// Standard.site (AT Protocol) identifiers, shared by the Astro build and
// scripts/atproto-sync.mjs so both agree on every record URI.
import { createHash } from "node:crypto";

export const DID = "did:plc:7cuf264sl2mmhdyijueif5ip";
export const SITE_URL = "https://1tsu.net";
export const PUBLICATION = {
  name: "Scott Tsuchiyama",
  description: "Thoughts and experiments with AI, from a software engineer in Seattle.",
};

const B32 = "234567abcdefghijklmnopqrstuvwxyz";

function hash(input) {
  return createHash("sha256").update(input).digest().readBigUInt64BE(0);
}

// Record keys for these lexicons must be TIDs (53-bit microsecond timestamp +
// 10-bit clock id). Deriving them from stable inputs makes syncing idempotent
// and lets the build compute URIs without talking to the network.
function tid(date, seed) {
  const h = hash(seed);
  const dayStart = BigInt(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())) * 1000n;
  const micros = dayStart + (h % 86_400_000_000n);
  let n = (micros << 10n) | ((h >> 40n) & 0x3ffn);
  let out = "";
  for (let i = 0; i < 13; i++) {
    out = B32[Number(n & 31n)] + out;
    n >>= 5n;
  }
  return out;
}

export const PUBLICATION_RKEY = tid(new Date("2026-02-20"), "publication");
export const PUBLICATION_URI = `at://${DID}/site.standard.publication/${PUBLICATION_RKEY}`;

export function documentRkey(collection, id, date) {
  return tid(date, `${collection}/${id}`);
}

export function documentUri(collection, id, date) {
  return `at://${DID}/site.standard.document/${documentRkey(collection, id, date)}`;
}
