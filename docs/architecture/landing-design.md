# Landing Page Design System (v2.6.0)

## Per-Page Design Customization

Each landing page supports custom design via CSS variables (`--lp-*` tokens).

### Design Customization Fields

- **Preset:** Select from 6 presets (clean-light, modern-dark, gradient-bold, startup-fresh, corporate-trust, warm-sunset)
- **Colors:** Primary, secondary, accent (hex or RGB)
- **Fonts:** Headings font, body font, border-radius
- **Google Fonts:** Auto-load from Google Fonts API (no external CDN)

### Implementation

- Design config stored in landing YAML: `metadata.design`
- Section components use `--lp-*` CSS vars instead of hardcoded colors
- Presets pre-define color schemes + font pairs
- Live preview updates without save

**Admin UI:** `/admin/landing/[slug]/design` panel with preset picker + custom editor

## Design Presets

| Preset | Tone | Colors | Fonts |
|--------|------|--------|-------|
| clean-light | Minimal, modern | Light grays + bright accent | Sans-serif + modern serif |
| modern-dark | Bold, tech-forward | Dark + vibrant neons | Modern sans-serif |
| gradient-bold | Creative, energetic | Gradient backgrounds + contrast | Display fonts |
| startup-fresh | Young, approachable | Pastels + bright highlights | Rounded sans-serif |
| corporate-trust | Professional, trustworthy | Blues + grays + gold | Conservative serif |
| warm-sunset | Organic, welcoming | Warm oranges + terracottas | Handwritten + natural serif |

## CSS Variables

All landing section components use `--lp-*` variables:

```css
--lp-primary: #3b82f6;
--lp-secondary: #ec4899;
--lp-accent: #f59e0b;
--lp-font-heading: 'Poppins', sans-serif;
--lp-font-body: 'Inter', sans-serif;
--lp-radius: 0.5rem;
--lp-spacing-base: 1rem;
```

## Section Layout Variants (36 Total)

Each section type supports multiple layout/design variants:

| Section | Variants | Example |
|---------|----------|---------|
| Hero | 4 | centered, split, video-bg, minimal |
| CTA | 5 | default, split, banner, minimal, with-image |
| Features | 3 | grid, list, alternating |
| Pricing | 3 | cards, simple, highlight-center |
| Testimonials | 3 | cards, single, minimal |
| FAQ | 3 | accordion, two-column, simple |
| Stats | 3 | row, cards, large |
| How It Works | 3 | numbered, timeline, cards |
| Team | 3 | grid, list, compact |
| Nav | 3 | default, centered, transparent |
| Footer | 3 | simple, columns, minimal |

**Implementation:** Each variant is a separate `.astro` component or conditional branch. Admin section picker shows variant selector.

## AI Landing Page Cloner (v2.6.0)

**Feature:** Paste URL → AI analyzes HTML → extracts sections + design → generates landing config

### Endpoint

```
POST /api/admin/landing/clone
Content-Type: application/json

{
  "url": "https://example.com"
}

Response:
{
  "landing": {
    "slug": "cloned-landing",
    "title": "...",
    "sections": [...],
    "metadata": { "design": {...} }
  },
  "design": {
    "preset": "modern-dark",
    "colors": {...},
    "fonts": {...}
  }
}
```

### Model

**Gemini 2.5 Flash** — Fast HTML analysis + section extraction

### Flow

1. User pastes URL in clone modal
2. Gemini analyzes HTML structure:
   - Extracts headings, sections, layout hierarchy
   - Identifies colors, fonts, visual patterns
   - Maps elements to landing section types
3. Returns:
   - YAML config with section data
   - Design preset matches + custom color values
4. User can edit before saving
5. Saved as draft for manual review

### Implementation

**Component:** `src/components/admin/landing/landing-clone-modal.tsx`
**API route:** `src/pages/api/admin/landing/clone.ts`
**Model:** `gemini-2.5-flash`

---

**Last updated:** 2026-03-27
**Version:** v2.6.0
