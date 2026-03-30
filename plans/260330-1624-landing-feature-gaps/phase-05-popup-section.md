# Phase 5 — Popup/Modal Section

## Overview
- **Priority:** P3
- **Status:** pending
- **Effort:** 3h
- **Description:** New section type `popup` — configurable trigger (scroll %, time delay, exit intent), rich content (heading, text, CTA, image), dismiss behavior. Renders as fixed overlay on the public page.

## Context
- 26 section types currently exist (see `SectionType` union in `landing-types.ts`)
- Section pipeline: type definition → smart default → form component → Astro renderer → register in maps
- `SECTION_GROUPS` in editor organizes types by category — popup goes under "Engagement"
- `landing-section-renderer.astro` has `componentMap` + body/nav/footer separation logic
- Popup is NOT a visible "body" section — it overlays the entire page. Renderer must handle it specially.

## Architecture

### Data Model
```ts
export interface PopupData {
  heading?: string
  text?: string
  image?: string
  cta?: { text: string; url: string }
  trigger: {
    type: 'scroll' | 'time' | 'exit-intent'
    /** Scroll %: 0-100. Time: delay in seconds */
    value?: number
  }
  /** Show once per session (sessionStorage) vs every page load */
  showOnce?: boolean
  /** Dismiss button label (default: "✕") */
  dismissLabel?: string
  variant?: 'centered' | 'bottom-bar' | 'slide-in-right'
}
```

### Rendering Strategy
Popup is client-side JS — triggers based on scroll/time/exit. The Astro component renders a hidden `<dialog>` element + inline `<script>` for trigger logic. No React island needed.

`sessionStorage` key: `popup-dismissed-{pageSlug}` — prevents repeated popups when `showOnce: true`.

## Related Code Files
- **Modify:** `src/lib/landing/landing-types.ts` — add `PopupData`, extend `SectionType` + `SectionData`
- **Create:** `src/components/landing/landing-popup.astro` — popup Astro component
- **Modify:** `src/components/landing/landing-section-renderer.astro` — register popup, render outside body sections
- **Modify:** `src/components/admin/landing/landing-page-editor.tsx` — add popup to `SECTION_GROUPS`
- **Modify:** `src/components/admin/landing/landing-section-forms.tsx` — add `PopupForm`
- **Modify:** `src/components/admin/landing/landing-smart-defaults.ts` — add popup default
- **Modify:** `src/components/admin/landing/landing-label-maps.ts` — add popup label
- **Modify:** `src/styles/landing.css` — popup styles

## Implementation Steps

### Step 1: Type Definitions (`landing-types.ts`)

1. Add `PopupData` interface (see Architecture above)
2. Add `'popup'` to `SectionType` union
3. Add `PopupData` to `SectionData` union

### Step 2: Smart Default (`landing-smart-defaults.ts`)

```ts
popup: {
  heading: 'Wait! Before You Go...',
  text: 'Get 20% off your first order with code WELCOME20',
  cta: { text: 'Claim Discount', url: '#pricing' },
  trigger: { type: 'exit-intent' },
  showOnce: true,
  variant: 'centered',
},
```

### Step 3: Admin Form (`landing-section-forms.tsx`)

Add `PopupForm` component with fields:
- Heading (text input)
- Text (textarea)
- Image URL (ImageField)
- CTA text + URL (inline row)
- Trigger type (select: scroll / time / exit-intent)
- Trigger value (number input — shown for scroll/time only)
- Show once (checkbox)
- Variant (VariantPicker: centered / bottom-bar / slide-in-right)
- Dismiss label (text input, placeholder "✕")

Register in `sectionFormMap`:
```ts
popup: PopupForm,
```

### Step 4: Label + Catalog

In `landing-label-maps.ts`:
```ts
popup: 'Popup',
```

In `landing-page-editor.tsx` `SECTION_GROUPS`, add to Engagement group:
```ts
{ type: 'popup', label: 'Popup', icon: '🪟', desc: 'A popup that appears based on scroll position, time delay, or exit intent.' },
```

### Step 5: Astro Component (`landing-popup.astro`)

```astro
---
import type { PopupData } from '@/lib/landing/landing-types'
const props = Astro.props as PopupData & { pageSlug?: string }
const { heading, text, image, cta, trigger, showOnce = true, dismissLabel = '✕', variant = 'centered' } = props
const popupId = `popup-${Math.random().toString(36).slice(2, 8)}`
---

<dialog id={popupId} class={`lp-popup lp-popup--${variant}`}>
  <div class="lp-popup__content">
    <button class="lp-popup__close" aria-label="Close">{dismissLabel}</button>
    {image && <img src={image} alt="" class="lp-popup__image" loading="lazy" />}
    {heading && <h2 class="lp-popup__heading">{heading}</h2>}
    {text && <p class="lp-popup__text">{text}</p>}
    {cta && <a href={cta.url} class="lp-popup__cta">{cta.text}</a>}
  </div>
</dialog>

<script define:vars={{ popupId, trigger, showOnce, pageSlug: props.pageSlug }}>
  // ...trigger logic (scroll observer / setTimeout / mouseleave)
</script>
```

Trigger implementations:
- **scroll:** `IntersectionObserver` on a sentinel div at `trigger.value`% of page height
- **time:** `setTimeout(showPopup, trigger.value * 1000)`
- **exit-intent:** `document.addEventListener('mouseleave', ...)` on top edge

Dismiss: `dialog.close()` + write `sessionStorage` key if `showOnce`.

### Step 6: Register in Renderer

In `landing-section-renderer.astro`:
1. Import: `import LandingPopup from './landing-popup.astro'`
2. Add to `componentMap`: `popup: LandingPopup,`
3. Extract popup sections separately (like nav/footer):
   ```ts
   const popupSections = enabled.filter(s => s.type === 'popup')
   const bodySections = enabled.filter(s => s.type !== 'nav' && s.type !== 'footer' && s.type !== 'popup')
   ```
4. Render popups after the `landing-sections` div:
   ```astro
   {popupSections.map(s => <LandingPopup {...s.data as any} pageSlug={pageTitle} />)}
   ```

### Step 7: CSS (`landing.css`)

Add popup styles (~40 lines):
- `.lp-popup` — `<dialog>` reset, fixed positioning, backdrop blur
- `.lp-popup--centered` — centered modal with max-width 480px
- `.lp-popup--bottom-bar` — fixed bottom strip
- `.lp-popup--slide-in-right` — slides in from right edge
- `.lp-popup__close` — absolute top-right, hover effect
- `.lp-popup__cta` — matches design system primary button
- `::backdrop` — semi-transparent dark overlay
- Animation: `@keyframes popup-appear` for fade+scale entrance

## Todo
- [ ] Add `PopupData` to `landing-types.ts`
- [ ] Add `'popup'` to `SectionType` union
- [ ] Add popup smart default
- [ ] Create `PopupForm` in section forms
- [ ] Register in `sectionFormMap`, label map, section catalog
- [ ] Create `landing-popup.astro` with trigger logic
- [ ] Register in `landing-section-renderer.astro`
- [ ] Add popup CSS to `landing.css`
- [ ] Test scroll trigger at 50%
- [ ] Test time delay trigger (3s)
- [ ] Test exit intent trigger
- [ ] Test `showOnce` behavior (dismiss → refresh → no popup)
- [ ] Test all 3 variants (centered, bottom-bar, slide-in-right)

## Success Criteria
- Popup appears based on configured trigger
- All 3 trigger types work correctly
- `showOnce` prevents re-display in same session
- Dismiss button closes popup
- CTA link navigates correctly
- 3 visual variants render correctly
- Popup visible in admin section list, editable via form

## Risk Assessment
- **Medium risk.** New section type touches multiple files. Exit-intent detection unreliable on mobile (no `mouseleave` event) — degrade gracefully (skip trigger on touch devices or fall back to scroll/time).
- **Mitigation:** Use `window.matchMedia('(hover: hover)')` to detect mouse capability. On touch devices, exit-intent falls back to 75% scroll trigger.

## Security Considerations
- Popup content from YAML — no user-generated HTML injection risk (Astro auto-escapes)
- `cta.url` rendered as `href` — standard link behavior, no `javascript:` protocol risk
