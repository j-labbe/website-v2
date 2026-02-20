# Phase 2: Site Shell, Design System, and Hero - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a polished dark-themed React SPA with the full design system (tokens, typography, components), hero section, sticky navbar, page layout skeleton, R2 data fetching, and SEO/meta tags. The commit graph and project timeline visualizations are Phase 3 — this phase builds the shell and proves end-to-end data flow from R2 to browser.

</domain>

<decisions>
## Implementation Decisions

### Hero composition
- Right-aligned split layout: photo on left, text (name + tagline + contact button) on right
- Even ~50/50 split ratio between photo and text
- Professional headshot photo
- Name "Jack Labbe" rendered large and bold (~48-64px), Inter font, heavy weight
- Tagline "Software / AI Engineer" in sans-serif (Inter), lighter weight — NOT monospace
- Contact button: filled accent color (#4F7DF5), pill shape (fully rounded), mailto link
- Hero uses natural height with generous padding (not full viewport height)
- Content vertically centered within the hero section
- Hero background: subtle radial gradient with accent glow, differentiating from the flat #040d21 body
- Mobile: photo restacks on top, text below
- Staggered entrance animation: photo → name → tagline → button, quick ~100ms gaps between each
- Max-width container (~1200px) centered on page

### Navbar
- Contact button only — no name, no branding, no logo
- Sticky (stays visible on scroll)
- Glass / backdrop blur effect (semi-transparent background)
- Contact button matches hero style: filled accent, pill shape
- Nav border: Claude's discretion

### Page layout
- Single-scroll: hero → commit graph → divider → timeline → footer
- Phase 2 placeholder: empty sections with monospace labels (e.g., `// commit graph`, `// projects`) to prove layout structure
- Deploy to .pages.dev subdomain first, switch to jacklabbe.com later

### Footer
- Compact single row: copyright + social icon links
- Icons only (no text labels): GitHub, LinkedIn, email, X (Twitter)
- Icon style: Claude's discretion

### Design system reference
- Primary design reference: Linear.app — crisp, high-contrast, polished engineering aesthetic
- Also informed by Stripe.com — professional, precise, dark gradients

### Color palette (locked tokens)
- `--bg: #040d21` (page background)
- `--surface: #0a1628` (elevated surfaces)
- `--surface-2: #111d33` (secondary surfaces)
- `--border: #1a2844` (borders, dividers)
- `--text: #c9d1d9` (body text)
- `--text-dim: #6e7a8a` (secondary/muted text)
- `--text-bright: #f0f6fc` (headings, emphasis)
- `--accent: #4F7DF5` (primary accent — Balanced Indigo Blue)
- `--accent-secondary: #6B9CFF` (lighter accent variant)
- Link/interactive text color: Claude's discretion (pick based on contrast ratios)
- Additional semantic colors (success, warning, error): Claude's discretion, add as needed

### Typography
- Headings: Inter (bold weight), font-display: swap
- Accent/code text: JetBrains Mono
- Tagline: Inter (lighter weight), NOT monospace
- Font loading: font-display: swap, with skeleton loading state masking the font swap flash

### Decorative elements
- Crosshatch grid pattern: very subtle (~3-5% opacity), scope at Claude's discretion
- Grid toggle: CSS variable only (`--grid-visible`), not user-facing
- Monospace section labels (e.g., `// projects`): dimmed text color (#6e7a8a), left-aligned
- 1px structural dividers: contained within max-width container (~1200px), style at Claude's discretion
- Button border radius: pill shape for buttons (fully rounded), consistent base radius (~8px) for all other elements (cards, badges, etc.)

### Loading experience
- Skeleton placeholders with gradient sweep shimmer (Linear/Stripe style)
- Content-shaped skeletons: mirror real layout (circle for photo, text-width bars, button shapes)
- Hero shows skeleton too — unified experience, everything reveals together
- Unified loading flow: skeletons → fonts + R2 data ready → staggered reveal animation
- All R2 JSON files (graph.json, projects.json, meta.json) fetched in parallel on page load
- 5-second timeout before showing error state
- Error state design: Claude's discretion
- Data caching strategy: Claude's discretion

### SEO / Open Graph
- OG preview card: matches site design (dark navy, name, tagline, accent blue)
- OG image method: Claude's discretion (static PNG or build-time generated)

### Accessibility
- Skip-to-content link target: Claude's discretion
- WCAG AA contrast ratios on all text (per requirements)
- Keyboard navigable

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

</decisions>

<specifics>
## Specific Ideas

- "I really like Linear's website look and feel. The dark gradients and font choice and design choices make it feel like a professional engineering site."
- Stripe.com / Linear.app as primary hero and overall design references — crisp, high-contrast, polished engineering aesthetic
- Contact button should be the same filled accent pill style in both the hero and the sticky navbar
- Font loading masked by skeleton state — skeletons serve double duty hiding both font swap and data loading
- Full color token palette prototyped and validated by user in a detailed HTML color explorer before this discussion

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-site-shell-design-system-and-hero*
*Context gathered: 2026-02-20*
