# jacklabbe.com — Developer Portfolio

## What This Is

A personal developer portfolio website for Jack Labbe that auto-updates with GitHub commit activity. It replaces the existing jacklabbe.com with a fast, minimal, dark-themed single-scroll page featuring a hero section, a GitHub-style commit graph, and a Time Machine-inspired project timeline. A scheduled Cloudflare Worker pipeline fetches commit data daily and writes JSON to R2, which the static site reads on visit.

## Core Value

Show what I'm actively building — a living, auto-updating portfolio driven by real commit data, not manually curated content.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Hero section with photo, name ("Jack Labbe"), tagline ("Software / AI Engineer"), and contact button
- [ ] GitHub-style commit graph (blue-tinted, rolling 12 months) beneath the hero
- [ ] Time Machine-style project timeline with right-side date spine (month-grouped, scroll-synced + clickable)
- [ ] Project entries showing repo name (or "Private Repo"), language badges, last active date, commit count
- [ ] Private repos display only: commit count, languages, and date/times (no repo name or links)
- [ ] Public repos display: repo name with GitHub link + all metadata
- [ ] Collect rich commit-level data (messages, diffs) for public repos but don't surface it in UI yet
- [ ] Scheduled Cloudflare Worker pipeline that runs daily, fetches latest commits from all contributed repos via GitHub API
- [ ] Pipeline writes JSON to Cloudflare R2 (CDN-cacheable)
- [ ] Site reads commit data from R2 JSON on visit
- [ ] Minimal navbar with only a contact button (top-right)
- [ ] Contact button also in hero section
- [ ] Dark theme with `#040d21` navy background
- [ ] Inter/system font for headings (bold), monospace font for accent text
- [ ] Decorative developer accents: subtle crosshatch grid pattern (toggleable), 1px structural divider lines, monospace section labels (e.g., `// projects`)
- [ ] Subtle fade-in on scroll for sections, hover states on interactive elements
- [ ] Spacious hero, compact timeline (mixed density)
- [ ] Single-scroll page: hero → commit graph → divider → timeline → footer
- [ ] Deployed to Cloudflare Pages (static upload)
- [ ] TypeScript React

### Out of Scope

- About/bio section — deferred, may add later
- Commit message display in UI — data collected but not shown in v1
- Diff stats in UI — data collected but not shown in v1
- PR context display — not collected or shown
- OAuth login / any auth — this is a public read-only site
- Mobile app — web only
- Blog / writing section — not part of this project
- Real-time updates — daily pipeline is sufficient
- Code hint decorative text (faint property annotations) — decided against

## Context

- Replacing existing jacklabbe.com (currently Gatsby-based with `#040d21` dark navy, SF Mono, Alliance No. 1 fonts)
- Switching from Gatsby to TypeScript React on Cloudflare Pages
- Design references: leerob.io (minimal/fast), cassidoo.co (polished), tailwindcss.com (developer-feel decorative elements)
- GitHub API will be accessed via Personal Access Token stored as Cloudflare Worker secret
- All repos the user contributes to (owned, org, forked) are in scope for the pipeline
- Two distinct components: data pipeline (Cloudflare Worker, cron) and website (static React SPA reading from R2)
- Not full SSG — site fetches data at visit time from R2 JSON, but all other content is static
- User wants parallel agent development via GSD execute/plan

## Constraints

- **Hosting**: Cloudflare Pages (static upload) + Cloudflare Workers (pipeline) + R2 (storage) — all Cloudflare ecosystem
- **Stack**: TypeScript React — no exceptions
- **Privacy**: Private repo names/URLs must never be exposed — only counts, languages, dates
- **Performance**: Fast load times — minimal JS bundle, CDN-served, no heavy frameworks
- **Design system**: Inter/system sans-serif + monospace accent fonts — no custom font files (Alliance No. 1 dropped)
- **Pipeline**: Daily cron — not real-time, not on-demand

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Cloudflare Worker for pipeline | Keeps everything in Cloudflare ecosystem, cron triggers built-in | — Pending |
| JSON in R2 over KV/D1 | Simplest approach, CDN-cacheable, no query layer needed | — Pending |
| Inter/system over Alliance No. 1 | No custom font overhead, widely available, fast load | — Pending |
| Blue-tinted commit graph over green | Match site palette, differentiate from GitHub's green | — Pending |
| Collect rich commit data but don't display | Future-proof the data layer without UI complexity now | — Pending |
| Grid pattern toggleable | Easy to test with/without during development | — Pending |
| All contributed repos (owned + org + forked) | Comprehensive activity picture, no manual curation | — Pending |

---
*Last updated: 2026-02-19 after initialization*
