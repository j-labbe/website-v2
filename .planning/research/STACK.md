# Technology Stack

**Project:** jacklabbe.com -- Developer Portfolio with Auto-Updating GitHub Data
**Researched:** 2026-02-19
**Note:** Web search and fetch tools were unavailable during research. Versions are based on training data (cutoff: May 2025) and should be verified with `npm info <package> version` before installation. Confidence levels reflect this limitation.

---

## Recommended Stack

### Build Tool / Dev Server

| Technology | Version | Purpose                         | Why                                                                                                                                                                                                                                 | Confidence                         |
| ---------- | ------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Vite       | ^6.x    | Build tool, dev server, bundler | Fastest DX for React+TS. Native ESM, sub-second HMR. Vite 6 is the current major. Produces optimized static output perfect for Cloudflare Pages static upload. No reason to use anything else for a new React project in 2025/2026. | MEDIUM (verify exact latest minor) |

### Core Framework

| Technology | Version | Purpose       | Why                                                                                                                                                                                                          | Confidence                                  |
| ---------- | ------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| React      | ^19.x   | UI framework  | Project requirement (TypeScript React). React 19 shipped stable in Dec 2024. Use it -- the new features (Actions, use() hook, ref as prop) are nice-to-haves but ecosystem compatibility is the real reason. | MEDIUM (verify 19.x is still latest stable) |
| React DOM  | ^19.x   | DOM rendering | Matches React version                                                                                                                                                                                        | MEDIUM                                      |
| TypeScript | ^5.7    | Type safety   | Project requirement. TS 5.7 is latest stable as of early 2025. Use strict mode.                                                                                                                              | MEDIUM (verify exact latest minor)          |

### Styling

| Technology                     | Version | Purpose                  | Why                                                                                                                                                                                                                                                                                                                | Confidence |
| ------------------------------ | ------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| CSS Modules (built-in to Vite) | N/A     | Component-scoped styling | For a portfolio site with a specific custom dark theme (#040d21), custom commit graph, and Time Machine timeline -- you need precise pixel-level control. CSS Modules give you scoped styles with zero runtime cost and zero bundle overhead. Vite supports them natively (`.module.css` files). No config needed. | HIGH       |
| CSS custom properties          | N/A     | Theme tokens             | Define `--color-bg: #040d21`, `--color-accent-blue`, spacing scale, etc. in `:root`. Single source of truth for the dark theme with zero library dependency.                                                                                                                                                       | HIGH       |

**Why NOT Tailwind CSS:** The project references tailwindcss.com only as a design reference for decorative elements, not as a stack choice. For this specific site:

- The commit graph needs SVG with precise positioning -- Tailwind utility classes do not help here.
- The Time Machine timeline is a custom scrolling component -- needs custom CSS anyway.
- The crosshatch grid pattern, 1px structural dividers, and subtle animations are all custom CSS.
- Tailwind adds configuration overhead and a build step for what is essentially a 5-section single-page site.
- CSS Modules + custom properties give complete control with zero dependencies.

**Why NOT styled-components / Emotion:** Runtime CSS-in-JS adds bundle size and slows rendering. The React ecosystem has moved away from runtime CSS-in-JS. For a performance-focused static portfolio, avoid it.

**Why NOT vanilla-extract:** Good zero-runtime option but adds TypeScript-in-CSS complexity that is unnecessary for a small site. CSS Modules are simpler and built into Vite.

### Cloudflare Worker Pipeline

| Technology                | Version | Purpose                              | Why                                                                                                                                                                                                              | Confidence                        |
| ------------------------- | ------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Wrangler                  | ^3.x    | CLI for Workers/R2/Pages             | The official Cloudflare CLI. Handles local dev (`wrangler dev`), deployment (`wrangler deploy`), cron trigger config, R2 bucket management, secrets management. Single tool for the entire Cloudflare ecosystem. | MEDIUM (verify if v4 has shipped) |
| @cloudflare/workers-types | ^4.x    | TypeScript types for Workers runtime | Type definitions for `Request`, `Response`, `R2Bucket`, `ScheduledEvent`, `ExecutionContext`, etc. Essential for TypeScript Worker development.                                                                  | MEDIUM                            |

### GitHub API Strategy

Use a **hybrid REST + GraphQL approach**:

| Technology       | Version | Purpose               | Why                                                                                                                                                                                                                                                                                                                 | Confidence                   |
| ---------------- | ------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| @octokit/graphql | ^8.x    | GitHub GraphQL client | For the commit graph: a single GraphQL query to `contributionsCollection.contributionCalendar` returns the entire 12-month contribution heatmap in ONE API call. This is the same data source GitHub uses for its own profile graph. Eliminates pagination, rate limit concerns, and timezone issues for the graph. | MEDIUM (verify latest major) |
| @octokit/rest    | ^21.x   | GitHub REST client    | For the project timeline: enumerate repos via REST (`/user/repos`), fetch per-repo metadata (languages, commit counts). REST is better for iterating over repos because the GraphQL schema for repository lists is more complex.                                                                                    | MEDIUM (verify latest major) |

**Why NOT just @octokit/rest for everything:** The REST API has no single endpoint for "contribution calendar." You would need to fetch commits from every repo individually, paginate through them, aggregate by day, and handle timezone alignment. The GraphQL `contributionCalendar` gives this pre-computed in one call. See PITFALLS.md Pitfall 2 (Events API 90-day limit) and Pitfall 3 (rate limit exhaustion).

**Why NOT the full `octokit` umbrella package:** Workers have a 1MB compressed size limit. `@octokit/graphql` + `@octokit/rest` together are lighter than the umbrella `octokit` package. If bundle size is still a concern, `@octokit/graphql` is tiny (~5KB) and `@octokit/rest` can be replaced with raw `fetch` for the few REST endpoints needed.

### Data Fetching (Client-Side)

| Technology     | Version | Purpose                           | Why                                                                                                                                                                                                                                                                      | Confidence |
| -------------- | ------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| Native `fetch` | N/A     | Fetch R2 JSON files on page visit | The site fetches 2-3 small JSON files from R2 on visit (graph.json, projects.json, meta.json). Use `Promise.all` for parallel fetching. No data fetching library is needed -- do NOT add React Query, SWR, or any fetching library for a handful of static JSON fetches. | HIGH       |

### Visualization (Commit Graph)

| Technology         | Version | Purpose                | Why                                                                                                                                                                                                                                                                                                                                | Confidence |
| ------------------ | ------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| SVG (inline React) | N/A     | Commit graph rendering | The GitHub-style contribution graph is a grid of colored rectangles. SVG is the natural fit: each cell is a `<rect>`, colors are computed from commit counts, the whole thing is a React component rendering SVG elements. No charting library needed -- the commit graph is a simple heatmap grid. Keeps bundle at zero extra KB. | HIGH       |

**Why NOT D3.js:** D3 is 80KB+ minified. The commit graph is a grid of rectangles with color interpolation. That is 20 lines of SVG code in React. D3 is massively overkill.

**Why NOT Chart.js / Recharts / Nivo:** Same reasoning. These are general-purpose charting libraries. The commit graph is not a chart -- it is a colored grid. Write it directly in SVG.

**Why NOT Canvas:** Canvas does not support DOM hover events natively (need hit testing). SVG gives free hover/tooltip support via DOM events. For a grid of ~365 cells, SVG performance is not a concern. Use `React.memo` and CSS data-attributes for color levels to avoid re-render jank (see PITFALLS.md Pitfall 6).

### Animation

| Technology                              | Version | Purpose                         | Why                                                                                                                                                                                                                                                                                                                         | Confidence |
| --------------------------------------- | ------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| CSS animations + `IntersectionObserver` | N/A     | Fade-in on scroll, hover states | The spec calls for "subtle fade-in on scroll" and "hover states on interactive elements." Use CSS `@keyframes` for the fade animation and a lightweight `IntersectionObserver` hook to trigger it. Zero library overhead. Also use IntersectionObserver for timeline scroll-synced date spine (see PITFALLS.md Pitfall 13). | HIGH       |

**Why NOT Framer Motion:** Framer Motion is 30KB+ gzipped. For fade-in-on-scroll and hover effects, CSS handles it natively. Adding Framer Motion to a "fast, minimal" portfolio is contradictory.

### Fonts

| Technology                 | Version | Purpose                                           | Why                                                                                                                                                                       | Confidence |
| -------------------------- | ------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Inter (Google Fonts / CDN) | N/A     | Heading font (bold)                               | Use the Google Fonts CDN with `display=swap` and preconnect hints. Do NOT self-host -- the Google Fonts CDN has near-universal cache hits. System font stack as fallback. | HIGH       |
| System monospace stack     | N/A     | Accent text (monospace labels like `// projects`) | `ui-monospace, "SF Mono", "Cascadia Code", "Fira Code", Consolas, monospace`. No font file to load.                                                                       | HIGH       |

### Testing

| Technology | Version | Purpose                  | Why                                                                                                                                                                                                                                                                    | Confidence                   |
| ---------- | ------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Vitest     | ^3.x    | Unit/integration testing | Vite-native test runner. Shares Vite config, instant startup, compatible with Jest API. Use for testing data transformation logic, commit graph color calculations, date grouping for timeline, and critically: private repo sanitization (see PITFALLS.md Pitfall 1). | MEDIUM (verify latest major) |

### Linting / Formatting

| Technology | Version | Purpose         | Why                                                                                            | Confidence |
| ---------- | ------- | --------------- | ---------------------------------------------------------------------------------------------- | ---------- |
| ESLint     | ^9.x    | Linting         | ESLint 9 uses flat config (`eslint.config.js`). Use `@eslint/js` + `typescript-eslint` plugin. | MEDIUM     |
| Prettier   | ^3.x    | Code formatting | Standard. Use with `.prettierrc`.                                                              | MEDIUM     |

### Package Manager

| Technology | Version | Purpose                         | Why                                                                                                                                                                                                                                                                        | Confidence                   |
| ---------- | ------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| pnpm       | ^9.x    | Package management + workspaces | pnpm is standard for Cloudflare projects (wrangler uses it internally). pnpm workspaces enable the monorepo structure (site, worker, shared types packages) with a single lockfile. Faster installs than npm, strict node_modules structure prevents phantom dependencies. | MEDIUM (verify latest major) |

---

## Alternatives Considered

| Category           | Recommended                 | Alternative            | Why Not                                                                                                                                                                                                                                                            |
| ------------------ | --------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Build tool         | Vite                        | Next.js                | Next.js is SSR/SSG framework. This project is a static SPA that fetches JSON at runtime. Next.js adds a server runtime, routing overhead, and opinionated structure that is unnecessary. Cloudflare Pages works best with static upload, not Next.js edge runtime. |
| Build tool         | Vite                        | Astro                  | Astro is great for content sites but this project has interactive components (scrolling timeline, commit graph hover states, data fetching). Astro's island architecture adds complexity for a single-page app that is entirely interactive.                       |
| Build tool         | Vite                        | Create React App       | CRA is deprecated/unmaintained. Do not use.                                                                                                                                                                                                                        |
| Styling            | CSS Modules                 | Tailwind CSS           | Overkill config for 5 sections. Custom SVG graph and timeline need custom CSS regardless. Adds build dependency for minimal benefit.                                                                                                                               |
| Styling            | CSS Modules                 | styled-components      | Runtime CSS-in-JS hurts performance. React ecosystem has moved to zero-runtime solutions.                                                                                                                                                                          |
| Styling            | CSS Modules                 | vanilla-extract        | Good zero-runtime but adds TS-in-CSS complexity unnecessary for a small site.                                                                                                                                                                                      |
| GitHub API (graph) | @octokit/graphql            | @octokit/rest only     | REST has no single endpoint for contribution calendar. Would require fetching commits from every repo individually with pagination. GraphQL gives the full 12-month graph in one call.                                                                             |
| GitHub API (graph) | @octokit/graphql            | Events API             | Events API is capped at 90 days / 300 events. Completely insufficient for a 12-month graph.                                                                                                                                                                        |
| Commit graph       | Inline SVG                  | D3.js                  | 80KB+ for rendering rectangles.                                                                                                                                                                                                                                    |
| Commit graph       | Inline SVG                  | Canvas API             | No native DOM hover events. SVG gives free tooltip support.                                                                                                                                                                                                        |
| Animation          | CSS + IntersectionObserver  | Framer Motion          | 30KB+ for fade effects. CSS handles this natively.                                                                                                                                                                                                                 |
| Data fetching      | Native fetch                | React Query / SWR      | 2-3 JSON files fetched once per visit. Caching, retry, and polling features are unused. Pure overhead.                                                                                                                                                             |
| Worker bundling    | Wrangler (esbuild built-in) | Custom esbuild/webpack | Wrangler bundles Workers internally. No separate bundler config needed.                                                                                                                                                                                            |
| Testing            | Vitest                      | Jest                   | Vitest is Vite-native, shares config, faster startup. Jest requires separate babel/ts-jest config.                                                                                                                                                                 |
| Package manager    | pnpm                        | npm                    | pnpm workspaces are cleaner for monorepos. Faster installs. Strict node_modules.                                                                                                                                                                                   |
| Package manager    | pnpm                        | yarn                   | Either works; pnpm aligns with Cloudflare tooling conventions.                                                                                                                                                                                                     |

---

## Full Dependency List

### Root (Monorepo)

```bash
# Initialize pnpm workspace
pnpm init

# Root dev dependencies (shared tooling)
pnpm add -Dw typescript@^5.7 eslint@^9 @eslint/js typescript-eslint prettier vitest@^3
```

### packages/site

```bash
# Core (runtime)
pnpm add react@^19 react-dom@^19

# Dev
pnpm add -D @vitejs/plugin-react@^4 vite@^6 @types/react@^19 @types/react-dom@^19
```

### packages/worker

```bash
# Dev (Workers are deployed via wrangler, not npm published)
pnpm add -D wrangler@^3 @cloudflare/workers-types@^4

# Runtime dependencies (bundled into Worker)
pnpm add @octokit/graphql@^8 @octokit/rest@^21
```

### packages/shared

```bash
# No runtime dependencies -- just TypeScript types
# Consumed by site and worker via pnpm workspace protocol
```

**Total site runtime dependencies: 2** (react, react-dom). Everything else is dev/build.
**Total worker runtime dependencies: 2** (@octokit/graphql, @octokit/rest). Bundled by wrangler.

---

## Project Structure

```
jacklabbe.com/
  .planning/                        # GSD planning files
  packages/
    shared/                         # Shared TypeScript types
      src/
        index.ts                    # Re-exports all types
        commits.ts                  # CommitActivity, DailyCommit types
        repos.ts                    # RepoMetadata types
        meta.ts                     # DataMeta types
      tsconfig.json
      package.json

    worker/                         # Cloudflare Worker (data pipeline)
      src/
        index.ts                    # Scheduled handler entry point
        github-graphql.ts           # GraphQL: contribution calendar
        github-rest.ts              # REST: repos, languages, commit counts
        transform.ts                # Raw API data -> R2 JSON shape
        sanitize.ts                 # Private repo data stripping
        r2.ts                       # R2 write operations
      wrangler.toml                 # Cron trigger, R2 binding, secrets
      tsconfig.json
      package.json

    site/                           # React SPA (Cloudflare Pages)
      src/
        components/
          Hero.tsx
          CommitGraph.tsx            # SVG grid component
          Timeline.tsx               # Time Machine project timeline
          DateSpine.tsx              # Scroll-synced month navigation
          ProjectEntry.tsx
          Navbar.tsx
          Footer.tsx
          ContactButton.tsx
        hooks/
          useGitHubData.ts           # Fetch + parse R2 JSON files
          useIntersectionFade.ts     # Scroll-triggered fade-in
          useActiveMonth.ts          # IntersectionObserver for date spine
        styles/
          global.css                 # CSS custom properties, base reset
          tokens.css                 # Design tokens (colors, spacing, fonts)
          Hero.module.css
          CommitGraph.module.css
          Timeline.module.css
          DateSpine.module.css
        types/                       # Re-exports from @jacklabbe/shared
        utils/
          colors.ts                  # Commit graph color interpolation
          dates.ts                   # Date formatting, month grouping
        App.tsx
        main.tsx
      public/
        favicon.ico
      index.html
      vite.config.ts
      tsconfig.json
      package.json

  package.json                       # Workspace root
  pnpm-workspace.yaml               # pnpm workspaces config
  tsconfig.base.json                 # Shared TS config (strict mode)
  .prettierrc
  eslint.config.js
```

### Why pnpm Monorepo with Shared Types

The site and worker have completely different runtimes (browser vs. Workers), different dependencies, and different deployment targets. But they share a critical contract: the R2 JSON schema. A `packages/shared` package provides compile-time type safety that the Worker's output matches what the Site expects. If you change a field name in the Worker's transform, TypeScript will catch the mismatch in the Site at build time. This prevents the deployment coordination pitfall described in PITFALLS.md Pitfall 14.

---

## Cloudflare Configuration

### wrangler.toml (Pipeline Worker)

```toml
name = "jacklabbe-pipeline"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[triggers]
crons = ["0 6 * * *"]  # Daily at 6 AM UTC

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "jacklabbe-data"

# Secrets (set via `wrangler secret put`):
# GITHUB_TOKEN - Fine-grained PAT with read-only Contents + Metadata
```

### R2 JSON Structure

```
jacklabbe-data/
  github-data/
    graph.json            # Commit graph heatmap (daily counts, ~5KB)
    projects.json         # Project list with metadata (~20KB for 100 repos)
    meta.json             # Pipeline metadata (last updated, counts)
```

Split into multiple files per ARCHITECTURE.md and PITFALLS.md Pitfall 5 (unbounded JSON growth). The graph can be fetched immediately while projects loads in parallel.

### R2 Access Strategy

**Recommended: R2 public bucket with custom domain** (`data.jacklabbe.com`).

If CORS issues arise, fall back to a Cloudflare Pages Function that proxies R2 reads (see PITFALLS.md Pitfall 8 for details). The Pages Function approach avoids CORS entirely by keeping requests same-origin.

### Cloudflare Pages Deployment

```bash
# Build
cd packages/site && pnpm build

# Deploy via wrangler
wrangler pages deploy packages/site/dist --project-name jacklabbe-site
```

Or connect the Git repo to Cloudflare Pages with build command `cd packages/site && pnpm install && pnpm build` and output directory `packages/site/dist`.

---

## Performance Budget

| Metric              | Target                | How                                                                          |
| ------------------- | --------------------- | ---------------------------------------------------------------------------- |
| JS bundle (gzipped) | < 50 KB               | React 19 (~40KB gzipped) + app code (~5-10KB). No heavy libraries.           |
| CSS (gzipped)       | < 5 KB                | CSS Modules, no framework overhead                                           |
| Font load           | 1 request             | Single Inter weight from Google Fonts CDN (with preconnect)                  |
| Data fetch          | 2-3 parallel requests | graph.json (~5KB) + projects.json (~20KB) + meta.json (<1KB) via Promise.all |
| LCP                 | < 1.5s                | Static HTML + hero renders immediately; data fetch is non-blocking           |
| Total requests      | < 12                  | HTML + JS chunks + CSS + font + 3 JSON files + favicon                       |

---

## Key Decisions Summary

| Decision                                   | Rationale                                                                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vite over Next.js/Astro                    | Static SPA with runtime data fetch. No SSR/SSG needed. Simplest build pipeline for Cloudflare Pages static upload.                                     |
| CSS Modules over Tailwind                  | Custom dark theme + SVG graph + timeline need precise custom CSS. Tailwind adds config overhead for minimal utility-class benefit on a 5-section page. |
| Inline SVG over charting library           | Commit graph is a colored rectangle grid. 20 lines of SVG vs. 80KB+ library.                                                                           |
| GraphQL + REST hybrid                      | GraphQL `contributionCalendar` gives the full commit graph in 1 API call. REST is better for iterating repo metadata. Avoids rate limit exhaustion.    |
| @octokit/graphql + @octokit/rest           | Official clients with TS types, pagination, auth. Lighter than umbrella `octokit`.                                                                     |
| Native fetch over React Query              | 2-3 JSON files fetched once per visit. No caching/polling needed.                                                                                      |
| CSS animations over Framer Motion          | "Subtle fade-in" does not justify 30KB+. CSS + IntersectionObserver achieves the same.                                                                 |
| pnpm monorepo with shared types            | Compile-time safety for the R2 JSON contract between Worker and Site. Prevents schema mismatch bugs.                                                   |
| Split JSON files (graph + projects + meta) | Enables parallel fetching, prevents unbounded file growth, allows independent caching.                                                                 |
| No router library                          | Single-scroll page with no routes. React Router would be dead weight.                                                                                  |

---

## Version Verification Checklist

**IMPORTANT:** Before running `pnpm install`, verify these versions are current:

```bash
# Run these to check latest versions
npm info react version
npm info vite version
npm info wrangler version
npm info @octokit/rest version
npm info @octokit/graphql version
npm info typescript version
npm info vitest version
npm info @cloudflare/workers-types version
npm info eslint version
npm info pnpm version
```

Versions listed above are based on training data (cutoff May 2025). The ecosystem moves fast -- Vite, Wrangler, and TypeScript especially may have new majors.

---

## Sources

| Claim                            | Source                                  | Confidence                         |
| -------------------------------- | --------------------------------------- | ---------------------------------- |
| React 19 stable (Dec 2024)       | Training data, widely reported          | MEDIUM -- verify current latest    |
| Vite 6.x current major           | Training data                           | MEDIUM -- verify, Vite 7 may exist |
| Wrangler 3.x current major       | Training data                           | MEDIUM -- verify, v4 may exist     |
| CSS Modules built into Vite      | Training data, well-established feature | HIGH                               |
| Workers 1MB compressed limit     | Training data, Cloudflare docs          | MEDIUM -- may have changed         |
| GraphQL contributionCalendar API | Training data, GitHub GraphQL docs      | MEDIUM -- verify exact field names |
| @octokit/graphql ~5KB            | Training data, approximate              | LOW -- verify actual bundle size   |
| Framer Motion ~30KB gzipped      | Training data, approximate              | MEDIUM                             |
| D3 ~80KB minified                | Training data, approximate              | MEDIUM                             |
| @octokit/rest handles pagination | Training data, well-established         | HIGH                               |
| CRA deprecated                   | Training data, widely known             | HIGH                               |
| pnpm used by Cloudflare tooling  | Training data                           | MEDIUM                             |
| Google Fonts CDN cache behavior  | Training data                           | HIGH                               |

**Overall stack confidence: MEDIUM** -- All recommendations are architecturally sound and reflect well-established patterns. The hybrid GraphQL+REST GitHub API strategy is well-motivated by the pitfalls research. Exact version numbers need verification via `npm info` before installation.
