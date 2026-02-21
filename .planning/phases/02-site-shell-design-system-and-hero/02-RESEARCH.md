# Phase 2: Site Shell, Design System, and Hero - Research

**Researched:** 2026-02-20
**Domain:** React SPA, CSS design system, font loading, Cloudflare Pages deployment, Open Graph, accessibility
**Confidence:** HIGH

## Summary

Phase 2 transforms the Phase 1 skeleton Vite+React app into a polished dark-themed SPA with a complete design system, hero section, sticky navbar, page layout, R2 data fetching, and SEO/meta tags. The existing codebase uses React 19.2.4 with Vite 7.3.1 in a pnpm monorepo. The site package currently has only a placeholder `App.tsx` and `main.tsx` -- everything visual is greenfield.

The core technical decisions are locked by CONTEXT.md: CSS Modules + CSS custom properties (no frameworks), Inter and JetBrains Mono fonts via Fontsource self-hosting, a specific dark color palette, and React 19's native document metadata support for OG tags. The R2 data is served from a public bucket (planned at `data.jacklabbe.com`) and the site fetches `graph.json`, `projects.json`, and `meta.json` on load. Cloudflare Pages deployment uses `wrangler pages deploy` for direct upload.

Key research findings: (1) React 19 natively supports `<title>`, `<meta>`, and `<link>` tags in component JSX with automatic hoisting to `<head>` -- no helmet library needed. (2) The color token `--text-dim: #6e7a8a` narrowly fails WCAG AA for normal text on both `--bg` and `--surface` backgrounds (4.44:1 and 4.16:1 vs. 4.5:1 required) -- it must be restricted to large text (>=18px bold or >=24px regular) or decorative/non-essential text. (3) White text on the accent button `#4F7DF5` only achieves 3.76:1 contrast -- use dark text (`--bg`) on the button instead, which achieves 5.15:1. (4) The CORS config must be updated to include the `.pages.dev` subdomain for the initial deployment.

**Primary recommendation:** Build the design system as CSS custom properties in a global tokens file, compose all components with CSS Modules (`.module.css`), self-host fonts via `@fontsource-variable/*`, and use React 19's native metadata support for OG tags. Deploy to Cloudflare Pages via `wrangler pages deploy site/dist`.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Hero composition:** Right-aligned split layout: photo on left, text (name + tagline + contact button) on right. Even ~50/50 split. Professional headshot. Name "Jack Labbe" rendered large and bold (~48-64px), Inter font, heavy weight. Tagline "Software / AI Engineer" in Inter, lighter weight (NOT monospace). Contact button: filled accent color (#4F7DF5), pill shape (fully rounded), mailto link. Natural height with generous padding (not full viewport). Content vertically centered. Subtle radial gradient with accent glow for hero background. Mobile: photo restacks on top, text below. Staggered entrance animation: photo -> name -> tagline -> button, ~100ms gaps. Max-width container (~1200px) centered.
- **Navbar:** Contact button only -- no name, no branding, no logo. Sticky. Glass / backdrop blur effect. Contact button matches hero style.
- **Page layout:** Single-scroll: hero -> commit graph -> divider -> timeline -> footer. Phase 2 placeholder: empty sections with monospace labels. Deploy to .pages.dev subdomain first.
- **Footer:** Compact single row: copyright + social icon links. Icons only (no text labels): GitHub, LinkedIn, email, X (Twitter).
- **Design system reference:** Linear.app and Stripe.com -- crisp, high-contrast, polished engineering aesthetic.
- **Color palette:** `--bg: #040d21`, `--surface: #0a1628`, `--surface-2: #111d33`, `--border: #1a2844`, `--text: #c9d1d9`, `--text-dim: #6e7a8a`, `--text-bright: #f0f6fc`, `--accent: #4F7DF5`, `--accent-secondary: #6B9CFF`.
- **Typography:** Headings: Inter (bold weight), font-display: swap. Accent/code text: JetBrains Mono. Tagline: Inter (lighter weight), NOT monospace. Font loading: font-display: swap with skeleton loading state masking the flash.
- **Decorative elements:** Crosshatch grid pattern at ~3-5% opacity. Grid toggle via CSS variable (`--grid-visible`). Monospace section labels dimmed (#6e7a8a), left-aligned. 1px structural dividers within max-width container. Pill shape for buttons, ~8px radius for cards/badges.
- **Loading experience:** Skeleton placeholders with gradient sweep shimmer. Content-shaped skeletons. Hero shows skeleton too. Unified flow: skeletons -> fonts + R2 data ready -> staggered reveal. All R2 JSON fetched in parallel. 5-second timeout. Error state design: Claude's discretion. Caching: Claude's discretion.
- **SEO / Open Graph:** OG preview card matching site design. OG image method: Claude's discretion.
- **Accessibility:** Skip-to-content link target: Claude's discretion. WCAG AA contrast ratios. Keyboard navigable.

### Claude's Discretion

- Photo shape and sizing (fits the split layout)
- Navbar bottom border treatment
- Link/interactive text color choice (based on contrast ratios)
- Semantic accent colors beyond blue (success, warning, error)
- Divider line style (solid vs gradient fade)
- Crosshatch grid scope (entire page vs hero only)
- Footer icon style (outline vs filled)
- Error state design
- Data caching strategy
- OG image generation method
- Skip-to-content link target
- Exact spacing scale and typography size scale

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                              | Research Support                                                                                                                   |
| ------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| INFR-03 | Deployed to Cloudflare Pages (static upload)                                             | Cloudflare Pages deployment via `wrangler pages deploy site/dist`, SPA routing config                                              |
| INFR-05 | Site fetches R2 JSON on visit (not full SSG)                                             | R2 public bucket access pattern, parallel fetch with Promise.all, 5s timeout, error handling                                       |
| HERO-01 | Hero section displays photo, name ("Jack Labbe"), and tagline ("Software / AI Engineer") | Split layout pattern, Inter font via Fontsource, typography scale, responsive breakpoints                                          |
| HERO-02 | Contact button in hero section (mailto link, no contact form)                            | Pill button styling, dark text on accent for AA contrast, mailto: link pattern                                                     |
| HERO-03 | Minimal navbar with only a contact button (top-right)                                    | Sticky nav, backdrop-filter blur, z-index layering                                                                                 |
| HERO-04 | Spacious hero layout with generous whitespace                                            | Spacing scale with CSS custom properties, padding tokens                                                                           |
| DSGN-01 | Dark theme with #040d21 navy background                                                  | CSS custom properties for full token palette, verified contrast ratios                                                             |
| DSGN-02 | Inter/system sans-serif font for headings (bold weight)                                  | @fontsource-variable/inter, font-display: swap, variable font single-file loading                                                  |
| DSGN-03 | Monospace font for accent text (tagline, section labels, metadata)                       | @fontsource-variable/jetbrains-mono -- NOTE: tagline is Inter per locked decision, JetBrains Mono for section labels/metadata only |
| DSGN-04 | Decorative structural 1px divider lines between sections                                 | CSS border or pseudo-element patterns, gradient fade recommendation                                                                |
| DSGN-05 | Monospace section labels (e.g., // projects, // contact)                                 | JetBrains Mono, dimmed text-dim color, left-aligned in container                                                                   |
| DSGN-06 | Toggleable subtle crosshatch grid pattern background (low opacity, easy enable/disable)  | SVG-in-CSS background pattern, CSS variable toggle `--grid-visible`                                                                |
| DSGN-08 | Single-scroll page layout: hero -> commit graph -> divider -> timeline -> footer         | Section-based layout, semantic HTML, placeholder sections for Phase 3 content                                                      |
| DSGN-09 | Responsive layout -- mobile-first, works on all viewports                                | CSS Grid/Flexbox, mobile-first breakpoints (375px base, 768px tablet, 1024px desktop)                                              |
| DSGN-10 | WCAG AA contrast ratios on all text                                                      | Verified contrast ratios for all token pairs (see Contrast Audit section)                                                          |
| DSGN-11 | CSS Modules + CSS custom properties (no CSS frameworks)                                  | Vite built-in CSS Modules (.module.css), camelCase localsConvention                                                                |
| META-01 | Open Graph tags for social sharing preview                                               | React 19 native metadata in JSX, static OG image (1200x630 PNG)                                                                    |
| META-02 | Semantic HTML structure (nav, main, section, article)                                    | HTML5 semantic elements, ARIA landmarks                                                                                            |
| META-03 | Keyboard navigable, skip-to-content link                                                 | Skip-to-content pattern, tabindex management, focus styles                                                                         |

</phase_requirements>

## Standard Stack

### Core (already installed)

| Library              | Version | Purpose             | Why Standard                                                                    |
| -------------------- | ------- | ------------------- | ------------------------------------------------------------------------------- |
| React                | 19.2.4  | UI framework        | Already installed. Native metadata support eliminates need for helmet libraries |
| React DOM            | 19.2.4  | DOM rendering       | Already installed                                                               |
| Vite                 | 7.3.1   | Build tool          | Already installed. Built-in CSS Modules support, zero config needed             |
| TypeScript           | ^5.9    | Type safety         | Already installed                                                               |
| @vitejs/plugin-react | ^4      | React JSX transform | Already installed                                                               |

### New Dependencies to Add

| Library                             | Version | Purpose                                  | Why Standard                                                                                                                      |
| ----------------------------------- | ------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| @fontsource-variable/inter          | latest  | Self-hosted Inter variable font          | 221K+ weekly downloads. Single WOFF2 file covers weights 100-900. Eliminates Google Fonts dependency. font-display: swap built in |
| @fontsource-variable/jetbrains-mono | latest  | Self-hosted JetBrains Mono variable font | Self-hosted monospace for accent text. Single file covers weights 100-800                                                         |

### No Additional Libraries Needed

| Capability         | Why No Library                                | Built-in Solution                                                                           |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| CSS styling        | DSGN-11 locks CSS Modules + custom properties | Vite built-in `.module.css` support                                                         |
| Document head/meta | React 19 has native support                   | `<title>`, `<meta>`, `<link>` in JSX auto-hoist to `<head>`                                 |
| Routing            | Single-page, single-scroll site               | No router needed -- one page                                                                |
| State management   | Only fetch state (loading/loaded/error)       | React useState + useEffect                                                                  |
| Icons (social)     | Only 4 icons needed                           | Hand-written SVG components (6-10 lines each) -- avoids icon library dependency for 4 icons |
| Animations         | Only entrance animations                      | CSS @keyframes + animation-delay -- no library needed for sequential fade-ins               |
| HTTP fetching      | Simple GET requests                           | Native fetch API with Promise.all                                                           |

**Installation:**

```bash
cd site && pnpm add @fontsource-variable/inter @fontsource-variable/jetbrains-mono
```

## Architecture Patterns

### Recommended Project Structure

```
site/
├── index.html                    # Entry point with OG meta fallbacks + font preload hints
├── public/
│   ├── og-image.png              # Static OG image (1200x630)
│   └── headshot.webp             # Professional headshot photo
├── src/
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Root component: metadata + layout composition
│   ├── styles/
│   │   ├── tokens.css            # Design tokens (CSS custom properties)
│   │   ├── reset.css             # Minimal CSS reset
│   │   ├── fonts.css             # Font imports and font-face declarations
│   │   ├── global.css            # Global styles (body, html, scrollbar)
│   │   └── animations.css        # Shared keyframe animations (shimmer, fade-in)
│   ├── components/
│   │   ├── Navbar/
│   │   │   ├── Navbar.tsx
│   │   │   └── Navbar.module.css
│   │   ├── Hero/
│   │   │   ├── Hero.tsx
│   │   │   ├── Hero.module.css
│   │   │   └── HeroSkeleton.tsx
│   │   ├── Footer/
│   │   │   ├── Footer.tsx
│   │   │   └── Footer.module.css
│   │   ├── SectionPlaceholder/
│   │   │   ├── SectionPlaceholder.tsx
│   │   │   └── SectionPlaceholder.module.css
│   │   ├── SkipToContent/
│   │   │   ├── SkipToContent.tsx
│   │   │   └── SkipToContent.module.css
│   │   └── icons/
│   │       └── SocialIcons.tsx    # GitHub, LinkedIn, Email, X as inline SVG components
│   ├── hooks/
│   │   └── useR2Data.ts          # Data fetching hook: parallel fetch, timeout, error handling
│   └── vite-env.d.ts            # Vite client types + env var types
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### Pattern 1: CSS Custom Properties Design Token System

**What:** All design values (colors, spacing, typography, borders, shadows) defined as CSS custom properties in a single `tokens.css` file. Components reference tokens via `var(--token-name)`, never hard-coded values.

**When to use:** Every component.

**Example:**

```css
/* tokens.css */
:root {
    /* Colors */
    --bg: #040d21;
    --surface: #0a1628;
    --surface-2: #111d33;
    --border: #1a2844;
    --text: #c9d1d9;
    --text-dim: #6e7a8a;
    --text-bright: #f0f6fc;
    --accent: #4f7df5;
    --accent-secondary: #6b9cff;
    --accent-glow: rgba(79, 125, 245, 0.15);

    /* Semantic colors */
    --success: #3fb950;
    --warning: #d29922;
    --error: #f85149;

    /* Typography */
    --font-sans:
        "Inter Variable", "Inter", system-ui, -apple-system, sans-serif;
    --font-mono:
        "JetBrains Mono Variable", "JetBrains Mono", "Fira Code", monospace;

    --text-xs: 0.75rem; /* 12px */
    --text-sm: 0.875rem; /* 14px */
    --text-base: 1rem; /* 16px */
    --text-lg: 1.125rem; /* 18px */
    --text-xl: 1.25rem; /* 20px */
    --text-2xl: 1.5rem; /* 24px */
    --text-3xl: 2rem; /* 32px */
    --text-4xl: 3rem; /* 48px */
    --text-5xl: 4rem; /* 64px */

    /* Spacing */
    --space-1: 0.25rem; /* 4px */
    --space-2: 0.5rem; /* 8px */
    --space-3: 0.75rem; /* 12px */
    --space-4: 1rem; /* 16px */
    --space-5: 1.5rem; /* 24px */
    --space-6: 2rem; /* 32px */
    --space-8: 3rem; /* 48px */
    --space-10: 4rem; /* 64px */
    --space-12: 5rem; /* 80px */
    --space-16: 8rem; /* 128px */

    /* Layout */
    --max-width: 1200px;
    --radius: 8px;
    --radius-pill: 9999px;

    /* Decorative */
    --grid-visible: 0; /* Toggle: 0 = hidden, 1 = visible */

    /* Transitions */
    --transition-fast: 150ms ease;
    --transition-base: 250ms ease;
}
```

### Pattern 2: CSS Module Component Pattern

**What:** Each component has a co-located `.module.css` file. Styles reference tokens, never raw values. Vite's `css.modules.localsConvention: 'camelCaseOnly'` enables clean imports.

**When to use:** Every component with visual styling.

**Example:**

```typescript
// Hero.tsx
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.photo}>
          <img src="/headshot.webp" alt="Jack Labbe" />
        </div>
        <div className={styles.content}>
          <h1 className={styles.name}>Jack Labbe</h1>
          <p className={styles.tagline}>Software / AI Engineer</p>
          <a href="mailto:..." className={styles.contactButton}>
            Contact
          </a>
        </div>
      </div>
    </section>
  );
}
```

```css
/* Hero.module.css */
.hero {
    background: radial-gradient(
        ellipse at 70% 50%,
        var(--accent-glow),
        var(--bg) 70%
    );
    padding: var(--space-12) 0;
}

.container {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 0 var(--space-6);
    display: flex;
    align-items: center;
    gap: var(--space-10);
}

.name {
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: var(--text-5xl);
    color: var(--text-bright);
    line-height: 1.1;
}

.tagline {
    font-family: var(--font-sans);
    font-weight: 300;
    font-size: var(--text-xl);
    color: var(--text);
    margin-top: var(--space-3);
}

.contactButton {
    display: inline-flex;
    align-items: center;
    padding: var(--space-3) var(--space-6);
    background: var(--accent);
    color: var(--bg);
    border-radius: var(--radius-pill);
    font-family: var(--font-sans);
    font-weight: 600;
    font-size: var(--text-base);
    text-decoration: none;
    margin-top: var(--space-5);
    transition: opacity var(--transition-fast);
}

/* Mobile restack */
@media (max-width: 768px) {
    .container {
        flex-direction: column;
        text-align: center;
    }
    .name {
        font-size: var(--text-4xl);
    }
}
```

### Pattern 3: Skeleton Loading with Shimmer

**What:** CSS-only skeleton loading with a gradient sweep shimmer effect. Uses `background-attachment: fixed` for synchronized shimmer across all skeleton elements.

**When to use:** Loading state for all content that depends on R2 data or font loading.

**Example:**

```css
/* animations.css */
@keyframes shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

.skeleton {
    background: linear-gradient(
        100deg,
        var(--surface) 40%,
        var(--surface-2) 50%,
        var(--surface) 60%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border-radius: var(--radius);
}
```

### Pattern 4: Staggered Entrance Animation

**What:** CSS keyframes with animation-delay for sequential reveal. Each element has an incrementing delay via CSS custom property.

**When to use:** Hero section reveal after loading completes.

**Example:**

```css
/* animations.css */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(12px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.staggerItem {
    opacity: 0;
    animation: fadeInUp 400ms ease-out forwards;
    animation-delay: calc(var(--stagger-index, 0) * 100ms);
}

@media (prefers-reduced-motion: reduce) {
    .staggerItem {
        animation: none;
        opacity: 1;
        transform: none;
    }
}
```

```tsx
// Usage in Hero.tsx
<div className={styles.photo} style={{ '--stagger-index': 0 } as React.CSSProperties}>
<h1 className={styles.name} style={{ '--stagger-index': 1 } as React.CSSProperties}>
<p className={styles.tagline} style={{ '--stagger-index': 2 } as React.CSSProperties}>
<a className={styles.contactButton} style={{ '--stagger-index': 3 } as React.CSSProperties}>
```

### Pattern 5: R2 Data Fetching Hook

**What:** Custom hook that fetches all R2 JSON in parallel with a 5-second timeout, tracks loading/loaded/error state.

**When to use:** App-level data loading.

**Example:**

```typescript
// hooks/useR2Data.ts
import type { GraphData, ProjectsFile, PipelineMeta } from "@jacklabbe/shared";

interface R2Data {
    graph: GraphData | null;
    projects: ProjectsFile | null;
    meta: PipelineMeta | null;
}

type R2State =
    | { status: "loading" }
    | { status: "loaded"; data: R2Data }
    | { status: "error"; error: string };

const R2_BASE = import.meta.env.VITE_R2_BASE_URL;
const TIMEOUT_MS = 5_000;

async function fetchWithTimeout(
    url: string,
    timeoutMs: number,
): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res;
    } finally {
        clearTimeout(id);
    }
}

export function useR2Data(): R2State {
    const [state, setState] = useState<R2State>({ status: "loading" });

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const [graphRes, projectsRes, metaRes] = await Promise.all([
                    fetchWithTimeout(`${R2_BASE}/graph.json`, TIMEOUT_MS),
                    fetchWithTimeout(`${R2_BASE}/projects.json`, TIMEOUT_MS),
                    fetchWithTimeout(`${R2_BASE}/meta.json`, TIMEOUT_MS),
                ]);

                const [graph, projects, meta] = await Promise.all([
                    graphRes.json() as Promise<GraphData>,
                    projectsRes.json() as Promise<ProjectsFile>,
                    metaRes.json() as Promise<PipelineMeta>,
                ]);

                if (!cancelled) {
                    setState({
                        status: "loaded",
                        data: { graph, projects, meta },
                    });
                }
            } catch (err) {
                if (!cancelled) {
                    setState({
                        status: "error",
                        error:
                            err instanceof Error
                                ? err.message
                                : "Failed to load data",
                    });
                }
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    return state;
}
```

### Pattern 6: React 19 Native Metadata

**What:** React 19 supports `<title>`, `<meta>`, and `<link>` tags directly in JSX. They are automatically hoisted to `<head>`. No helmet library needed.

**When to use:** OG tags, page title, description.

**Example:**

```tsx
// App.tsx
function App() {
    return (
        <>
            <title>Jack Labbe - Software / AI Engineer</title>
            <meta
                name="description"
                content="Software and AI engineer portfolio..."
            />
            <meta
                property="og:title"
                content="Jack Labbe - Software / AI Engineer"
            />
            <meta
                property="og:description"
                content="Software and AI engineer portfolio..."
            />
            <meta
                property="og:image"
                content="https://jacklabbe.com/og-image.png"
            />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://jacklabbe.com" />
            <meta name="twitter:card" content="summary_large_image" />
            {/* ... rest of app */}
        </>
    );
}
```

**CRITICAL CAVEAT for SPAs:** Social media crawlers (Facebook, Twitter, LinkedIn) do NOT execute JavaScript. React 19's metadata hoisting works for browsers but not for crawlers. For OG tags to work, they MUST also exist as static HTML in `index.html`. Place the essential OG tags in both locations:

1. Static in `index.html` `<head>` for crawlers
2. In React JSX for runtime completeness

### Anti-Patterns to Avoid

- **Hard-coded colors in component CSS:** Always use `var(--token)`. Even if "just this once," hard-coded values drift from the system.
- **Using `!important`:** Design system should have clean specificity. If needed, the architecture is wrong.
- **Importing all font weights individually:** Use `@fontsource-variable/*` for a single file with all weights.
- **Google Fonts CDN link:** Self-host via Fontsource for performance and privacy. No external font requests.
- **Creating a CSS-in-JS solution:** The locked decision is CSS Modules + custom properties. No styled-components, emotion, etc.
- **Using a routing library:** This is a single-scroll page. No router needed.
- **Fetching R2 data per-component:** Fetch once at the app level, pass data down as props.

## Don't Hand-Roll

| Problem                   | Don't Build                                  | Use Instead                                                         | Why                                                                                                                                               |
| ------------------------- | -------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Font hosting/loading      | Custom @font-face declarations               | `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono` | Fontsource handles subsetting, WOFF2 generation, font-display, and provides variable font in single import                                        |
| CSS reset                 | Full custom reset                            | Minimal 20-line reset targeting only what matters                   | Full resets (normalize.css) are overkill for a controlled design system. A few rules suffice: box-sizing, margin/padding reset, img/svg defaults  |
| Icon library for 4 icons  | npm install react-icons or lucide-react      | Inline SVG components (4 small components)                          | Lucide deprecated brand icons. react-icons pulls in entire icon sets. For exactly 4 social icons, inline SVG is smaller and has zero dependencies |
| Document metadata library | react-helmet-async, @dr.pogodin/react-helmet | React 19 native `<title>`, `<meta>`, `<link>` in JSX                | React 19 natively hoists these tags to `<head>`. No library needed. Static fallbacks in `index.html` for crawlers                                 |
| Animation library         | framer-motion, react-spring                  | CSS @keyframes + animation-delay                                    | The only animations are sequential fade-ins and a shimmer effect. CSS handles this in ~20 lines. No need for a 30KB+ animation library            |

**Key insight:** This phase needs minimal dependencies because the locked decisions (CSS Modules, CSS custom properties, no frameworks) align with native browser and React 19 capabilities. The two font packages are the only new dependencies.

## Common Pitfalls

### Pitfall 1: OG Tags Invisible to Social Crawlers

**What goes wrong:** OG preview cards show blank or fallback content when shared on Twitter/LinkedIn/Facebook despite tags being present in React components.
**Why it happens:** Social media crawlers do not execute JavaScript. React 19's metadata hoisting works at runtime in browsers, but crawlers only see the static HTML served by the server.
**How to avoid:** Duplicate essential OG tags as static HTML in `index.html` `<head>`. The React JSX tags are for runtime completeness (and potential future SSR), but `index.html` is the source of truth for crawlers.
**Warning signs:** Facebook Sharing Debugger shows no OG data. Twitter Card Validator shows fallback.

### Pitfall 2: CORS Failure on .pages.dev Subdomain

**What goes wrong:** R2 fetch requests fail with CORS errors when deployed to the `.pages.dev` preview URL.
**Why it happens:** The current `cors.json` only allows `https://jacklabbe.com` and `http://localhost:5173`. The `.pages.dev` subdomain is not in the allowed origins list.
**How to avoid:** Add the `.pages.dev` subdomain to `cors.json` before deploying. Use a wildcard pattern if Cloudflare R2 supports it, or add the exact `https://<project>.pages.dev` origin. Re-apply CORS after updating: `wrangler r2 bucket cors set jacklabbe-data --file cors.json`.
**Warning signs:** `fetch()` errors in console mentioning "CORS policy" or "Access-Control-Allow-Origin".

### Pitfall 3: text-dim Color Failing WCAG AA for Normal Text

**What goes wrong:** Accessibility audit flags insufficient contrast on text using `--text-dim: #6e7a8a`.
**Why it happens:** `#6e7a8a` on `#040d21` achieves 4.44:1 -- just below the 4.5:1 WCAG AA threshold for normal-sized text. On `#0a1628` (surface) it drops to 4.16:1.
**How to avoid:** Only use `--text-dim` for:

- Large text: >=18.66px bold or >=24px regular (AA large text threshold is 3:1)
- Non-essential decorative text (section labels like "// projects" that are supplementary)
- Never for body copy, interactive elements, or essential information at normal text sizes
  **Warning signs:** Lighthouse or axe-core flags contrast issues on dim-colored text.

### Pitfall 4: Button Text Contrast on Accent Background

**What goes wrong:** White text on the `#4F7DF5` accent button only achieves 3.76:1 -- fails WCAG AA for normal text.
**Why it happens:** The accent blue is not dark enough for white text to meet 4.5:1.
**How to avoid:** Use dark text (`--bg: #040d21`) on accent buttons instead of white. This achieves 5.15:1 which passes WCAG AA.
**Warning signs:** Lighthouse contrast check fails on button text.

### Pitfall 5: Font Loading Flash (FOUT)

**What goes wrong:** Text briefly renders in system font, then reflows when Inter/JetBrains Mono loads, causing visible layout shift.
**Why it happens:** `font-display: swap` intentionally shows system font first. Without masking, users see the swap.
**How to avoid:** The locked decision elegantly solves this: skeleton loading state masks font loading. Keep skeletons visible until BOTH fonts are loaded AND R2 data is available. Use `document.fonts.ready` Promise to detect font loading completion.
**Warning signs:** Text visibly reflows/resizes after initial render.

### Pitfall 6: Vite Environment Variable Missing at Runtime

**What goes wrong:** `import.meta.env.VITE_R2_BASE_URL` is `undefined` at runtime.
**Why it happens:** Vite only exposes variables prefixed with `VITE_`. The variable must be set in `.env` (for dev) and `.env.production` (for builds), or passed as environment variables during build.
**How to avoid:** Create `.env` with `VITE_R2_BASE_URL=https://pub-xxx.r2.dev` (dev URL). Create `.env.production` with `VITE_R2_BASE_URL=https://data.jacklabbe.com` (or the actual R2 public URL). Type the variable in `vite-env.d.ts`.
**Warning signs:** Fetch URLs start with `undefined/graph.json`.

### Pitfall 7: Backdrop Filter Not Rendering on Some Browsers

**What goes wrong:** The glass-effect navbar appears as a solid opaque bar on some browsers/configurations.
**Why it happens:** `backdrop-filter: blur()` requires `-webkit-backdrop-filter` for Safari. Some older browsers don't support it at all.
**How to avoid:** Always provide a solid fallback `background-color` that works without blur. Use both `backdrop-filter` and `-webkit-backdrop-filter`. The fallback should be a semi-transparent version of `--bg` (e.g., `rgba(4, 13, 33, 0.85)`).
**Warning signs:** Navbar looks different in Safari vs Chrome.

### Pitfall 8: prefers-reduced-motion Ignored

**What goes wrong:** Vestibular disorder users experience motion sickness from entrance animations and shimmer effects.
**Why it happens:** Developer forgets to add `@media (prefers-reduced-motion: reduce)` overrides.
**How to avoid:** Every animation CSS rule must have a corresponding `prefers-reduced-motion: reduce` media query that disables or reduces the animation. The shimmer and staggered entrance animations must both respect this preference.
**Warning signs:** Animations play even when OS "reduce motion" setting is enabled.

## WCAG AA Contrast Audit (Verified)

All contrast ratios calculated using WCAG 2.0 relative luminance formula:

| Foreground                     | Background              | Ratio   | AA Normal (4.5:1) | AA Large (3:1) |
| ------------------------------ | ----------------------- | ------- | ----------------- | -------------- |
| `--text` (#c9d1d9)             | `--bg` (#040d21)        | 12.54:1 | PASS              | PASS           |
| `--text-dim` (#6e7a8a)         | `--bg` (#040d21)        | 4.44:1  | **FAIL**          | PASS           |
| `--text-bright` (#f0f6fc)      | `--bg` (#040d21)        | 17.79:1 | PASS              | PASS           |
| `--accent` (#4F7DF5)           | `--bg` (#040d21)        | 5.15:1  | PASS              | PASS           |
| `--accent-secondary` (#6B9CFF) | `--bg` (#040d21)        | 7.21:1  | PASS              | PASS           |
| `--text` (#c9d1d9)             | `--surface` (#0a1628)   | 11.75:1 | PASS              | PASS           |
| `--text-dim` (#6e7a8a)         | `--surface` (#0a1628)   | 4.16:1  | **FAIL**          | PASS           |
| `--text-bright` (#f0f6fc)      | `--surface` (#0a1628)   | 16.66:1 | PASS              | PASS           |
| `--text` (#c9d1d9)             | `--surface-2` (#111d33) | 10.91:1 | PASS              | PASS           |
| `--text-dim` (#6e7a8a)         | `--surface-2` (#111d33) | 3.86:1  | **FAIL**          | PASS           |
| `--accent` (#4F7DF5)           | `--surface-2` (#111d33) | 4.48:1  | **FAIL** (barely) | PASS           |
| White (#ffffff)                | `--accent` (#4F7DF5)    | 3.76:1  | **FAIL**          | PASS           |
| `--bg` (#040d21)               | `--accent` (#4F7DF5)    | 5.15:1  | PASS              | PASS           |

**Actionable rules from this audit:**

1. Button text on `--accent` background: Use `--bg` (dark), not white
2. `--text-dim` on any background: Large text only (>=18.66px bold or >=24px regular), or decorative/non-essential text
3. `--accent` on `--surface-2`: Only for large text (4.48:1 is close but fails AA normal)
4. All other token combinations pass WCAG AA for normal text

## Discretion Recommendations

### Photo Shape and Sizing

**Recommendation:** Rounded rectangle with `border-radius: var(--radius)` (8px), not a circle. Circles crop unpredictably on different headshot compositions. Size the photo at approximately 280-320px in the hero split, constrained by `max-width: 50%` of the container. Use `object-fit: cover` with a fixed aspect ratio (e.g., 4:5 portrait).

### Navbar Bottom Border

**Recommendation:** A 1px border using `border-bottom: 1px solid var(--border)`. This provides subtle visual separation consistent with the Linear.app aesthetic without being heavy. The border only appears when the navbar is "stuck" (i.e., user has scrolled), to avoid a visible line at the top of the page.

### Link/Interactive Text Color

**Recommendation:** Use `--accent-secondary: #6B9CFF` for links and interactive text. It achieves 7.21:1 contrast on `--bg`, which comfortably passes WCAG AA, and is lighter than the primary accent, making it stand out as clickable. This follows the convention of links being slightly lighter/brighter than surrounding text.

### Semantic Accent Colors

**Recommendation:**

- `--success: #3fb950` (GitHub-style green, 5.08:1 on --bg)
- `--warning: #d29922` (amber, 7.00:1 on --bg)
- `--error: #f85149` (GitHub-style red, 5.72:1 on --bg)
  These won't be heavily used in Phase 2 but should be defined in tokens for Phase 3.

### Divider Line Style

**Recommendation:** Gradient fade -- a 1px line that fades from transparent at the edges to `var(--border)` in the center. This matches the Linear.app aesthetic (subtle, not harsh). Implementation: `background: linear-gradient(to right, transparent, var(--border), transparent); height: 1px;` within the max-width container.

### Crosshatch Grid Scope

**Recommendation:** Apply to the entire page body, not just the hero. At 3-5% opacity it provides subtle texture without competing with content. Control via `--grid-visible` CSS variable. Implementation: A subtle SVG crosshatch pattern as `background-image` on `body`, with `opacity: var(--grid-visible)` on a `::before` pseudo-element.

### Footer Icon Style

**Recommendation:** Outline/stroke style icons (not filled) at 20px. This matches the Linear.app minimal aesthetic -- filled icons feel heavier and more "app-like." The outline style is also consistent with the 1px structural line language of the design system.

### Error State Design

**Recommendation:** A centered, minimal error card with: icon (a simple warning triangle or circle-x), error message in `--text`, a "Retry" button styled like the contact button but with `--error` background, and a "Data unavailable" subtitle in `--text-dim`. No page-level error -- the hero and layout still render, only the data-dependent content shows the error state.

### Data Caching Strategy

**Recommendation:** Cache-first with `stale-while-revalidate` semantics. On load, check `sessionStorage` for cached R2 data. If present and less than 1 hour old, render immediately (no skeleton) while refetching in the background. If absent or stale, show skeleton and fetch. R2 already sets `Cache-Control: public, max-age=3600` (from Phase 1 r2.ts), so browser HTTP cache also helps. This is lightweight (no service worker needed) and improves repeat visits.

### OG Image Method

**Recommendation:** Static PNG file committed to `public/og-image.png`. For a portfolio site with fixed content (name, tagline), there's no dynamic data to generate. Design it to match the site: dark navy background (#040d21), "Jack Labbe" in Inter Bold, "Software / AI Engineer" below, accent blue accent elements, 1200x630px. Create once in a design tool (Figma, or even a simple HTML-to-PNG script during development).

### Skip-to-Content Link Target

**Recommendation:** Target the `<main>` element containing the hero section. Use `id="main-content"` on the `<main>` tag. The skip link should be the first focusable element in the DOM, visually hidden until focused.

### Exact Spacing and Typography Scale

**Recommendation:** Use the scale defined in the tokens pattern above. It follows a standard 4px base grid (common in design systems like GitHub Primer and Linear). Typography scale uses a modular progression. The hero name should be `--text-5xl` (4rem/64px) on desktop, `--text-4xl` (3rem/48px) on mobile.

## Code Examples

### Vite Configuration for CSS Modules

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    css: {
        modules: {
            localsConvention: "camelCaseOnly",
        },
    },
});
```

### Font Loading with Fontsource

```typescript
// fonts.css (imported in main.tsx)
@import '@fontsource-variable/inter';
@import '@fontsource-variable/jetbrains-mono';
```

```typescript
// main.tsx
import './styles/reset.css';
import './styles/tokens.css';
import './styles/fonts.css';
import './styles/global.css';
import './styles/animations.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

### Minimal CSS Reset

```css
/* reset.css */
*,
*::before,
*::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
}

body {
    font-family: var(--font-sans);
    font-size: var(--text-base);
    color: var(--text);
    background-color: var(--bg);
    line-height: 1.6;
    min-height: 100vh;
}

img,
svg {
    display: block;
    max-width: 100%;
}

a {
    color: inherit;
    text-decoration: none;
}

button {
    font: inherit;
    color: inherit;
    background: none;
    border: none;
    cursor: pointer;
}
```

### Crosshatch Grid Pattern

```css
/* global.css -- crosshatch grid overlay */
body::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    opacity: calc(var(--grid-visible) * 0.04);
    background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 40L40 0M-10 10L10 -10M30 50L50 30' stroke='%23c9d1d9' stroke-width='0.5'/%3E%3C/svg%3E");
    background-size: 40px 40px;
    transition: opacity var(--transition-base);
}
```

### Sticky Navbar with Glass Effect

```css
/* Navbar.module.css */
.navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(4, 13, 33, 0.8);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid transparent;
    transition: border-color var(--transition-base);
    padding: var(--space-4) 0;
}

.navbar[data-scrolled="true"] {
    border-bottom-color: var(--border);
}

.inner {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 0 var(--space-6);
    display: flex;
    justify-content: flex-end;
    align-items: center;
}
```

### Skip-to-Content Pattern

```tsx
// SkipToContent.tsx
import styles from "./SkipToContent.module.css";

export function SkipToContent() {
    return (
        <a href="#main-content" className={styles.skipLink}>
            Skip to content
        </a>
    );
}
```

```css
/* SkipToContent.module.css */
.skipLink {
    position: absolute;
    top: -100%;
    left: var(--space-4);
    z-index: 999;
    padding: var(--space-3) var(--space-5);
    background: var(--accent);
    color: var(--bg);
    border-radius: var(--radius);
    font-weight: 600;
    transition: top var(--transition-fast);
}

.skipLink:focus {
    top: var(--space-4);
}
```

### Font Load Detection

```typescript
// Hook to detect when fonts are loaded
export function useFontsReady(): boolean {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        document.fonts.ready.then(() => setReady(true));
    }, []);

    return ready;
}
```

### Social Icon SVG Components

```tsx
// icons/SocialIcons.tsx
// Simple inline SVG components -- no icon library dependency

interface IconProps {
    size?: number;
    className?: string;
}

export function GitHubIcon({ size = 20, className }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
        </svg>
    );
}

export function LinkedInIcon({ size = 20, className }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
            <rect x="2" y="9" width="4" height="12" />
            <circle cx="4" cy="4" r="2" />
        </svg>
    );
}

export function MailIcon({ size = 20, className }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    );
}

export function XIcon({ size = 20, className }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
            <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
        </svg>
    );
}
```

### index.html with Static OG Tags

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Jack Labbe - Software / AI Engineer</title>
        <meta
            name="description"
            content="Software and AI engineer. View my live commit activity, projects, and contributions."
        />

        <!-- Open Graph -->
        <meta
            property="og:title"
            content="Jack Labbe - Software / AI Engineer"
        />
        <meta
            property="og:description"
            content="Software and AI engineer. View my live commit activity, projects, and contributions."
        />
        <meta
            property="og:image"
            content="https://jacklabbe.com/og-image.png"
        />
        <meta property="og:url" content="https://jacklabbe.com" />
        <meta property="og:type" content="website" />

        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta
            name="twitter:title"
            content="Jack Labbe - Software / AI Engineer"
        />
        <meta
            name="twitter:description"
            content="Software and AI engineer. View my live commit activity, projects, and contributions."
        />
        <meta
            name="twitter:image"
            content="https://jacklabbe.com/og-image.png"
        />

        <!-- Favicon -->
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

        <!-- Preload critical fonts -->
        <link
            rel="preload"
            href="/fonts/inter-variable.woff2"
            as="font"
            type="font/woff2"
            crossorigin
        />
    </head>
    <body>
        <div id="root"></div>
        <script type="module" src="/src/main.tsx"></script>
    </body>
</html>
```

**Note on font preload:** The exact font file paths depend on where Fontsource bundles them after Vite build. The preload hint may need adjustment after verifying the actual output paths in `dist/assets/`.

## Cloudflare Pages Deployment

### Deployment Configuration

Phase 2 deploys the site as a static SPA to Cloudflare Pages via direct upload. No server-side code runs on Pages -- R2 data is fetched client-side.

**Deployment command:**

```bash
cd site && pnpm build && npx wrangler pages deploy dist --project-name=jacklabbe
```

**SPA routing (if using wrangler.toml for Pages):**

The site is a single-scroll page with no client-side routing, so SPA not_found_handling is optional but harmless. If deploying via `wrangler pages deploy`, no `wrangler.toml` is needed for the site package -- the CLI handles it.

**Important:** The site's `wrangler.toml` (if created) is separate from the worker's `wrangler.toml`. They are different Cloudflare projects.

### CORS Update Required

Before deploying, update `cors.json` to include the `.pages.dev` origin:

```json
{
    "rules": [
        {
            "allowed": {
                "origins": [
                    "https://jacklabbe.com",
                    "https://jacklabbe.pages.dev",
                    "http://localhost:5173"
                ],
                "methods": ["GET", "HEAD"],
                "headers": ["content-type"]
            },
            "maxAgeSeconds": 86400
        }
    ]
}
```

Then re-apply: `wrangler r2 bucket cors set jacklabbe-data --file cors.json`

### Environment Variables

```bash
# .env (development)
VITE_R2_BASE_URL=https://pub-XXXXXXXX.r2.dev  # or the r2.dev public URL

# .env.production (production build)
VITE_R2_BASE_URL=https://data.jacklabbe.com    # custom domain for R2
```

Type declaration in `vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_R2_BASE_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
```

## State of the Art

| Old Approach                               | Current Approach                                         | When Changed         | Impact                                                                                        |
| ------------------------------------------ | -------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| react-helmet-async for `<head>` management | React 19 native `<title>`, `<meta>`, `<link>` in JSX     | React 19 (Dec 2024)  | No library needed for simple metadata. Still need static `index.html` fallback for crawlers   |
| Google Fonts CDN `<link>` tag              | Self-hosted via @fontsource-variable                     | 2023+ industry trend | Better performance (no third-party DNS/connection), privacy (no Google tracking), reliability |
| normalize.css / reset.css                  | Minimal targeted reset (~20 lines)                       | 2023+                | Modern browsers need fewer resets. Tailwind/Primer approach                                   |
| Styled-components / CSS-in-JS              | CSS Modules + CSS custom properties                      | 2024+ trend reversal | Zero-runtime CSS, better performance, native browser features                                 |
| Framer Motion for all animations           | CSS @keyframes for simple animations, Framer for complex | Ongoing              | CSS animations are zero-bundle-cost and sufficient for entrance/shimmer                       |

**Deprecated/outdated:**

- `react-helmet`: Unmaintained since 2020. `react-helmet-async` fork exists but unnecessary with React 19
- Google Fonts CDN: Self-hosting is the modern standard for performance-conscious sites
- `backdrop-filter` without `-webkit-` prefix: Safari still requires the prefix as of 2025

## Open Questions

1. **R2 Public URL**
    - What we know: The bucket is `jacklabbe-data`. CORS is configured. The architecture doc planned `data.jacklabbe.com` as custom domain.
    - What's unclear: Whether the custom domain has actually been configured in Cloudflare dashboard, or if we should use the r2.dev public development URL. Need to verify which URL works.
    - Recommendation: Check if `data.jacklabbe.com` resolves. If not, use the r2.dev public URL for development and configure the custom domain as part of this phase's deployment tasks. Set the URL via `VITE_R2_BASE_URL` environment variable so it can be changed without code changes.

2. **Headshot Photo Asset**
    - What we know: The hero needs a professional headshot photo.
    - What's unclear: Whether the user has a photo file ready, what format/size it is.
    - Recommendation: Use WebP format for the photo (best compression for photographic content). Provide a placeholder during development. The photo should be placed in `site/public/headshot.webp`.

3. **Cloudflare Pages Project Name**
    - What we know: Deployment is via `wrangler pages deploy`.
    - What's unclear: Whether a Pages project already exists in the Cloudflare dashboard.
    - Recommendation: Create the project during the first deployment: `wrangler pages project create jacklabbe`. The CLI will prompt for setup. Subsequent deploys use `wrangler pages deploy dist --project-name=jacklabbe`.

## Sources

### Primary (HIGH confidence)

- React 19 release blog (react.dev) - Native document metadata support, verified code examples
- Vite 7.3.1 official docs (vite.dev) - CSS Modules built-in support, localsConvention config, environment variables
- Fontsource (fontsource.org) - Inter and JetBrains Mono variable font installation, npm packages
- Cloudflare R2 public buckets docs (developers.cloudflare.com) - Public URL format, custom domain setup
- Cloudflare Pages direct upload docs (developers.cloudflare.com) - `wrangler pages deploy` usage
- WCAG 2.0 contrast requirements (w3.org) - 4.5:1 AA normal, 3:1 AA large text thresholds

### Secondary (MEDIUM confidence)

- CSS-Tricks staggered animation article - CSS animation-delay patterns, verified by MDN
- Fontsource npm weekly downloads (npmjs.com) - 221K+ for Inter variable, confirms community standard
- Lucide GitHub issue #2792 - Brand icon deprecation confirmed, motivates inline SVG approach
- Cloudflare Workers SPA routing docs - `not_found_handling: "single-page-application"` config

### Tertiary (LOW confidence)

- Font preload path in Vite output - Exact paths in `dist/assets/` depend on Vite build hashing. Verify after first build.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Versions verified from installed packages, APIs verified from official docs
- Architecture: HIGH - Patterns verified from Vite docs, React 19 docs, and established CSS Module practices
- Pitfalls: HIGH - Contrast ratios calculated programmatically, CORS issue verified from existing config, OG crawler limitation well-documented
- Discretion recommendations: MEDIUM - Based on research of Linear.app/Stripe.com aesthetic and accessibility best practices, but subjective design choices

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (30 days -- stable domain, no fast-moving dependencies)
