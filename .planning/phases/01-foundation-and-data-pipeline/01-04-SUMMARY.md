---
phase: 01-foundation-and-data-pipeline
plan: 04
subsystem: api
tags: [github-api, graphql, rest, octokit, rate-limiting, pagination]

# Dependency graph
requires:
  - phase: 01-02
    provides: Worker package skeleton with @octokit/graphql and @octokit/rest dependencies
provides:
  - GraphQL client for 12-month GitHub contribution calendar (fetchContributionCalendar)
  - REST client for repo enumeration with affiliation filter (fetchAllRepos)
  - REST client for per-repo commit listing with author/date filtering (fetchRepoCommits)
  - REST client for per-repo language breakdown (fetchRepoLanguages)
  - REST client for individual commit detail with diff stats (fetchCommitDetail)
  - Rate limit checking with structured logging and graceful degradation
  - Raw GitHub API response types for internal use
affects: [01-05, 01-03]

# Tech tracking
tech-stack:
  added: [@octokit/graphql@^9, @octokit/rest@^22]
  patterns: [inside-handler-octokit-instantiation, rate-limit-graceful-degradation, structured-json-logging]

key-files:
  created:
    - worker/src/github/types.ts
    - worker/src/github/graphql.ts
    - worker/src/github/rest.ts
  modified: []

key-decisions:
  - "fetchCommitDetail returns null (not throw) when rate limit < 200 -- graceful degradation over hard failure"
  - "checkRateLimit called before each individual commit detail fetch to prevent rate limit exhaustion"
  - "Raw API response types kept separate from shared types -- types.ts is internal to worker, not exported to shared"

patterns-established:
  - "Inside-handler instantiation: Octokit/graphql clients created inside functions, never at module scope (Workers constraint)"
  - "Structured logging: JSON.stringify({ stage, ...data, ts }) pattern for all API operations"
  - "Graceful degradation: rate limit checks return null/skip instead of throwing, pipeline continues with partial data"

requirements-completed: [PIPE-02, PIPE-03, PIPE-04, PIPE-08, PIPE-10]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 1 Plan 4: GitHub API Integration Summary

**GraphQL contribution calendar client and REST client for repo enumeration, commit fetching, and language data with per-call rate limit checking and graceful degradation via @octokit/graphql and @octokit/rest**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T18:32:06Z
- **Completed:** 2026-02-19T18:35:44Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Built GraphQL client that queries GitHub's contributionsCollection for 12-month contribution calendar with day-level granularity
- Built REST client with 5 exported functions covering repo enumeration (with owner+collaborator+org affiliation filter), language breakdown, paginated commit listing, and individual commit detail with diff stats
- Implemented rate limit awareness: checkRateLimit helper logs remaining budgets, fetchCommitDetail skips calls when REST budget < 200 remaining
- Defined complete raw GitHub API response types (internal to worker) for type-safe API interaction

## Task Commits

Each task was committed atomically:

1. **Task 1: GitHub GraphQL client for contribution calendar** - `7dcabde` (feat)
2. **Task 2: GitHub REST client for repo enumeration, commits, and languages** - `4259768` (feat)

## Files Created/Modified

- `worker/src/github/types.ts` - Raw GitHub API response types (GitHubContributionCalendar, GitHubRepo, GitHubCommit, GitHubCommitDetail)
- `worker/src/github/graphql.ts` - fetchContributionCalendar using @octokit/graphql with 12-month date range
- `worker/src/github/rest.ts` - createOctokit, fetchAllRepos, fetchRepoLanguages, fetchRepoCommits, fetchCommitDetail with rate limit handling

## Decisions Made

- fetchCommitDetail returns null instead of throwing when rate limit is low -- allows pipeline to continue with partial commit detail data rather than failing entirely
- checkRateLimit is called before every individual commit detail fetch (not batched) to ensure the most up-to-date rate limit info before expensive N+1 calls
- Raw GitHub API types (types.ts) are kept internal to the worker package, not exported to @jacklabbe/shared -- shared types represent the transformed output, not raw API shapes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed nullable graphql resource in rate limit response**

- **Found during:** Task 2 (REST client implementation)
- **Issue:** TypeScript strict null check flagged `data.resources.graphql` as possibly undefined in the @octokit/rest rate limit response type
- **Fix:** Added null check with fallback to 'unknown' values in the structured log output
- **Files modified:** worker/src/github/rest.ts
- **Verification:** Worker typecheck passes for all github/\* files
- **Committed in:** 4259768 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor type safety fix. No scope creep.

## Issues Encountered

- Pre-existing file (transform/sanitize.ts from plan 01-03) has a type error for `node:crypto` module, causing worker-wide typecheck to fail. This is out of scope for plan 01-04 -- all github/\* files typecheck cleanly. `pnpm build` still passes (wrangler bundles successfully).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- GitHub API integration layer is complete and ready for Plan 05 (pipeline orchestration) to wire fetch -> transform -> write
- Plan 03 (transform layer) can import types from worker/src/github/types.ts for its transformation functions
- All functions accept token as parameter, ready to receive env.GITHUB_TOKEN from handler context

## Self-Check: PASSED

All 3 files verified present. Commits 7dcabde and 4259768 verified in git log.

---

_Phase: 01-foundation-and-data-pipeline_
_Completed: 2026-02-19_
