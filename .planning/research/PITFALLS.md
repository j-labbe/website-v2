# Domain Pitfalls

**Domain:** Developer portfolio with auto-updating GitHub commit data, Cloudflare Workers pipeline, R2 storage
**Project:** jacklabbe.com
**Researched:** 2026-02-19
**Overall confidence:** MEDIUM (training data only -- web search/official docs unavailable during research)

---

## Critical Pitfalls

Mistakes that cause rewrites, data leaks, or broken production behavior.

---

### Pitfall 1: Private Repo Name/URL Leakage Through Indirect Data

**What goes wrong:** Private repo names or URLs leak into the public JSON served from R2. This happens not through the obvious `repo.name` field (which developers remember to strip) but through indirect paths: commit messages referencing repo names, branch names containing project names, language stats that uniquely fingerprint a repo, or the GitHub API response containing `repository.full_name` nested inside event/commit objects that get serialized wholesale.

**Why it happens:** Developers fetch rich API responses and store the full object "for later use," intending to filter at display time. But the JSON in R2 is publicly readable. The filtering must happen at write time in the Worker, not at read time in the SPA. Additionally, commit messages for public repo collection (`"fix bug in secret-project"`) can reference private repos by name.

**Consequences:** Employer NDAs violated, proprietary project names exposed to anyone inspecting network requests, potential legal liability.

**Prevention:**
1. Define an explicit allowlist of fields to extract per repo visibility level. Never store raw API responses.
2. For private repos, construct a new sanitized object containing ONLY: `{ commitCount, languages, dates, isPrivate: true }`. No repo name, no URL, no commit messages, no branch names, no owner info.
3. For public repos, even though rich data is collected, still construct explicit objects rather than spreading API responses.
4. Add a unit test that parses the generated JSON and asserts no private repo names appear anywhere in the serialized output (requires a test fixture with known private repo names).
5. Treat the R2 JSON as a public API surface -- anything written there is visible to anyone with browser dev tools.

**Detection:** Before any deployment, manually inspect the R2 JSON output. Search for any string that matches a known private repo name. Automate this as a post-pipeline validation step.

**Phase:** Must be addressed in the data pipeline phase (Phase 1/2). This is a design constraint, not a feature to add later.

**Confidence:** HIGH -- this is a well-known class of data leakage bugs.

---

### Pitfall 2: GitHub Events API Only Returns 90 Days / 300 Events

**What goes wrong:** Developers use the `/users/{username}/events` endpoint expecting to get a full year of commit history for the 12-month graph. The Events API only returns up to 90 days of history and is capped at 300 events (10 pages of 30). For active developers, 300 events may cover only 2-3 weeks. The commit graph has empty months and looks abandoned.

**Why it happens:** The Events API is designed for activity feeds, not historical analysis. Its documentation states the 90-day/300-event limits, but developers often discover this only after deployment when older months show zero activity.

**Consequences:** The 12-month commit graph -- the centerpiece visual -- shows mostly empty squares. The portfolio looks inactive despite heavy coding.

**Prevention:**
1. Do NOT rely on the Events API for historical commit data.
2. Use a two-pronged approach:
   - **Initial backfill:** Use the Repository Commits API (`GET /repos/{owner}/{repo}/commits`) with `since` and `until` parameters to fetch the full 12 months of history for each repo. This endpoint has no 90-day limit.
   - **Daily incremental:** The cron Worker fetches only the last day's commits (or since last successful run) and merges into the existing JSON.
3. First, enumerate all repos via `GET /user/repos?affiliation=owner,collaborator,organization_member&per_page=100` (paginate through all). Then fetch commits per repo.
4. For forked repos where you contributed, you need to check commits where the author matches your username specifically.

**Detection:** After initial backfill, verify that the commit graph has data for all 12 months. If any month shows zero and you know you were coding, the data source is wrong.

**Phase:** Must be understood before building the pipeline. The entire pipeline architecture depends on which API endpoints to use. This is a Phase 1 design decision.

**Confidence:** HIGH -- the 90-day/300-event limit is well-documented in GitHub API docs.

---

### Pitfall 3: GitHub API Rate Limit Exhaustion During Backfill

**What goes wrong:** The initial backfill needs to fetch commits from every repo you've contributed to. If you have 50+ repos and need 12 months of commit history per repo (potentially multiple pages each), you can easily burn through the 5,000 requests/hour authenticated rate limit. The Worker hits 403s, backfill is incomplete, and the graph has holes.

**Why it happens:** Each repo requires at least one API call for commits, often multiple pages. Language stats require a separate call. Enumerating repos requires pagination. For 80 repos with an average of 3 pages of commits each, that is 80 + 240 + 80 (languages) = 400 calls minimum. Add pagination for repo listing and error retries, and you approach limits quickly. The problem compounds if you also want org repos where multiple API calls are needed to list org memberships first.

**Consequences:** Incomplete data, missing repos, empty graph sections. If the Worker retries aggressively, it can get the PAT temporarily blocked.

**Prevention:**
1. **Separate backfill from daily cron.** The backfill is a one-time operation that may need to be run manually or split across multiple invocations. Do not try to backfill 12 months on the first cron trigger.
2. **Implement rate limit awareness.** Check `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers after each call. If remaining drops below 100, stop and persist progress. Resume on next invocation.
3. **Use conditional requests.** Send `If-None-Match` with ETags from previous responses. 304 responses do not count against rate limits.
4. **Consider GraphQL API for efficiency.** A single GraphQL query can fetch a user's contribution calendar (the green squares data) without per-repo pagination: `user(login: "...") { contributionsCollection { contributionCalendar { weeks { contributionDays { date contributionCount } } } } }`. This gives you the commit graph in ONE API call. Use REST only for per-repo metadata that GraphQL does not expose efficiently.
5. **Cloudflare Worker CPU time limit:** Free tier Workers have 10ms CPU time; paid (Workers Paid / Bundled) have 30-50ms. But cron triggers on Paid plan get up to 15 minutes wall clock. Make sure you are on the paid plan if doing significant API work in the Worker. Alternatively, use multiple sub-requests (which count against subrequest limits, not CPU time directly for I/O wait).

**Detection:** Log rate limit headers. Alert (or write a status field to R2) when backfill is incomplete. The daily cron should report how many repos it successfully processed vs. total.

**Phase:** Pipeline architecture phase. The backfill vs. incremental distinction must be designed upfront.

**Confidence:** HIGH -- rate limits are documented. GraphQL contributions query is well-established.

---

### Pitfall 4: Cloudflare Worker Cron Subrequest and Execution Limits

**What goes wrong:** Cloudflare Workers have a limit of 1,000 subrequests per invocation (on the paid plan; 50 on free). Each `fetch()` call to the GitHub API counts as one subrequest. A daily update touching 80+ repos with multiple API calls per repo can exceed this. Additionally, cron-triggered Workers have a maximum execution duration (varies by plan: ~30 seconds on free, up to 15 minutes on paid with Cron Triggers).

**Why it happens:** Developers treat Workers like traditional serverless functions (Lambda with 15-min timeout and unlimited HTTP calls) without accounting for Cloudflare's distinct execution model.

**Consequences:** Worker silently terminates mid-execution. Some repos updated, others stale. No error visible unless you check logs. Data inconsistency in R2.

**Prevention:**
1. **Use Paid plan.** Free tier limits (50 subrequests, 10ms CPU) are completely insufficient for this use case. Paid plan gives 1,000 subrequests and 15-minute cron execution.
2. **Minimize API calls per run.** Daily incremental updates should only need: 1 call to list repos (or check for new ones), 1 call per repo for recent commits (most will be 1 page), 1 R2 write. For 80 repos, that is roughly 160-250 subrequests -- well within 1,000.
3. **Batch strategy:** If you have 200+ repos, split updates across multiple cron invocations (e.g., repos A-M on even hours, N-Z on odd hours). Or use a queue: write repo list to R2, process N repos per cron run, track position.
4. **Keep the backfill separate.** Run it locally or via a GitHub Action, not in the Worker. Upload the initial JSON to R2 via wrangler CLI. Then the Worker only does lightweight daily increments.
5. **The R2 read/write also counts as a subrequest** -- but R2 bindings are "in-network" and may not count against the subrequest limit (verify with current Cloudflare docs). However, always design conservatively.

**Detection:** Monitor Worker invocation logs via `wrangler tail`. Check for "exceeded subrequest limit" errors. Include a `lastSuccessfulRun` timestamp in the R2 JSON.

**Phase:** Pipeline architecture phase. Must choose between Worker-only vs. hybrid (Worker + local/GitHub Action for backfill) early.

**Confidence:** MEDIUM -- limits are documented but exact behavior of cron triggers vs. regular Workers and R2 binding subrequest counting may have changed. Verify with current Cloudflare docs before implementation.

---

### Pitfall 5: R2 JSON Grows Unbounded and Becomes a Performance Problem

**What goes wrong:** The R2 JSON file starts small but grows over time as 12 months of commit data accumulates. If storing per-commit data (messages, diffs) for public repos, a single JSON file can reach megabytes. The SPA fetches this entire file on every visit, causing slow initial loads -- especially on mobile.

**Why it happens:** "Just append to the JSON" is the simplest approach. Without a data retention/rotation strategy, the file grows monotonically. Rich commit data (messages, diff stats) per commit across dozens of active repos for 12 months can easily reach 5-10 MB. Even without rich data, commit-per-day metadata across 80 repos for 365 days is substantial.

**Consequences:** Slow page loads (defeats the "fast, minimal" design goal). High R2 egress (though R2 has free egress, large files still hurt user experience). Mobile users on slow connections see a loading spinner for seconds.

**Prevention:**
1. **Split the JSON into layers:**
   - `graph.json`: Just the commit graph data (date + count per day, 365 entries). Tiny (under 5 KB). Fetched immediately.
   - `projects.json`: Project list with metadata (name, languages, last active, commit count). Small (under 20 KB for 100 repos). Fetched immediately.
   - `commits/{repo-slug}.json`: Per-repo detailed commit data (messages, diffs). Fetched on demand only if/when the UI needs it (v2+). Not fetched at all in v1.
2. **Rolling window:** The Worker should trim data older than 13 months (keep an extra month buffer for the 12-month graph). Never keep unbounded history.
3. **Gzip/Brotli compression:** R2 does not automatically compress responses. Either pre-compress the JSON in the Worker (write `.json.gz` and serve with correct Content-Encoding), or put a Cloudflare Pages function / Worker in front of R2 that handles compression. Cloudflare CDN will compress if responses go through the CDN with proper cache headers.
4. **Cache headers:** Set `Cache-Control: public, max-age=3600` (1 hour) on the R2 objects. The data only updates daily, so aggressive caching is safe.

**Detection:** Monitor the size of JSON files in R2 after a few weeks. If `graph.json` exceeds 10 KB or `projects.json` exceeds 50 KB, something is wrong.

**Phase:** Pipeline and data model design phase. The JSON schema and split strategy must be decided before writing any pipeline code.

**Confidence:** HIGH -- JSON size scaling is a well-understood problem.

---

## Moderate Pitfalls

---

### Pitfall 6: Commit Graph Rendering Performance With Canvas vs. SVG vs. DOM

**What goes wrong:** Developers render the GitHub-style commit graph (365+ cells with color intensity, hover tooltips, axis labels) using individual DOM elements (e.g., one `<div>` per cell). With 365+ cells plus labels, this creates 400-500 DOM nodes in a single component. On initial render, this is fine. But if any parent state changes cause re-renders, React re-reconciles all 400+ nodes, causing jank. SVG has similar issues at this scale with React's virtual DOM.

**Why it happens:** The commit graph looks simple (it is just colored squares) so developers use the simplest approach (mapped divs). It works in development but may stutter on lower-powered devices or when other parts of the page trigger re-renders.

**Prevention:**
1. **Use CSS Grid with a single container.** Render the grid as a CSS Grid with `grid-template-columns: repeat(53, 1fr)` and 7 rows. Each cell is a small div, but the layout is handled by CSS, not JavaScript.
2. **Memoize aggressively.** Wrap the commit graph component in `React.memo()` and ensure the data prop is referentially stable (not recreated on every render). The graph data changes at most once per day.
3. **Canvas is overkill for this scale.** 365 cells is not enough to warrant Canvas. DOM/SVG is fine if properly memoized. Canvas makes tooltips and accessibility harder.
4. **Avoid inline styles per cell.** Use CSS custom properties or data attributes with CSS selectors for color intensity levels (e.g., `data-level="0|1|2|3|4"` with corresponding CSS rules). This avoids 365 unique style objects in React.

**Detection:** Use React DevTools Profiler. If the commit graph component re-renders when scrolling other sections, memoization is broken.

**Phase:** Frontend implementation phase. Not a design-time decision, but developers should know the pattern before coding.

**Confidence:** HIGH -- standard React rendering patterns.

---

### Pitfall 7: Stale Data UX -- User Visits During Pipeline Failure

**What goes wrong:** The daily cron Worker fails silently (GitHub API outage, rate limit, Worker error). R2 JSON is not updated. Days pass. The portfolio shows a commit graph with the most recent days empty, making it look like the developer stopped coding. Visitors do not know the data is stale -- they assume it is accurate.

**Why it happens:** Cron jobs fail. Without monitoring, nobody notices. The SPA has no way to distinguish "no commits today" from "pipeline did not run." Both look the same in the data.

**Consequences:** The portfolio's core value prop (showing active development) is undermined. Ironically, the developer may be coding heavily but the portfolio says otherwise.

**Prevention:**
1. **Include a `lastUpdated` timestamp in the JSON.** The SPA should display "Last updated: X hours ago" somewhere subtle. If the timestamp is more than 48 hours old, show a visual indicator that data may be stale.
2. **Implement a dead man's switch.** The Worker writes a `heartbeat.json` to R2 on every successful run with `{ "timestamp": "...", "reposProcessed": N, "status": "ok" }`. A separate lightweight Worker or Pages function can check this and alert (e.g., send a webhook to Discord/email) if heartbeat is older than 36 hours.
3. **Graceful degradation.** If the SPA cannot fetch R2 JSON at all (R2 outage, CORS issue), show the last cached version from service worker or show a minimal fallback ("Check my GitHub directly") rather than a blank page.
4. **Idempotent pipeline.** If the Worker fails mid-run, it should not corrupt the existing JSON. Write to a temp key first (`data-pending.json`), then rename/copy to the production key (`data.json`) only on success. R2 supports `put` which is atomic for individual objects.

**Detection:** The `lastUpdated` field makes staleness visible to both the developer and visitors.

**Phase:** Pipeline phase (heartbeat, atomic writes) and frontend phase (stale data indicator).

**Confidence:** HIGH -- operational reliability pattern.

---

### Pitfall 8: CORS Configuration for R2 Public Access

**What goes wrong:** The React SPA on `jacklabbe.com` (served from Cloudflare Pages) tries to fetch JSON from R2. The fetch fails with a CORS error because R2 buckets are not publicly accessible by default and do not have CORS headers configured. Developers spend hours debugging what looks like a network error.

**Why it happens:** R2 is a storage service, not a web server. To serve files publicly, you need either: (a) R2 custom domain with public access enabled and CORS rules, (b) a Worker sitting in front of R2 that adds CORS headers, or (c) serve the JSON through a Cloudflare Pages Function (which is essentially a Worker). Developers assume R2 works like S3 static website hosting out of the box.

**Consequences:** Launch blocker. The SPA cannot load any data.

**Prevention:**
1. **Recommended approach: Cloudflare Pages Function as proxy.** Since the SPA is on Cloudflare Pages, add a Pages Function at `/api/data.json` (or similar) that reads from R2 (via binding) and returns the response with proper headers. This keeps everything on the same origin -- no CORS needed at all.
2. **Alternative: R2 public bucket with custom domain.** Enable public access on the R2 bucket, attach a custom domain (e.g., `data.jacklabbe.com`), and configure CORS rules in the R2 bucket settings. This adds DNS complexity.
3. **Avoid: Making the R2 bucket fully public without CORS rules.** Even with public access, cross-origin fetches from a different domain need CORS headers.
4. **The Pages Function approach is best** because it also lets you add cache headers, handle compression, and keeps the R2 bucket private (defense in depth for any accidentally-written private data).

**Detection:** Test the fetch from the actual deployed domain (not localhost) early. CORS issues only manifest cross-origin.

**Phase:** Infrastructure/deployment phase. Must be solved before the frontend can fetch data.

**Confidence:** HIGH -- extremely common Cloudflare R2 issue.

---

### Pitfall 9: GitHub API Does Not Return "Contributed To" Repos Directly

**What goes wrong:** Developers expect a single API endpoint that returns "all repos I have committed to." No such endpoint exists in the REST API. The `/user/repos` endpoint returns repos you own or are a member/collaborator of, but NOT repos where you only made commits via pull requests (e.g., open-source contributions to repos you do not have write access to).

**Why it happens:** GitHub's data model distinguishes between "repos you have access to" and "repos you have committed to." The REST API primarily exposes the former. Getting contributions to third-party repos requires different approaches.

**Consequences:** Open-source contributions are missing from the portfolio. Developers who actively contribute to popular projects look less active than they are.

**Prevention:**
1. **For the commit graph (counts per day):** Use the GraphQL `contributionsCollection` API. It includes ALL contributions (commits, PRs, issues, reviews) across all repos, including repos you do not own. This is what GitHub uses for its own profile graph. One query gives you the full year.
2. **For the project list:** Use `/user/repos?affiliation=owner,collaborator,organization_member&per_page=100` for repos you have direct access to. This covers owned repos, org repos, and repos where you are an explicit collaborator.
3. **Accept the gap:** Repos you contributed to via PRs (without being a collaborator) are hard to enumerate comprehensively via API. The GraphQL contributions calendar captures the commit counts, but associating them with specific repos is limited to what the Events API shows (90 days) or what the user manually configures.
4. **For v1, this is acceptable.** The commit graph (powered by GraphQL) will be complete. The project timeline will show owned/org/collaborator repos. External PR contributions are an edge case for a personal portfolio.

**Detection:** Compare the commit graph totals with GitHub profile's contribution count. If they match, coverage is good.

**Phase:** Pipeline design phase. The API strategy depends on understanding this limitation.

**Confidence:** HIGH -- well-known GitHub API limitation.

---

### Pitfall 10: Timezone Mismatch in Commit Graph Day Boundaries

**What goes wrong:** The commit graph shows commits on the wrong day. A commit made at 11 PM local time shows up on the next day because the Worker processes timestamps in UTC. Or conversely, the graph does not match GitHub's own contribution graph because GitHub uses the committer's timezone while the Worker uses UTC.

**Why it happens:** GitHub's contribution graph uses the committer's local timezone to assign commits to days. The GraphQL `contributionsCollection` API returns dates in UTC. If the Worker or SPA does not adjust for this, day boundaries shift. Cloudflare Workers run in UTC with no timezone configuration.

**Consequences:** The commit graph does not match GitHub's profile graph. Users notice the discrepancy. Days appear to have wrong counts.

**Prevention:**
1. **If using GraphQL `contributionCalendar`:** The API returns contribution counts per date already bucketed by day in the user's timezone (as set in GitHub settings). Trust these dates directly. Do not re-bucket.
2. **If using REST commit endpoints:** Commits have `author.date` with timezone offset (e.g., `2026-02-19T23:30:00-05:00`). Use the offset to determine the local date, not UTC conversion.
3. **Store dates as date strings (`YYYY-MM-DD`), not timestamps.** The graph only needs day granularity. Storing `"2026-02-19"` avoids timezone bugs downstream.
4. **Test with late-night and early-morning commits.** These are the edge cases that expose timezone bugs.

**Detection:** Compare your portfolio's graph with GitHub's profile contribution graph for the same date range. Any discrepancy indicates a timezone issue.

**Phase:** Pipeline phase (date handling) and frontend phase (graph rendering).

**Confidence:** HIGH -- timezone bugs are the most common date-handling pitfall.

---

### Pitfall 11: PAT Token Stored Insecurely or with Excessive Scope

**What goes wrong:** The GitHub Personal Access Token is stored with overly broad scopes (e.g., `repo` scope grants full read/write to all repos including private ones). If the token leaks (via logs, error messages, or Cloudflare dashboard access), an attacker has write access to all repositories.

**Why it happens:** The `repo` scope is the obvious choice because it is needed to read private repo data. But `repo` grants read AND write. There is no read-only scope for private repos in GitHub's classic PAT system.

**Consequences:** Full write access to all repositories if token leaks. Attacker can push malicious code, delete branches, or access sensitive code.

**Prevention:**
1. **Use a Fine-Grained Personal Access Token (not classic).** Fine-grained PATs allow: specific repository access (or all repos), read-only permissions per category, expiration dates. Set permissions to: `Contents: Read-only`, `Metadata: Read-only`. No write access needed.
2. **Store as a Cloudflare Worker secret** (via `wrangler secret put GITHUB_TOKEN`). Never hardcode in wrangler.toml or source code.
3. **Set token expiration.** Fine-grained PATs support expiration. Set to 90 days and create a calendar reminder to rotate.
4. **Never log the token.** Ensure error handling in the Worker does not accidentally serialize the token into logs or R2 data.
5. **If you need access to org private repos:** The fine-grained PAT must be approved by the org admin. If this is not possible, use a classic PAT with `repo` scope but understand the risk.

**Detection:** Audit the token's scopes in GitHub Settings > Developer Settings > Personal Access Tokens. Verify it has minimal permissions.

**Phase:** Infrastructure setup phase. Token creation happens before any pipeline code.

**Confidence:** HIGH -- well-documented GitHub security practice.

---

## Minor Pitfalls

---

### Pitfall 12: Language Stats Are Inaccurate for Repos with Vendored/Generated Code

**What goes wrong:** GitHub's repository languages API (`GET /repos/{owner}/{repo}/languages`) returns byte counts per language. Repos with vendored dependencies (e.g., `node_modules` committed), generated code (e.g., protobuf output), or large data files (e.g., JSON fixtures) show misleading language breakdowns. A TypeScript project might show as "90% JavaScript" because of a committed `dist/` folder.

**Why it happens:** GitHub's linguist library excludes some vendored paths but not all. The API reflects what linguist detects.

**Prevention:**
1. **Use language stats for badges, not as primary metadata.** Show "TypeScript, Python, Go" without percentages.
2. **Consider using the primary language (`repo.language` field)** from the repos endpoint rather than the detailed breakdown. It is usually more accurate for categorization.
3. **Do not over-invest in language accuracy for v1.** This is a cosmetic issue. Users will not deeply analyze language percentages on a portfolio.

**Detection:** Spot-check a few repos. If a known TypeScript repo shows as JavaScript, the data source is linguist's byte counting.

**Phase:** Pipeline data processing. Minor concern.

**Confidence:** HIGH -- known linguist behavior.

---

### Pitfall 13: Scroll-Synced Date Spine Performance on Long Timelines

**What goes wrong:** The Time Machine-style timeline with a scroll-synced date spine requires tracking scroll position to update the active month indicator. Naive implementations use `scroll` event listeners without throttling, causing layout thrashing on every pixel of scroll. On mobile, this creates visible jank and drains battery.

**Why it happens:** `scroll` events fire at 60+ Hz. If each event triggers DOM reads (getBoundingClientRect) and writes (updating the active state), the browser cannot keep up.

**Prevention:**
1. **Use Intersection Observer.** Place invisible sentinel elements at each month boundary. When a sentinel enters/leaves the viewport, update the active month. Zero scroll event listeners needed.
2. **Fallback: Use `requestAnimationFrame` throttling.** If Intersection Observer does not give enough granularity, throttle scroll handlers to once per frame via rAF.
3. **CSS `scroll-snap` for click-to-month navigation.** When a user clicks a month on the date spine, use `scrollIntoView({ behavior: 'smooth' })` rather than manual scroll animation.
4. **Avoid `position: sticky` stacking issues.** If the date spine is sticky-positioned, test on iOS Safari (known bugs with nested sticky elements and scroll containers).

**Detection:** Profile with Chrome DevTools Performance tab. Look for long "Recalculate Style" or "Layout" tasks during scrolling.

**Phase:** Frontend implementation phase.

**Confidence:** HIGH -- standard scroll performance patterns.

---

### Pitfall 14: Cloudflare Pages Deploy vs. Worker Deploy Coordination

**What goes wrong:** The site (Pages) and the data pipeline (Worker) are deployed independently. A Pages deploy updates the SPA to expect a new JSON schema, but the Worker has not been updated yet and is still writing the old schema. Or vice versa: the Worker writes a new schema, but the old SPA cannot parse it.

**Why it happens:** Two separate deployment pipelines (Pages via git push or wrangler, Worker via wrangler) with no coordination mechanism.

**Prevention:**
1. **Version the JSON schema.** Include a `version` field in the R2 JSON (e.g., `"schemaVersion": 1`). The SPA checks the version and handles unknown versions gracefully (show stale cached data or fallback).
2. **Deploy Worker first, then Pages.** The Worker writes data; the SPA reads it. If the Worker writes a superset of data (additive changes only), old SPAs can still parse it. New SPAs may need new fields, so deploy Worker first.
3. **Keep the JSON schema additive-only.** Never remove or rename fields. Only add new ones. This makes deployments order-independent for most changes.
4. **Monorepo recommended.** Keep Worker code and SPA code in the same repository. This makes it easy to see when a JSON schema change affects both sides. Use a shared TypeScript type definition for the JSON schema.

**Detection:** Schema mismatches manifest as blank sections or console errors in the SPA. Include error boundaries around data-dependent components.

**Phase:** Project structure decision (monorepo vs. separate repos) at the start. Schema versioning when building the pipeline.

**Confidence:** HIGH -- standard distributed system versioning.

---

### Pitfall 15: Forgetting That R2 Reads Are Eventually Consistent for Overwrites

**What goes wrong:** The Worker writes updated JSON to R2. A visitor loads the site moments later and gets the old data. They refresh -- still old data. Minutes later, the new data appears. Developers think the pipeline is broken and start debugging.

**Why it happens:** R2 (like S3) provides strong read-after-write consistency for new objects, but overwrites of existing objects may have a brief propagation delay, especially when served through Cloudflare's CDN cache. The CDN caches R2 responses, and a new write does not automatically purge the cache.

**Consequences:** Confusion during development and testing. Not a real user-facing issue since data updates daily and CDN TTL can be set to 1 hour.

**Prevention:**
1. **Set appropriate Cache-Control headers.** For daily-updating data, `Cache-Control: public, max-age=3600, s-maxage=3600` (1 hour) is reasonable. Visitors get fresh data within an hour of pipeline run.
2. **For development/testing:** Add a cache-busting query parameter (e.g., `?v=timestamp`) or use `Cache-Control: no-cache` temporarily.
3. **If using a Pages Function as proxy:** The function can add `Cache-Control` headers explicitly, giving you full control.
4. **Do not use versioned filenames** (e.g., `data-v123.json`) for the cron-updated data. This adds complexity and orphans old files. Simple TTL-based caching is sufficient for daily updates.

**Detection:** After a Worker run, fetch the JSON URL directly (not through the SPA) with `curl -I` to check cache headers and response freshness.

**Phase:** Infrastructure/deployment phase.

**Confidence:** MEDIUM -- R2 consistency model details should be verified with current Cloudflare documentation.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| **Infrastructure setup** | PAT token with excessive scopes (Pitfall 11) | Use fine-grained PAT with read-only permissions |
| **Infrastructure setup** | R2 not accessible from SPA (Pitfall 8) | Use Pages Function proxy from day one |
| **Pipeline design** | Using Events API instead of proper endpoints (Pitfall 2) | Use GraphQL contributionsCollection + REST repos/commits |
| **Pipeline design** | Rate limit exhaustion on backfill (Pitfall 3) | Separate backfill from daily cron; use GraphQL for graph data |
| **Pipeline design** | Worker subrequest limits (Pitfall 4) | Ensure paid plan; keep daily updates lightweight |
| **Pipeline implementation** | Private repo data leakage (Pitfall 1) | Allowlist-based field extraction; never store raw API responses |
| **Data model design** | Unbounded JSON growth (Pitfall 5) | Split into graph.json + projects.json; rolling 13-month window |
| **Data model design** | Timezone day-boundary bugs (Pitfall 10) | Store dates as YYYY-MM-DD strings; trust GraphQL calendar dates |
| **Frontend - commit graph** | DOM re-render jank (Pitfall 6) | React.memo, CSS data-attributes for levels, stable props |
| **Frontend - timeline** | Scroll listener performance (Pitfall 13) | Intersection Observer for month tracking |
| **Frontend - data loading** | No indication of stale data (Pitfall 7) | lastUpdated timestamp in JSON; display in UI |
| **Deployment** | Schema mismatch between Worker and SPA (Pitfall 14) | Schema versioning; shared TypeScript types; deploy Worker first |
| **Ongoing operations** | Silent pipeline failures (Pitfall 7) | Heartbeat file in R2; dead man's switch alerting |

---

## Sources

- GitHub REST API documentation (rate limits, events API limits, repos endpoint) -- training data, not live-verified
- GitHub GraphQL API documentation (contributionsCollection, contributionCalendar) -- training data, not live-verified
- Cloudflare Workers documentation (subrequest limits, CPU time, cron triggers) -- training data, not live-verified
- Cloudflare R2 documentation (public access, CORS, consistency model) -- training data, not live-verified
- React performance patterns (memo, Intersection Observer, scroll handling) -- training data

**NOTE:** Web search and official documentation fetch were unavailable during this research session. All findings are based on training data (cutoff ~May 2025). Key items to verify against current docs before implementation:
- Cloudflare Worker subrequest limits for cron triggers (Pitfall 4)
- R2 consistency model for overwrites (Pitfall 15)
- Fine-grained PAT availability for organization repos (Pitfall 11)
- GraphQL contributionsCollection exact response format and timezone behavior (Pitfalls 9, 10)
