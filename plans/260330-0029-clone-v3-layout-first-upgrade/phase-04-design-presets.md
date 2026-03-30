# Phase 4: Design Presets & Theme System (10h)

## Context
- Current: `LandingDesign` supports per-page colors, fonts, borderRadius via `design` YAML field
- CSS vars (`--lp-primary`, etc.) set via inline styles on `.landing-page-root`
- `design.preset` field exists in types but not implemented
- Scoped CSS already overrides per-section styles

## Key Files
- `src/lib/landing/landing-types.ts` — `LandingDesign` type (has `preset?: string`)
- `src/styles/landing.css` — CSS var defaults
- `src/content.config.ts` — Zod schema (has `preset` field)
- Landing page renderer (likely `src/pages/[slug].astro` or similar)

## Preset Definitions

5 built-in presets. Each = full set of CSS var values.

### 1. SaaS Dark (`saas-dark`)
Inspired by: claudekit.cc, linear.app
```
primary: #6366f1, secondary: #8b5cf6, accent: #22d3ee
background: #0f172a, surface: #1e293b, text: #f1f5f9, textMuted: #94a3b8
fonts: { heading: "Inter", body: "Inter" }
borderRadius: 12px
```

### 2. Travel Warm (`travel-warm`)
Inspired by: aucoeurvietnam.com, boutique travel
```
primary: #2d4a3e, secondary: #1a2e28, accent: #d4a853
background: #faf8f5, surface: #ffffff, text: #1a2e28, textMuted: #5c6b63
fonts: { heading: "Playfair Display", body: "Lato" }
borderRadius: 8px
```

### 3. Corporate Clean (`corporate`)
Inspired by: stripe.com, notion.so
```
primary: #0066ff, secondary: #1a1a2e, accent: #ff6b35
background: #ffffff, surface: #f7f8fa, text: #1a1a2e, textMuted: #6b7280
fonts: { heading: "Inter", body: "Inter" }
borderRadius: 8px
```

### 4. Creative Agency (`creative`)
Inspired by: awwwards-style agencies
```
primary: #ff3366, secondary: #6c5ce7, accent: #ffd93d
background: #ffffff, surface: #f8f9ff, text: #2d3436, textMuted: #636e72
fonts: { heading: "Space Grotesk", body: "DM Sans" }
borderRadius: 16px
```

### 5. E-commerce (`ecommerce`)
Inspired by: shopify stores, product-focused
```
primary: #1a1a1a, secondary: #333333, accent: #e74c3c
background: #ffffff, surface: #f5f5f5, text: #1a1a1a, textMuted: #757575
fonts: { heading: "Poppins", body: "Open Sans" }
borderRadius: 6px
```

## Architecture

### Preset Registry

New file: `src/lib/landing/landing-design-presets.ts`

```typescript
import type { LandingDesign } from './landing-types'

export const DESIGN_PRESETS: Record<string, LandingDesign> = {
  'saas-dark': { colors: {...}, fonts: {...}, borderRadius: '12px' },
  'travel-warm': { colors: {...}, fonts: {...}, borderRadius: '8px' },
  // ...
}

/** Resolve design — preset values as base, per-page overrides on top */
export function resolveDesign(design?: LandingDesign): LandingDesign {
  if (!design) return DESIGN_PRESETS['corporate'] // default
  const preset = design.preset ? DESIGN_PRESETS[design.preset] : {}
  return deepMerge(preset, design) // page-level overrides win
}
```

### Smart Style Defaults Update

`applySmartStyleDefaults()` in `landing-clone-ai.ts` uses hardcoded colors. Update to read from resolved preset instead.

### Admin Preset Switcher

Add preset dropdown to admin landing page editor. On change:
1. Update `design.preset` in YAML
2. Clear `design.colors` / `design.fonts` (let preset handle them)
3. Page re-renders with new preset vars

## Implementation Steps

### Step 1: Preset Registry (2h)
1. Create `src/lib/landing/landing-design-presets.ts`
2. Define 5 presets with full color/font/radius values
3. Implement `resolveDesign()` merge function
4. Export preset names list for admin UI

### Step 2: Page Renderer Integration (2h)
1. Find landing page renderer (`[slug].astro` or similar)
2. Call `resolveDesign(config.design)` before rendering
3. Apply resolved design as CSS vars on `.landing-page-root`
4. Add Google Fonts `<link>` tags for preset fonts

### Step 3: Google Fonts Loading (1h)
1. Map preset font names to Google Fonts URLs
2. Conditionally inject `<link>` in `<head>` based on resolved fonts
3. Font display: `swap` for performance

### Step 4: Admin Preset Switcher (3h)
1. Add preset dropdown to landing page editor sidebar
2. Show preset preview (color swatches + font name)
3. On selection: update YAML `design.preset`, clear manual overrides
4. Allow "Custom" option that reveals color/font pickers

### Step 5: Clone Pipeline Integration (2h)
1. After design extraction, match extracted colors to nearest preset
2. Set `design.preset` if match confidence > 80%
3. Fall back to custom colors if no preset matches
4. Update `applySmartStyleDefaults()` to use preset-aware colors

## Todo

- [ ] Create design presets registry file
- [ ] Implement resolveDesign() merge function
- [ ] Integrate preset resolution into page renderer
- [ ] Add Google Fonts conditional loading
- [ ] Build admin preset switcher UI
- [ ] Add preset matching to clone pipeline
- [ ] Test each preset with a full-featured landing page
- [ ] Verify preset + manual override layering works

## Success Criteria
- Switching preset in admin changes entire page look instantly
- Clone pipeline auto-detects closest preset
- Manual color overrides layer on top of preset
- Google Fonts load correctly for non-system fonts
- No flash of unstyled text (FOUT) — font-display: swap

## Risk Assessment
- **Google Fonts dependency**: If blocked, fall back to system fonts. Preset defines both custom + system fallback.
- **Preset matching accuracy**: Color distance algorithm (Delta E) needed for reliable matching. Start simple: exact hex match on primary color.
