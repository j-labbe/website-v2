---
phase: 01-foundation-and-data-pipeline
plan: 05
subsystem: pipeline
tags: [pipeline-orchestration, r2, github-actions, deployment, cors]

# Dependency graph
requires:
  - phase: 01-03
    provides: Transform layer (graph, projects, sanitize, backfill)
  - phase: 01-04
    provides: GitHub API clients (GraphQL calendar, REST repos/commits/languages)
provides:
  - Pipeline orchestrator wiring fetch -> transform -> write
  - R2 read/write operations with atomic writes and error recovery
  - Worker handlers (scheduled cron + authenticated HTTP refresh)
  - GitHub Actions workflow for daily pipeline execution and R2 upload
  - R2 CORS policy for browser access
affects: [phase-02]

# Tech tracking
tech-stack:
  added: [github-actions, tsx]
  patterns: [github-actions-pipeline, wrangler-r2-upload, bearer-auth-graphql]

key-files:
  created:
    - worker/src/pipeline.ts
    - worker/src/r2.ts
    - worker/scripts/run-pipeline.ts
    - .github/workflows/pipeline.yml
    - pipeline.config.json
    - cors.json
  modified:
    - worker/src/index.ts
    - worker/src/github/rest.ts
    - worker/src/github/graphql.ts
    - worker/wrangler.toml

key-decisions:
  - "Pivoted from Cloudflare Worker cron execution to GitHub Actions -- Workers hit 1000 subrequest limit with large repo counts"
  - "Pipeline runs as standalone Node.js script via tsx in GH Actions, uploads JSON to R2 via wrangler CLI"
  - "Private repo names redacted from CI logs via safeRepoId() helper -- returns '[private]' for private repos"
  - "Org repos fetched per-org via listForOrg with deduplication, configurable via pipeline.config.json"
  - "GH_PAT env var used instead of GITHUB_TOKEN to avoid GitHub Actions auto-injection conflict"
  - "GraphQL auth uses bearer prefix (GitHub's recommended format for GraphQL API)"
  - "Cloudflare account_id added to wrangler.toml to skip /memberships API lookup in CI"

patterns-established:
  - "GitHub Actions pipeline: checkout -> pnpm setup -> install -> run script -> upload artifacts"
  - "Pipeline config: external JSON file at repo root for username/orgs configuration"
  - "R2 upload via wrangler CLI in CI rather than programmatic R2 API calls"

requirements-completed: [PIPE-01, PIPE-05, INFR-04]

# Metrics
duration: ~60min (including debugging auth issues)
completed: 2026-02-20
---

# Phase 1 Plan 5: Pipeline Orchestration, R2 Writes, and Deployment Summary

**Pipeline orchestrator wiring GitHub API fetches through transform layer to R2, deployed via GitHub Actions with daily cron and manual trigger**

## Performance

- **Duration:** ~60 min (including auth debugging)
- **Started:** 2026-02-19
- **Completed:** 2026-02-20
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files created:** 6
- **Files modified:** 4

## Accomplishments

- Built pipeline orchestrator (pipeline.ts) that fetches contribution calendar, enumerates repos, fetches languages/commits, transforms data, and writes results to R2
- Built R2 operations layer (r2.ts) with atomic write ordering (data files first, meta.json last) and error recovery
- Wired Worker handlers with real scheduled (cron) and fetch (HTTP POST with Bearer auth) triggers
- Created GitHub Actions workflow replacing Worker-based execution after hitting Cloudflare's 1000 subrequest limit
- Built standalone pipeline script (run-pipeline.ts) reusing all existing fetch/transform modules
- Added pipeline.config.json for configurable username and org list
- Fixed privacy leak: private repo names no longer appear in CI logs
- Added per-org repo fetching with deduplication for organization repositories
- Configured R2 CORS for browser access from jacklabbe.com and localhost
- Added Cloudflare account_id to wrangler.toml for CI compatibility

## Architecture Deviation: Worker → GitHub Actions

The original plan called for pipeline execution inside the Cloudflare Worker via cron trigger. During deployment testing, the pipeline hit Cloudflare's 1000 subrequest limit (each repo requires 2+ API calls, plus commit detail fetches).

**Resolution:** Pipeline execution moved to GitHub Actions as a standalone Node.js script. The script reuses all existing modules (github/graphql, github/rest, transform/*) and writes JSON to disk. A subsequent GH Actions step uploads the files to R2 via wrangler CLI. The Worker still exists with its handlers for potential future use.

## Task Commits

Key commits across the plan (iterative debugging required multiple fixes):

1. **Task 1: R2 operations and pipeline orchestrator** - `8b6fc78` (feat)
2. **Task 2: Wire Worker handlers and CORS** - `7c30bab` (feat)
3. **Pivot to GitHub Actions** - `5e30b18` (feat)
4. **Auth and deployment fixes** - Multiple commits (`b4786a7` through `cb92695`)

## Files Created/Modified

- `worker/src/pipeline.ts` - Pipeline orchestrator (Worker path, still functional)
- `worker/src/r2.ts` - R2 read/write with atomic ordering and error recovery
- `worker/src/index.ts` - Worker entry with scheduled + fetch handlers
- `worker/scripts/run-pipeline.ts` - Standalone Node.js pipeline for GH Actions
- `.github/workflows/pipeline.yml` - Daily cron + manual trigger workflow
- `pipeline.config.json` - Username and org configuration
- `cors.json` - R2 CORS policy (Cloudflare rules format)
- `worker/wrangler.toml` - Added account_id for CI
- `worker/src/github/rest.ts` - Added safeRepoId(), per-org fetching, dedup
- `worker/src/github/graphql.ts` - Switched to bearer auth prefix

## Deviations from Plan

### Major: Pipeline execution moved from Worker to GitHub Actions
- **Reason:** Cloudflare Workers 1000 subrequest limit insufficient for pipeline's API call volume
- **Impact:** New files (run-pipeline.ts, pipeline.yml), Worker handlers remain as backup
- **Resolution:** Fully working GH Actions pipeline with daily cron and wrangler R2 uploads

### Auto-fixed Issues
- CORS config format (S3-style → Cloudflare rules format)
- GraphQL auth prefix (token → bearer for GitHub GraphQL API)
- pnpm version in GH Actions (added packageManager field)
- tsx resolution (pnpm --filter exec pattern)
- Output path double-nesting (cwd already worker/)
- Private repo names in logs (safeRepoId helper)
- Org repos missing (per-org fetch + dedup)
- GH_PAT env var naming (avoid GITHUB_TOKEN conflict)
- Cloudflare account_id for wrangler in CI

## User Setup Required

Completed during verification:
- GitHub secret `PIPELINE_GITHUB_TOKEN` (classic PAT with repo, read:org, read:user)
- GitHub secret `CLOUDFLARE_API_TOKEN` (API token with R2 Storage: Edit)
- R2 bucket `jacklabbe-data` created
- R2 CORS applied via `wrangler r2 bucket cors set`

## Self-Check: PASSED

Pipeline runs successfully via GitHub Actions. Data flows from GitHub API → transform → R2 upload.

---
*Phase: 01-foundation-and-data-pipeline*
*Completed: 2026-02-20*
