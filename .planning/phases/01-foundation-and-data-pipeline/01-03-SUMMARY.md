---
phase: 01-foundation-and-data-pipeline
plan: 03
subsystem: transform
tags: [tdd, vitest, sanitization, privacy, sha256, typescript, transform]

# Dependency graph
requires:
    - phase: 01-01
      provides: "Shared types (ProjectEntry, GraphData, PipelineMeta, CommitDetail) and monorepo workspace"
provides:
    - sanitizePrivateRepo function with SHA-256 hashed IDs and allowlist-only field selection
    - transformRepo function routing public/private repos to appropriate handlers
    - filterRepos function removing repos with fewer than 3 commits
    - transformContributionCalendar converting GitHub GraphQL calendar to flat GraphData
    - isBackfillNeeded detecting empty or stale R2 meta state
affects: [01-04, 01-05]

# Tech tracking
tech-stack:
    added: [vitest@4.0.18]
    patterns:
        [
            tdd-red-green-refactor,
            allowlist-sanitization,
            explicit-field-construction,
        ]

key-files:
    created:
        - worker/src/transform/sanitize.ts
        - worker/src/transform/projects.ts
        - worker/src/transform/graph.ts
        - worker/src/transform/backfill.ts
        - worker/src/transform/__tests__/sanitize.test.ts
        - worker/src/transform/__tests__/projects.test.ts
        - worker/src/transform/__tests__/graph.test.ts
        - worker/src/transform/__tests__/backfill.test.ts
        - worker/vitest.config.ts
    modified:
        - worker/package.json

key-decisions:
    - "Used node:crypto createHash for SHA-256 hashing (available in Workers runtime, no extra deps)"
    - "RawGitHubRepo interface defined locally in sanitize.ts rather than shared package (internal to worker)"
    - "Boundary at exactly >48h for backfill (not >=), so exactly 48h still counts as fresh"

patterns-established:
    - "Allowlist sanitization: construct output objects field-by-field, never spread raw API data"
    - "TDD workflow: RED (failing tests) -> GREEN (minimal implementation) -> REFACTOR"
    - "Privacy boundary: JSON.stringify tests prove no private data leaks in serialized output"

requirements-completed: [PIPE-06, PIPE-07, PIPE-09]

# Metrics
duration: 5min
completed: 2026-02-19
---

# Phase 1 Plan 3: Data Transformation and Sanitization Summary

**TDD-driven transform layer with allowlist-based private repo sanitization (SHA-256 hashed IDs), public repo enrichment, contribution calendar flattening, and backfill detection -- 43 tests proving privacy boundary holds**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-19T18:32:04Z
- **Completed:** 2026-02-19T18:37:18Z
- **Tasks:** 2 (RED + GREEN TDD phases)
- **Files modified:** 10

## Accomplishments

- Built the privacy boundary: sanitizePrivateRepo constructs output with explicit field allowlist, never spreading raw API data. SHA-256 hash of full_name produces stable 16-char hex IDs.
- Implemented full public repo transformation with URL, description, topics, and rich commit data passthrough
- Created contribution calendar transformer that flattens GitHub's nested weeks/days structure and maps NONE->0 through FOURTH_QUARTILE->4
- Built backfill detection: null meta = full backfill, >48h staleness = full backfill
- 43 tests across 4 test files proving correctness, including JSON.stringify leak detection tests

## Task Commits

Each task was committed atomically:

1. **TDD RED: Failing tests for all transform functions** - `e553ef4` (test)
2. **TDD GREEN: Implement transform functions to pass all tests** - `fea89f2` (feat)

_No REFACTOR commit needed -- implementation was clean on first pass._

## Files Created/Modified

- `worker/src/transform/sanitize.ts` - Private repo allowlist sanitization with SHA-256 ID hashing
- `worker/src/transform/projects.ts` - Public/private repo transformation router and commit filter
- `worker/src/transform/graph.ts` - GitHub contribution calendar to GraphData transformation
- `worker/src/transform/backfill.ts` - Backfill detection based on R2 meta state
- `worker/src/transform/__tests__/sanitize.test.ts` - 16 tests: allowlist fields, no-leak JSON.stringify, fork handling
- `worker/src/transform/__tests__/projects.test.ts` - 14 tests: public enrichment, private delegation, filter boundary
- `worker/src/transform/__tests__/graph.test.ts` - 8 tests: level mapping, flat array, range extraction
- `worker/src/transform/__tests__/backfill.test.ts` - 5 tests: null meta, stale meta, fresh meta, boundary
- `worker/vitest.config.ts` - Vitest config with shared package alias
- `worker/package.json` - Added vitest devDependency and test script

## Decisions Made

- Used `node:crypto` createHash for SHA-256 hashing since it is available in the Cloudflare Workers runtime without needing external dependencies
- Defined RawGitHubRepo interface in sanitize.ts (worker-internal) rather than the shared package, since it represents raw API shapes not part of the public contract
- Set backfill boundary at strictly greater than 48 hours (>48h, not >=48h), so exactly 48 hours still counts as fresh

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None -- no external service configuration required.

## Next Phase Readiness

- All transform functions are tested and ready for integration with the GitHub API fetching layer (Plan 04)
- The sanitizePrivateRepo function is imported by transformRepo, establishing the privacy delegation pattern
- filterRepos is ready to post-process transformed repo arrays before R2 writes
- transformContributionCalendar is ready to receive raw GraphQL calendar data
- isBackfillNeeded is ready to check R2 meta state in the pipeline orchestrator

## Self-Check: PASSED

All 9 files verified present. Commits e553ef4 and fea89f2 verified in git log. All 43 tests pass.

---

_Phase: 01-foundation-and-data-pipeline_
_Completed: 2026-02-19_
