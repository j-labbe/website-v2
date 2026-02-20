# Phase 3: Core Visualizations and Launch - Research

**Researched:** 2026-02-20
**Domain:** SVG data visualization, scroll-synced navigation, Cloudflare Pages deployment
**Confidence:** HIGH

## Summary

Phase 3 builds two data-driven visualizations (commit heatmap and project timeline) on top of the existing React/Tailwind/Vite stack from Phases 1-2, adds hover states across all interactive elements, and deploys to jacklabbe.com. The data pipeline already produces `graph.json` (with `ContributionDay[]` including date, count, and 0-4 level) and `projects.json` (with `ProjectEntry[]` including `monthlyCommits` keyed by "YYYY-MM"). The site shell already fetches this data via `useR2Data` with sessionStorage caching.

The commit heatmap is a pure inline SVG (no charting libraries per GRPH-03) -- a grid of `<rect>` elements arranged in 52 columns x 7 rows. The project timeline is a month-grouped card list with a sticky date spine that uses IntersectionObserver for scroll-synced active month highlighting. Both components receive data from the existing `useR2Data` hook. Deployment is to Cloudflare Pages with a custom domain pointed via CNAME.

**Primary recommendation:** Hand-build the SVG heatmap from `<rect>` elements (the data shape maps directly to the grid), implement scroll spy with IntersectionObserver (already proven in Navbar), and use `position: sticky` for the date spine. No new dependencies needed -- everything builds on React 19, Tailwind v4, and the existing design system.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Commit graph style:** Navy-to-bright-blue color scale, 4 intensity levels, rounded square cells, empty cells have faint fill, month labels on top, day-of-week labels on left, GitHub-style "Less -- More" legend, simple tooltip ("12 commits on Jan 15, 2026"), mobile horizontal scroll with full-size cells, left-to-right wave animation on first load
- **No total commit count displayed, no section heading** -- graph flows naturally below hero
- **Timeline entry design:** Card-based layout with background/border/shadow, "Projects" section heading with divider, card metadata includes language badges (GitHub actual colors), commit count, date range, description. Projects appear in every month they were active (full card each time, not month-specific). Within a month sorted by most recent commit first. All projects shown (no collapsing). Public repos are clickable links, private repos have different accent (border color or subtle icon)
- **Date spine behavior:** Sticky positioning, current month bold + blue accent, smooth scroll on click, mobile abbreviated "01/26" format, subtle hover effect on months
- **Hover & interaction feel:** Commit graph cells scale 1.5-2x, project cards Linear-style lift + background shift, links brighten to blue + underline slides in, date spine text brighten, all transitions 100-150ms

### Claude's Discretion
- Month grouping header style (bold label with divider, sticky, etc.)
- Timeline card scroll animation style (fade-up, stagger, etc.)
- Exact cell sizing and gap spacing for the heatmap grid
- Production deployment configuration details
- Error states and loading states for visualizations
- Exact shadow/border values for cards

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GRPH-01 | GitHub-style contribution heatmap displaying rolling 12 months of commit activity | SVG grid of `<rect>` elements mapped from `GraphData.days[]`; 52-column x 7-row layout |
| GRPH-02 | Blue-tinted color scale matching site palette (not GitHub green) | 4-level scale using design tokens: empty=`--color-surface`, low/med/high from blue palette |
| GRPH-03 | Rendered as inline SVG (no charting libraries) | Pure JSX `<svg>` with `<rect>` elements -- no dependencies needed |
| GRPH-04 | Graph positioned directly beneath hero section | Replace `SectionPlaceholder label="// activity"` in App.tsx |
| GRPH-05 | Responsive -- readable on mobile viewports | `overflow-x: auto` wrapper, fixed cell size, horizontal scroll on mobile |
| TIME-01 | Chronological project list sorted by most recent contribution (newest first) | Sort by `lastActiveAt` descending, group into months using `monthlyCommits` keys |
| TIME-02 | Month-grouped entries (January 2026, December 2025, etc.) | Iterate `monthlyCommits` keys to determine which months a project appears in |
| TIME-03 | Public repos display: repo name with link, language badges, last active, commit count | Map `ProjectEntry` fields directly; GitHub linguist colors for badges |
| TIME-04 | Private repos display as "Private Repo" with badges, no name/link | Conditional rendering on `isPrivate` flag |
| TIME-05 | Time Machine-style right-side date spine showing months | Sticky sidebar with month list, CSS `position: sticky` |
| TIME-06 | Scroll-synced date spine -- active month highlights as user scrolls | IntersectionObserver on month section sentinels, same pattern as Navbar |
| TIME-07 | Clickable date spine -- clicking a month jumps to that section | `element.scrollIntoView({ behavior: 'smooth' })` with month section IDs |
| TIME-08 | Compact timeline density | Tight card padding, reduced vertical gaps, small text for metadata |
| TIME-09 | Subtle fade-in animation on scroll for timeline entries | IntersectionObserver + existing `stagger-item` CSS class pattern |
| DSGN-07 | Hover states on interactive elements (links, graph cells, timeline entries) | CSS transitions at 100-150ms per user spec; Tailwind `hover:` utilities |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x | Component framework | Already in use |
| Tailwind CSS | 4.2.x | Styling | Already in use with @theme tokens |
| Vite | 7.x | Build tool | Already in use |
| TypeScript | 5.9.x | Type safety | Already in use |

### Supporting (no new installs needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @jacklabbe/shared | workspace | `GraphData`, `ProjectEntry`, `ProjectsFile` types | All component data typing |
| IntersectionObserver API | Browser native | Scroll spy, fade-in-on-scroll | Date spine sync, timeline entry reveal |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-built SVG heatmap | `@uiw/react-heat-map` or `react-calendar-heatmap` | Libraries add deps and constrain styling; hand-built SVG is trivial for this grid shape and gives full control over animation, colors, tooltips |
| Native IntersectionObserver | `react-intersection-observer` | Package adds convenience hooks but this project already uses raw IO in Navbar; consistency favors same pattern |
| Native `position: sticky` | `react-sticky-box` | CSS sticky works perfectly for a sidebar; library adds unnecessary abstraction |

**Installation:**
```bash
# No new packages needed -- everything builds on existing stack
```

## Architecture Patterns

### Recommended Project Structure
```
site/src/
├── components/
│   ├── CommitGraph/
│   │   ├── CommitGraph.tsx        # Main heatmap SVG component
│   │   ├── CommitGraphTooltip.tsx  # Hover tooltip overlay
│   │   └── commitGraphUtils.ts    # Grid layout math, color mapping
│   ├── Timeline/
│   │   ├── Timeline.tsx           # Orchestrator: month sections + spine
│   │   ├── TimelineCard.tsx       # Individual project card
│   │   ├── DateSpine.tsx          # Sticky month navigation sidebar
│   │   └── LanguageBadge.tsx      # GitHub-colored language pill
│   └── ... (existing components)
├── hooks/
│   ├── useScrollSpy.ts            # IntersectionObserver for active month
│   └── useR2Data.ts               # (existing) data fetching
├── utils/
│   ├── languageColors.ts          # GitHub linguist color map
│   ├── dateUtils.ts               # Month formatting, grouping helpers
│   └── stagger.ts                 # (existing) animation utilities
└── styles/
    └── main.css                   # (existing) add heatmap + timeline styles
```

### Pattern 1: SVG Heatmap Grid Layout
**What:** Map `ContributionDay[]` to a 52-column x 7-row grid of `<rect>` elements
**When to use:** Rendering the commit graph
**Example:**
```typescript
// The data is a flat array of days. GitHub's grid is organized:
// - Columns = weeks (Sunday-to-Saturday)
// - Rows = day of week (0=Sun, 6=Sat)
// - First column may be partial (starts on whatever day rangeStart falls on)

interface CellPosition {
  weekIndex: number;
  dayIndex: number; // 0=Sun, 6=Sat
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

const CELL_SIZE = 13;  // px (GitHub uses ~11, slightly larger for readability)
const CELL_GAP = 3;    // px gap between cells
const CELL_RADIUS = 2; // px border-radius for rounded squares

function dayToCellPosition(day: ContributionDay, rangeStart: string): CellPosition {
  const start = new Date(rangeStart);
  const current = new Date(day.date);
  const daysSinceStart = Math.floor(
    (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  const startDayOfWeek = start.getDay(); // 0=Sun
  const totalOffset = daysSinceStart + startDayOfWeek;
  return {
    weekIndex: Math.floor(totalOffset / 7),
    dayIndex: totalOffset % 7,
    date: day.date,
    count: day.count,
    level: day.level,
  };
}

// SVG rendering
function CommitGraph({ data }: { data: GraphData }) {
  const cells = data.days.map(d => dayToCellPosition(d, data.rangeStart));
  const totalWeeks = Math.max(...cells.map(c => c.weekIndex)) + 1;
  const width = totalWeeks * (CELL_SIZE + CELL_GAP) + LABEL_OFFSET;
  const height = 7 * (CELL_SIZE + CELL_GAP) + MONTH_LABEL_HEIGHT;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Commit activity over the past year">
      {/* Month labels */}
      {/* Day-of-week labels */}
      {cells.map(cell => (
        <rect
          key={cell.date}
          x={LABEL_OFFSET + cell.weekIndex * (CELL_SIZE + CELL_GAP)}
          y={MONTH_LABEL_HEIGHT + cell.dayIndex * (CELL_SIZE + CELL_GAP)}
          width={CELL_SIZE}
          height={CELL_SIZE}
          rx={CELL_RADIUS}
          fill={LEVEL_COLORS[cell.level]}
        />
      ))}
    </svg>
  );
}
```

### Pattern 2: IntersectionObserver Scroll Spy
**What:** Track which month section is in view to highlight the date spine
**When to use:** Syncing date spine to scroll position
**Example:**
```typescript
// Custom hook -- similar pattern to existing Navbar sentinel approach
function useScrollSpy(sectionIds: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry most visible in viewport
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-20% 0px -60% 0px', // Bias toward top of viewport
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectionIds]);

  return activeId;
}
```

### Pattern 3: Month Grouping from ProjectEntry Data
**What:** Group projects into months they were active in
**When to use:** Building timeline sections
**Example:**
```typescript
interface MonthGroup {
  key: string;       // "2026-02"
  label: string;     // "February 2026"
  projects: ProjectEntry[];
}

function groupByMonth(projects: ProjectEntry[]): MonthGroup[] {
  const monthMap = new Map<string, ProjectEntry[]>();

  for (const project of projects) {
    // Each project appears in every month it was active
    for (const monthKey of Object.keys(project.monthlyCommits)) {
      if (!monthMap.has(monthKey)) monthMap.set(monthKey, []);
      monthMap.get(monthKey)!.push(project);
    }
  }

  // Sort months newest first
  const sortedKeys = [...monthMap.keys()].sort().reverse();

  return sortedKeys.map(key => ({
    key,
    label: formatMonthLabel(key), // "February 2026"
    projects: monthMap.get(key)!
      // Within a month, sort by most recent commit first
      .sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt)),
  }));
}
```

### Pattern 4: Sticky Date Spine Layout
**What:** Two-column layout with sticky sidebar
**When to use:** Timeline section
**Example:**
```tsx
// Timeline layout with sticky spine
<section className="max-w-[1200px] mx-auto px-8">
  <div className="flex gap-8">
    {/* Main content column */}
    <div className="flex-1 min-w-0">
      {months.map(month => (
        <div key={month.key} id={`month-${month.key}`}>
          <h3>{month.label}</h3>
          {month.projects.map(p => <TimelineCard key={`${month.key}-${p.id}`} project={p} />)}
        </div>
      ))}
    </div>

    {/* Date spine -- sticky sidebar */}
    <nav className="w-24 shrink-0 sticky top-20 self-start h-fit max-md:w-16"
         aria-label="Timeline navigation">
      {months.map(month => (
        <button
          key={month.key}
          onClick={() => scrollToMonth(month.key)}
          className={activeMonth === month.key ? 'font-bold text-accent' : 'text-text-dim'}
        >
          {month.label}
        </button>
      ))}
    </nav>
  </div>
</section>
```

### Anti-Patterns to Avoid
- **Scroll event listeners for scroll spy:** Use IntersectionObserver instead -- the project already uses this pattern in Navbar. Scroll listeners cause jank and battery drain.
- **Canvas for the heatmap:** Requirement GRPH-03 explicitly says inline SVG. Canvas would also make tooltips and accessibility harder.
- **Charting libraries (D3, Chart.js, recharts):** The heatmap is a simple grid of rectangles. A charting library adds 50-200KB for something achievable in ~100 lines of JSX.
- **Rendering month-specific data per card:** User decided each card shows the SAME full data (total commits, full date range) regardless of which month section it appears in. Don't compute per-month subsets.
- **Virtualizing the timeline:** User decided "all projects shown, no collapsing." With typical developer project counts (20-60), virtualization adds complexity for no benefit.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GitHub language colors | Color mapping function | Static lookup map from linguist `languages.yml` | Colors must match GitHub exactly for recognizability; 1700+ languages defined |
| Date formatting | Custom date string parsing | `Intl.DateTimeFormat` | Handles localization, month names, edge cases |
| Smooth scroll | Manual `requestAnimationFrame` scroll | `element.scrollIntoView({ behavior: 'smooth' })` | Native, performant, respects `prefers-reduced-motion` |
| Tooltip positioning | Manual coordinate math | CSS `position: absolute` relative to SVG container + pointer events | SVG mouse events give coordinates directly |

**Key insight:** The visualizations themselves are hand-built (SVG rects, card layout), but utility problems like color mapping, date formatting, and scroll behavior should use platform APIs.

## Common Pitfalls

### Pitfall 1: SVG Coordinate System vs DOM Pixels
**What goes wrong:** SVG `viewBox` coordinates don't match screen pixels, causing tooltip positioning errors and cell click targets to be wrong.
**Why it happens:** SVG uses its own coordinate space; `getBoundingClientRect()` returns DOM coordinates while mouse events on SVG elements return SVG-space coordinates.
**How to avoid:** Use the SVG container's `getBoundingClientRect()` for tooltip positioning relative to the page, not SVG internal coordinates. Or position the tooltip outside the SVG entirely using a React portal or sibling div.
**Warning signs:** Tooltips appear in wrong position, especially when the SVG is scaled.

### Pitfall 2: Date Timezone Shifting
**What goes wrong:** `new Date("2026-01-15")` creates a date at midnight UTC, which in local time zones west of UTC becomes January 14th. Heatmap cells show on wrong day-of-week row.
**Why it happens:** ISO date strings without time components are parsed as UTC. `getDay()` returns local timezone day-of-week.
**How to avoid:** Either: (a) always use UTC methods (`getUTCDay()`, `getUTCFullYear()`) consistently, or (b) append `T00:00:00` to force local time parsing. Choose one approach and use it everywhere.
**Warning signs:** Off-by-one day errors, cells misaligned on weekends/Mondays.

### Pitfall 3: IntersectionObserver Threshold Sensitivity
**What goes wrong:** Scroll spy flickers between months or gets "stuck" on a month that's barely visible.
**Why it happens:** Single threshold (e.g., `0.5`) means the callback only fires when crossing exactly 50% visibility. Fast scrolling can skip the threshold entirely.
**How to avoid:** Use multiple thresholds `[0, 0.25, 0.5, 0.75, 1]` and pick the entry with the highest `intersectionRatio`. Also use `rootMargin` to bias toward the top of viewport (e.g., `'-20% 0px -60% 0px'`).
**Warning signs:** Active month doesn't change when scrolling slowly, or jumps erratically.

### Pitfall 4: Sticky Positioning Overflow
**What goes wrong:** `position: sticky` doesn't work because a parent has `overflow: hidden` or `overflow: auto`.
**Why it happens:** Sticky positioning requires all ancestors between the sticky element and its scroll container to have `overflow: visible`.
**How to avoid:** Audit the parent chain of the date spine. The `max-w-[1200px]` container and any flex/grid parents must not set `overflow: hidden`.
**Warning signs:** Date spine scrolls with content instead of sticking.

### Pitfall 5: Duplicate Keys When Projects Repeat Across Months
**What goes wrong:** React warns about duplicate keys when the same project appears in multiple month sections.
**Why it happens:** Using `project.id` as key, but the same project renders in multiple months.
**How to avoid:** Use composite key: `${monthKey}-${project.id}`.
**Warning signs:** React console warning about duplicate keys, unexpected re-renders.

### Pitfall 6: Mobile Horizontal Scroll Heatmap Clipping
**What goes wrong:** The heatmap SVG is wider than the viewport but the horizontal scroll container clips the month labels or legend.
**Why it happens:** `overflow-x: auto` on a container that's too tight, or the SVG `viewBox` doesn't account for labels.
**How to avoid:** Ensure the scroll container wraps the entire SVG (including labels and legend). Add padding inside the SVG viewBox for labels. Test at 320px width.
**Warning signs:** Month labels cut off, legend not visible on mobile.

## Code Examples

### GitHub Language Color Map
```typescript
// Source: https://raw.githubusercontent.com/github-linguist/linguist/master/lib/linguist/languages.yml
// Subset of most common languages -- extend as needed
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#CE422B',
  Java: '#b07219',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Ruby: '#701516',
  Swift: '#FA7343',
  Kotlin: '#A97BFF',
  HTML: '#e34c26',
  CSS: '#663399',
  Shell: '#89e051',
  Dart: '#00B4AB',
  Lua: '#000080',
  PHP: '#4F5D95',
  R: '#198CE7',
  Scala: '#DC322F',
  Haskell: '#5e5086',
  Elixir: '#6e4a7e',
  Vue: '#2c3e50',
  Svelte: '#ff3e00',
  Dockerfile: '#384d54',
  Makefile: '#427819',
  Nix: '#7e7eff',
  Zig: '#ec915c',
  OCaml: '#ef7a08',
  Jupyter: '#DA5B0B',
};

// Fallback for unknown languages
export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? '#8b949e';
}
```

### Heatmap Blue Color Scale
```typescript
// 4-level blue scale matching site dark theme
// Level 0 = empty (faint fill to show grid structure)
// Levels 1-4 map to increasingly vivid blue
export const LEVEL_COLORS = [
  '#0a1628',  // level 0: empty -- near-background (--color-surface)
  '#0e3460',  // level 1: low -- dark navy-blue
  '#1a6dbd',  // level 2: medium -- mid blue
  '#3b8eea',  // level 3: high -- bright blue
  '#4F7DF5',  // level 4: very high -- matches --color-accent
] as const;
```

### Wave Animation for Heatmap
```typescript
// Left-to-right wave: columns fill in sequentially
// Each column gets a CSS animation-delay based on its week index
function getColumnDelay(weekIndex: number, totalWeeks: number): string {
  // Total animation spread: ~1.5s for all columns
  const delayMs = (weekIndex / totalWeeks) * 1500;
  return `${delayMs}ms`;
}

// In the SVG rect:
<rect
  key={cell.date}
  x={...}
  y={...}
  width={CELL_SIZE}
  height={CELL_SIZE}
  rx={CELL_RADIUS}
  fill={LEVEL_COLORS[cell.level]}
  className="commit-cell"
  style={{
    animationDelay: getColumnDelay(cell.weekIndex, totalWeeks),
  }}
/>

// CSS for the wave animation:
// .commit-cell {
//   opacity: 0;
//   animation: cellFadeIn 300ms ease-out forwards;
// }
// @keyframes cellFadeIn {
//   from { opacity: 0; transform: scale(0.5); }
//   to { opacity: 1; transform: scale(1); }
// }
```

### Tooltip Component
```typescript
// Simple tooltip positioned relative to the heatmap container
interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  text: string;
}

function CommitGraphTooltip({ tooltip }: { tooltip: TooltipState }) {
  if (!tooltip.visible) return null;
  return (
    <div
      className="absolute pointer-events-none bg-surface-2 border border-border text-text text-xs px-3 py-1.5 rounded-md whitespace-nowrap z-10"
      style={{
        left: tooltip.x,
        top: tooltip.y - 40, // Position above the cell
        transform: 'translateX(-50%)',
      }}
    >
      {tooltip.text}
    </div>
  );
}

// Format: "12 commits on Jan 15, 2026"
function formatTooltip(count: number, date: string): string {
  const d = new Date(date + 'T00:00:00'); // Force local time
  const formatted = d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
  return `${count} ${count === 1 ? 'commit' : 'commits'} on ${formatted}`;
}
```

### Hover States (DSGN-07)
```css
/* Commit graph cells: scale on hover */
.commit-cell {
  transition: transform 120ms ease;
  transform-origin: center;
}
.commit-cell:hover {
  transform: scale(1.8);
  /* Note: SVG transform needs to be relative to cell center */
}

/* Project cards: Linear-style lift + background shift */
.timeline-card {
  transition: transform 120ms ease, background-color 120ms ease, box-shadow 120ms ease;
}
.timeline-card:hover {
  transform: translateY(-2px);
  background-color: var(--color-surface-2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Links: color brighten + underline slide in */
.link-hover {
  position: relative;
  transition: color 120ms ease;
}
.link-hover::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--color-accent);
  transition: width 120ms ease;
}
.link-hover:hover {
  color: var(--color-accent);
}
.link-hover:hover::after {
  width: 100%;
}

/* Date spine months: text brighten */
.spine-month {
  transition: color 120ms ease;
}
.spine-month:hover {
  color: var(--color-text-bright);
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  .commit-cell {
    animation: none !important;
    opacity: 1;
  }
  .timeline-card,
  .link-hover,
  .link-hover::after,
  .spine-month,
  .commit-cell:hover {
    transition: none;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| D3.js for simple grids | Inline SVG via JSX | Ongoing trend | D3 is overkill for static grids; JSX gives full React integration |
| Scroll event listeners | IntersectionObserver | Widely adopted since 2020 | Better performance, no jank, already used in this project |
| CSS Modules | Tailwind CSS v4 with @theme | Already migrated in Phase 2 | Use Tailwind utilities + @theme tokens; project already uses this |
| react-calendar-heatmap | Hand-built SVG | N/A (project decision) | GRPH-03 mandates inline SVG, no charting libraries |

**Deprecated/outdated:**
- `react-calendar-heatmap` last significant update was 2021 -- functional but not actively maintained
- CSS `scroll-behavior: smooth` on `html` is less precise than `scrollIntoView({ behavior: 'smooth' })` for targeted scrolling

## Open Questions

1. **Heatmap cell size tuning**
   - What we know: GitHub uses ~11px cells with ~3px gap. User wants cells readable on mobile.
   - What's unclear: Optimal size for this site's layout (1200px max-width container, with labels)
   - Recommendation: Start with 13px cells / 3px gap, iterate visually. Claude's discretion per CONTEXT.md.

2. **SVG hover transform origin**
   - What we know: SVG `transform: scale()` defaults to `(0,0)` origin, not center of element like CSS
   - What's unclear: Whether CSS `transform-origin: center` works reliably on SVG `<rect>` across browsers
   - Recommendation: Use SVG `transform` attribute with explicit translate-scale-translate pattern, or use CSS with `transform-box: fill-box; transform-origin: center;` (supported in all modern browsers)

3. **Cloudflare Pages custom domain status**
   - What we know: INFR-03 (Cloudflare Pages deployment) is marked complete from Phase 2; the site deploys to `jacklabbe.pages.dev`
   - What's unclear: Whether jacklabbe.com custom domain + DNS is already configured, or needs to be set up
   - Recommendation: Check Cloudflare dashboard during deployment task; if not configured, add custom domain via Pages settings and verify DNS propagation

## Sources

### Primary (HIGH confidence)
- Existing codebase: `shared/src/graph.ts`, `shared/src/projects.ts` -- data shape definitions
- Existing codebase: `site/src/hooks/useR2Data.ts` -- data fetching pattern
- Existing codebase: `site/src/components/Navbar/Navbar.tsx` -- IntersectionObserver pattern
- Existing codebase: `site/src/styles/main.css` -- design tokens and animation patterns
- [GitHub Linguist languages.yml](https://raw.githubusercontent.com/github-linguist/linguist/master/lib/linguist/languages.yml) -- authoritative language color definitions

### Secondary (MEDIUM confidence)
- [Cloudflare Pages Custom Domains docs](https://developers.cloudflare.com/pages/configuration/custom-domains/) -- deployment configuration
- [MDN IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) -- scroll spy implementation
- [SVG transform-box: fill-box](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-box) -- CSS transforms on SVG elements

### Tertiary (LOW confidence)
- Web search results on scroll spy patterns -- general community patterns, verified against codebase approach

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies; everything is already installed and proven in Phases 1-2
- Architecture: HIGH -- data shapes are defined, component patterns are established, IntersectionObserver pattern already in Navbar
- Pitfalls: HIGH -- timezone issues and SVG coordinate systems are well-documented; sticky overflow is a known CSS gotcha
- Deployment: MEDIUM -- Cloudflare Pages is already set up, but custom domain configuration needs verification

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (stable -- no fast-moving dependencies)
