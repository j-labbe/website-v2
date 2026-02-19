# Project Research Summary

**Project:** jacklabbe.com — Developer Portfolio with Auto-Updating GitHub Data
**Domain:** Static developer portfolio with serverless data pipeline
**Researched:** 2026-02-19
**Confidence:** MEDIUM

## Executive Summary

jacklabbe.com is a static single-page React portfolio differentiated by a live-updating GitHub commit graph and a scroll-navigable "Time Machine" project timeline. The architecture is a two-runtime system: a Cloudflare Worker cron job that pulls GitHub data daily and writes pre-computed JSON to R2, and a Vite/React SPA served from Cloudflare Pages that fetches those JSON files at runtime. These runtimes share no server-side connection — R2 is the contract between them. This decoupling means the site is always fast (static CDN delivery) and always current (Worker runs independently of deploys). The right stack is deliberately minimal: React 19, CSS Modules, inline SVG for the commit graph, native fetch, and Intersection Observer for scroll sync. No charting libraries, no runtime CSS-in-JS, no SSR framework. Total site runtime dependencies: 2 (react, react-dom).

The recommended architecture places all computation in the Worker and makes the SPA a pure renderer. The Worker fetches GitHub data via GraphQL (full 12-month contribution calendar in a single API call) and REST (repo metadata), sanitizes private repo details with an explicit field allowlist, aggregates data into three small JSON files (graph.json ~5KB, projects.json ~20KB, meta.json ~1KB), and writes them to R2. The SPA fetches all three in parallel on load and renders without any client-side data transformation. This keeps the bundle small, the load fast, and the logic testable. The pnpm monorepo with a `packages/shared` TypeScript types package enforces the JSON schema contract between Worker and SPA at compile time, preventing schema drift across independent deployments.

The top risks are: (1) private repo data leaking through indirect API fields (commit messages, nested response objects) if sanitization happens at render time instead of write time in the Worker; (2) GitHub API rate limits exhausting during initial backfill if the wrong API is used — the Events API is capped at 90 days and 300 events, making it useless for a 12-month graph; and (3) the R2 CORS configuration being missed until production deployment. All three are design-time decisions that must be settled before writing pipeline code.

## Key Findings

### Recommended Stack

The stack is deliberately lean. Vite 6 builds the SPA with zero configuration for CSS Modules and TypeScript. React 19 provides the UI framework. pnpm workspaces manage the monorepo (site, worker, shared types). On the Cloudflare side, Wrangler handles Worker deployment and cron configuration; @octokit/graphql fetches the contribution calendar in one call; @octokit/rest handles repo enumeration. The SPA has exactly two runtime dependencies: react and react-dom. The Worker bundles @octokit/graphql and @octokit/rest via Wrangler's built-in esbuild.

**Core technologies:**
- **Vite 6 + React 19 + TypeScript 5.7**: SPA build pipeline — fastest DX for static React, native ESM, Cloudflare Pages static upload; Next.js and Astro rejected as unnecessary for a static SPA
- **CSS Modules + CSS custom properties**: Styling — zero runtime cost, full control over dark theme and custom SVG; Tailwind rejected because custom SVG and timeline need custom CSS regardless, adding config overhead for minimal utility
- **@octokit/graphql**: GitHub commit graph — single GraphQL call returns full 12-month contribution calendar; REST cannot do this without per-repo pagination across all repos
- **@octokit/rest**: GitHub repo metadata — REST better for iterating paginated repo lists; used alongside GraphQL in hybrid approach
- **Inline SVG (React components)**: Commit graph visualization — 20 lines of SVG vs. D3's 80KB+; free DOM hover events for tooltips; Canvas rejected because it lacks native DOM events
- **Cloudflare Worker + Wrangler**: Scheduled data pipeline — cron trigger, R2 write, secrets management in one CLI
- **pnpm workspaces**: Monorepo — shared TypeScript types enforce R2 JSON contract at compile time; prevents schema drift bugs
- **Vitest**: Testing — Vite-native, essential for testing private repo sanitization and date aggregation logic
- **CSS animations + Intersection Observer**: All scroll/entrance animation — CSS handles fade-in natively; IntersectionObserver handles month tracking without scroll listener jank; Framer Motion (30KB+) rejected

**Verify before installing:** All version numbers are based on training data (cutoff May 2025). Run `npm info <package> version` for react, vite, wrangler, @octokit/graphql, @octokit/rest, typescript, vitest, pnpm before installation.

### Expected Features

**Must have (table stakes):**
- Hero/identity section — name, role, contact; visitors need orientation in under 3 seconds
- Contact mechanism — mailto link styled as a button; no contact form (spam magnet, requires backend)
- Project showcase — repo name, language badge, last active date, commit count
- Responsive/mobile layout — 40-60% of portfolio traffic is mobile; must be baked in from day one, not retrofitted
- Fast load times (<2s) — slow portfolio is a strong negative signal to developer audience
- Dark theme with WCAG AA contrast — developer norm; bad contrast is worse than no dark theme
- Working links and graceful empty states — broken links destroy credibility
- Semantic HTML and accessibility basics — skip-to-content link, keyboard navigation, ARIA landmarks
- Open Graph / social meta tags — URL preview cards when shared on Slack, LinkedIn, Twitter

**Should have (differentiators):**
- Auto-updating commit graph (GitHub-style, 12-month rolling, blue-tinted) — living proof of activity; the signature feature
- Time Machine project timeline with scroll-synced date spine — communicates growth narrative over time; distinguishes from flat card grids
- Private repo handling — shows professional/corporate work without leaking confidential project details
- Language badge aggregation derived from real commit data — more credible than self-reported skills sections
- Daily auto-refresh pipeline — site never goes stale; most portfolios rot because they require manual curation
- Decorative developer aesthetic (crosshatch grid, structural lines, monospace labels) — signals craft to developer audience
- Commit count badges on projects — raw numbers are more credible than vague contributor labels

**Defer (v2+):**
- Commit message display — data worth collecting now but UI needs curation logic to avoid showing "wip", "fix", "asdf"
- Diff stats (lines added/removed) — noisy without context; collect in pipeline but don't surface in v1
- About/bio section — only if v1 feedback creates demand
- Per-repo detailed commit history pages

**Explicit anti-features (do not build):**
Contact form, blog section, skills self-assessment bars, testimonials, light mode toggle, real-time WebSocket updates, GitHub OAuth, manually curated "featured projects," multi-page routing, search/filtering, RSS feed, public analytics dashboard. Each is either scope creep, contradicts the static architecture, or actively harms the developer audience's perception.

### Architecture Approach

The system has two runtimes connected only by R2 storage — they share nothing at runtime. The Worker is the write path (cron, GitHub API, transform, sanitize, R2 write) and the SPA is the read path (R2 fetch on mount, render). The Worker pre-computes everything so the browser renders data directly with zero client-side aggregation. Shared TypeScript types in `packages/shared` enforce the JSON contract at build time. R2 public bucket with custom domain `data.jacklabbe.com` is the recommended read path — simpler than a Worker proxy for read-only public data. CORS configuration on the R2 custom domain is the primary infrastructure complexity and must be verified before deploying the SPA.

**Major components:**
1. **packages/worker** (Cloudflare Worker) — GitHub API fetching (GraphQL contributionsCollection + REST repos), data transformation, private repo sanitization with field allowlist, R2 writes on daily cron at 6 AM UTC; all computation and aggregation lives here
2. **packages/site** (React SPA on Cloudflare Pages) — fetch R2 JSON on mount via useGitHubData hook, render Hero, CommitGraph (inline SVG), Timeline, DateSpine; zero data processing in the browser; CSS Modules with dark theme custom properties
3. **packages/shared** (TypeScript types only) — R2 JSON schema interfaces (DataMeta, RepoMetadata, CommitData, DailyCommit, WeeklyCommit); compile-time contract between Worker and SPA; no runtime dependencies
4. **Cloudflare R2 bucket** — three JSON files: graph.json (daily commit heatmap, ~5KB), projects.json (repo metadata, ~20KB for 100 repos), meta.json (pipeline health, last updated timestamp)

**Key patterns:**
- Pre-compute everything in the Worker; R2 JSON must be render-ready (no client-side aggregation)
- Idempotent Worker runs: fetch complete dataset, write all files after all fetches succeed
- Graceful data loading: loading / ready / error states in useGitHubData; never crash on R2 unavailability
- Sanitize private repos at write time (Worker), never at read time (SPA) — R2 is a public surface
- Split JSON files enable parallel fetching and independent cache TTLs; never one giant data blob
- Store all dates as YYYY-MM-DD strings to avoid timezone bugs; trust GraphQL calendar dates directly

### Critical Pitfalls

1. **Private repo data leakage via indirect API fields** — Use an explicit field allowlist when constructing Worker output objects; never serialize or spread raw GitHub API responses to R2; add a unit test asserting no private repo names appear anywhere in the serialized JSON output; treat R2 as a public API surface

2. **GitHub Events API 90-day limit breaks the commit graph** — Do NOT use `/users/{username}/events` for historical data; it is capped at 90 days / 300 events; use GraphQL `contributionsCollection.contributionCalendar` for the 12-month graph (one call, pre-bucketed by day in user's timezone); use REST commit endpoints only for per-repo metadata

3. **Rate limit exhaustion during initial backfill** — Do not backfill 12 months in the first cron trigger; run backfill separately (locally or via GitHub Action, not in the Worker); keep daily cron to lightweight incremental updates (~160-250 subrequests); check `X-RateLimit-Remaining` headers after each call

4. **CORS blocks all SPA data fetching in production** — R2 is not publicly accessible by default; configure CORS rules on the R2 custom domain (Allow-Origin: jacklabbe.com, GET only) before the SPA can fetch data; test cross-origin fetches from the actual deployed domain, not localhost; alternatively use a Pages Function proxy to keep requests same-origin and avoid CORS entirely

5. **Silent pipeline failure makes the portfolio look inactive** — Include `lastUpdated` timestamp in meta.json and display it in the SPA; write a heartbeat file to R2 on each successful run; show a stale data indicator if timestamp exceeds 48 hours; use idempotent writes (write all files only after all fetches succeed) to prevent partial corruption

## Implications for Roadmap

Based on combined research, the dependency graph drives a clear phase structure: shared types define the contract, the Worker fulfills it, the SPA consumes it. Nothing meaningful in the SPA can be built without real R2 data to develop against.

### Phase 1: Foundation and Infrastructure

**Rationale:** The JSON schema is the integration contract between Worker and SPA. Define it first in shared types before either side is built. R2 and Cloudflare account setup must be verified before any code depends on them. Settling the PAT security model and CORS approach upfront eliminates two of the most common late-stage blockers.

**Delivers:** pnpm monorepo with three workspace packages, shared TypeScript types for all three R2 JSON files (DataMeta, RepoMetadata, CommitData), R2 bucket created and CORS strategy decided, GitHub fine-grained PAT configured as Worker secret, Wrangler installed and authenticated, local dev environment confirmed end-to-end

**Addresses:** Table stakes infrastructure; FEATURES.md critical path ("R2 JSON schema design: High risk — schema changes after launch are painful")

**Avoids:** Pitfall 14 (schema mismatch between Worker and SPA — shared types provide compile-time enforcement), Pitfall 11 (PAT with excessive scopes — fine-grained read-only PAT), Pitfall 8 (CORS surprises at deploy time — decide approach before building either side)

### Phase 2: Data Pipeline (Worker)

**Rationale:** The SPA cannot be built meaningfully without real data in R2. Building the Worker first means realistic JSON shapes are available before writing any UI component. The backfill strategy must be decided here — not retrofitted. This phase delivers the most complex backend logic (API integration, sanitization, aggregation) while the codebase is small and easy to reason about.

**Delivers:** Deployed Cloudflare Worker with daily cron trigger, GitHub GraphQL client (contributionsCollection for 12-month graph), GitHub REST client (repo enumeration, per-repo metadata), private repo sanitization with field allowlist, three R2 JSON files with real data, initial backfill completed (run separately, not in Worker), pipeline health monitoring (heartbeat, lastUpdated field), unit tests for sanitization and date aggregation

**Addresses:** Auto-updating commit graph, private repo handling, daily auto-refresh pipeline reliability

**Avoids:** Pitfall 2 (Events API 90-day limit — use GraphQL contributionCalendar instead), Pitfall 3 (rate limit exhaustion — separate backfill, lightweight daily cron), Pitfall 4 (Worker subrequest limits — paid plan, daily incremental runs stay under 1,000 subrequests), Pitfall 1 (private data leakage — allowlist-based extraction with unit tests), Pitfall 10 (timezone day-boundary bugs — YYYY-MM-DD strings, trust GraphQL calendar dates), Pitfall 5 (unbounded JSON growth — rolling 13-month window, split files from day one), Pitfall 7 (silent pipeline failure — heartbeat + lastUpdated)

### Phase 3: Site Core and Design System

**Rationale:** With real data in R2, the SPA can be built against actual JSON shapes. The design system (dark theme tokens, typography, spacing scale) must exist before components are built — retrofitting global CSS is expensive. The Hero section is the simplest data-consuming component and proves the end-to-end pipeline works before tackling complex visualizations.

**Delivers:** Vite + React + TypeScript SPA scaffold, CSS custom properties design system (dark theme `#040d21`, typography scale, spacing tokens), `useGitHubData` hook with parallel R2 fetching and loading/ready/error states, Hero section with aggregate stats from meta.json, responsive layout foundations (mobile-first CSS), semantic HTML and accessibility basics (skip-to-content, ARIA landmarks, keyboard navigation), Open Graph meta tags

**Addresses:** Hero/identity, contact mechanism, dark theme, fast load times (<50KB JS bundle), accessibility, social meta tags, responsive layout foundations

**Avoids:** Pitfall 7 (stale data UX — display lastUpdated from meta.json in Hero), Pitfall 8 (CORS — confirm data fetches work from deployed domain before investing in more components)

### Phase 4: Core Visualizations

**Rationale:** The two highest-complexity, highest-value features — commit graph and project timeline — come after the design system is established and the data pipeline is proven. The commit graph is the signature differentiator and must use correct memoization patterns from the start. The timeline's scroll-synced date spine is the most technically risky feature and builds on the IntersectionObserver pattern established in Phase 3.

**Delivers:** CommitGraph component (inline SVG, React.memo, CSS data-attributes for 5 color levels, hover tooltips, empty state handling), Time Machine timeline (month-grouped chronological project entries), DateSpine with scroll-synced active month indicator (IntersectionObserver at month boundaries, click-to-scroll via scrollIntoView), per-project language badges (GitHub language color scheme), commit count badges, private vs. public repo visual differentiation

**Addresses:** Auto-updating commit graph (core differentiator), Time Machine timeline (core differentiator), scroll-synced date navigation, language badges, commit count badges, private repo handling in UI

**Avoids:** Pitfall 6 (commit graph DOM re-render jank — React.memo, CSS data-attributes not inline styles, stable data prop reference), Pitfall 13 (scroll listener performance jank — IntersectionObserver for month tracking, not `scroll` event listeners; test on iOS Safari for sticky positioning bugs)

### Phase 5: Polish and Production Deployment

**Rationale:** Decorative elements, animations, and production deployment come last — after core functionality is verified. This ensures the production environment can be tested with a complete, working product rather than debugging infrastructure and features simultaneously. The deploy pipeline is a one-time configuration that should not gate feature development.

**Delivers:** Crosshatch grid background pattern and structural decorative lines, monospace label accents (`// projects`), fade-in scroll animations (CSS @keyframes + IntersectionObserver), Cloudflare Pages deployment with custom domain jacklabbe.com, R2 custom domain data.jacklabbe.com with CORS rules configured, Cache-Control headers on R2 objects (max-age=3600), end-to-end production verification of full data pipeline

**Addresses:** Decorative developer aesthetic, subtle entrance animations, professional domain and HTTPS, production reliability

**Avoids:** Pitfall 15 (R2 eventual consistency confusion — set Cache-Control headers, document expected 1-hour propagation delay), Pitfall 14 (deployment coordination — deploy Worker first, then Pages; schema versioning in place from Phase 1)

### Phase Ordering Rationale

- **Shared types before everything** — both Worker and SPA compile against these interfaces; defining the schema first surfaces disagreements before either side has significant code investment
- **Worker before SPA** — the SPA needs real R2 data to develop against; building the Worker first eliminates mocking and ensures no integration surprises at the end
- **Hero before complex visualizations** — simpler component proves end-to-end data fetch pipeline works before tackling SVG rendering and scroll sync
- **Commit graph before timeline** — the graph is a fixed-size SVG grid (simpler) while the timeline has variable-height entries and bidirectional scroll sync (more complex); sequencing validates rendering patterns incrementally
- **Backfill in Phase 2 operations, not Phase 1 setup** — backfill is a one-time operational task run outside the Worker; not part of monorepo infrastructure
- **Polish and deploy last** — decorative elements and animations are quick to add but should not gate functional review

### Research Flags

Phases needing deeper research during planning:

- **Phase 2 (Data Pipeline):** Cloudflare Worker subrequest limits and cron execution duration for paid vs. free plans need verification before committing to architecture — these determine whether daily pipeline runs fit in a single Worker invocation. The GitHub GraphQL `contributionsCollection` exact field names, timezone behavior, and required PAT scopes should be verified via introspection or current docs before writing the GraphQL client.
- **Phase 4 (Core Visualizations):** The scroll-synced date spine is the highest-risk UI feature in the project. IntersectionObserver threshold tuning and iOS Safari sticky positioning behavior should be spiked early in the phase before committing to the full implementation.

Phases with standard patterns (research can be skipped):

- **Phase 1 (Foundation):** pnpm workspaces and TypeScript monorepo patterns are fully documented with established conventions. No novel decisions required.
- **Phase 3 (Site Core):** Vite + React + TypeScript SPA setup is thoroughly documented. CSS Modules with custom properties is a well-understood pattern. `useEffect` + `Promise.all` data fetching is standard React. No novel decisions required.
- **Phase 5 (Polish and Deployment):** Cloudflare Pages direct upload via Wrangler CLI is documented. CSS @keyframes + IntersectionObserver fade-in is a standard pattern. Cache-Control header configuration is standard.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Architectural choices are well-reasoned and consistent across all four research files. Exact version numbers unverified — run `npm info` before installing. The hybrid GraphQL+REST approach is strongly motivated by the rate limit pitfalls research. CSS Modules over Tailwind is clearly justified for this specific project. |
| Features | MEDIUM-HIGH | Table stakes and anti-features reflect mature developer portfolio conventions that change slowly. The differentiator set (commit graph, timeline, private repo handling) is well-scoped and internally consistent. Lower confidence only for "latest trends" not core feature decisions. |
| Architecture | MEDIUM | The two-runtime pipeline pattern (Worker -> R2 -> static SPA) is well-established and the right fit. Cloudflare-specific details (R2 public access configuration, Pages direct upload CLI flags, Worker subrequest limits for cron) need verification against current 2026 Cloudflare documentation. |
| Pitfalls | MEDIUM-HIGH | 15 pitfalls identified across all phases. GitHub API limitations (Events API 90-day cap, rate limits, "contributed to" enumeration) are well-documented and high confidence. R2 consistency model and Cloudflare plan-specific limits are rated MEDIUM and need current doc verification. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Cloudflare Worker plan requirements:** Whether the paid plan is required (subrequest limits 50 free vs. 1,000 paid; cron execution duration 30s free vs. 15 min paid) needs confirmation before implementing the pipeline architecture. Free tier may be insufficient for daily runs touching 50+ repos.
- **GitHub GraphQL exact schema:** The `contributionsCollection.contributionCalendar` field structure, pagination, and timezone behavior should be verified against current GitHub GraphQL schema via introspection query or current docs before writing the GraphQL client.
- **R2 CORS configuration in 2026:** The exact steps to configure CORS rules on an R2 public custom domain may have changed since training data; verify against current Cloudflare dashboard during Phase 1.
- **Fine-grained PAT for organization repos:** If private repos are in a GitHub organization, the org admin must approve fine-grained PATs. Confirm applicability before implementing the PAT strategy; if org approval is unavailable, a classic PAT with minimal scopes is the fallback.
- **Wrangler current version:** Wrangler v4 may have shipped; verify CLI flags for `pages deploy`, `secret put`, and `dev` against current documentation before Phase 1 setup.
- **Cloudflare Pages monorepo build config:** Direct upload via `wrangler pages deploy packages/site/dist` is recommended over git integration for monorepos; verify current CLI syntax.

## Sources

### Primary (HIGH confidence)
- CSS Modules built into Vite — well-established Vite feature, unchanged across versions
- GitHub Events API 90-day / 300-event limit — documented GitHub REST API constraint
- React.memo and Intersection Observer patterns — standard React performance patterns
- Private repo allowlist sanitization — fundamental data security practice
- pnpm workspaces monorepo pattern — well-documented, stable tooling

### Secondary (MEDIUM confidence)
- React 19 stable (Dec 2024) — training data, widely reported; verify current latest
- Vite 6 as current major — training data; Vite 7 may exist, verify
- Wrangler 3.x as current major — training data; v4 may have shipped, verify
- GitHub GraphQL `contributionsCollection` API structure and timezone behavior — training data; verify exact field names and pagination
- Cloudflare Worker subrequest limits (1,000 paid / 50 free) and cron execution duration — training data; verify current plan limits
- @octokit/graphql + @octokit/rest versions (^8.x, ^21.x) — training data; verify latest majors
- R2 public access and CORS configuration steps — training data; verify against current Cloudflare dashboard

### Tertiary (LOW confidence)
- @octokit/graphql ~5KB bundle size — training data estimate; verify actual bundle size before committing to approach
- R2 eventual consistency model for overwrites — training data; verify current Cloudflare R2 consistency guarantees
- Fine-grained PAT support scope for organization private repos — training data; behavior may vary by org configuration

---
*Research completed: 2026-02-19*
*Ready for roadmap: yes*
