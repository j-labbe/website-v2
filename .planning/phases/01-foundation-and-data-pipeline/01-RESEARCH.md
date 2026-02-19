# Phase 1: Foundation and Data Pipeline - Research

**Researched:** 2026-02-19
**Domain:** pnpm monorepo, Cloudflare Workers/R2, GitHub GraphQL+REST APIs, TypeScript shared types
**Confidence:** HIGH

## Summary

Phase 1 delivers the monorepo skeleton and the Cloudflare Worker data pipeline that fetches GitHub data and writes structured JSON to R2. The research confirms every technical choice in the CONTEXT.md decisions is sound and well-supported by current tooling. The key findings that shape implementation are:

1. **Wrangler v4 is current** (4.67.0), not v3. The migration is minimal -- same configuration patterns, updated esbuild internally. Use `wrangler@^4`.
2. **Workers Paid plan is essential.** Free tier limits (50 subrequests, 10ms CPU) are completely insufficient. Paid plan gives 10,000 subrequests and 15-minute cron execution with no duration limit for cron triggers on the Bundled plan.
3. **GraphQL and REST rate limits are separate pools** -- 5,000 points/hour each. The hybrid approach (GraphQL for contribution calendar, REST for repo metadata + commits) effectively doubles available API budget.
4. **Octokit works in Workers** but must be instantiated inside the handler, not at module scope. This is a resolved issue (not a design concern).
5. **Rich commit data (messages, diff stats) requires individual GET /commits/{ref} calls** -- the list endpoint does not return stats. This is the most API-expensive part of the pipeline and must be carefully budgeted.
6. **R2 CORS is straightforward** with the wrangler CLI (`wrangler r2 bucket cors set`). Custom domain setup requires the domain zone to be in the same Cloudflare account.

**Primary recommendation:** Build the Worker with both `scheduled` and `fetch` handlers in one deployment -- cron for daily runs, authenticated HTTP for manual refresh. Use the "live types" pattern for the shared package so no build step is needed during development.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Data scope
- GitHub username: `j-labbe`
- Include all repos with contributions: owned, org, and forked
- 24-month rolling window for the project timeline
- Commit graph uses 12 months (GitHub contribution calendar default)
- Filter out repos with fewer than 3 commits (removes drive-by forks, empty inits)

#### Private repo rules
- All private repos labeled "Private Repo" -- no category hints, no names, no URLs
- Language badges shown per private repo (languages don't reveal enough to be a privacy concern)
- Each private repo appears as its own individual entry (not collapsed)
- No exclusion list needed -- anonymization is sufficient
- Both created date and last-active date stored for private repos
- Per-month commit counts stored (not just totals) -- enables timeline activity distribution
- Stable hashed ID (SHA of repo name) for tracking across pipeline runs
- Private repo commits count toward the commit graph heatmap
- Org repos follow the same private/public rules as personal repos
- Forked private repos: store parent info only if the parent repo is public

#### Fork handling
- Public forks marked clearly (e.g., "Forked: repo-name" or fork badge)
- Store `is_fork` flag + parent repo name and URL for public forks
- Private forks with public parents: store parent info; private forks with private parents: no parent info

#### JSON data contract
- graph.json: Commit graph heatmap data (Claude's discretion on daily vs weekly granularity)
- projects.json: Repo entries with metadata, per-month commit counts, language badges, dates
- meta.json: Minimal -- last-updated timestamp and success/failure status
- Public repos: collect rich commit-level data now (messages, diff stats) for v2 readiness (CONT-01, CONT-02)
- "Last updated" timestamp from meta.json will be displayed on the site (reinforces "living" portfolio)

#### Update & recovery
- Daily cron trigger at ~06:00 UTC
- Backfill strategy: Claude's discretion (auto-detect vs manual trigger)
- On pipeline failure: keep existing R2 data + write error marker to meta.json so SPA can show "data may be outdated"
- HTTP endpoint available for manual refresh (authenticated) -- useful after pushing a burst of commits

### Claude's Discretion
- graph.json granularity (raw daily vs pre-grouped by week)
- Backfill trigger strategy (auto-detect empty R2 vs manual endpoint)
- Exact progress bar or logging approach for the Worker
- HTTP auth mechanism for the manual refresh endpoint
- Compression algorithm choices
- Temp file handling during pipeline runs

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFR-01 | TypeScript React application (Vite build toolchain) | Vite 7.3.1 + React 19.2.4 + TypeScript 5.9.3 verified as current. Site package uses Vite; this phase creates the skeleton with `pnpm build` passing. |
| INFR-02 | pnpm monorepo with shared types package (site/, worker/, shared/) | pnpm 10.30.0 confirmed. "Live types" pattern eliminates build step for shared package. `workspace:*` protocol for cross-references. |
| INFR-03 | Deployed to Cloudflare Pages (static upload) | `wrangler pages deploy` for monorepo static upload confirmed. Phase 1 sets up skeleton; actual deployment is Phase 2+. |
| INFR-04 | Commit data served from Cloudflare R2 (CDN-cacheable JSON) | R2 public bucket with custom domain confirmed. CORS configurable via `wrangler r2 bucket cors set`. Cache-Control headers set on PUT. |
| INFR-05 | Site fetches R2 JSON on visit (not full SSG) | Architecture confirmed: SPA fetches from R2 public URL at runtime. Phase 1 ensures R2 is accessible; Phase 2 implements the fetch. |
| PIPE-01 | Cloudflare Worker runs on daily cron trigger | Wrangler v4 cron triggers confirmed. `[triggers] crons = ["0 6 * * *"]` in wrangler.toml. 15-min execution limit (no limit on Bundled plan). |
| PIPE-02 | Worker uses GitHub GraphQL API for 12-month commit graph data | `contributionsCollection(from, to) { contributionCalendar { weeks { contributionDays { contributionCount, contributionLevel, date } } totalContributions } }` verified. One API call, ~1 point. Dates pre-bucketed by user's timezone. |
| PIPE-03 | Worker uses GitHub REST API for repo enumeration and per-repo metadata | `GET /user/repos?affiliation=owner,collaborator,organization_member&per_page=100` confirmed. Paginate with `page` param. Languages via `GET /repos/{owner}/{repo}/languages`. |
| PIPE-04 | Worker fetches data from all repos user contributes to | REST `/user/repos` with affiliation filter covers owned + org + collaborator repos. Forked repos included. GraphQL contributionCalendar covers ALL contributions including external PRs. |
| PIPE-05 | Worker writes split JSON files to R2 | R2 `put()` method confirmed via binding. Write graph.json, projects.json, meta.json as separate keys. Set `httpMetadata` for Content-Type and Cache-Control. |
| PIPE-06 | Private repo data sanitized via allowlist | Build sanitized objects with explicit field selection. Never spread/serialize raw API responses. SHA-256 hash of `full_name` for stable ID. Unit test that serialized JSON contains no private repo names. |
| PIPE-07 | Public repo data includes rich commit-level data | `GET /repos/{owner}/{repo}/commits/{ref}` returns `stats.additions`, `stats.deletions`, `commit.message`. List endpoint does NOT include stats -- individual commit GET required. Budget API calls carefully. |
| PIPE-08 | Pipeline handles GitHub API rate limits gracefully | REST: 5,000 req/hr. GraphQL: 5,000 points/hr (separate pool). Check `X-RateLimit-Remaining` header. Use `@octokit/rest` built-in pagination and rate limit handling. |
| PIPE-09 | Pipeline handles initial backfill separately from daily incremental | Backfill is API-intensive (12-24 months of commits across all repos). Auto-detect empty R2 bucket on first run. Daily runs are lightweight incremental. |
| PIPE-10 | GitHub PAT stored as Cloudflare Worker secret | `wrangler secret put GITHUB_TOKEN`. Access via `env.GITHUB_TOKEN`. Fine-grained PAT with Contents: Read-only + Metadata: Read-only. `.dev.vars` for local development. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pnpm | 10.30.0 | Package manager + monorepo workspaces | Current stable. Workspaces enable shared types across site/worker/shared. Strict `node_modules` prevents phantom deps. |
| TypeScript | 5.9.3 | Type safety across all packages | Current stable. `composite: true` enables project references for incremental builds. `customConditions` enables live types. |
| Wrangler | 4.67.0 | Cloudflare CLI (Workers, R2, Pages, secrets) | Current stable (v4 shipped March 2025). Updated esbuild for modern JS. Same config patterns as v3. |
| @cloudflare/workers-types | 4.20260219.0 | TypeScript types for Workers runtime | Provides `R2Bucket`, `ScheduledController`, `ExecutionContext`, `Request`, `Response` types. Version date-stamped. |
| @octokit/graphql | 9.0.3 | GitHub GraphQL client | Official client. Single call for 12-month contribution calendar. ~5KB. |
| @octokit/rest | 22.0.1 | GitHub REST client | Official client with built-in pagination, auth, and rate limit headers. Repo enumeration, commit fetching, language stats. |
| Vite | 7.3.1 | Build tool for site package | Current stable. Needed for Phase 1 `pnpm build` success criterion even though site is a skeleton. |
| React | 19.2.4 | UI framework for site package | Current stable. Minimal skeleton in Phase 1; real UI in Phase 2+. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 4.0.18 | Unit testing | Test private repo sanitization, date aggregation, hash stability. Critical for PIPE-06 verification. |
| @vitejs/plugin-react | ^4.x | Vite React plugin | Site package build. Verify latest: `npm info @vitejs/plugin-react version`. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @octokit/graphql + @octokit/rest | Raw `fetch()` calls | Octokit provides type safety, pagination, auth, rate limit awareness. Raw fetch is lighter but requires reimplementing all of this. Octokit's bundle size is acceptable for Workers (well under 10MB compressed limit). |
| @octokit/graphql + @octokit/rest | `octokit` umbrella package | Umbrella includes plugins we don't need. Separate packages are lighter. |
| pnpm workspaces | Turborepo + pnpm | Turborepo adds caching/task orchestration. Unnecessary for 3 small packages. Adds configuration overhead. |
| TypeScript project references | Simple path aliases | Project references enforce build order and enable incremental compilation. Path aliases are simpler but don't catch cross-package type errors at build time. |

**Installation (root):**
```bash
pnpm init
# Create pnpm-workspace.yaml pointing to site/, worker/, shared/
pnpm add -Dw typescript@^5.9
```

**Installation (worker):**
```bash
cd worker
pnpm add @octokit/graphql@^9 @octokit/rest@^22
pnpm add -D wrangler@^4 @cloudflare/workers-types
```

**Installation (site):**
```bash
cd site
pnpm add react@^19 react-dom@^19
pnpm add -D vite@^7 @vitejs/plugin-react @types/react @types/react-dom typescript@^5.9
```

**Installation (shared):**
```bash
cd shared
# No runtime deps -- just TypeScript types
pnpm add -D typescript@^5.9
```

## Architecture Patterns

### Recommended Project Structure

```
jacklabbe.com/
├── site/                          # React SPA (Cloudflare Pages)
│   ├── src/
│   │   ├── main.tsx               # App entry (skeleton in Phase 1)
│   │   └── App.tsx                # Root component (placeholder)
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json              # extends ../tsconfig.base.json
│   └── package.json               # depends on @jacklabbe/shared
├── worker/                        # Cloudflare Worker (data pipeline)
│   ├── src/
│   │   ├── index.ts               # scheduled + fetch handlers
│   │   ├── github/
│   │   │   ├── graphql.ts         # contributionsCollection query
│   │   │   ├── rest.ts            # repo enumeration, commits, languages
│   │   │   └── types.ts           # GitHub API response types (internal)
│   │   ├── transform/
│   │   │   ├── graph.ts           # Raw calendar -> graph.json shape
│   │   │   ├── projects.ts        # Raw repos -> projects.json shape
│   │   │   └── sanitize.ts        # Private repo field allowlist
│   │   ├── r2.ts                  # R2 write operations with error handling
│   │   └── pipeline.ts            # Orchestrates fetch -> transform -> write
│   ├── wrangler.toml
│   ├── tsconfig.json              # extends ../tsconfig.base.json
│   └── package.json               # depends on @jacklabbe/shared
├── shared/                        # Shared TypeScript types
│   ├── src/
│   │   ├── index.ts               # Re-exports all types
│   │   ├── graph.ts               # GraphData, ContributionDay types
│   │   ├── projects.ts            # ProjectEntry, MonthlyCommits types
│   │   └── meta.ts                # PipelineMeta type
│   ├── tsconfig.json              # composite: true
│   └── package.json               # @jacklabbe/shared
├── pnpm-workspace.yaml            # packages: [site, worker, shared]
├── tsconfig.base.json             # Shared strict TS config
└── package.json                   # Root workspace scripts
```

**Note on directory naming:** The CONTEXT.md specifies `site/`, `worker/`, `shared/` as top-level directories (not nested under `packages/`). The prior architecture research used `packages/` but the user decision takes precedence. Both patterns work with pnpm workspaces -- just configure `pnpm-workspace.yaml` accordingly.

### Pattern 1: Live Types (Shared Package Without Build Step)

**What:** The shared package exports TypeScript source directly during development. No build step needed for type changes to propagate to site and worker.

**When to use:** Always during development. Only build for publishing (not applicable here since we never publish shared to npm).

**Configuration:**

shared/package.json:
```json
{
  "name": "@jacklabbe/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "import": {
        "@jacklabbe/source": "./src/index.ts",
        "default": "./src/index.ts"
      }
    }
  },
  "types": "./src/index.ts"
}
```

tsconfig.base.json:
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "customConditions": ["@jacklabbe/source"]
  }
}
```

Consumer package.json (site/ and worker/):
```json
{
  "dependencies": {
    "@jacklabbe/shared": "workspace:*"
  }
}
```

**Why this works:** TypeScript resolves imports via the custom condition to `.ts` source files. Wrangler and Vite both bundle from source directly. No intermediate build step, no stale types.

Source: [Live types in a TypeScript monorepo](https://colinhacks.com/essays/live-types-typescript-monorepo)

### Pattern 2: Dual Handler Worker (Cron + HTTP)

**What:** A single Worker exports both `scheduled` (for cron) and `fetch` (for manual refresh) handlers.

**When to use:** This phase. The Worker needs daily cron AND an authenticated HTTP endpoint for manual refresh.

**Example:**
```typescript
// Source: Cloudflare Workers docs
// https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/

interface Env {
  R2_BUCKET: R2Bucket;
  GITHUB_TOKEN: string;
  REFRESH_SECRET: string;  // shared secret for manual refresh auth
}

export default {
  // Daily cron trigger
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) {
    ctx.waitUntil(runPipeline(env));
  },

  // Manual refresh via HTTP (authenticated)
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    // Simple shared-secret auth for manual trigger
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${env.REFRESH_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }
    ctx.waitUntil(runPipeline(env));
    return new Response("Pipeline triggered", { status: 202 });
  },
};
```

Source: [Cloudflare Workers Scheduled Handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/)

### Pattern 3: Allowlist-Based Sanitization

**What:** Private repo data constructed from an explicit field allowlist. Never spread or serialize raw API responses.

**When to use:** Every time a private repo is processed. This is the privacy boundary.

**Example:**
```typescript
import { createHash } from 'node:crypto';

function sanitizePrivateRepo(
  raw: GitHubRepo,
  monthlyCommits: Record<string, number>,
  languages: Record<string, number>,
): ProjectEntry {
  return {
    // Stable hash for cross-run tracking
    id: createHash('sha256').update(raw.full_name).digest('hex').slice(0, 16),
    name: 'Private Repo',
    isPrivate: true,
    isFork: raw.fork,
    // Parent info only if parent is public
    parentRepo: (raw.fork && raw.parent && !raw.parent.private)
      ? { name: raw.parent.full_name, url: raw.parent.html_url }
      : null,
    languages: Object.keys(languages),  // language names only, no byte counts
    createdAt: raw.created_at.slice(0, 10),   // YYYY-MM-DD
    lastActiveAt: raw.pushed_at.slice(0, 10), // YYYY-MM-DD
    monthlyCommits,  // { "2026-01": 15, "2026-02": 8, ... }
    totalCommits: Object.values(monthlyCommits).reduce((a, b) => a + b, 0),
    // Explicitly omitted: name, url, description, topics, commit messages, diff stats
  };
}
```

### Pattern 4: Atomic R2 Writes with Error Recovery

**What:** Write all JSON files only after all API fetches succeed. On failure, preserve existing R2 data and write an error marker to meta.json.

**When to use:** Every pipeline run.

**Example:**
```typescript
async function writePipelineResults(
  bucket: R2Bucket,
  graph: GraphData,
  projects: ProjectEntry[],
): Promise<void> {
  const now = new Date().toISOString();

  // Write data files
  await bucket.put('graph.json', JSON.stringify(graph), {
    httpMetadata: {
      contentType: 'application/json',
      cacheControl: 'public, max-age=3600',
    },
  });
  await bucket.put('projects.json', JSON.stringify({ projects }), {
    httpMetadata: {
      contentType: 'application/json',
      cacheControl: 'public, max-age=3600',
    },
  });

  // Write success meta last (signals complete write)
  await bucket.put('meta.json', JSON.stringify({
    lastUpdated: now,
    status: 'ok',
    projectCount: projects.length,
  }), {
    httpMetadata: {
      contentType: 'application/json',
      cacheControl: 'public, max-age=3600',
    },
  });
}

async function writeErrorMeta(bucket: R2Bucket, error: string): Promise<void> {
  // On failure: only update meta.json with error status
  // graph.json and projects.json remain from last successful run
  const existing = await bucket.get('meta.json');
  const prev = existing ? await existing.json<PipelineMeta>() : {};

  await bucket.put('meta.json', JSON.stringify({
    ...prev,
    lastUpdated: prev.lastUpdated,  // preserve last successful time
    status: 'error',
    error,
    errorAt: new Date().toISOString(),
  }), {
    httpMetadata: {
      contentType: 'application/json',
      cacheControl: 'public, max-age=300',  // shorter cache on error
    },
  });
}
```

### Anti-Patterns to Avoid

- **Instantiating Octokit at module scope:** Workers require Octokit to be created inside handler functions, not at top level. Confirmed resolved issue but still the correct pattern.
  Source: [cloudflare/workers-sdk#2975](https://github.com/cloudflare/workers-sdk/issues/2975)

- **Storing raw GitHub API responses in R2:** Always construct new objects with explicit fields. Raw responses contain nested `repository.full_name`, commit messages referencing private repos, and other indirect leakage paths.

- **Using the Events API for historical data:** Capped at 90 days / 300 events. Completely useless for a 12-month graph. Use GraphQL `contributionCalendar` instead.

- **Building the shared package before worker/site can use it:** Use the live types pattern. No build step needed for shared types during development.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GitHub API pagination | Manual page iteration with Link headers | `@octokit/rest` built-in pagination via `.paginate()` | Handles Link header parsing, rate limit awareness, request queuing |
| GitHub auth + token management | Manual Authorization header on every fetch | `@octokit/graphql` and `@octokit/rest` auth option | Handles token format, retry on 401, rate limit headers |
| Stable hash for private repo IDs | Custom hash function | Node.js `crypto.createHash('sha256')` | Available in Workers runtime. Deterministic, standard, no dependencies. |
| CORS configuration | Worker proxy just for CORS headers | R2 CORS policy via `wrangler r2 bucket cors set` | Native R2 feature. No extra Worker code or deployment. |
| Cron scheduling | External scheduler (GitHub Actions, etc.) | Wrangler cron triggers `[triggers] crons` | Built into Workers platform. Zero external dependencies. |

**Key insight:** The Cloudflare + Octokit ecosystems solve most infrastructure problems. The custom code in this phase should focus exclusively on: (1) the data transformation/sanitization logic, and (2) the pipeline orchestration (what to fetch, in what order, how to handle partial failures).

## Common Pitfalls

### Pitfall 1: Rich Commit Data N+1 Query Explosion

**What goes wrong:** To collect commit messages and diff stats (PIPE-07, CONT-01, CONT-02), the pipeline needs to call `GET /repos/{owner}/{repo}/commits/{sha}` for EACH commit individually. The list endpoint (`GET /repos/{owner}/{repo}/commits`) does NOT return `stats` (additions/deletions) or `files`. For 50 active repos with 10 recent commits each, that is 500 individual API calls just for diff stats.

**Why it happens:** GitHub's API design separates the "list" view (lightweight) from the "detail" view (includes stats/files). This is common in REST APIs but creates an N+1 problem for data collection.

**How to avoid:**
1. **Daily runs: only fetch commits since last successful run.** If the pipeline ran yesterday, you only need stats for today's commits (likely 0-20 across all repos).
2. **Backfill: batch carefully.** For 24 months of history, fetch commit SHAs via the list endpoint first, then fetch individual stats in batches with rate limit checking.
3. **Use the `stats/commit_activity` endpoint** (`GET /repos/{owner}/{repo}/stats/commit_activity`) for aggregate weekly commit counts. This gives counts without individual commit detail -- useful for the monthly aggregation in projects.json.
4. **Budget:** Reserve 80% of REST rate limit (4,000 of 5,000 req/hr) for commit detail calls. Use the other 20% for repo enumeration and metadata.
5. **Consider deferring rich commit data to backfill only.** Daily runs collect SHAs and counts; a separate backfill process enriches with messages and stats.

**Warning signs:** Pipeline taking more than 5 minutes on daily runs. Rate limit remaining dropping below 1,000 during execution.

Source: [GitHub REST API commits endpoint](https://docs.github.com/en/rest/commits/commits)

### Pitfall 2: GraphQL contributionCalendar Date Range Limitations

**What goes wrong:** The `contributionsCollection(from, to)` parameters only accept a maximum range of approximately 1 year (365-366 days). Requesting a 24-month range returns an error.

**Why it happens:** GitHub limits the contribution calendar query to roughly 1 year per call.

**How to avoid:**
1. **For graph.json (12 months):** Single query with `from` = 12 months ago, `to` = now. This fits within the limit.
2. **For projects.json (24 months):** The contribution calendar is NOT used for project data. Use REST `GET /repos/{owner}/{repo}/commits?author=j-labbe&since=...&until=...` for per-repo commit counts over 24 months.
3. **The 24-month window only applies to project timeline data, not the graph.**

**Warning signs:** GraphQL errors mentioning invalid date range or exceeding maximum window.

### Pitfall 3: Octokit Instantiation in Workers

**What goes wrong:** Creating an Octokit instance at module scope (outside handlers) causes the Worker to fail with "Some functionality, such as asynchronous I/O, timeouts, and generating random values, can only be performed while handling a request."

**Why it happens:** Workers isolate initialization is restricted. Network I/O and crypto operations must occur inside a handler context.

**How to avoid:** Always create Octokit instances inside the `scheduled()` or `fetch()` handler:

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    // Create inside handler -- NOT at module scope
    const octokit = new Octokit({ auth: env.GITHUB_TOKEN });
    const graphql = graphqlClient.defaults({
      headers: { authorization: `token ${env.GITHUB_TOKEN}` },
    });
    // ... use them
  },
};
```

**Warning signs:** Worker deployment succeeds but invocation immediately fails with the error above.

Source: [cloudflare/workers-sdk#2975](https://github.com/cloudflare/workers-sdk/issues/2975)

### Pitfall 4: R2 CORS Policy Not Taking Effect

**What goes wrong:** After setting a CORS policy, cross-origin requests from the SPA still fail. Developers assume R2 is broken.

**Why it happens:** Three common causes: (1) CORS headers only appear on requests that include a valid `Origin` header -- testing with `curl` without `-H "Origin: ..."` shows no CORS headers. (2) Cached assets don't reflect new CORS rules until cache is purged. (3) `AllowedOrigins` must be exact scheme+host+port format (e.g., `https://jacklabbe.com`), not just a hostname.

**How to avoid:**
1. Set CORS policy via wrangler: `wrangler r2 bucket cors set jacklabbe-data --file cors.json`
2. Policy must include the exact origin: `"AllowedOrigins": ["https://jacklabbe.com", "http://localhost:5173"]`
3. After policy change, purge cache if using a custom domain
4. Test with: `curl -H "Origin: https://jacklabbe.com" -I https://data.jacklabbe.com/graph.json`
5. Propagation takes up to 30 seconds

Source: [Cloudflare R2 CORS docs](https://developers.cloudflare.com/r2/buckets/cors/)

### Pitfall 5: Worker Free Plan Limits

**What goes wrong:** Pipeline silently fails or terminates mid-execution because free tier limits are hit: 50 subrequests or 10ms CPU time.

**Why it happens:** Developers start on free tier for development and forget to upgrade. The pipeline needs hundreds of subrequests and several seconds of CPU time.

**How to avoid:** Use the Workers Paid plan from the start. Paid plan provides: 10,000 subrequests per invocation, 15-minute cron execution (no duration limit on Bundled), 10MB script size.

**Warning signs:** Worker logs show "exceeded subrequest limit" or unexpected termination without error.

Source: [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)

### Pitfall 6: stats/commit_activity Returning 202 (Not Ready)

**What goes wrong:** The `GET /repos/{owner}/{repo}/stats/commit_activity` endpoint returns HTTP 202 instead of 200 on first request. The data is empty or missing.

**Why it happens:** GitHub computes repository statistics asynchronously. The first request triggers computation; subsequent requests return cached results. This 202 pattern also applies to other `/stats/` endpoints.

**How to avoid:**
1. On 202 response, wait 2-3 seconds and retry (up to 3 times)
2. Cache stats across pipeline runs -- if you got stats yesterday, they're likely still valid today minus the most recent day
3. Don't block the entire pipeline on one repo's stats being unavailable

**Warning signs:** Empty arrays in `commit_activity` response body. HTTP 202 status code.

Source: [GitHub REST API statistics](https://docs.github.com/en/rest/metrics/statistics)

## Code Examples

### GitHub GraphQL Query for Contribution Calendar

```typescript
// Source: GitHub GraphQL API docs + verified implementations
// https://williamcallahan.com/blog/adding-github-contribution-graph-to-nextjs

const CONTRIBUTION_QUERY = `
  query($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              contributionLevel
              date
            }
          }
        }
      }
    }
  }
`;

// contributionLevel is an enum: NONE, FIRST_QUARTILE, SECOND_QUARTILE,
// THIRD_QUARTILE, FOURTH_QUARTILE — maps to 0-4 intensity levels
// date is "YYYY-MM-DD" — already bucketed by user's timezone settings

interface ContributionDay {
  contributionCount: number;
  contributionLevel: 'NONE' | 'FIRST_QUARTILE' | 'SECOND_QUARTILE' | 'THIRD_QUARTILE' | 'FOURTH_QUARTILE';
  date: string; // "YYYY-MM-DD"
}

// Usage:
const from = '2025-02-19T00:00:00Z';  // 12 months ago
const to = '2026-02-19T23:59:59Z';    // now
const result = await graphql(CONTRIBUTION_QUERY, { username: 'j-labbe', from, to });
```

### R2 CORS Policy Configuration

```json
// cors.json -- applied via: wrangler r2 bucket cors set jacklabbe-data --file cors.json
// Source: https://developers.cloudflare.com/r2/buckets/cors/
[
  {
    "AllowedOrigins": [
      "https://jacklabbe.com",
      "http://localhost:5173"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["content-type"],
    "MaxAgeSeconds": 86400
  }
]
```

### Wrangler.toml Configuration

```toml
# Source: https://developers.cloudflare.com/workers/wrangler/configuration/
name = "jacklabbe-pipeline"
main = "src/index.ts"
compatibility_date = "2026-02-01"

[triggers]
crons = ["0 6 * * *"]  # Daily at 06:00 UTC

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "jacklabbe-data"

# Secrets (set via CLI, NOT in this file):
# wrangler secret put GITHUB_TOKEN
# wrangler secret put REFRESH_SECRET
```

### Env Interface Declaration

```typescript
// Source: https://developers.cloudflare.com/workers/configuration/secrets/
interface Env {
  R2_BUCKET: R2Bucket;
  GITHUB_TOKEN: string;
  REFRESH_SECRET: string;
}
```

### Shared Types Example

```typescript
// shared/src/graph.ts
export interface GraphData {
  /** Daily contribution counts for the commit heatmap */
  days: ContributionDay[];
  totalContributions: number;
  /** ISO 8601 date string of the earliest day in the range */
  rangeStart: string;
  /** ISO 8601 date string of the latest day in the range */
  rangeEnd: string;
}

export interface ContributionDay {
  /** "YYYY-MM-DD" */
  date: string;
  /** Total contributions (commits, PRs, issues, reviews) */
  count: number;
  /** 0-4 intensity level */
  level: 0 | 1 | 2 | 3 | 4;
}

// shared/src/projects.ts
export interface ProjectEntry {
  /** Stable ID: SHA-256 hash prefix for private, GitHub ID string for public */
  id: string;
  name: string;  // "Private Repo" for private repos
  isPrivate: boolean;
  isFork: boolean;
  /** Only populated for public forks */
  parentRepo: { name: string; url: string } | null;
  /** Language names (e.g., ["TypeScript", "Python"]) */
  languages: string[];
  /** "YYYY-MM-DD" */
  createdAt: string;
  /** "YYYY-MM-DD" */
  lastActiveAt: string;
  /** Per-month commit counts: { "2026-01": 15, "2026-02": 8 } */
  monthlyCommits: Record<string, number>;
  totalCommits: number;
  // Public-only fields:
  url?: string;           // GitHub URL
  description?: string;
  topics?: string[];
  /** Rich commit data for v2 (messages, diff stats) -- only for public repos */
  recentCommits?: CommitDetail[];
}

export interface CommitDetail {
  sha: string;
  message: string;
  date: string;           // "YYYY-MM-DD"
  additions: number;
  deletions: number;
}

// shared/src/meta.ts
export interface PipelineMeta {
  lastUpdated: string;        // ISO 8601 timestamp
  status: 'ok' | 'error';
  error?: string;
  errorAt?: string;
  projectCount: number;
  publicCount: number;
  privateCount: number;
}

export interface ProjectsFile {
  projects: ProjectEntry[];
}
```

### pnpm-workspace.yaml

```yaml
packages:
  - 'site'
  - 'worker'
  - 'shared'
```

### Root package.json Scripts

```json
{
  "name": "jacklabbe.com",
  "private": true,
  "scripts": {
    "build": "pnpm -r build",
    "dev:worker": "cd worker && wrangler dev --test-scheduled",
    "dev:site": "cd site && vite dev",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck"
  }
}
```

## Discretion Recommendations

Research findings for areas marked as "Claude's Discretion" in CONTEXT.md:

### graph.json Granularity: Use Raw Daily Data

**Recommendation:** Store raw daily granularity (one entry per day, 365-366 entries per year).

**Rationale:**
- The GraphQL `contributionCalendar` returns data per-day natively. Storing daily preserves full fidelity.
- graph.json at daily granularity is approximately 365 * ~40 bytes = ~15KB uncompressed, well under any performance concern.
- The SPA can group by week for rendering if needed -- this is a trivial client-side operation (7-day chunks).
- Pre-grouping by week loses the ability to show per-day tooltips on hover, which is a standard feature of GitHub-style contribution graphs.

### Backfill Strategy: Auto-Detect Empty R2

**Recommendation:** On each pipeline run, check if `meta.json` exists in R2. If it does not exist (or if a `backfill_needed` flag is set), run the full backfill. Otherwise, run the incremental daily update.

**Rationale:**
- Simpler than a separate manual endpoint for backfill
- Self-healing: if R2 bucket is recreated or data is deleted, pipeline automatically backfills on next cron run
- The manual HTTP refresh endpoint is already planned and can include a `?backfill=true` query parameter for explicit triggering
- Daily cron should check `meta.json.lastUpdated` -- if more than 48 hours stale, consider it a backfill scenario

### HTTP Auth Mechanism: Bearer Token (Shared Secret)

**Recommendation:** Use a simple shared secret stored as a Worker secret (`REFRESH_SECRET`). The manual refresh endpoint checks `Authorization: Bearer <secret>`.

**Rationale:**
- Zero external dependencies (no OAuth, no JWT libraries)
- The endpoint is not user-facing -- it's a developer tool for the repo owner
- Store the secret via `wrangler secret put REFRESH_SECRET`
- Can be called with: `curl -X POST https://worker.jacklabbe.com/ -H "Authorization: Bearer <secret>"`

### Logging Approach: Structured console.log with Pipeline Stage

**Recommendation:** Use `console.log` with structured JSON messages. Wrangler tails show these in real-time. Include pipeline stage, repo count, rate limit remaining, and elapsed time.

**Rationale:**
- Workers runtime captures `console.log` output, visible via `wrangler tail`
- No logging library needed -- Workers have no persistent filesystem for log files
- Structured format enables filtering in `wrangler tail --format json`

```typescript
function log(stage: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ stage, ...data, ts: Date.now() }));
}
// Usage: log('fetch-repos', { count: 47, rateLimitRemaining: 4800 });
```

### Temp File Handling: Write to Final Keys Directly

**Recommendation:** Do not use temp files or staging keys in R2. Write `graph.json`, `projects.json`, and `meta.json` directly. Write data files first, meta.json last (meta.json being the "commit" signal).

**Rationale:**
- R2 `put()` is atomic for individual objects -- a partial write of one key does not corrupt another key.
- Writing meta.json last means: if the pipeline fails mid-write, meta.json still reflects the previous successful run. The SPA checks meta.json's `lastUpdated` to detect staleness.
- R2 does not support multi-object atomic transactions. Writing to temp keys and then "renaming" (copy + delete) doubles the number of R2 operations without gaining atomicity.
- The "stale data is better than no data" principle (from CONTEXT.md) is satisfied by this approach: old data files persist until overwritten.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Wrangler v3 | Wrangler v4 (4.67.0) | March 2025 | Updated internal esbuild. Minor breaking changes (legacy assets, node-compat flag removed). Config format unchanged. |
| @octokit/rest v21 | @octokit/rest v22 (22.0.1) | ~Late 2025 | Verify changelog for breaking changes before implementation. |
| @octokit/graphql v8 | @octokit/graphql v9 (9.0.3) | ~2025 | Verify changelog for breaking changes before implementation. |
| Workers free tier 50 subrequests | Paid plan 10,000 subrequests | Unchanged | Paid plan is required for this project's API call volume. |
| R2 CORS via dashboard only | R2 CORS via `wrangler r2 bucket cors set` | Available now | CLI-first approach enables version-controlled CORS config. |

**Deprecated/outdated:**
- `wrangler version` command: Use `wrangler --version` instead (v4 change)
- `--node-compat` flag: Use `nodejs_compat` compatibility flag in wrangler.toml instead
- `--legacy-assets` flag: Use Workers Assets instead

## Open Questions

1. **Workers Paid plan pricing and activation**
   - What we know: Paid plan ($5/month) gives 10,000 subrequests, no cron duration limit on Bundled
   - What's unclear: Whether the account already has a paid plan, or if this needs to be set up
   - Recommendation: Verify plan status in Cloudflare dashboard before starting implementation. If on free plan, upgrade first.

2. **Fine-grained PAT for organization private repos**
   - What we know: Fine-grained PATs support Contents: Read-only + Metadata: Read-only per-repo
   - What's unclear: Whether organization repos require org admin approval for the fine-grained PAT
   - Recommendation: Create the fine-grained PAT first. If org approval is needed, use a classic PAT with `repo` scope as fallback (document the risk).

3. **R2 custom domain DNS setup**
   - What we know: Custom domain (e.g., `data.jacklabbe.com`) must be in the same Cloudflare account's DNS zone
   - What's unclear: Whether `jacklabbe.com` is already managed by Cloudflare DNS
   - Recommendation: Verify DNS setup during Phase 1 infrastructure tasks. If not on Cloudflare DNS, add via CNAME partial setup.

4. **@octokit/rest v22 and @octokit/graphql v9 breaking changes**
   - What we know: New major versions exist (v22.0.1 and v9.0.3)
   - What's unclear: Exact breaking changes from v21/v8. Prior research assumed v21/v8.
   - Recommendation: Check changelogs before implementation. Core patterns (auth, pagination, `graphql()` call signature) are unlikely to change fundamentally.

5. **Vite 7 breaking changes from Vite 6**
   - What we know: Vite 7.3.1 is current (prior research assumed Vite 6)
   - What's unclear: Breaking changes from Vite 6 to 7
   - Recommendation: For Phase 1, the site is a skeleton. Vite 7 `create-vite` template will work. Verify `vite.config.ts` patterns if migrating from v6 examples.

## Sources

### Primary (HIGH confidence)
- [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/) - Subrequest limits, CPU time, cron duration, memory
- [Cloudflare Workers Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) - Config syntax, scheduled handler signature
- [Cloudflare Workers Scheduled Handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/) - ScheduledController API, ctx.waitUntil
- [Cloudflare R2 CORS Configuration](https://developers.cloudflare.com/r2/buckets/cors/) - CORS policy JSON schema, wrangler CLI command, gotchas
- [Cloudflare R2 Public Buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/) - Custom domain setup, r2.dev subdomains
- [Cloudflare R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/) - R2Bucket.put(), R2Bucket.get(), httpMetadata
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/) - `wrangler secret put`, .dev.vars, env access
- [GitHub REST API Commits](https://docs.github.com/en/rest/commits/commits) - List commits (no stats), Get single commit (has stats), pagination
- [GitHub GraphQL Rate Limits](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api) - 5,000 points/hr, separate from REST, point calculation
- [GitHub REST API Rate Limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) - 5,000 req/hr authenticated, separate from GraphQL
- npm registry version checks (2026-02-19) - pnpm 10.30.0, Vite 7.3.1, React 19.2.4, TS 5.9.3, Wrangler 4.67.0, @octokit/graphql 9.0.3, @octokit/rest 22.0.1

### Secondary (MEDIUM confidence)
- [GitHub contribution graph implementation](https://williamcallahan.com/blog/adding-github-contribution-graph-to-nextjs) - GraphQL query structure, contributionLevel enum, date format
- [Live types in TypeScript monorepo](https://colinhacks.com/essays/live-types-typescript-monorepo) - Custom export conditions, customConditions tsconfig
- [cloudflare/workers-sdk#2975](https://github.com/cloudflare/workers-sdk/issues/2975) - Octokit Workers compatibility (must instantiate in handler)
- [GitHub REST API statistics](https://docs.github.com/en/rest/metrics/statistics) - commit_activity, code_frequency endpoints, 202 response pattern
- [pnpm workspaces](https://pnpm.io/workspaces) - workspace:* protocol, pnpm-workspace.yaml

### Tertiary (LOW confidence)
- @octokit/rest v22 and @octokit/graphql v9 breaking changes -- not verified, check changelogs
- Vite 7 breaking changes from Vite 6 -- not verified, check Vite changelog
- Cloudflare R2 custom domain caching behavior -- verify with real deployment

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified via npm registry. Wrangler v4, Octokit Workers compatibility, R2 CORS all confirmed via official docs.
- Architecture: HIGH - Dual-handler Worker pattern confirmed. R2 binding API, CORS setup, and secrets management all verified against current Cloudflare docs.
- Pitfalls: HIGH - GitHub API rate limits, GraphQL points system, and commit stats N+1 issue verified against official docs. Workers limits verified. Octokit instantiation issue confirmed resolved.

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (30 days -- stable APIs and tooling)
