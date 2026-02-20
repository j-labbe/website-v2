---
phase: 03-core-visualizations-and-launch
plan: 02
subsystem: ui
tags: [react, timeline, intersection-observer, scroll-spy, css-transitions]

requires:
  - phase: 01-foundation
    provides: "ProjectEntry/ProjectsFile shared types"
  - phase: 02-site-shell
    provides: "Design tokens, stagger-item animation pattern, Tailwind @theme setup"
provides:
  - "Timeline component tree (Timeline, TimelineCard, DateSpine, LanguageBadge)"
  - "Month grouping utility (groupByMonth) for chronological project display"
  - "Language color map with 32 GitHub linguist colors"
  - "useScrollSpy hook for IntersectionObserver-based active section tracking"
  - "Timeline CSS: card hover lift, link underline slide, spine month brighten"
affects: [03-03-PLAN]

tech-stack:
  added: []
  patterns: ["IntersectionObserver scroll spy", "fade-in via stagger-item + observer", "composite React keys for duplicate prevention"]

key-files:
  created:
    - site/src/utils/languageColors.ts
    - site/src/utils/dateUtils.ts
    - site/src/hooks/useScrollSpy.ts
    - site/src/components/Timeline/LanguageBadge.tsx
    - site/src/components/Timeline/TimelineCard.tsx
    - site/src/components/Timeline/DateSpine.tsx
    - site/src/components/Timeline/Timeline.tsx
  modified:
    - site/src/styles/main.css

key-decisions:
  - "useInViewRef callback pattern for fade-in rather than separate hook file -- keeps animation logic co-located with Timeline"
  - "Composite key ${monthKey}-${project.id} prevents React duplicate key warnings when same project appears in multiple months"

patterns-established:
  - "useScrollSpy: reusable IntersectionObserver hook for any section-based navigation"
  - "Timeline card public/private branching via isPrivate flag with visual differentiation via border accent"

requirements-completed: [TIME-01, TIME-02, TIME-03, TIME-04, TIME-05, TIME-06, TIME-07, TIME-08, TIME-09, DSGN-07]

duration: 2min
completed: 2026-02-20
---

# Phase 03 Plan 02: Timeline Summary

**Month-grouped project timeline with sticky date spine, scroll-synced highlighting, public/private card variants, and Linear-style hover interactions**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-20T22:10:32Z
- **Completed:** 2026-02-20T22:12:47Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Utility layer: 32-language GitHub linguist color map, month grouping with multi-month project support, date range formatting
- Scroll spy hook using IntersectionObserver with rootMargin biasing for accurate active month tracking
- Full Timeline component tree: orchestrator, cards (public/private), date spine (sticky, clickable, responsive), language badges
- Hover states: Linear-style card lift, link underline slide-in, spine month text brighten -- all 120ms with reduced motion overrides
- Cards fade in on scroll using stagger-item pattern with per-element IntersectionObserver

## Task Commits

Each task was committed atomically:

1. **Task 1: Create utility modules and scroll spy hook** - `b5d795f` (feat)
2. **Task 2: Build Timeline component tree with cards, date spine, and hover states** - `43b7820` (feat)

## Files Created/Modified
- `site/src/utils/languageColors.ts` - GitHub linguist color map (32 languages) + getLanguageColor fallback
- `site/src/utils/dateUtils.ts` - groupByMonth, formatMonthLabel, formatDateRange utilities
- `site/src/hooks/useScrollSpy.ts` - IntersectionObserver scroll spy returning active section ID
- `site/src/components/Timeline/LanguageBadge.tsx` - Language pill with colored dot
- `site/src/components/Timeline/TimelineCard.tsx` - Project card with public/private variants
- `site/src/components/Timeline/DateSpine.tsx` - Sticky sidebar month navigation with scroll-to
- `site/src/components/Timeline/Timeline.tsx` - Orchestrator with month sections, scroll spy, fade-in
- `site/src/styles/main.css` - Added timeline-card, link-hover, spine-month classes + reduced motion

## Decisions Made
- Used inline useInViewRef callback pattern in Timeline.tsx rather than separate hook file -- keeps fade-in animation logic co-located
- Composite React keys `${monthKey}-${project.id}` prevent duplicate key warnings when projects span multiple months
- DateSpine abbreviated format (02/26) on mobile via responsive visibility classes rather than JS media query

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Timeline component ready to receive ProjectsFile props from useR2Data hook
- Plan 03 can wire Timeline into the page layout and add final integration

## Self-Check: PASSED

All 7 created files verified present. Both task commits (b5d795f, 43b7820) verified in git log.

---
*Phase: 03-core-visualizations-and-launch*
*Completed: 2026-02-20*
