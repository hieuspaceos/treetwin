# Phase 2: Section Variant Expansion (18h)

## Context
- Current variant counts: hero(4), features(3), pricing(3), testimonials(4), faq(3), cta(5), stats(3), how-it-works(3), team(3), nav(3), footer(3)
- Each variant is a conditional block inside a single `.astro` file
- All variants must work on both dark and light section backgrounds (via CSS vars)

## Key Files
- `src/components/landing/landing-hero.astro` — 4 variants, ~155 lines
- `src/components/landing/landing-features.astro` — 3 variants, ~101 lines
- `src/components/landing/landing-pricing.astro` — 3 variants
- `src/components/landing/landing-testimonials.astro` — 4 variants
- `src/components/landing/landing-nav.astro` — 3 variants, ~135 lines
- `src/components/landing/landing-footer.astro` — 3 variants
- `src/lib/landing/landing-types.ts` — variant union types per section

## New Variants Per Section

### Hero (add 2: `fullscreen`, `slider`)
| Variant | Description |
|---------|-------------|
| `fullscreen` | 100vh, centered text, ken-burns bg animation, scroll indicator arrow |
| `slider` | Multiple slides (use `items` array on HeroData), auto-rotate, dots navigation |

**Type change:** Add `items?: Array<{ headline: string; subheadline?: string; backgroundImage?: string }>` to `HeroData`

### Features (add 3: `masonry`, `icon-strip`, `bento`)
| Variant | Description |
|---------|-------------|
| `masonry` | CSS columns layout, cards with varying heights |
| `icon-strip` | Horizontal scrollable icon bar (5-8 items), icon above label, no description |
| `bento` | CSS grid with first item spanning 2 rows, rest filling around it |

### Pricing (add 2: `comparison`, `toggle`)
| Variant | Description |
|---------|-------------|
| `comparison` | Table layout: features as rows, plans as columns, checkmarks |
| `toggle` | Monthly/annual toggle switch above standard cards |

**Type change:** Add `annualPlans?: PricingPlan[]` to `PricingData` for toggle variant

### Testimonials (add 2: `quote-wall`, `logo-strip`)
| Variant | Description |
|---------|-------------|
| `quote-wall` | Masonry grid of quote cards (no avatars, just text + name) |
| `logo-strip` | Horizontal scrolling logo bar + single featured quote above |

### Nav (add 2: `hamburger`, `mega`)
| Variant | Description |
|---------|-------------|
| `hamburger` | Always shows hamburger icon, full-screen overlay menu on click |
| `mega` | Desktop dropdown panels with grouped links; hamburger on mobile |

**Type change:** Add `groups?: Array<{ label: string; links: Array<{ label: string; href: string; description?: string }> }>` to `NavData`

**CRITICAL:** Both `hamburger` and `mega` variants require minimal JS for toggle. Use `<script>` tag in astro component with vanilla JS (no framework).

### Footer (add 2: `mega`, `centered-social`)
| Variant | Description |
|---------|-------------|
| `mega` | 4-5 column layout with link groups, newsletter input, social icons |
| `centered-social` | Centered text + large social icon row + copyright |

### FAQ (add 1: `searchable`)
| Variant | Description |
|---------|-------------|
| `searchable` | Search input at top, filters FAQ items client-side |

**Requires:** Small `<script>` for client-side filtering.

### Stats (add 1: `counter`)
| Variant | Description |
|---------|-------------|
| `counter` | Animated count-up on scroll (IntersectionObserver + requestAnimationFrame) |

### CTA (add 1: `floating`)
| Variant | Description |
|---------|-------------|
| `floating` | Fixed bottom bar that appears on scroll, dismissible |

## Implementation Strategy

**File size concern:** Some components will exceed 200 lines with new variants. Split strategy:
- If component exceeds 200 lines after adding variants, extract each variant into its own file:
  - `landing-hero-fullscreen.astro`, `landing-hero-slider.astro`
  - Parent component imports and delegates based on `variant` prop
- Components under 200 lines: keep variants in single file

## Implementation Steps

### Step 1: Update Types (2h)
1. Update `HeroData` — add `items` array, `fullscreen` and `slider` to variant union
2. Update `FeaturesData` — add `masonry`, `icon-strip`, `bento` to variant union
3. Update `PricingData` — add `comparison`, `toggle`, `annualPlans`
4. Update `TestimonialsData` — add `quote-wall`, `logo-strip`
5. Update `NavData` — add `hamburger`, `mega`, `groups`
6. Update `FooterData` — add `mega`, `centered-social`
7. Update `FaqData` — add `searchable`
8. Update `StatsData` — add `counter`
9. Update `CtaData` — add `floating`
10. Update `SectionType` enum in content.config.ts if needed

### Step 2: Hero Variants (2h)
1. Implement `fullscreen` variant — 100vh, ken-burns CSS animation, scroll indicator
2. Implement `slider` variant — CSS-only slide transitions, dot indicators
3. Ensure dark/light theme compatibility via CSS vars

### Step 3: Features Variants (2h)
1. `masonry` — CSS columns layout
2. `icon-strip` — horizontal flex with overflow-x scroll, snap
3. `bento` — CSS grid with span rules

### Step 4: Pricing Variants (2h)
1. `comparison` — HTML table with sticky first column
2. `toggle` — vanilla JS toggle switch, swap plan data

### Step 5: Testimonials Variants (1.5h)
1. `quote-wall` — CSS columns masonry
2. `logo-strip` — CSS animation infinite scroll

### Step 6: Nav Variants (3h)
1. `hamburger` — full-screen overlay, vanilla JS toggle
2. `mega` — dropdown panels, groups support
3. Both: aria attributes for accessibility

### Step 7: Footer + FAQ + Stats + CTA (3.5h)
1. Footer `mega` — multi-column with newsletter
2. Footer `centered-social` — centered layout
3. FAQ `searchable` — vanilla JS filter
4. Stats `counter` — IntersectionObserver animation
5. CTA `floating` — fixed positioning, scroll trigger

### Step 8: Update Clone Prompts (2h)
1. Add all new variants to `DIRECT_CLONE_PROMPT` section descriptions
2. Add variant selection guidance to `STRUCTURE_PROMPT`
3. Test with sample HTML that Gemini should map to new variants

## Todo

- [ ] Update all type definitions with new variant unions
- [ ] Hero: fullscreen + slider variants
- [ ] Features: masonry + icon-strip + bento variants
- [ ] Pricing: comparison + toggle variants
- [ ] Testimonials: quote-wall + logo-strip variants
- [ ] Nav: hamburger + mega variants (with JS)
- [ ] Footer: mega + centered-social variants
- [ ] FAQ: searchable variant (with JS)
- [ ] Stats: counter variant (with JS)
- [ ] CTA: floating variant
- [ ] Update clone AI prompts with new variants
- [ ] Dark/light theme test for all new variants
- [ ] Modularize components exceeding 200 lines

## Success Criteria
- Each new variant renders correctly in isolation
- All variants respect CSS var theming (dark bg = light text automatically)
- Nav hamburger works on mobile with no framework JS
- Clone prompt includes all new variant options
- No component file exceeds 200 lines

## Risk Assessment
- **JS in Astro components**: Use `<script>` tags (Astro bundles these). Keep JS minimal (<30 lines per component).
- **Slider hero**: CSS-only is limited. Accept basic fade transitions; no swipe gestures in v3.
- **Comparison pricing table**: Horizontal scroll needed on mobile for many columns.
