# Requirements: jacklabbe.com

**Defined:** 2026-02-19
**Core Value:** Show what I'm actively building -- a living, auto-updating portfolio driven by real commit data, not manually curated content.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Data Pipeline

- [ ] **PIPE-01**: Cloudflare Worker runs on daily cron trigger, fetching latest GitHub commit data
- [x] **PIPE-02**: Worker uses GitHub GraphQL API (`contributionsCollection.contributionCalendar`) for 12-month commit graph data
- [x] **PIPE-03**: Worker uses GitHub REST API for repo enumeration and per-repo metadata
- [x] **PIPE-04**: Worker fetches data from all repos user contributes to (owned, org, forked)
- [ ] **PIPE-05**: Worker writes split JSON files to R2: graph.json, projects.json, meta.json
- [x] **PIPE-06**: Private repo data is sanitized via allowlist field extraction -- only commit counts, languages, and dates stored (never repo names, URLs, or raw API responses)
- [x] **PIPE-07**: Public repo data includes repo name, URL, languages, commit counts, dates, and rich commit-level data (messages, diffs) for future use
- [x] **PIPE-08**: Pipeline handles GitHub API rate limits gracefully (backoff, error logging)
- [x] **PIPE-09**: Pipeline handles initial backfill separately from daily incremental updates
- [x] **PIPE-10**: GitHub PAT stored as Cloudflare Worker secret (never in code or R2)

### Hero / Identity

- [x] **HERO-01**: Hero section displays photo, name ("Jack Labbe"), and tagline ("Software / AI Engineer")
- [x] **HERO-02**: Contact button in hero section (mailto link, no contact form)
- [x] **HERO-03**: Minimal navbar with only a contact button (top-right)
- [x] **HERO-04**: Spacious hero layout with generous whitespace

### Commit Graph

- [ ] **GRPH-01**: GitHub-style contribution heatmap displaying rolling 12 months of commit activity
- [ ] **GRPH-02**: Blue-tinted color scale matching site palette (not GitHub green)
- [ ] **GRPH-03**: Rendered as inline SVG (no charting libraries)
- [ ] **GRPH-04**: Graph positioned directly beneath hero section
- [ ] **GRPH-05**: Responsive -- readable on mobile viewports

### Project Timeline

- [ ] **TIME-01**: Chronological project list sorted by most recent contribution (newest first)
- [ ] **TIME-02**: Month-grouped entries (January 2026, December 2025, etc.)
- [ ] **TIME-03**: Public repos display: repo name with GitHub link, language badges, last active date, commit count
- [ ] **TIME-04**: Private repos display as "Private Repo" with language badges, last active date, commit count (no name or link)
- [ ] **TIME-05**: Time Machine-style right-side date spine showing months
- [ ] **TIME-06**: Scroll-synced date spine -- active month highlights as user scrolls through content
- [ ] **TIME-07**: Clickable date spine -- clicking a month jumps to that month's projects
- [ ] **TIME-08**: Compact timeline density (more content visible at once)
- [ ] **TIME-09**: Subtle fade-in animation on scroll for timeline entries

### Design System

- [x] **DSGN-01**: Dark theme with `#040d21` navy background
- [x] **DSGN-02**: Inter/system sans-serif font for headings (bold weight)
- [x] **DSGN-03**: Monospace font for accent text (tagline, section labels, metadata)
- [x] **DSGN-04**: Decorative structural 1px divider lines between sections
- [x] **DSGN-05**: Monospace section labels (e.g., `// projects`, `// contact`)
- [x] **DSGN-06**: Toggleable subtle crosshatch grid pattern background (low opacity, easy enable/disable)
- [ ] **DSGN-07**: Hover states on interactive elements (links, graph cells, timeline entries)
- [x] **DSGN-08**: Single-scroll page layout: hero → commit graph → divider → timeline → footer
- [x] **DSGN-09**: Responsive layout -- mobile-first, works on all viewports
- [x] **DSGN-10**: WCAG AA contrast ratios on all text
- [x] **DSGN-11**: CSS Modules + CSS custom properties (no CSS frameworks)

### Infrastructure

- [x] **INFR-01**: TypeScript React application (Vite build toolchain)
- [x] **INFR-02**: pnpm monorepo with shared types package (site/, worker/, shared/)
- [x] **INFR-03**: Deployed to Cloudflare Pages (static upload)
- [ ] **INFR-04**: Commit data served from Cloudflare R2 (CDN-cacheable JSON)
- [x] **INFR-05**: Site fetches R2 JSON on visit (not full SSG)

### Meta / SEO

- [x] **META-01**: Open Graph tags for social sharing preview (og:title, og:description, og:image)
- [x] **META-02**: Semantic HTML structure (nav, main, section, article elements)
- [x] **META-03**: Keyboard navigable, skip-to-content link

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Content Display

- **CONT-01**: Display commit messages for public repos (data already collected in v1)
- **CONT-02**: Display diff stats (lines added/removed) for public repos
- **CONT-03**: About/bio section

### Enhanced Features

- **ENHC-01**: Configurable time range on commit graph (toggle 6mo/12mo/all time)
- **ENHC-02**: Project detail expansion (click a project to see more info)
- **ENHC-03**: Language breakdown chart (aggregate across all repos)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Contact form | Requires backend, spam filtering. mailto link is simpler and more professional |
| Blog / writing section | Different content type, different update cadence. Commit data IS the content |
| Skills self-assessment | Subjective skill bars are mocked. Let language badges from real data speak |
| Light mode toggle | Doubles design surface for no audience benefit. Developer audience prefers dark |
| Real-time updates / WebSockets | Massive complexity for zero value. Daily pipeline is sufficient |
| Animation-heavy landing | Three.js, particles, parallax -- impressive for 5s, annoying after. Hurts perf and a11y |
| GitHub OAuth / login | Read-only public site. No user-facing auth needed |
| Manual featured projects | Defeats auto-updating purpose. Recency and commit count are the curation signal |
| Search / filtering | Over-engineering for dozens of projects. Chronological timeline with month nav IS filtering |
| RSS feed / API endpoints | No audience. R2 JSON is technically accessible if needed |
| Multi-page navigation | Breaks single-scroll narrative. One page is right for this scope |
| Mobile app | Web only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PIPE-01 | Phase 1 | Pending |
| PIPE-02 | Phase 1 | Complete |
| PIPE-03 | Phase 1 | Complete |
| PIPE-04 | Phase 1 | Complete |
| PIPE-05 | Phase 1 | Pending |
| PIPE-06 | Phase 1 | Complete |
| PIPE-07 | Phase 1 | Complete |
| PIPE-08 | Phase 1 | Complete |
| PIPE-09 | Phase 1 | Complete |
| PIPE-10 | Phase 1 | Complete |
| HERO-01 | Phase 2 | Complete |
| HERO-02 | Phase 2 | Complete |
| HERO-03 | Phase 2 | Complete |
| HERO-04 | Phase 2 | Complete |
| GRPH-01 | Phase 3 | Pending |
| GRPH-02 | Phase 3 | Pending |
| GRPH-03 | Phase 3 | Pending |
| GRPH-04 | Phase 3 | Pending |
| GRPH-05 | Phase 3 | Pending |
| TIME-01 | Phase 3 | Pending |
| TIME-02 | Phase 3 | Pending |
| TIME-03 | Phase 3 | Pending |
| TIME-04 | Phase 3 | Pending |
| TIME-05 | Phase 3 | Pending |
| TIME-06 | Phase 3 | Pending |
| TIME-07 | Phase 3 | Pending |
| TIME-08 | Phase 3 | Pending |
| TIME-09 | Phase 3 | Pending |
| DSGN-01 | Phase 2 | Complete |
| DSGN-02 | Phase 2 | Complete |
| DSGN-03 | Phase 2 | Complete |
| DSGN-04 | Phase 2 | Complete |
| DSGN-05 | Phase 2 | Complete |
| DSGN-06 | Phase 2 | Complete |
| DSGN-07 | Phase 3 | Pending |
| DSGN-08 | Phase 2 | Complete |
| DSGN-09 | Phase 2 | Complete |
| DSGN-10 | Phase 2 | Complete |
| DSGN-11 | Phase 2 | Complete |
| INFR-01 | Phase 1 | Complete |
| INFR-02 | Phase 1 | Complete |
| INFR-03 | Phase 2 | Complete |
| INFR-04 | Phase 1 | Pending |
| INFR-05 | Phase 2 | Complete |
| META-01 | Phase 2 | Complete |
| META-02 | Phase 2 | Complete |
| META-03 | Phase 2 | Complete |

**Coverage:**
- v1 requirements: 47 total
- Mapped to phases: 47
- Unmapped: 0

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 after roadmap creation*
