# Roadmap: jacklabbe.com

## Overview

Three phases deliver jacklabbe.com from empty repo to live portfolio. Phase 1 builds the monorepo skeleton and the entire Cloudflare Worker data pipeline so real GitHub data lands in R2 before any UI work begins. Phase 2 creates the React SPA shell with the full design system, hero section, and page layout -- proving end-to-end data flow from R2 to browser. Phase 3 builds the two signature visualizations (commit graph and project timeline) against real data and ships the production site.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation and Data Pipeline** - Monorepo, shared types, GitHub Actions pipeline writing real GitHub data to R2
- [ ] **Phase 2: Site Shell, Design System, and Hero** - React SPA with design tokens, hero section, page layout, data fetching, SEO (gap closure in progress)
- [ ] **Phase 3: Core Visualizations and Launch** - Commit graph, project timeline with scroll-synced date spine, hover states, production deploy

## Phase Details

### Phase 1: Foundation and Data Pipeline
**Goal**: Real GitHub commit data is flowing into R2 daily, with a monorepo structure that enforces the JSON contract between Worker and SPA at compile time
**Depends on**: Nothing (first phase)
**Requirements**: INFR-01, INFR-02, INFR-04, PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-06, PIPE-07, PIPE-08, PIPE-09, PIPE-10
**Success Criteria** (what must be TRUE):
  1. Running `pnpm build` from the repo root compiles all three workspace packages (site, worker, shared) without errors
  2. The Cloudflare Worker runs on its daily cron trigger and writes graph.json, projects.json, and meta.json to R2 with real GitHub data
  3. Private repo entries in R2 JSON contain only commit counts, languages, and dates -- never repo names, URLs, or raw API responses
  4. Public repo entries in R2 JSON include repo name, URL, languages, commit counts, dates, and rich commit-level data
  5. R2 JSON files are accessible from a browser via the configured public URL (CORS verified)
**Plans:** 5 plans

Plans:
- [x] 01-01-PLAN.md — Monorepo root with pnpm workspaces, shared TypeScript types package (JSON contract)
- [x] 01-02-PLAN.md — Site skeleton (Vite+React) and worker skeleton (Wrangler) with shared type imports
- [x] 01-03-PLAN.md — Data transformation and sanitization (TDD): private repo allowlist, public repo enrichment, graph transformation, backfill detection
- [x] 01-04-PLAN.md — GitHub API fetching layer: GraphQL contribution calendar, REST repo/commit/language enumeration, rate limit handling
- [x] 01-05-PLAN.md — Pipeline orchestration, R2 writes, Worker handlers, CORS config, deployment verification

### Phase 2: Site Shell, Design System, and Hero
**Goal**: Visitors see a polished dark-themed hero page that loads commit metadata from R2, with the full design system and page layout skeleton ready for visualizations
**Depends on**: Phase 1
**Requirements**: INFR-03, INFR-05, HERO-01, HERO-02, HERO-03, HERO-04, DSGN-01, DSGN-02, DSGN-03, DSGN-04, DSGN-05, DSGN-06, DSGN-08, DSGN-09, DSGN-10, DSGN-11, META-01, META-02, META-03
**Success Criteria** (what must be TRUE):
  1. Visiting the site shows the hero section with photo, name ("Jack Labbe"), tagline ("Software / AI Engineer"), and a working contact button that opens an email client
  2. The page renders correctly on mobile viewports (375px) and desktop (1440px) with the dark navy background, Inter/system headings, monospace accent text, and structural divider lines
  3. The site fetches R2 JSON on load and displays a loading state, then renders content (or an error state if R2 is unavailable)
  4. Sharing the URL on social platforms shows a correct Open Graph preview card with title, description, and image
  5. A keyboard-only user can navigate the page using Tab, activate the contact button, and use the skip-to-content link
**Plans:** 5 plans

Plans:
- [x] 02-01-PLAN.md — Design system foundation: CSS tokens, fonts, animations, global styles, Vite config, R2 data hook, font-ready hook
- [x] 02-02-PLAN.md — Core UI components: Hero section with skeleton, sticky Navbar with glass blur, SkipToContent, social icons
- [x] 02-03-PLAN.md — App composition, Footer, section placeholders, dividers, OG meta tags, CORS update, Cloudflare Pages deployment
- [ ] 02-04-PLAN.md — Gap closure: Migrate from CSS Modules to Tailwind CSS v4 (install, @theme tokens, convert all components)
- [ ] 02-05-PLAN.md — Gap closure: Squircle photo shape (superellipse clip-path) and LQIP blur-in photo loading

### Phase 3: Core Visualizations and Launch
**Goal**: The complete portfolio is live at jacklabbe.com with an auto-updating commit graph and scroll-navigable project timeline
**Depends on**: Phase 2
**Requirements**: GRPH-01, GRPH-02, GRPH-03, GRPH-04, GRPH-05, TIME-01, TIME-02, TIME-03, TIME-04, TIME-05, TIME-06, TIME-07, TIME-08, TIME-09, DSGN-07
**Success Criteria** (what must be TRUE):
  1. A blue-tinted GitHub-style contribution heatmap renders below the hero showing 12 months of commit activity as an inline SVG, readable on both mobile and desktop
  2. Scrolling past the commit graph reveals a chronological project timeline grouped by month, with public repos showing name/link/badges and private repos showing "Private Repo" with badges only
  3. The right-side date spine highlights the current month as the user scrolls, and clicking a month on the spine jumps to that month's projects
  4. Hovering over commit graph cells, timeline entries, and links produces visible hover state changes
  5. The site is live at jacklabbe.com on Cloudflare Pages with the Worker running daily and data refreshing automatically
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Data Pipeline | 5/5 | Complete | 2026-02-20 |
| 2. Site Shell, Design System, and Hero | 3/5 | Gap closure | 2026-02-20 |
| 3. Core Visualizations and Launch | 0/0 | Not started | - |
