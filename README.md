# Blog

Scott Tsuchiyama's personal blog: thoughts and experiments with AI, from a software engineer in Seattle.

Live at **https://1tsu.net**

## Content

There are two streams, and the homepage shows both in one feed sorted by date.

| Stream | What it's for | Folder | URL |
| :-- | :-- | :-- | :-- |
| **Notes** | Short ideas, quick experiments, things in progress | `src/content/notes/` | `/notes/<slug>` |
| **Posts** | Longer, more considered writing | `src/content/posts/` | `/posts/<slug>` |

Each stream also has an index page (`/notes`, `/posts`), and there's an About page at `/about` (`src/pages/about.astro`).

## Writing a new note or post

```sh
npm run new:note "Title of the note"
npm run new:post "Title of the post"
```

Each command creates a Markdown file named after the title with today's date and prints its path. It won't overwrite an existing file.

```md
---
title: "Title of the post"
description: "One line shown under the title in the feed."
date: 2026-11-24
---

The body, in regular Markdown.
```

- **Posts** require `title`, `description` and `date`.
- **Notes** require `title` and `date`; `description` is optional.
- The filename becomes the URL slug.
- Use `.mdx` instead of `.md` to embed components.

There are no drafts: anything on `main` is published. Keep unfinished pieces on a branch.

## Running locally

Astro 7 needs Node 24 (`>= 22.23.4`). The system Node may be older, so use the project environment:

```sh
devenv shell                         # or: nix shell nixpkgs#nodejs_24
npm install
npm run dev                          # http://localhost:4321/
```

| Command | Action |
| :-- | :-- |
| `npm run dev` | Start the dev server |
| `npm run build` | Build the site to `dist/` |
| `npm run preview` | Serve the built site locally |
| `npm run new:note "Title"` | Create a new note |
| `npm run new:post "Title"` | Create a new post |

## Publishing

Every push to `main` builds the site and deploys it to GitHub Pages (`.github/workflows/deploy.yml`), which takes about a minute. Watch it with `gh run watch`.

The usual flow is a branch and a pull request, then merge to publish.

## Standard.site (AT Protocol)

Every note and post is also published as a [Standard.site](https://standard.site) record on [@scottty.bsky.social](https://bsky.app/profile/scottty.bsky.social), so AT Protocol readers and indexes can find it.

- `src/lib/atproto.mjs` holds the DID, publication name and description, and derives a stable record key for each entry from its collection, filename and date.
- `https://1tsu.net/.well-known/site.standard.publication` returns the publication URI, and each entry page has a `<link rel="site.standard.document">` tag. Together these verify the records.
- After each deploy, CI runs `npm run atproto:sync`, which creates or updates changed records and deletes records for removed entries. It needs the `BSKY_APP_PASSWORD` repo secret (a Bluesky app password).
- `npm run atproto:sync -- --dry-run` prints the records without publishing.

Renaming a file or changing its `date` gives the entry a new record key: the old record is deleted and a new one is created.

## How it's built

- [Astro](https://astro.build) 7, static output, with MDX.
- Content collections are defined in `src/content.config.ts`.
- The site is served under `/` (`base` in `astro.config.mjs`). Build links with `import.meta.env.BASE_URL`, which includes the trailing slash.

```text
src/
├── components/   Layout, Nav, Footer, EntryList (feed), Article, Prose, Heading
├── content/
│   ├── notes/    Notes (Markdown)
│   └── posts/    Posts (Markdown)
├── pages/
│   ├── index.astro             Homepage: mixed feed
│   ├── about.astro
│   ├── notes/                  Notes index and note pages
│   └── posts/                  Posts index and post pages
└── styles/global.css           Design tokens and base styles
scripts/new.mjs                 new:note / new:post
```

## Credit

The theme is based on uinux-blog, which builds on [Bear Blog](https://github.com/HermanMartinus/bearblog/).
