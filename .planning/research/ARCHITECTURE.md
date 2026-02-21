# Architecture Patterns

**Domain:** Developer portfolio with auto-updating GitHub commit data
**Project:** jacklabbe.com
**Researched:** 2026-02-19
**Confidence:** MEDIUM (based on training data for Cloudflare Workers, R2, Pages, and GitHub API -- no live verification available)

## Recommended Architecture

### System Overview

The system is two distinct runtime components sharing a monorepo, connected by a JSON file in R2:

```
┌──────────────────────────────────────────────────────────────────┐
│                        MONOREPO (one git repo)                   │
│                                                                  │
│  ┌─────────────────────┐          ┌────────────────────────────┐ │
│  │  packages/worker     │          │  packages/site             │ │
│  │  (Cloudflare Worker) │          │  (React SPA)               │ │
│  │                      │          │                            │ │
│  │  Cron: 0 6 * * *     │          │  Vite + React + TypeScript │ │
│  │  GitHub API fetch     │          │  Static build → CF Pages   │ │
│  │  JSON → R2            │          │  Reads JSON from R2        │ │
│  └──────────┬───────────┘          └──────────┬─────────────────┘ │
│             │                                 │                   │
│             │  writes                         │  reads            │
│             ▼                                 ▼                   │
│       ┌─────────────────────────────────────────┐                │
│       │         Cloudflare R2 Bucket             │                │
│       │   github-data/commits.json               │                │
│       │   github-data/repos.json                 │                │
│       └─────────────────────────────────────────┘                │
│                                                                  │
│  ┌─────────────────────┐                                         │
│  │  packages/shared     │                                        │
│  │  TypeScript types    │                                        │
│  │  for R2 JSON schema  │                                        │
│  └─────────────────────┘                                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component                  | Responsibility                                            | Communicates With                         | Runtime                                   |
| -------------------------- | --------------------------------------------------------- | ----------------------------------------- | ----------------------------------------- |
| **Worker (data pipeline)** | Fetch GitHub data on cron, normalize it, write JSON to R2 | GitHub API (outbound HTTPS), R2 (write)   | Cloudflare Worker runtime                 |
| **Site (React SPA)**       | Render portfolio UI, visualize commit data                | R2 (read via public URL or Worker proxy)  | Browser (static files served by CF Pages) |
| **R2 Bucket**              | Store pre-computed JSON blobs                             | Written by Worker, read by Site           | Cloudflare storage                        |
| **Shared types**           | TypeScript interfaces for R2 JSON schema                  | Imported at build time by Worker and Site | Build-time only                           |

## Data Flow

### Write Path (Worker Cron)

```
1. Cloudflare cron trigger fires (daily, e.g., 0 6 * * * UTC)
2. Worker authenticates to GitHub API using PAT stored in Worker secret
3. Worker fetches:
   a. GET /user/repos?type=all&per_page=100 (paginated)
   b. For each repo: GET /repos/{owner}/{repo}/stats/commit_activity
   c. For each repo: GET /repos/{owner}/{repo}/commits?author={user}&per_page=100
4. Worker normalizes data:
   - Public repos: full repo name, description, language, commit counts, dates
   - Private repos: anonymized name ("Private Project 1"), language, commit counts only
5. Worker writes JSON files to R2:
   - github-data/commits.json  (commit activity / graph data)
   - github-data/repos.json    (repo metadata)
   - github-data/meta.json     (last-updated timestamp, generation metadata)
6. Worker exits
```

### Read Path (Site Load)

```
1. User visits jacklabbe.com
2. Browser loads static React SPA from Cloudflare Pages
3. React app fetches JSON on mount:
   - GET https://data.jacklabbe.com/github-data/commits.json
   - GET https://data.jacklabbe.com/github-data/repos.json
   - GET https://data.jacklabbe.com/github-data/meta.json
4. React app renders:
   - Hero section with aggregate stats
   - Commit graph visualization (from commits.json)
   - Timeline / Time Machine view (from repos.json + commits.json)
5. Data is cached in browser (stale-while-revalidate pattern)
```

## Critical Architecture Decision: How the Site Reads R2

There are two viable approaches. I recommend **Option A: R2 Public Bucket with Custom Domain**.

### Option A: R2 Public Bucket with Custom Domain (RECOMMENDED)

**How:** Enable R2 public access, attach a custom domain (e.g., `data.jacklabbe.com`). The SPA fetches JSON directly from this URL.

**Pros:**

- Simplest architecture. No extra Worker to maintain for reads.
- Cloudflare handles caching, TLS, and CDN automatically on the custom domain.
- Zero compute cost for reads (R2 public access is just storage egress).
- CORS headers configurable via R2 bucket settings or a Transform Rule.

**Cons:**

- Entire bucket is public (mitigate by only storing public-safe data).
- Less control over response headers without an intermediary.

**Why this wins:** This is a read-only portfolio site. The JSON is meant to be public. Adding a Worker proxy for reads is unnecessary complexity. R2 public access with a custom domain gives you CDN caching, HTTPS, and a clean URL with zero moving parts on the read path.

### Option B: Worker Proxy for R2 Reads (NOT recommended for this project)

**How:** A second Worker (or the same Worker on a different route) handles `GET /github-data/*`, reads from R2, and returns the JSON with custom headers.

**Pros:**

- Full control over caching headers, CORS, and response shaping.
- Could add authentication or rate limiting.
- Could transform data per-request.

**Cons:**

- Extra Worker to maintain, deploy, and monitor.
- Adds latency (Worker invocation) to every data fetch.
- Worker invocation costs (though free tier is generous).
- Unnecessary for public, pre-computed, read-only JSON.

**When to choose this instead:** Only if you later need per-request data transformation, authentication on the data endpoint, or response shaping that R2 public access cannot provide.

## Monorepo Structure

```
jacklabbe.com/
├── .planning/                    # GSD planning files
├── packages/
│   ├── worker/                   # Cloudflare Worker (data pipeline)
│   │   ├── src/
│   │   │   ├── index.ts          # Worker entry, cron handler
│   │   │   ├── github.ts         # GitHub API client
│   │   │   ├── transform.ts      # Data normalization (public/private)
│   │   │   └── r2.ts             # R2 write operations
│   │   ├── wrangler.toml         # Worker config (cron, R2 binding, secrets)
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── site/                     # React SPA (Cloudflare Pages)
│   │   ├── src/
│   │   │   ├── main.tsx          # App entry
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   │   ├── Hero.tsx
│   │   │   │   ├── CommitGraph.tsx
│   │   │   │   └── Timeline.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useGitHubData.ts  # Fetches R2 JSON
│   │   │   ├── types/            # Re-exports from shared
│   │   │   └── lib/
│   │   │       └── api.ts        # R2 data fetch functions
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── shared/                   # Shared TypeScript types
│       ├── src/
│       │   ├── index.ts
│       │   ├── commits.ts        # CommitActivity, CommitDay types
│       │   ├── repos.ts          # RepoMetadata types
│       │   └── meta.ts           # DataMeta types
│       ├── tsconfig.json
│       └── package.json
├── package.json                  # Workspace root
├── pnpm-workspace.yaml           # pnpm workspaces config
└── tsconfig.base.json            # Shared TS config
```

**Why pnpm workspaces:** pnpm is the standard for Cloudflare projects (wrangler uses it internally). Workspaces let `packages/worker` and `packages/site` both import from `packages/shared` without publishing. The `shared` package provides compile-time type safety that the Worker's output matches what the Site expects.

## R2 JSON Schema Design

### `github-data/meta.json`

```typescript
interface DataMeta {
    lastUpdated: string; // ISO 8601 timestamp
    generatedBy: string; // "jacklabbe-worker/1.0"
    repoCount: number; // Total repos processed
    publicRepoCount: number;
    privateRepoCount: number;
    commitCountTotal: number; // Aggregate across all repos
    oldestCommitDate: string; // ISO 8601
    newestCommitDate: string; // ISO 8601
}
```

### `github-data/repos.json`

```typescript
interface RepoData {
    repos: RepoMetadata[];
}

interface RepoMetadata {
    id: string; // Stable ID (use GitHub repo ID, hashed for private)
    name: string; // Full name for public, "Private Project N" for private
    isPrivate: boolean;
    language: string | null; // Primary language
    description: string | null; // null for private repos
    url: string | null; // GitHub URL for public, null for private
    createdAt: string; // ISO 8601
    lastCommitAt: string; // ISO 8601
    commitCount: number; // Total commits by user
    topics: string[]; // GitHub topics (empty for private)
}
```

### `github-data/commits.json`

```typescript
interface CommitData {
    // For the commit graph (GitHub-contribution-graph style)
    dailyActivity: DailyCommit[];

    // For the timeline view
    weeklyActivity: WeeklyCommit[];
}

interface DailyCommit {
    date: string; // "2025-01-15" (YYYY-MM-DD)
    count: number; // Total commits across all repos
    publicCount: number;
    privateCount: number;
}

interface WeeklyCommit {
    weekStart: string; // "2025-01-13" (Monday)
    count: number;
    repos: string[]; // Repo IDs active this week
}
```

**Design rationale:**

- Pre-aggregated by day and week so the SPA does zero data processing. The Worker does the work once; the browser just renders.
- Public/private split in DailyCommit allows the graph to show "I was active" for private repos without leaking what the work was.
- Repo IDs in WeeklyCommit let the timeline link weeks to projects.
- All dates are strings (not timestamps) because JSON has no native Date type and ISO strings sort lexicographically.

## Patterns to Follow

### Pattern 1: Pre-Compute Everything in the Worker

**What:** The Worker should do ALL data aggregation, filtering, and transformation. The R2 JSON should be render-ready.

**When:** Always. This is the core architectural principle.

**Why:** The Worker runs once daily on a server. The SPA runs on every visitor's browser. Compute cost belongs in the Worker, not the client.

**Example:**

```typescript
// GOOD: Worker pre-computes daily totals
const dailyActivity: DailyCommit[] = computeDailyTotals(allCommits);
await r2.put(
    "github-data/commits.json",
    JSON.stringify({ dailyActivity, weeklyActivity }),
);

// BAD: Dumping raw GitHub API responses into R2 for the SPA to process
await r2.put("github-data/raw-commits.json", JSON.stringify(rawGitHubResponse));
```

### Pattern 2: Idempotent Worker Runs

**What:** Every Worker cron run writes the complete dataset, not incremental diffs.

**When:** Always for this scale of data (a few hundred KB of JSON at most).

**Why:** Idempotent runs are simpler to reason about, debug, and recover from. If a run fails partway, the previous JSON is still valid. No corruption from partial updates.

```typescript
// GOOD: Fetch everything, write everything
export default {
    async scheduled(event: ScheduledEvent, env: Env) {
        const repos = await fetchAllRepos(env.GITHUB_PAT);
        const commits = await fetchAllCommitActivity(repos, env.GITHUB_PAT);
        const transformed = transformData(repos, commits);

        // Atomic-ish: write new data only after all fetches succeed
        await env.R2_BUCKET.put(
            "github-data/repos.json",
            JSON.stringify(transformed.repos),
        );
        await env.R2_BUCKET.put(
            "github-data/commits.json",
            JSON.stringify(transformed.commits),
        );
        await env.R2_BUCKET.put(
            "github-data/meta.json",
            JSON.stringify(transformed.meta),
        );
    },
};
```

### Pattern 3: Graceful Data Loading in the SPA

**What:** The SPA should handle missing/stale/loading data without crashing.

**When:** On every data fetch.

**Why:** The Worker might fail, R2 might be temporarily unavailable, or the user might be on a slow connection.

```typescript
// useGitHubData.ts
function useGitHubData() {
    const [data, setData] = useState<GitHubData | null>(null);
    const [status, setStatus] = useState<"loading" | "ready" | "error">(
        "loading",
    );

    useEffect(() => {
        async function load() {
            try {
                const [commits, repos, meta] = await Promise.all([
                    fetch(`${DATA_BASE_URL}/github-data/commits.json`).then(
                        (r) => r.json(),
                    ),
                    fetch(`${DATA_BASE_URL}/github-data/repos.json`).then((r) =>
                        r.json(),
                    ),
                    fetch(`${DATA_BASE_URL}/github-data/meta.json`).then((r) =>
                        r.json(),
                    ),
                ]);
                setData({ commits, repos, meta });
                setStatus("ready");
            } catch {
                setStatus("error");
            }
        }
        load();
    }, []);

    return { data, status };
}
```

### Pattern 4: Private Repo Sanitization at the Source

**What:** The Worker must strip private repo details BEFORE writing to R2. Never store sensitive data in R2 "just in case."

**When:** During the transform step in every Worker run.

**Why:** R2 is configured for public access. Anything written to R2 is publicly readable. Sanitization must happen in the Worker, not the SPA.

```typescript
function sanitizeRepo(repo: GitHubRepo): RepoMetadata {
    if (repo.private) {
        return {
            id: hashString(repo.full_name), // Deterministic but opaque
            name: `Private Project`, // Assign number later based on sort
            isPrivate: true,
            language: repo.language, // Language is OK to expose
            description: null, // Strip description
            url: null, // Strip URL
            createdAt: repo.created_at,
            lastCommitAt: repo.pushed_at,
            commitCount: 0, // Filled in later
            topics: [], // Strip topics
        };
    }
    // Public repos: include everything
    return {
        /* ... full data ... */
    };
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Pages Functions as the Data Layer

**What:** Using Cloudflare Pages Functions (the `/functions` directory) to proxy R2 reads or act as an API.

**Why bad:** Pages Functions are tightly coupled to the Pages deployment. They add cold start latency, make the SPA less portable, and conflate "serving the site" with "serving data." Debugging is harder because you have implicit routing. R2 public access is simpler and faster.

**Instead:** Use R2 public access with a custom domain for data. Keep Pages as a pure static host.

### Anti-Pattern 2: Fetching GitHub Data at Build Time

**What:** Using a Pages build step to fetch GitHub data and bake it into the SPA bundle.

**Why bad:** Build-time data means you need to rebuild and redeploy the site to update commit data. It couples content freshness to deploy frequency. It also means your GitHub PAT needs to be a Pages environment variable (larger blast radius).

**Instead:** The Worker fetches data on its own schedule, writes to R2. The SPA fetches from R2 at runtime. Site deploys and data updates are independent.

### Anti-Pattern 3: One Giant JSON File

**What:** Putting all data (repos, commits, metadata) into a single `data.json` file.

**Why bad:** The commit graph might need `commits.json` immediately, but the timeline might lazy-load `repos.json`. A single file means you fetch everything or nothing. As data grows, this wastes bandwidth on pages that only need a subset.

**Instead:** Split into logical files (`commits.json`, `repos.json`, `meta.json`). The SPA can `Promise.all` them for the main view or lazy-load individual files for specific sections.

### Anti-Pattern 4: Storing GitHub PAT in wrangler.toml

**What:** Putting the GitHub Personal Access Token directly in the wrangler.toml config file.

**Why bad:** wrangler.toml is committed to git. The PAT would be exposed in the repository.

**Instead:** Use `wrangler secret put GITHUB_PAT` to store it as an encrypted Worker secret. Access via `env.GITHUB_PAT` in the Worker code.

## Suggested Build Order

The build order is driven by dependencies between components:

```
Phase 1: Foundation
├── Monorepo setup (pnpm workspaces, tsconfig)
├── Shared types package (R2 JSON schema interfaces)
└── R2 bucket creation and configuration

Phase 2: Data Pipeline (Worker)
├── GitHub API client (auth, pagination, rate limit handling)
├── Data transformation (public/private sanitization)
├── R2 write operations
├── Cron trigger configuration
└── Verify: manually trigger Worker, inspect R2 JSON

Phase 3: Site Core
├── Vite + React + TypeScript setup
├── R2 data fetching hook (useGitHubData)
├── Hero section (uses meta.json for aggregate stats)
└── Verify: site loads and displays real data from R2

Phase 4: Visualizations
├── Commit graph component (uses commits.json)
├── Timeline / Time Machine component (uses repos.json + commits.json)
└── Responsive design, polish

Phase 5: Deploy Pipeline
├── Cloudflare Pages deployment (static upload or git integration)
├── Custom domain setup (jacklabbe.com for Pages, data.jacklabbe.com for R2)
├── CORS configuration on R2 custom domain
└── Verify: end-to-end flow on production
```

**Why this order:**

1. **Shared types first** because both Worker and Site depend on them. Defining the JSON schema early prevents integration mismatches.
2. **Worker before Site** because the Site needs real data to develop against. You cannot build the commit graph component without commit data. Building the Worker first means you have real JSON in R2 before writing any frontend code.
3. **Hero before visualizations** because the hero section is simpler (just display numbers from meta.json), proving the data fetch pipeline works before tackling complex SVG/canvas rendering.
4. **Deploy pipeline last** because Cloudflare Pages static upload works with `npx wrangler pages deploy dist/` and does not need to be set up until the site is ready to go live. During development, use `wrangler dev` and `vite dev` locally.

## Cloudflare-Specific Configuration Details

### Worker (`wrangler.toml`)

```toml
name = "jacklabbe-worker"
main = "src/index.ts"
compatibility_date = "2024-09-23"

[triggers]
crons = ["0 6 * * *"]   # Daily at 6:00 UTC

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "jacklabbe-data"
```

### R2 Bucket Setup

```
Bucket name: jacklabbe-data
Public access: Enabled
Custom domain: data.jacklabbe.com (CNAME to R2 public URL)
CORS: Allow origin https://jacklabbe.com, GET only
```

### Pages Deployment

Cloudflare Pages with direct upload (not git integration) is recommended for a monorepo where the site is in `packages/site`. Git integration expects the repo root to be the project root, which does not match a monorepo. Direct upload via `wrangler pages deploy packages/site/dist` is simpler and more explicit.

## Scalability Considerations

| Concern                   | Current (1 user, portfolio)           | If Data Grows (years of commits)          | If Traffic Spikes (HN front page)                     |
| ------------------------- | ------------------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| **R2 storage**            | < 1 MB JSON                           | < 10 MB JSON (years of daily data)        | No change (static files)                              |
| **R2 reads**              | ~100/day                              | ~100/day                                  | Free tier: 10M reads/month. CDN cache handles spikes. |
| **Worker invocations**    | 1/day (cron)                          | 1/day                                     | 1/day (cron is not user-triggered)                    |
| **GitHub API rate limit** | ~50 requests/run (well under 5000/hr) | ~200 requests/run if many repos           | No change (cron, not user-triggered)                  |
| **Page load size**        | ~50 KB JSON total                     | ~500 KB JSON (consider splitting by year) | CDN-cached, no origin load                            |
| **Build time**            | < 30s                                 | < 30s                                     | No change                                             |

**Key insight:** Because the Worker runs on a fixed schedule (not per-request) and R2 is CDN-backed, this architecture handles traffic spikes with zero changes. The Worker's GitHub API usage is completely decoupled from visitor traffic.

## Sources

- Cloudflare Workers Cron Triggers documentation (training data, MEDIUM confidence)
- Cloudflare R2 public buckets and custom domains documentation (training data, MEDIUM confidence)
- Cloudflare Pages direct upload documentation (training data, MEDIUM confidence)
- GitHub REST API `/repos` and `/stats/commit_activity` endpoints (training data, HIGH confidence -- stable API)
- pnpm workspaces documentation (training data, HIGH confidence -- well-established tooling)

**Note:** All recommendations are based on training data (cutoff ~mid 2025). Cloudflare product details (R2 public access configuration, Pages direct upload CLI flags) should be verified against current documentation during implementation. The core architectural patterns (Worker cron -> R2 -> static SPA reads) are well-established and unlikely to have changed.
