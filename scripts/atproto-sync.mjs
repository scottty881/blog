// Publishes Standard.site records for the blog to its AT Protocol repo.
// Usage: BSKY_APP_PASSWORD=... node scripts/atproto-sync.mjs [--dry-run]
import { readFileSync, readdirSync } from "node:fs";
import { parse } from "yaml";
import {
  DID,
  SITE_URL,
  PUBLICATION,
  PUBLICATION_RKEY,
  PUBLICATION_URI,
  documentRkey,
} from "../src/lib/atproto.mjs";

const dryRun = process.argv.includes("--dry-run");

function readEntries(collection) {
  const dir = `src/content/${collection}`;
  return readdirSync(dir)
    .filter((file) => /\.mdx?$/.test(file))
    .map((file) => {
      const raw = readFileSync(`${dir}/${file}`, "utf8");
      const [, frontmatter, body] = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
      const data = parse(frontmatter);
      const id = file.replace(/\.mdx?$/, "");
      const date = new Date(data.date);
      return { collection, id, date, data, body };
    });
}

function plainText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/[*_`]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function documentRecord({ collection, id, date, data, body }) {
  return {
    $type: "site.standard.document",
    site: PUBLICATION_URI,
    path: `/${collection}/${id}`,
    title: data.title,
    ...(data.description ? { description: data.description } : {}),
    textContent: plainText(body),
    publishedAt: date.toISOString(),
  };
}

const publication = {
  $type: "site.standard.publication",
  url: SITE_URL,
  name: PUBLICATION.name,
  description: PUBLICATION.description,
  preferences: { showInDiscover: true },
};

const documents = new Map(
  [...readEntries("posts"), ...readEntries("notes")].map((entry) => [
    documentRkey(entry.collection, entry.id, entry.date),
    documentRecord(entry),
  ])
);

if (dryRun) {
  console.log(JSON.stringify({ [PUBLICATION_RKEY]: publication, ...Object.fromEntries(documents) }, null, 2));
  process.exit(0);
}

const password = process.env.BSKY_APP_PASSWORD;
if (!password) throw new Error("BSKY_APP_PASSWORD is not set");

const didDoc = await (await fetch(`https://plc.directory/${DID}`)).json();
const pds = didDoc.service.find((s) => s.id === "#atproto_pds").serviceEndpoint;
const handle = didDoc.alsoKnownAs[0].replace("at://", "");

async function xrpc(method, params, { body, token } = {}) {
  const url = new URL(`/xrpc/${method}`, pds);
  if (params) url.search = new URLSearchParams(params);
  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body && JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method}: ${res.status} ${await res.text()}`);
  return res.json();
}

const { accessJwt } = await xrpc("com.atproto.server.createSession", null, {
  body: { identifier: handle, password },
});

async function listRecords(collection) {
  const records = new Map();
  let cursor;
  do {
    const page = await xrpc("com.atproto.repo.listRecords", {
      repo: DID,
      collection,
      limit: "100",
      ...(cursor ? { cursor } : {}),
    });
    for (const r of page.records) records.set(r.uri.split("/").pop(), r.value);
    cursor = page.cursor;
  } while (cursor);
  return records;
}

// Key order differs once the PDS stores records, so compare sorted JSON.
const canonical = (value) =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v
  );

async function put(collection, rkey, record, existing) {
  if (existing && canonical(existing) === canonical(record)) return;
  await xrpc("com.atproto.repo.putRecord", null, {
    token: accessJwt,
    body: { repo: DID, collection, rkey, record },
  });
  console.log(`put ${collection}/${rkey} ${record.path ?? record.url}`);
}

const existingPublications = await listRecords("site.standard.publication");
await put("site.standard.publication", PUBLICATION_RKEY, publication, existingPublications.get(PUBLICATION_RKEY));

const existingDocuments = await listRecords("site.standard.document");
for (const [rkey, record] of documents) {
  await put("site.standard.document", rkey, record, existingDocuments.get(rkey));
}

// Remove records for entries that were deleted or renamed.
for (const [rkey, value] of existingDocuments) {
  if (value.site === PUBLICATION_URI && !documents.has(rkey)) {
    await xrpc("com.atproto.repo.deleteRecord", null, {
      token: accessJwt,
      body: { repo: DID, collection: "site.standard.document", rkey },
    });
    console.log(`delete site.standard.document/${rkey} ${value.path}`);
  }
}

console.log(`Synced ${documents.size} document(s) to ${handle}`);
