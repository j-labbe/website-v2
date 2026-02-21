# Phase 3: Core Visualizations and Launch - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the two signature visualizations (commit heatmap and project timeline with scroll-synced date spine), add hover states across all interactive elements, and deploy the production site to jacklabbe.com. The data pipeline and site shell already exist from Phases 1-2.

</domain>

<decisions>
## Implementation Decisions

### Commit graph style

- Navy-to-bright-blue color scale matching the dark theme — empty cells near-background, high activity vivid blue
- 4 intensity levels (like GitHub): empty, low, medium, high
- Rounded square cells (slight border-radius, classic GitHub look)
- Empty cells have faint fill to show full grid structure (not invisible)
- Month labels along the top (Jan, Feb, Mar...)
- Day-of-week labels on the left side (Mon, Wed, Fri)
- No total commit count displayed
- No section heading — graph flows naturally below the hero
- GitHub-style "Less — More" legend in the corner with sample cells
- Simple tooltip on cell hover: "12 commits on Jan 15, 2026" (count + date only, no repo breakdown)
- Mobile: horizontal scroll to see all 52 weeks, cells stay full-size
- Animate in on first load: left-to-right wave (columns fill in sequentially oldest to newest)

### Timeline entry design

- Card-based layout — each project in a distinct card with background, border, shadow
- Section heading: "Projects" with a divider
- Card metadata: language badges (GitHub's actual language colors), commit count, date range (first + last active), description
- Projects appear in every month they were active (not just most recent month)
- Same full card each time (total commits, full date range, same badges) — not month-specific data
- Within a month, sorted by most recent commit first
- All projects shown — no collapsing even if 8+ in a month
- Public repo names are clickable links to GitHub
- Private repos: different accent (border color or subtle icon) to signal "private" — still shows badges

### Date spine behavior

- Sticky positioning — fixed in viewport while scrolling through the timeline
- Current month highlighted with bold weight + blue accent color
- Click-to-jump uses smooth scroll animation
- Mobile: stays visible on the side but compact — abbreviated format like "01/26" instead of full month names
- Spine months have subtle hover effect (text brightens) to signal clickability

### Hover & interaction feel

- Commit graph cells: scale up (1.5-2x) on hover
- Project cards: Linear-style hover — slight lift + background shift
- Links (repo names, nav, footer): color brightens to blue + underline slides in
- Date spine months: subtle text brighten on hover
- All hover transitions: snappy 100-150ms timing

### Claude's Discretion

- Month grouping header style (bold label with divider, sticky, etc.)
- Timeline card scroll animation style (fade-up, stagger, etc.)
- Exact cell sizing and gap spacing for the heatmap grid
- Production deployment configuration details
- Error states and loading states for visualizations
- Exact shadow/border values for cards

</decisions>

<specifics>
## Specific Ideas

- "Similar to linear.app styling" for card hover effects — slight lift + background shift
- GitHub-authentic language badge colors (TypeScript = blue, Python = yellow, etc.) for recognizability
- The commit graph should feel like GitHub's contribution graph but in the site's blue palette
- Mobile date spine should be minimized but still visible and navigable — abbreviated month format

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 03-core-visualizations-and-launch_
_Context gathered: 2026-02-20_
