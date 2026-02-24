---
phase: 02-site-shell-design-system-and-hero
verified: 2026-02-20T21:15:00Z
status: human_needed
score: 25/25 must-haves verified
re_verification:
    previous_status: human_needed
    previous_score: 19/19
    gaps_closed:
        - "Tailwind CSS v4 migration (Plans 04 and 05 executed since previous verification)"
        - "LQIP blur-in photo loading replacing skeleton shimmer for photo area"
        - "Build-time LQIP generation via sharp from actual headshot.webp"
        - "3D tilt hover effect on hero photo"
        - "rounded-2xl photo shape (user-approved replacement for squircle per visual verification)"
    gaps_remaining: []
    regressions: []
human_verification:
    - test: "Visit the deployed site at https://jacklabbe.pages.dev and visually inspect the hero section"
      expected: "Photo on left with rounded-2xl corners and 3D tilt hover effect, 'Jack Labbe' in large bold Inter font, 'Software / AI Engineer' tagline, blue 'Contact' pill button. Dark navy background #040d21 with subtle radial gradient accent glow in the hero area."
      why_human: "Visual appearance and polish cannot be verified programmatically. Photo asset (headshot.webp) must be present in public/ for full LQIP effect."
    - test: "Observe the LQIP loading sequence on first visit (clear sessionStorage first)"
      expected: "A blurred version of the photo (20x20px placeholder generated from actual headshot) fades smoothly into the full-resolution image. No skeleton shimmer rectangle for the photo area. Text/button areas still show skeleton shimmers while loading."
      why_human: "LQIP blur-to-sharp transition timing and smoothness are runtime behaviors requiring visual observation."
    - test: "Hover over the hero photo"
      expected: "Photo tracks mouse position with a 3D perspective tilt effect (up to +/-17deg on X and Y axes), scales up to 1.05x. On mouse leave, returns to flat. Grayscale filter applies on hover."
      why_human: "3D tilt hover interaction requires mouse-tracking in a browser."
    - test: "Scroll down on the deployed page"
      expected: "Navbar sticks to top with glass blur effect. A 1px bottom border appears on the navbar once the page is scrolled past the top (driven by IntersectionObserver + CSS rule nav[data-scrolled='true'])."
      why_human: "IntersectionObserver-driven scroll detection and backdrop-filter blur quality require browser observation."
    - test: "Resize the browser to mobile width (~375px)"
      expected: "Hero photo restacks above the text content (column layout). Photo max-width reduces. rounded-2xl shape still applies."
      why_human: "Responsive layout behavior requires visual inspection at target breakpoint."
    - test: "Tab through the page with keyboard only"
      expected: "First Tab press reveals the skip-to-content link at top-left. Second Tab reaches the Navbar contact button. Skip link navigates focus to #main-content when activated."
      why_human: "Keyboard navigation flow and focus ring visibility require interactive testing."
    - test: "Check browser DevTools Network tab for R2 data fetch"
      expected: "Three fetch requests to the R2 base URL: graph.json, projects.json, meta.json. Requests may fail (CORS or 404) if R2 bucket has no data yet -- that is acceptable. Hero renders regardless."
      why_human: "Network request behavior and CORS headers require browser DevTools inspection."
    - test: "Paste https://jacklabbe.pages.dev into a social sharing preview tool (e.g., https://www.opengraph.xyz)"
      expected: "Preview card shows title 'Jack Labbe - Software / AI Engineer', description text, and the og-image (currently a placeholder PNG)."
      why_human: "OG tag rendering by social crawlers requires external tool or actual social share test."
---

# Phase 02: Site Shell -- Design System and Hero Verification Report

**Phase Goal:** Visitors see a polished dark-themed hero page that loads commit metadata from R2, with the full design system and page layout skeleton ready for visualizations
**Verified:** 2026-02-20T21:15:00Z
**Status:** human_needed (all 25 automated checks pass; 8 items require browser verification)
**Re-verification:** Yes -- Plans 04 and 05 executed since previous verification (2026-02-20T20:00:00Z)

---

## Summary of Changes Since Previous Verification

Two additional plans executed after the initial verification:

**Plan 04 (Tailwind CSS v4 migration):** Full architectural migration from CSS Modules to Tailwind CSS v4. All 8 `.module.css` files deleted. 5 individual CSS source files (tokens.css, reset.css, fonts.css, global.css, animations.css) consolidated into a single `main.css` with `@import "tailwindcss"`, `@theme` design tokens, and `@layer base/components`. All components converted to inline Tailwind utility classes. Build confirmed passing.

**Plan 05 (LQIP and visual polish):** Hero photo loading replaced from skeleton shimmer to LQIP (Low Quality Image Placeholder) blur-in. Build-time LQIP generation via `sharp` from the actual `headshot.webp`. 3D tilt hover effect added. Photo shape changed from proposed squircle (SVG clip-path) to `rounded-2xl` per user-approved decision during visual verification checkpoint.

---

## Goal Achievement

### Observable Truths

Truths 1-19 carry over from the initial verification (all previously VERIFIED). Truths 20-25 cover Plans 04 and 05.

| #   | Truth                                                                                                        | Status   | Evidence                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | All design tokens (colors, spacing, typography) are defined in a single CSS entry point                      | VERIFIED | `main.css` has `@theme` block with 13 color tokens, 2 font stacks, 2 animation tokens                                                                   |
| 2   | Inter and JetBrains Mono variable fonts are self-hosted via Fontsource and available throughout the site     | VERIFIED | `main.css` imports `@fontsource-variable/inter` and `@fontsource-variable/jetbrains-mono`; WOFF2 assets in build output                                 |
| 3   | The R2 data fetching hook loads graph.json, projects.json, and meta.json in parallel with 5s timeout         | VERIFIED | `useR2Data.ts` uses `Promise.all` with `fetchWithTimeout(url, 5_000)` and `AbortController`                                                             |
| 4   | The crosshatch grid pattern is rendered at low opacity and toggleable via --grid-visible CSS variable        | VERIFIED | `main.css` `@layer base` `body::before` with `opacity: calc(var(--grid-visible, 0) * 0.04)`                                                             |
| 5   | CSS architecture: no CSS Modules, Tailwind v4 via @tailwindcss/vite                                          | VERIFIED | `vite.config.ts` has `tailwindcss()` plugin, no CSS modules config; zero .module.css files found                                                        |
| 6   | Hero section displays photo (left), name, tagline, and contact button with staggered entrance animation      | VERIFIED | `Hero.tsx` renders split layout; `stagger-item` global class with `--stagger-index` 0-3 on 4 elements                                                   |
| 7   | Hero has radial gradient background and responsive mobile restack at 768px                                   | VERIFIED | `Hero.tsx` `bg-[radial-gradient(ellipse_at_70%_50%,...)]`; `max-md:flex-col max-md:text-center` classes                                                 |
| 8   | Navbar is sticky with glass/backdrop-blur effect and scroll-aware border                                     | VERIFIED | `Navbar.tsx` `backdrop-blur-[12px]`, `border-b border-transparent`; `main.css` `nav[data-scrolled="true"]` CSS rule                                     |
| 9   | Skip-to-content link is visually hidden until focused and targets #main-content                              | VERIFIED | `SkipToContent.tsx` `href="#main-content"`, `absolute -top-full`, `focus:top-4`                                                                         |
| 10  | HeroSkeleton renders placeholders matching real hero layout                                                  | VERIFIED | `HeroSkeleton.tsx`: LQIP blur placeholder for photo area, 3 skeleton shimmers (name, tagline, button)                                                   |
| 11  | Page has single-scroll layout: hero -> commit graph placeholder -> divider -> projects placeholder -> footer | VERIFIED | `App.tsx` renders full composition in correct order                                                                                                     |
| 12  | Footer displays copyright and 4 social icon links                                                            | VERIFIED | `Footer.tsx` copyright plus 4 social links using GitHubIcon, LinkedInIcon, MailIcon, XIcon                                                              |
| 13  | Monospace section labels appear at placeholder sections                                                      | VERIFIED | `SectionPlaceholder.tsx` `font-mono text-text-dim text-sm tracking-wider`                                                                               |
| 14  | 1px structural gradient-fade divider lines separate sections                                                 | VERIFIED | `Divider.tsx` `h-px bg-[linear-gradient(to_right,transparent,var(--color-border),transparent)]`                                                         |
| 15  | Open Graph meta tags present for social sharing                                                              | VERIFIED | `index.html` has og:title, og:description, og:image, og:url, og:type, all Twitter Card tags                                                             |
| 16  | Loading orchestration: skeleton until fonts + R2 data ready, then staggered reveal                           | VERIFIED | `App.tsx` `isReady = fontsReady && (r2State.status === 'loaded' \|\| r2State.status === 'error')`, passes `isLoading={!isReady}` to Hero                |
| 17  | prefers-reduced-motion respected in all animations                                                           | VERIFIED | `main.css` `@media (prefers-reduced-motion: reduce)` disables `.skeleton`, `.stagger-item`, and `.lqip-full` transitions                                |
| 18  | CORS config updated for .pages.dev origin                                                                    | VERIFIED | `cors.json` contains `https://jacklabbe.pages.dev` (commit `444e62b`)                                                                                   |
| 19  | Site deployed to Cloudflare Pages                                                                            | VERIFIED | SUMMARY.md documents deployment; CORS update confirms deployment occurred                                                                               |
| 20  | All components use Tailwind utility classes instead of CSS Modules                                           | VERIFIED | `find site/src -name "*.module.css"` returns zero results; `grep -r "from.*module\.css" site/src/` returns zero results                                 |
| 21  | Single CSS entry point (main.css) with @import "tailwindcss" and @theme design tokens                        | VERIFIED | `main.css` line 6: `@import "tailwindcss"`; lines 9-32: `@theme` block with all color/font/animation tokens                                             |
| 22  | Hero photo loading uses LQIP blur-in pattern, not skeleton shimmer                                           | VERIFIED | `Hero.tsx` imports `LQIP_DATA_URI` from `../../generated/lqip`; renders `lqip-placeholder` + `lqip-full` with `imageLoaded` state and `onLoad` handler  |
| 23  | LQIP generation is build-time from actual headshot.webp (not hardcoded placeholder)                          | VERIFIED | `scripts/generate-lqip.mjs` uses `sharp` to resize headshot to 20x20px WebP; `package.json` build script runs LQIP generation before tsc and vite build |
| 24  | HeroSkeleton photo area shows LQIP blur placeholder (not skeleton shimmer rectangle)                         | VERIFIED | `HeroSkeleton.tsx` renders `lqip-container` with `lqip-placeholder` img; text/button areas retain `.skeleton` class                                     |
| 25  | prefers-reduced-motion disables LQIP fade transition                                                         | VERIFIED | `main.css` lines 172-174: `@media (prefers-reduced-motion: reduce) { .lqip-full { opacity: 1; transition: none; } }`                                    |

**Score:** 25/25 truths verified (automated)

**Design decision note:** Plan 05's must_have truth stated "The hero photo has a pronounced squircle (superellipse) shape." The actual implementation uses `rounded-2xl` instead. This deviation is user-approved and documented in `02-05-SUMMARY.md` key-decisions: "Replaced squircle (superellipse clip-path) with rounded-2xl per user feedback during visual verification." This is not a gap -- it is a user-directed design refinement confirmed at a human verification checkpoint.

---

## Required Artifacts

| Artifact                                                        | Expected                                                          | Status   | Details                                                                                                                                                                   |
| --------------------------------------------------------------- | ----------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `site/src/styles/main.css`                                      | Single Tailwind CSS entry with @theme tokens, @layer base/comp    | VERIFIED | 177 lines; @import tailwindcss, @theme block, @layer base (reset, body, grid), @layer components (skeleton, stagger-item, nav scroll, LQIP classes), reduced-motion block |
| `site/vite.config.ts`                                           | Vite config with @tailwindcss/vite plugin, no CSS modules config  | VERIFIED | 7 lines; `import tailwindcss from '@tailwindcss/vite'`; `plugins: [tailwindcss(), react()]`; no `css.modules` property                                                    |
| `site/src/main.tsx`                                             | Single CSS import (main.css only)                                 | VERIFIED | Line 1: `import './styles/main.css'` -- only CSS import, no legacy individual file imports                                                                                |
| `site/src/App.tsx`                                              | Root component composing all sections                             | VERIFIED | 63 lines; full composition, loading orchestration, OG tags, no CSS module import                                                                                          |
| `site/src/components/Hero/Hero.tsx`                             | Hero component using Tailwind classes, LQIP, 3D tilt              | VERIFIED | 85 lines; LQIP_DATA_URI import, imageLoaded state, lqip-container/placeholder/full classes, mouseMove 3D tilt, stagger-item animation                                     |
| `site/src/components/Hero/HeroSkeleton.tsx`                     | Skeleton with LQIP photo placeholder, skeleton for text/button    | VERIFIED | 25 lines; LQIP_DATA_URI import, lqip-placeholder for photo, .skeleton for name/tagline/button areas                                                                       |
| `site/src/components/Navbar/Navbar.tsx`                         | Sticky navbar with contact button and IntersectionObserver scroll | VERIFIED | 53 lines; backdrop-blur-[12px], data-scrolled attribute, IntersectionObserver sentinel pattern                                                                            |
| `site/src/components/Footer/Footer.tsx`                         | Footer with copyright and social icon links                       | VERIFIED | 32 lines; 4 social links with aria-label attributes                                                                                                                       |
| `site/src/components/SectionPlaceholder/SectionPlaceholder.tsx` | Placeholder sections with mono font labels                        | VERIFIED | 13 lines; font-mono text-text-dim                                                                                                                                         |
| `site/src/components/Divider/Divider.tsx`                       | 1px gradient-fade divider                                         | VERIFIED | 7 lines; role="separator" aria-hidden="true", gradient line                                                                                                               |
| `site/src/components/SkipToContent/SkipToContent.tsx`           | Accessible skip-to-content link                                   | VERIFIED | 10 lines; href="#main-content", -top-full until focus:top-4                                                                                                               |
| `site/src/components/icons/SocialIcons.tsx`                     | Inline SVG social icon components                                 | VERIFIED | 4 icons (GitHub, LinkedIn, Mail, X) with aria-hidden="true"                                                                                                               |
| `site/src/hooks/useR2Data.ts`                                   | R2 data fetching with parallel fetch and timeout                  | VERIFIED | 109 lines; Promise.all, 5s AbortController timeout, sessionStorage caching                                                                                                |
| `site/src/hooks/useFontsReady.ts`                               | Font loading detection                                            | VERIFIED | 11 lines; document.fonts.ready.then()                                                                                                                                     |
| `site/src/generated/lqip.ts`                                    | Build-time generated LQIP data URI                                | VERIFIED | 3 lines; exports `LQIP_DATA_URI` as base64 WebP data URI; auto-generated by scripts/generate-lqip.mjs at build                                                            |
| `site/scripts/generate-lqip.mjs`                                | Build-time LQIP generation script using sharp                     | VERIFIED | Resizes headshot.webp to 20x20px WebP quality 20; writes to src/generated/lqip.ts; graceful fallback if headshot missing                                                  |
| `site/index.html`                                               | Static OG meta tags                                               | VERIFIED | 29 lines; og:title, og:description, og:image, og:url, og:type, all Twitter Card tags                                                                                      |

---

## Key Link Verification

| From                                 | To                                | Via                                                | Status | Details                                                                                                   |
| ------------------------------------ | --------------------------------- | -------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| `site/src/main.tsx`                  | `site/src/styles/main.css`        | Single CSS import                                  | WIRED  | Line 1: `import './styles/main.css'` -- only CSS import present                                           |
| `site/src/styles/main.css`           | `tailwindcss`                     | @import directive                                  | WIRED  | Line 6: `@import "tailwindcss"`                                                                           |
| `site/vite.config.ts`                | `@tailwindcss/vite`               | Vite plugin registration                           | WIRED  | Line 2: `import tailwindcss from '@tailwindcss/vite'`; Line 6: `tailwindcss()` in plugins                 |
| `site/src/App.tsx`                   | `useR2Data.ts`                    | Hook call with result consumed                     | WIRED  | Import line 7; `const r2State = useR2Data()` with status checked in `isReady`                             |
| `site/src/App.tsx`                   | `useFontsReady.ts`                | Hook call with result consumed                     | WIRED  | Import line 8; `const fontsReady = useFontsReady()` with result in `isReady`                              |
| `site/src/App.tsx`                   | `Hero.tsx`                        | Component composition with meaningful prop         | WIRED  | `<Hero isLoading={!isReady} />` -- isLoading computed from both hooks                                     |
| `Hero.tsx`                           | `generated/lqip.ts`               | LQIP_DATA_URI import used in both img elements     | WIRED  | Line 2: `import { LQIP_DATA_URI } from "../../generated/lqip"`; used at lines 48 and 53                   |
| `HeroSkeleton.tsx`                   | `generated/lqip.ts`               | LQIP_DATA_URI import used in photo placeholder img | WIRED  | Line 1: `import { LQIP_DATA_URI } from '../../generated/lqip'`; used at line 10                           |
| `Hero.tsx`                           | `main.css` LQIP classes           | Global CSS classes applied to DOM elements         | WIRED  | `lqip-container`, `lqip-placeholder`, `lqip-full`, `lqip-full.loaded` applied via className               |
| `package.json` build script          | `scripts/generate-lqip.mjs`       | Prebuild step in build command                     | WIRED  | `"build": "node scripts/generate-lqip.mjs && tsc -b && vite build"`                                       |
| `scripts/generate-lqip.mjs`          | `site/public/headshot.webp`       | sharp reads headshot to generate LQIP              | WIRED  | Script reads HEADSHOT path, writes LQIP_DATA_URI to `src/generated/lqip.ts`; graceful fallback if missing |
| `main.css nav[data-scrolled="true"]` | `Navbar.tsx` IntersectionObserver | Data attribute state drives CSS rule               | WIRED  | CSS rule in @layer components; Navbar.tsx sets attribute via observer callback                            |
| `site/src/hooks/useR2Data.ts`        | `@jacklabbe/shared`               | Type imports for R2 data shapes                    | WIRED  | Line 2: `import type { GraphData, ProjectsFile, PipelineMeta } from '@jacklabbe/shared'`                  |
| `site/src/hooks/useR2Data.ts`        | `VITE_R2_BASE_URL`                | Runtime env variable for R2 endpoint               | WIRED  | Line 15: `const R2_BASE = import.meta.env.VITE_R2_BASE_URL` used in all 3 fetch calls                     |

---

## Requirements Coverage

| Requirement | Source Plan  | Description                                                           | Status    | Evidence                                                                                                        |
| ----------- | ------------ | --------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------- |
| INFR-03     | 02-03        | Deployed to Cloudflare Pages                                          | SATISFIED | Deployment documented in SUMMARY.md; CORS update commit `444e62b` confirms live deployment                      |
| INFR-05     | 02-01        | Site fetches R2 JSON on visit (not full SSG)                          | SATISFIED | `useR2Data.ts` runtime fetches via `Promise.all(fetchWithTimeout(...))` in useEffect                            |
| HERO-01     | 02-02, 02-05 | Hero section displays photo, name, tagline                            | SATISFIED | `Hero.tsx` renders LQIP-backed photo, `<h1>Jack Labbe</h1>`, `<p>Software / AI Engineer</p>`                    |
| HERO-02     | 02-02, 02-05 | Contact button in hero section (mailto link, no contact form)         | SATISFIED | `<a href="mailto:jack.labbe@icloud.com.com">Contact</a>` in Hero.tsx                                                |
| HERO-03     | 02-02        | Minimal navbar with only a contact button                             | SATISFIED | `Navbar.tsx` renders single `<a href="mailto:...">Contact</a>` link only, no other content                      |
| HERO-04     | 02-02, 02-05 | Spacious hero layout with generous whitespace                         | SATISFIED | `Hero.tsx` `py-20` (5rem top/bottom); `max-w-[1200px] mx-auto px-8` container                                   |
| DSGN-01     | 02-01, 02-04 | Dark theme with `#040d21` navy background                             | SATISFIED | `main.css` `@theme` `--color-bg: #040d21`; `@layer base` body `background-color: var(--color-bg)`               |
| DSGN-02     | 02-01, 02-04 | Inter/system sans-serif for headings (bold weight)                    | SATISFIED | `main.css` `--font-sans: 'Inter Variable', ...`; Hero `font-sans font-bold text-[4rem]`                         |
| DSGN-03     | 02-01, 02-04 | Monospace font for accent text (tagline, section labels)              | SATISFIED | `main.css` `--font-mono: 'JetBrains Mono Variable', ...`; SectionPlaceholder `font-mono`                        |
| DSGN-04     | 02-02, 02-04 | Decorative structural 1px divider lines between sections              | SATISFIED | `Divider.tsx` `h-px bg-[linear-gradient(to_right,transparent,var(--color-border),transparent)]`                 |
| DSGN-05     | 02-02, 02-04 | Monospace section labels (// projects, // commit graph)               | SATISFIED | `SectionPlaceholder` renders "// commit graph" and "// projects" in `font-mono`                                 |
| DSGN-06     | 02-01, 02-04 | Toggleable crosshatch grid pattern background (low opacity)           | SATISFIED | `main.css` `@layer base` `body::before` with `--grid-visible` toggle; default 0                                 |
| DSGN-08     | 02-03, 02-04 | Single-scroll page layout                                             | SATISFIED | `App.tsx`: hero -> divider -> commit graph placeholder -> divider -> projects -> footer                         |
| DSGN-09     | 02-01, 02-04 | Responsive layout, mobile-first, works on all viewports               | SATISFIED | Hero `max-md:flex-col max-md:text-center max-md:max-w-[200px]`; HeroSkeleton same                               |
| DSGN-10     | 02-01, 02-04 | WCAG AA contrast ratios on all text                                   | SATISFIED | @theme documents color semantics; accent button uses `text-bg` (dark text on blue, satisfactory contrast)       |
| DSGN-11     | 02-01, 02-04 | Tailwind CSS v4 with @theme design tokens (migrated from CSS Modules) | SATISFIED | Full Tailwind v4 migration confirmed; zero .module.css files; all tokens in @theme                              |
| META-01     | 02-03        | Open Graph tags for social sharing preview                            | SATISFIED | `index.html` and `App.tsx` both have og:title, og:description, og:image, og:url, og:type                        |
| META-02     | 02-02        | Semantic HTML structure (nav, main, section, footer elements)         | SATISFIED | `<nav>` (Navbar), `<main id="main-content">` (App), `<section>` (Hero, SectionPlaceholder), `<footer>` (Footer) |
| META-03     | 02-02        | Keyboard navigable, skip-to-content link                              | SATISFIED | `SkipToContent.tsx` `href="#main-content"` with `focus:top-4` reveal; all links have `focus-visible:outline-2`  |

**All 19 requirement IDs from phase plans are accounted for. No orphaned requirements detected.**

Requirements NOT assigned to Phase 2 (for reference): DSGN-07 (hover states on interactive elements) is Phase 3 pending; INFR-04 (R2 data serving) is Phase 1/3 pending.

---

## Anti-Patterns Found

No blocker or warning anti-patterns found.

Scanned: `App.tsx`, `Hero.tsx`, `HeroSkeleton.tsx`, `Navbar.tsx`, `Footer.tsx`, `SectionPlaceholder.tsx`, `Divider.tsx`, `SkipToContent.tsx`, `useR2Data.ts`, `useFontsReady.ts`, `main.css`, `scripts/generate-lqip.mjs`.

- No `TODO/FIXME/XXX/HACK` comments
- No `return null` or empty implementations
- No stub handlers (no console.log-only handlers, no preventDefault-only)
- No hard-coded color values in components (all Tailwind token utilities)
- Zero CSS Module imports (`grep -r "from.*module\.css" site/src/` returns no results)

**Notable observations (informational only):**

1. `site/src/generated/lqip.ts` is git-ignored and regenerated at build time. The working-tree file contains a real base64 WebP from the actual headshot (142-byte LQIP), confirming `headshot.webp` is present in `site/public/` and the full build pipeline executes correctly.

2. `og-image.png` at `site/public/og-image.png` remains a placeholder (70 bytes, 1x1 pixel). OG tags correctly reference it. Not a blocker for Phase 2.

3. Plan 05's must_have truth ("hero photo has a pronounced squircle shape") was intentionally superseded by user-approved decision during the visual verification checkpoint. Commit `fbdd58c` implemented the squircle; commit `ad099ad` replaced it with `rounded-2xl` per user feedback. This is documented in SUMMARY key-decisions and is not a gap.

---

## Human Verification Required

### 1. Hero visual appearance and LQIP loading

**Test:** Visit `https://jacklabbe.pages.dev`, clear sessionStorage (DevTools > Application > Storage > Clear site data), then hard-reload.
**Expected:** Photo area shows a blurred placeholder that smoothly transitions to the full headshot. Photo has `rounded-2xl` corners. "Jack Labbe" in large bold Inter. "Software / AI Engineer" tagline. Blue "Contact" pill. Dark navy background with subtle radial gradient.
**Why human:** Visual appearance, font rendering, LQIP blur quality, and transition smoothness are runtime behaviors.

### 2. 3D tilt hover effect on hero photo

**Test:** Hover over the hero headshot photo and move the mouse around.
**Expected:** Photo tracks mouse position with a 3D perspective tilt (up to +/-17deg on X and Y axes, scaling to 1.05x). Grayscale filter applies on hover. Returns to flat on mouse leave.
**Why human:** Mouse-tracked 3D transform requires interactive browser testing.

### 3. Navbar glass blur and scroll border

**Test:** Scroll down the page past the hero section.
**Expected:** Navbar stays sticky at top. Glass/blur effect visible. A subtle 1px bottom border appears at the bottom of the navbar once scrolled past the top (driven by `nav[data-scrolled="true"]` CSS rule in main.css).
**Why human:** `backdrop-filter` rendering and IntersectionObserver-driven border require browser observation.

### 4. Mobile responsive layout

**Test:** Open DevTools, switch to mobile viewport (375px width).
**Expected:** Hero photo appears above the text content (stacked vertically). Photo max-width reduced and centered. `rounded-2xl` shape still applies on mobile.
**Why human:** Responsive layout behavior requires visual inspection at target breakpoint.

### 5. Keyboard navigation

**Test:** Tab through the page using keyboard only.
**Expected:** First Tab press reveals the "Skip to content" link at top-left. Second Tab reaches the Navbar "Contact" button. Activating the skip link moves focus to `#main-content`.
**Why human:** Focus ring visibility and skip link behavior require interactive keyboard testing.

### 6. R2 data fetch network behavior

**Test:** Open DevTools > Network tab, reload page, filter by Fetch/XHR.
**Expected:** Three requests to the R2 base URL: graph.json, projects.json, meta.json. These may return CORS errors or 404 if R2 bucket is not yet configured -- acceptable. Hero renders regardless.
**Why human:** Network request behavior requires browser DevTools inspection.

### 7. prefers-reduced-motion

**Test:** Enable "Emulate prefers-reduced-motion: reduce" in DevTools > Rendering, then reload.
**Expected:** No skeleton shimmer animation (static gradient). No stagger fadeInUp (elements appear immediately at full opacity). No LQIP fade transition (full image shown immediately at opacity 1, no transition).
**Why human:** Animation disabling requires DevTools emulation or OS system preference.

### 8. Open Graph social preview

**Test:** Paste `https://jacklabbe.pages.dev` into https://www.opengraph.xyz.
**Expected:** Preview shows title "Jack Labbe - Software / AI Engineer" and description. OG image will be the placeholder (1x1 PNG) until replaced with a designed 1200x630 image.
**Why human:** Social crawler OG rendering requires external tool.

---

## Build Verification

```
site build: vite v7.3.1 building client environment for production...
site build: ✓ 40 modules transformed.
site build: ✓ built in 2.12s
worker build: Done
```

`pnpm build` from repo root passes with zero errors. Both site and worker build cleanly.

---

_Verified: 2026-02-20T21:15:00Z_
_Verifier: Claude (gsd-verifier)_
