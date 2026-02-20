---
phase: 03-core-visualizations-and-launch
plan: 01
subsystem: ui
tags: [svg, heatmap, react, visualization, css-animation]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: GraphData and ContributionDay types in @jacklabbe/shared
  - phase: 02-site-shell
    provides: Design system tokens, Tailwind v4 @theme, main.css animation patterns
provides:
  - CommitGraph SVG heatmap component with tooltip, legend, wave animation, mobile scroll
  - commitGraphUtils with grid layout math, color mapping, date formatting
  - cellFadeIn keyframe and .commit-cell CSS styles
affects: [03-02, 03-03, app-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [inline-svg-heatmap, utc-date-handling, svg-transform-box-fill-box]

key-files:
  created:
    - site/src/components/CommitGraph/CommitGraph.tsx
    - site/src/components/CommitGraph/CommitGraphTooltip.tsx
    - site/src/components/CommitGraph/commitGraphUtils.ts
  modified:
    - site/src/styles/main.css

key-decisions:
  - "UTC date methods throughout to avoid timezone shifting (getUTCDay, Intl with timeZone UTC)"
  - "Tooltip positioned via container getBoundingClientRect + SVG-to-DOM coordinate scaling"
  - "transform-box: fill-box for SVG rect hover scaling from center"

patterns-established:
  - "Inline SVG heatmap: pure JSX <rect> grid with CSS animation-delay for wave effect"
  - "SVG tooltip pattern: absolute-positioned sibling div with DOM coordinate mapping"

requirements-completed: [GRPH-01, GRPH-02, GRPH-03, GRPH-04, GRPH-05]

# Metrics
duration: 2min
completed: 2026-02-20
---

# Phase 3 Plan 1: Commit Graph Heatmap Summary

**Inline SVG heatmap with 52x7 blue-scale grid, tooltip, Less-More legend, column-staggered wave animation, and mobile horizontal scroll**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-20T22:10:33Z
- **Completed:** 2026-02-20T22:12:44Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- CommitGraph component renders inline SVG heatmap with 4-level blue color scale and faint empty cells
- Month labels on top, day-of-week labels on left, Less-More legend in bottom-right
- Tooltip shows "N commits on Mon DD, YYYY" on hover with proper UTC date formatting
- Left-to-right column wave animation (cellFadeIn with staggered delays over 1.5s)
- Cells scale 1.8x on hover with 120ms transition via transform-box: fill-box
- Mobile horizontal scroll via overflow-x-auto wrapper
- Reduced motion support disables animation and hover transforms

## Task Commits

Each task was committed atomically:

1. **Task 1: Build commit graph SVG heatmap with utilities** - `f9bc56f` (feat)
2. **Task 2: Add heatmap CSS animations and hover states** - `fa15a95` (feat)

## Files Created/Modified
- `site/src/components/CommitGraph/commitGraphUtils.ts` - Grid layout math, LEVEL_COLORS, UTC date handling, month label computation
- `site/src/components/CommitGraph/CommitGraphTooltip.tsx` - Absolute-positioned tooltip overlay
- `site/src/components/CommitGraph/CommitGraph.tsx` - Main SVG heatmap component with tooltip state, legend, labels, wave animation
- `site/src/styles/main.css` - cellFadeIn keyframe, .commit-cell animation/hover/reduced-motion styles

## Decisions Made
- Used UTC date methods consistently (getUTCDay, Intl.DateTimeFormat with timeZone: 'UTC') to avoid timezone shifting per research pitfall 2
- Tooltip uses container getBoundingClientRect + SVG-to-DOM coordinate scaling rather than SVG internal coordinates per research pitfall 1
- CSS transform-box: fill-box with transform-origin: center for reliable SVG rect hover scaling per research recommendation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript error in LqipImage.tsx (missing generated/lqip module) -- not related to this plan, out of scope

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- CommitGraph component ready to receive GraphData props from useR2Data hook
- Needs to be integrated into App.tsx (replacing SectionPlaceholder) in a future plan
- CSS animations and hover states are self-contained and will activate when component mounts

## Self-Check: PASSED

- All 4 files found on disk
- Commits f9bc56f and fa15a95 verified in git log
- TypeScript compilation passes (only pre-existing LqipImage error)

---
*Phase: 03-core-visualizations-and-launch*
*Completed: 2026-02-20*
