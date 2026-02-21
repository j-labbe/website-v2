# Phase 1: Foundation and Data Pipeline - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Monorepo skeleton (site/, worker/, shared/) with pnpm workspaces and a Cloudflare Worker pipeline that fetches GitHub data via GraphQL and REST APIs, sanitizes it, and writes structured JSON to R2. No UI — this phase delivers the data engine that Phases 2 and 3 render.

</domain>

<decisions>
## Implementation Decisions

### Data scope

- GitHub username: `j-labbe`
- Include all repos with contributions: owned, org, and forked
- 24-month rolling window for the project timeline
- Commit graph uses 12 months (GitHub contribution calendar default)
- Filter out repos with fewer than 3 commits (removes drive-by forks, empty inits)

### Private repo rules

- All private repos labeled "Private Repo" — no category hints, no names, no URLs
- Language badges shown per private repo (languages don't reveal enough to be a privacy concern)
- Each private repo appears as its own individual entry (not collapsed)
- No exclusion list needed — anonymization is sufficient
- Both created date and last-active date stored for private repos
- Per-month commit counts stored (not just totals) — enables timeline activity distribution
- Stable hashed ID (SHA of repo name) for tracking across pipeline runs
- Private repo commits count toward the commit graph heatmap
- Org repos follow the same private/public rules as personal repos
- Forked private repos: store parent info only if the parent repo is public

### Fork handling

- Public forks marked clearly (e.g., "Forked: repo-name" or fork badge)
- Store `is_fork` flag + parent repo name and URL for public forks
- Private forks with public parents: store parent info; private forks with private parents: no parent info

### JSON data contract

- graph.json: Commit graph heatmap data (Claude's discretion on daily vs weekly granularity)
- projects.json: Repo entries with metadata, per-month commit counts, language badges, dates
- meta.json: Minimal — last-updated timestamp and success/failure status
- Public repos: collect rich commit-level data now (messages, diff stats) for v2 readiness (CONT-01, CONT-02)
- "Last updated" timestamp from meta.json will be displayed on the site (reinforces "living" portfolio)

### Update & recovery

- Daily cron trigger at ~06:00 UTC
- Backfill strategy: Claude's discretion (auto-detect vs manual trigger)
- On pipeline failure: keep existing R2 data + write error marker to meta.json so SPA can show "data may be outdated"
- HTTP endpoint available for manual refresh (authenticated) — useful after pushing a burst of commits

### Claude's Discretion

- graph.json granularity (raw daily vs pre-grouped by week)
- Backfill trigger strategy (auto-detect empty R2 vs manual endpoint)
- Exact progress bar or logging approach for the Worker
- HTTP auth mechanism for the manual refresh endpoint
- Compression algorithm choices
- Temp file handling during pipeline runs

</decisions>

<specifics>
## Specific Ideas

- The "last updated" timestamp should be visible on the site — part of the "living portfolio" identity
- Rich commit data (messages, diffs) collected now even though it's v2 — avoid re-backfilling later
- Fork badge or "Forked: name" treatment for public forks — credit to upstream while showing your contributions
- Pipeline should be resilient: stale data is better than no data

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 01-foundation-and-data-pipeline_
_Context gathered: 2026-02-19_
