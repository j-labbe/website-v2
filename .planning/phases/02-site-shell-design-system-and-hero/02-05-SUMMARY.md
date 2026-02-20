---
phase: 02-site-shell-design-system-and-hero
plan: 05
subsystem: ui
tags: [lqip, hero-photo, sharp, 3d-tilt, image-loading, blur-in]

# Dependency graph
requires:
  - phase: 02-site-shell-design-system-and-hero
    provides: "Tailwind CSS v4 component architecture with @theme design tokens"
provides:
  - "LQIP blur-in photo loading with build-time generation via sharp"
  - "3D tilt hover effect on hero photo (Apple TV style, +/-17deg)"
  - "Grayscale hover filter on hero photo"
  - "Build-time LQIP pipeline (scripts/generate-lqip.mjs)"
affects: [03-core-visualizations-and-launch]

# Tech tracking
tech-stack:
  added: [sharp]
  patterns: [build-time-lqip-generation, 3d-tilt-hover-effect]

key-files:
  created:
    - site/scripts/generate-lqip.mjs
  modified:
    - site/src/components/Hero/Hero.tsx
    - site/src/components/Hero/HeroSkeleton.tsx
    - site/package.json
    - .gitignore

key-decisions:
  - "Replaced squircle (superellipse clip-path) with rounded-2xl per user feedback during visual verification"
  - "Build-time LQIP generation via sharp instead of hardcoded base64 -- regenerates from actual headshot.webp"
  - "3D tilt effect with +/-17deg rotation tuned during checkpoint iteration"
  - "Photo dimensions fixed at 300x250px instead of aspect-ratio based sizing"

patterns-established:
  - "Build-time asset generation: scripts/ directory with prebuild step in package.json"
  - "Generated code in src/generated/ excluded from git, regenerated on build"

requirements-completed: [HERO-01, HERO-02, HERO-03, HERO-04]

# Metrics
duration: 8min
completed: 2026-02-20
---

# Phase 2 Plan 5: Hero Photo LQIP and Visual Polish Summary

**LQIP blur-in photo loading with build-time sharp generation, 3D tilt hover effect (+/-17deg), and rounded-2xl photo shape**

## Performance

- **Duration:** ~8 min (including checkpoint iteration with user)
- **Started:** 2026-02-20T20:45:00Z
- **Completed:** 2026-02-20T20:53:12Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Implemented LQIP (Low Quality Image Placeholder) blur-in loading for hero photo, replacing skeleton shimmer
- Created build-time LQIP generation script using sharp that produces a tiny 20x20px WebP from the actual headshot
- Added 3D tilt hover effect (Apple TV style) with +/-17deg rotation and grayscale filter on hover
- Iterated photo shape from superellipse clip-path to rounded-2xl per user visual feedback
- Fixed photo dimensions to 300x250px for consistent layout

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement squircle clip-path and LQIP blur-in for hero photo** - `fbdd58c` (feat)
2. **Task 2: Visual verification iteration -- replace squircle with rounded-2xl, add 3D tilt, build-time LQIP** - `ad099ad` (feat)

## Files Created/Modified
- `site/scripts/generate-lqip.mjs` - Build-time script using sharp to generate LQIP data URI from headshot.webp
- `site/src/components/Hero/Hero.tsx` - LQIP blur-in loading, 3D tilt hover effect, grayscale filter, rounded-2xl shape
- `site/src/components/Hero/HeroSkeleton.tsx` - LQIP placeholder in skeleton (blurred image instead of shimmer rectangle), rounded-2xl shape
- `site/package.json` - Added sharp dev dependency, generate:lqip script, prebuild LQIP step
- `.gitignore` - Added site/src/generated/ to exclude build-time generated LQIP module
- `pnpm-lock.yaml` - Updated with sharp dependency
- `site/src/styles/main.css` - LQIP container, placeholder, and transition styles (from task 1)

**Deleted files:** site/src/components/Hero/SquircleClipDef.tsx (squircle approach replaced with rounded-2xl)

## Decisions Made
- Replaced squircle (superellipse SVG clip-path) with Tailwind `rounded-2xl` per user feedback during visual verification -- user preferred the standard rounded rectangle look
- Used build-time LQIP generation via sharp instead of hardcoded base64 data URI -- ensures the placeholder always matches the actual headshot
- Added 3D tilt hover effect (Apple TV style) with +/-17deg rotation -- tuned interactively with user from initial value
- Fixed photo container to 300x250px instead of aspect-ratio based sizing for more predictable layout
- Generated code (src/generated/lqip.ts) excluded from git and regenerated during build via prebuild script

## Deviations from Plan

### Auto-fixed Issues

**1. [Checkpoint Iteration] Replaced squircle with rounded-2xl and added 3D tilt effect**
- **Found during:** Task 2 (human verification checkpoint)
- **Issue:** User preferred rounded rectangle over squircle shape; requested 3D tilt hover effect
- **Fix:** Removed SquircleClipDef.tsx and SVG clip-path; applied rounded-2xl; added mouse-tracked 3D rotation and grayscale
- **Files modified:** Hero.tsx, HeroSkeleton.tsx, SquircleClipDef.tsx (deleted)
- **Verification:** User approved visual appearance

**2. [Checkpoint Iteration] Build-time LQIP generation replacing hardcoded base64**
- **Found during:** Task 2 (human verification checkpoint)
- **Issue:** Hardcoded base64 placeholder was a dark gradient SVG, not from actual headshot
- **Fix:** Created scripts/generate-lqip.mjs using sharp to generate real LQIP from headshot.webp at build time
- **Files modified:** scripts/generate-lqip.mjs (created), Hero.tsx, HeroSkeleton.tsx, package.json, .gitignore
- **Verification:** Build passes, LQIP generated from actual headshot (142 bytes)

---

**Total deviations:** 2 checkpoint iterations (user-directed design refinements)
**Impact on plan:** Design direction changed from squircle to rounded-2xl per user preference. Added 3D tilt effect and build-time LQIP generation as improvements. No scope creep -- all changes within hero photo scope.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. LQIP is auto-generated at build time from headshot.webp.

## Next Phase Readiness
- Phase 2 is now fully complete (all 5 plans executed)
- Hero section has polished photo loading (LQIP blur-in) and interactive hover effects
- Ready to plan and execute Phase 3: Core Visualizations and Launch
- Build-time asset generation pattern established for any future generated code

## Self-Check: PASSED

- FOUND: site/scripts/generate-lqip.mjs
- FOUND: site/src/components/Hero/Hero.tsx
- FOUND: site/src/components/Hero/HeroSkeleton.tsx
- FOUND: commit fbdd58c (Task 1)
- FOUND: commit ad099ad (Task 2)
- CONFIRMED: SquircleClipDef.tsx deleted
- Build passes cleanly

---
*Phase: 02-site-shell-design-system-and-hero*
*Completed: 2026-02-20*
