---
title: "How this blog is built"
description: "Astro, GitHub Pages, the AT Protocol and an AI agent doing most of the typing."
date: 2026-11-24
---

This blog is also my first experiment on it. I built nearly all of it by talking to an AI coding agent (Claude Code) in my terminal: describing what I wanted, reviewing pull requests and merging them.

## The stack

- **[Astro](https://astro.build)** generates a static site from Markdown.
- **GitHub Pages** hosts it. Every push to `main` builds and deploys in about a minute.
- **Cloudflare** handles DNS for `1tsu.net`.
- **Nix** pins the dev environment, so the Node version on my machine matches CI.

## Notes and posts

There are two streams. Notes are short: ideas, half-finished experiments. Posts are longer and more considered, like this one. Both show up in one feed on the homepage.

Starting one is a single command:

```sh
npm run new:note "Title"
npm run new:post "Title"
```

That creates the file with today's date and the frontmatter filled in, so the only thing left is writing.

## Publishing to the AT Protocol

Every entry is also published as a [Standard.site](https://standard.site) record on my Bluesky account. Standard.site is a shared format for long-form writing on the AT Protocol, so readers and search tools in that ecosystem can find posts without knowing this site exists.

Two things prove the records are mine. The site serves `/.well-known/site.standard.publication`, which points at the blog's record, and each page has a `<link>` tag pointing at its own record. A script runs after every deploy and creates, updates or deletes records to match the site.

My favorite detail: record IDs have to be timestamp-based IDs (TIDs), so the agent derives each one from the entry's date and filename. The build and the sync script compute the same ID independently, with no database and no state file.

## Analytics without cookies

Cloudflare Web Analytics counts page views with one script tag. No cookies, no tracking across sites, no consent banner.

## Building it with an agent

The agent did the typing: an Astro 5 to 7 upgrade, the notes stream, the custom domain, the AT Protocol sync. I made the decisions, reviewed every PR and held the merge button. It wasn't allowed to merge on its own unless I said so, and a couple of times it got stopped for trying.

It wasn't flawless. The Astro upgrade quietly broke every post link: Astro 7 dropped a trailing slash from the base path, so links pointed at `/blogposts/...` and returned 404s. The build passed because it only checked that pages were generated, not where their links pointed. The agent caught it while building the next feature, owned the mistake and shipped a one-line fix.

That's the real lesson so far: an agent makes it cheap to build things, and checking the output is still my job.

## What's next

Auto-posting new entries to Bluesky, and showing Bluesky replies as comments here.
