// Usage: npm run new:note "Title"  |  npm run new:post "Title"
import { existsSync, writeFileSync } from "node:fs";

const [kind, ...words] = process.argv.slice(2);
const dirs = { note: "notes", post: "posts" };
const title = words.join(" ").trim();

if (!dirs[kind] || !title) {
  console.error('Usage: npm run new:note "Title"  |  npm run new:post "Title"');
  process.exit(1);
}

const slug = title
  .normalize("NFKD")
  .toLowerCase()
  .replace(/['’]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");
const date = new Date().toLocaleDateString("en-CA"); // local YYYY-MM-DD
const path = `src/content/${dirs[kind]}/${slug}.md`;

if (existsSync(path)) {
  console.error(`Already exists: ${path}`);
  process.exit(1);
}

const frontmatter = [
  `title: ${JSON.stringify(title)}`,
  ...(kind === "post" ? ['description: ""'] : []),
  `date: ${date}`,
];

writeFileSync(path, `---\n${frontmatter.join("\n")}\n---\n\n`);
console.log(path);
