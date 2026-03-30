# Phase 5: Mobile & Polish (12h)

## Context
- Current: desktop-first CSS, no hamburger nav, untested mobile layouts
- Phase 1-4 add variants + presets but mobile testing deferred to here
- Nav links hidden on mobile (`hidden sm:flex`), no alternative navigation

## Key Files
- All `src/components/landing/*.astro` — responsive audit
- `src/styles/landing.css` — breakpoints, mobile styles
- `src/components/landing/landing-nav.astro` — needs hamburger for default/centered variants

## Breakpoints

| Name | Width | Target |
|------|-------|--------|
| Mobile | < 640px (375px test) | iPhone SE, small Android |
| Tablet | 640px - 1023px (768px test) | iPad, tablets |
| Desktop | 1024px+ (1440px test) | Laptops, monitors |

## Implementation Steps

### Step 1: Hamburger Nav for All Nav Variants (3h)

**Problem:** `default` and `centered` nav variants use `hidden sm:flex` on link container — links invisible on mobile with no alternative.

**Solution:** Add hamburger toggle to ALL nav variants (not just `hamburger` variant from Phase 2).

1. Add hamburger button (visible below 640px, hidden above)
2. Mobile menu: full-screen overlay with links stacked vertically
3. Vanilla JS: toggle `.is-open` class, trap focus, close on Escape
4. Animation: slide-down or fade-in
5. Aria: `aria-expanded`, `aria-controls`, `role="dialog"`

```html
<!-- Added to every nav variant -->
<button class="lp-nav-toggle" aria-expanded="false" aria-controls="lp-mobile-menu">
  <span class="lp-hamburger-icon"></span>
</button>
<div id="lp-mobile-menu" class="lp-mobile-menu" role="dialog" aria-modal="true">
  <!-- links rendered here -->
</div>
```

```css
.lp-nav-toggle { display: flex; /* mobile */ }
@media (min-width: 640px) { .lp-nav-toggle { display: none; } }
.lp-mobile-menu { display: none; }
.lp-mobile-menu.is-open { display: flex; flex-direction: column; /* overlay styles */ }
```

### Step 2: Responsive Audit — All Sections (4h)

Systematic check at 375px for each component:

| Component | Known Issues | Fix |
|-----------|-------------|-----|
| Hero (split) | 2-col side-by-side breaks | `flex-wrap: wrap` already there, verify min-width |
| Features (grid) | Cards too narrow at 2-col on 375px | Landing-grid classes already handle this (1-col at mobile) |
| Pricing (cards) | Cards overflow horizontally | `overflow-x: auto` wrapper, or stack vertically |
| Testimonials (carousel) | JS horizontal scroll | Ensure scroll-snap works on touch |
| Stats (row) | Values wrap awkwardly | Stack to 2x2 grid on mobile |
| Layout sections | Multi-col grids don't collapse | Phase 1 handles this (mobile-first CSS) — verify |
| Image-text | Side-by-side image+text | `flex-wrap: wrap` already there — verify |
| Footer (columns) | 4-col footer overflows | 2-col on tablet, 1-col on mobile |
| Comparison table | Wide table overflows | Horizontal scroll wrapper |

For each:
1. Test at 375px, 768px, 1440px
2. Fix overflow, text truncation, touch targets (min 44px)
3. Test font sizes with `clamp()` (already used, verify)

### Step 3: Dark Theme Card/Button Fixes (2h)

**Problem:** Cards on dark backgrounds inherit light-theme styles — borders invisible, buttons blend in.

**Solution:** Scoped CSS already handles some (`buildScopedCssFromStyles`). Expand:

1. When section has `textColor: #fff` (dark indicator):
   - Cards: `background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12)`
   - Buttons primary: keep `--lp-primary` bg (works on dark)
   - Buttons outline: `border-color: rgba(255,255,255,0.3); color: #fff`
   - Input fields: dark bg, light border, light text
   - Dividers: `rgba(255,255,255,0.1)`

2. Add CSS utility class `.lp-dark-section`:
```css
.lp-dark-section .lp-card-hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); }
.lp-dark-section .landing-btn-outline { border-color: rgba(255,255,255,0.3); color: #fff; }
.lp-dark-section input, .lp-dark-section textarea { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); color: #fff; }
```

3. Section renderer: auto-add `.lp-dark-section` when `style.textColor` is white-ish

### Step 4: Image Optimization (1.5h)

1. Add `loading="lazy"` to all `<img>` tags (most already have it — audit)
2. Add `decoding="async"` to non-hero images
3. Hero background images: no lazy (above the fold)
4. Add `width` + `height` attributes where known (prevents CLS)
5. Consider `<picture>` with WebP for hero backgrounds (stretch goal)

### Step 5: Accessibility Audit (1.5h)

1. **Color contrast**: Check all preset color combos against WCAG AA (4.5:1 text, 3:1 large text)
   - Test each preset's text-on-bg combinations
   - Fix any failing combos by adjusting `textMuted` colors
2. **Focus indicators**: Ensure visible focus ring on all interactive elements
   - Add `:focus-visible` outline to buttons, links, nav items
3. **Aria labels**: Nav, mobile menu, carousel controls, FAQ accordions
4. **Heading hierarchy**: Verify h1 -> h2 -> h3 order per page
5. **Skip navigation**: Add "Skip to content" link before nav
6. **Reduced motion**: Verify `prefers-reduced-motion` disables all animations (already partially done in CSS)

## Todo

- [ ] Hamburger nav for default/centered/transparent variants
- [ ] Mobile menu overlay with focus trap
- [ ] Responsive audit: hero variants at 375px
- [ ] Responsive audit: features/pricing/stats at 375px
- [ ] Responsive audit: layout sections collapse correctly
- [ ] Responsive audit: footer columns at 375px
- [ ] Dark section card/button CSS utility
- [ ] Auto-apply .lp-dark-section in section renderer
- [ ] Image optimization audit (lazy, decoding, dimensions)
- [ ] Accessibility: color contrast check for all presets
- [ ] Accessibility: focus indicators
- [ ] Accessibility: aria labels on interactive components
- [ ] Accessibility: skip-to-content link
- [ ] Test with VoiceOver (macOS) on 2 sample pages

## Success Criteria
- All pages usable on iPhone SE (375px) — no horizontal overflow, readable text, tappable buttons
- Hamburger nav works on all nav variants at mobile
- Dark-bg sections have visible cards, buttons, inputs
- All interactive elements have visible focus indicators
- No images without `loading` attribute
- Skip-to-content link present on all landing pages
- Lighthouse accessibility score > 90 on 2 test pages

## Risk Assessment
- **Hamburger JS in Astro**: Use `<script>` tag in component. Astro deduplicates scripts automatically. Keep under 30 lines.
- **Focus trap complexity**: Use simple approach — trap Tab key between first/last focusable elements in mobile menu. No library needed.
- **CLS from lazy images**: Mitigate with explicit `width`/`height` or `aspect-ratio` on containers.
