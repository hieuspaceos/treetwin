# Phase 1: Layout System Upgrade (16h)

## Context
- Current: `landing-layout.astro` renders a single CSS grid from `columns` ratio array
- No variant support, no responsive breakpoints, no nested layout nesting
- Layout type: `LayoutData { columns: number[], gap: string, children: LayoutChild[] }`

## Key Files
- `src/components/landing/landing-layout.astro` — layout renderer (82 lines)
- `src/lib/landing/landing-types.ts` — `LayoutData`, `LayoutChild` types
- `src/styles/landing.css` — grid utilities, responsive breakpoints
- `src/content.config.ts` — Zod schema for layout section

## Requirements

### Functional
- 8 layout variants covering real-world patterns
- Each variant stacks to single column on mobile (<640px)
- Nested sections inside layout columns render correctly
- Backward compatible: existing `columns: [1,1]` without variant still works as `grid` default

### Non-Functional
- No runtime JS — pure CSS layout
- Layout CSS < 100 lines total
- Each variant accessible via `variant` field in YAML data

## Layout Variants

| Variant | Description | Grid Template (desktop) | Use Case |
|---------|-------------|------------------------|----------|
| `grid` (default) | Equal/ratio columns from `columns` array | dynamic from ratios | General multi-col |
| `sidebar-left` | Narrow left + wide right | `280px 1fr` | Docs, filter+content |
| `sidebar-right` | Wide left + narrow right | `1fr 280px` | Content+sidebar |
| `asymmetric` | 60/40 split | `3fr 2fr` | Text-heavy+media |
| `thirds` | 3 equal columns | `1fr 1fr 1fr` | Feature cards row |
| `hero-split` | 55/45 with vertical center | `1.2fr 1fr` + align-items:center | Hero with media |
| `stacked` | Full-width rows (1 column) | `1fr` | Vertical stack within layout |
| `masonry` | CSS columns (not grid) | columns: 2/3 | Gallery, cards |

## Architecture

### Type Changes (`landing-types.ts`)

```typescript
export interface LayoutData {
  columns: number[]
  gap?: string
  children: LayoutChild[]
  /** Layout variant — determines CSS grid behavior */
  variant?: 'grid' | 'sidebar-left' | 'sidebar-right' | 'asymmetric' | 'thirds' | 'hero-split' | 'stacked' | 'masonry'
  /** Reverse column order on mobile (useful when image should appear before text on small screens) */
  mobileReverse?: boolean
  /** Vertical alignment of columns */
  alignItems?: 'start' | 'center' | 'end' | 'stretch'
}
```

### Component Changes (`landing-layout.astro`)

```astro
<!-- Variant determines grid-template-columns at desktop breakpoint -->
<!-- Mobile: all variants collapse to single column -->
<section class="landing-section">
  <div class:list={[`lp-layout`, `lp-layout--${variant}`, mobileReverse && 'lp-layout--reverse']}>
    {/* columns render inside */}
  </div>
</section>
```

### CSS Changes (`landing.css`)

```css
/* Base: mobile-first single column */
.lp-layout { display: grid; grid-template-columns: 1fr; gap: var(--lp-layout-gap, 1.5rem); }
.lp-layout--reverse > :first-child { order: 2; }
.lp-layout--reverse > :last-child { order: 1; }

/* Masonry uses CSS columns instead of grid */
.lp-layout--masonry { display: block; columns: 2; column-gap: 1.5rem; }
.lp-layout--masonry > * { break-inside: avoid; margin-bottom: 1.5rem; }

/* Desktop breakpoints */
@media (min-width: 768px) {
  .lp-layout--grid { /* dynamic via inline style */ }
  .lp-layout--sidebar-left { grid-template-columns: 280px 1fr; }
  .lp-layout--sidebar-right { grid-template-columns: 1fr 280px; }
  .lp-layout--asymmetric { grid-template-columns: 3fr 2fr; }
  .lp-layout--thirds { grid-template-columns: repeat(3, 1fr); }
  .lp-layout--hero-split { grid-template-columns: 1.2fr 1fr; align-items: center; }
  .lp-layout--stacked { grid-template-columns: 1fr; }
  .lp-layout--masonry { columns: 3; }
  .lp-layout--reverse > :first-child { order: unset; }
  .lp-layout--reverse > :last-child { order: unset; }
}
```

## Implementation Steps

1. **Update `LayoutData` type** in `landing-types.ts`
   - Add `variant`, `mobileReverse`, `alignItems` fields
   - Add variant union type

2. **Update `landing-layout.astro`**
   - Read `variant` from props (default `'grid'`)
   - Apply variant class `lp-layout--{variant}`
   - For `grid` variant, keep existing inline `grid-template-columns` from `columns` array
   - For named variants, rely on CSS classes (no inline grid template)
   - Apply `align-items` from props
   - Handle `mobileReverse` class

3. **Add layout CSS** to `landing.css`
   - Mobile-first: base = single column
   - Desktop (768px+): variant-specific grid templates
   - Masonry variant: CSS columns approach
   - Gap override via CSS custom property

4. **Update Zod schema** in `content.config.ts`
   - Add variant enum to layout section data (passthrough via `z.record(z.unknown())` already handles this, but document)

5. **Update clone prompts** in `landing-clone-ai.ts`
   - Add variant descriptions to LAYOUT section of `DIRECT_CLONE_PROMPT`
   - Add variant guidance to `STRUCTURE_PROMPT`

6. **Test with existing YAML pages**
   - Verify existing layout sections (no variant = `grid`) render unchanged
   - Create test YAML with each variant

## Todo

- [x] Update LayoutData type with variant field
- [x] Refactor landing-layout.astro to use variant classes
- [x] Write layout CSS (mobile-first + desktop breakpoints)
- [x] Update clone AI prompts with variant info
- [ ] Test backward compatibility with existing pages
- [ ] Test each variant with 2+ nested section types
- [ ] Test mobile collapse for all variants (375px)

## Success Criteria
- All 8 variants render correctly at 375px, 768px, 1024px, 1440px
- Existing layout sections without `variant` field render identically to v2
- Clone prompts reference layout variants for AI to choose from

## Risk Assessment
- **Masonry CSS columns** may not be supported in older Safari — fallback to 2-col grid
- **Inline grid-template override** on `grid` variant may conflict with CSS class — keep inline style for `grid` only, CSS for named variants
