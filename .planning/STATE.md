# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Show what I'm actively building -- a living, auto-updating portfolio driven by real commit data, not manually curated content.
**Current focus:** Phase 2 complete -- ready to plan Phase 3

## Current Position

Phase: 2 of 3 (Site Shell, Design System, and Hero)
Plan: 5 of 5 in Phase 2 complete
Status: Phase 2 Complete
Last activity: 2026-02-20 -- Completed 02-05 (LQIP photo loading + visual polish)

Progress: [██████████] 100% (Phase 2)

## Performance Metrics

**Velocity:**
- Total plans completed: 10
- Average duration: ~10 min
- Total execution time: ~1.6 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 5/5 | ~75 min | ~15 min |
| 02-site-shell | 5/5 | ~31 min | ~6 min |

**Recent Trend:**
- Last 5 plans: 02-01 (3 min), 02-02 (2 min), 02-03 (~15 min), 02-04 (3 min), 02-05 (~8 min)
- Trend: Phase 2 complete, all plans executed efficiently

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 3-phase quick-depth structure -- pipeline before SPA, visualizations last
- [Roadmap]: All DSGN requirements except hover states (DSGN-07) go in Phase 2; hover states ship with the components they apply to in Phase 3
- [01-01]: Used live types pattern (customConditions + source exports) to eliminate build step for shared package
- [01-01]: Type-only re-exports (export type) in index.ts to ensure zero runtime footprint
- [01-02]: Worker Env interface includes R2_BUCKET, GITHUB_TOKEN, and REFRESH_SECRET bindings matching research patterns
- [01-02]: Worker uses both scheduled and fetch handler stubs for cron and manual refresh endpoints
- [01-02]: Added .gitignore rules for shared package build artifacts to keep live types pattern clean
- [01-04]: fetchCommitDetail returns null (not throw) when rate limit < 200 -- graceful degradation over hard failure
- [01-04]: checkRateLimit called before each individual commit detail fetch to prevent rate limit exhaustion
- [01-04]: Raw API response types kept separate from shared types -- types.ts is internal to worker, not exported to shared
- [01-03]: Used node:crypto createHash for SHA-256 hashing (available in Workers runtime, no extra deps)
- [01-03]: RawGitHubRepo interface defined locally in sanitize.ts rather than shared package (internal to worker)
- [01-03]: Backfill boundary at strictly >48h (not >=), so exactly 48h still counts as fresh
- [01-05]: Pivoted from Worker cron to GitHub Actions due to 1000 subrequest limit
- [01-05]: GH_PAT env var avoids GITHUB_TOKEN auto-injection conflict in Actions
- [01-05]: GraphQL auth uses bearer prefix per GitHub's recommendation
- [01-05]: Pipeline config (username, orgs) externalized to pipeline.config.json
- [02-01]: sessionStorage caching with 1hr TTL for R2 data -- improves repeat visits without service worker complexity
- [02-01]: Added .env.production to .gitignore alongside .env -- both contain environment-specific URLs
- [02-02]: IntersectionObserver with sentinel element for navbar scroll detection -- avoids scroll event listener performance cost
- [02-02]: Navbar contact button uses text-sm (slightly smaller than hero text-base) for visual hierarchy
- [02-03]: Static OG tags in index.html for social crawlers plus React 19 runtime metadata
- [02-03]: CORS config expanded to include jacklabbe.pages.dev origin for R2 data fetching
- [02-04]: Tailwind @theme for design tokens: --color-* convention maps to bg-*, text-*, border-* utilities
- [02-04]: Navbar scroll-state handled via CSS rule in @layer components rather than React state
- [02-04]: Renamed staggerItem to stagger-item for kebab-case consistency with Tailwind conventions
- [02-05]: Replaced squircle clip-path with rounded-2xl per user feedback during visual verification
- [02-05]: Build-time LQIP generation via sharp instead of hardcoded base64 -- regenerates from actual headshot
- [02-05]: 3D tilt hover effect on hero photo with +/-17deg rotation (Apple TV style)
- [02-05]: Photo dimensions fixed at 300x250px for predictable layout

### Pending Todos

None yet.

### Blockers/Concerns

- Cloudflare API token permissions should be verified if R2 uploads fail
- Worker handlers (scheduled/fetch) remain functional but unused since pivot to GH Actions

## Session Continuity

Last session: 2026-02-20
Stopped at: Phase 3 context gathered
Resume file: .planning/phases/03-core-visualizations-and-launch/03-CONTEXT.md
Next action: Plan Phase 3 (Core Visualizations and Launch)
