# Phase 4 — SEO Fields for Landing Pages

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 45min (reduced — reuse existing SEO system from articles)
- **Description:** Wire landing pages into the existing SEO system used by articles (ogImage, seoTitle, noindex, SEO score panel)

## Context — What Articles Already Have
- `schema-registry.ts` → `ogImage`, `seoTitle`, `noindex` fields with media browse
- `seo-score-panel.tsx` → scores title length, description, keywords, ogImage
- `[slug].astro` (articles) → renders `og:image`, JSON-LD, canonical
- `base-head.astro` → renders `og:title`, `og:description` but NO `og:image`

## What Landing Pages Are Missing
- No `seo` field in `LandingPageConfig`
- No `og:image` meta tag in `landing-layout.astro` or `[landing].astro`
- No SEO score panel in landing page editor
- No `noindex` option

## Architecture — Reuse, Don't Rebuild

```
1. Add `seo` field to LandingPageConfig type (landing-types.ts)
2. Add SEO fields to editor settings panel (reuse existing input pattern)
3. Pass ogImage to landing-layout.astro → inject via <slot name="head">
4. Optionally embed seo-score-panel.tsx in editor (already built for articles)
```

## Implementation Steps

1. **Add `seo` to `LandingPageConfig`** in `landing-types.ts`:
   ```typescript
   seo?: { ogImage?: string; keywords?: string; canonicalUrl?: string; noindex?: boolean }
   ```

2. **Add SEO fields to editor settings panel** (`landing-page-editor.tsx`):
   - OG Image URL input (use ImageField component for drag-drop)
   - Keywords input (comma-separated text)
   - Canonical URL override (optional)
   - Noindex checkbox
   - Collapsible section "SEO Settings"

3. **Render in `[landing].astro`**:
   - Pass `seo.ogImage` to layout via head slot
   - `<meta property="og:image" content={seo.ogImage} />`
   - `<meta name="keywords" content={seo.keywords} />`
   - `<link rel="canonical" href={seo.canonicalUrl || autoCanonical} />`
   - `{seo.noindex && <meta name="robots" content="noindex" />}`

4. **Optional: Embed SEO score panel** from `seo-score-panel.tsx` if API compatible

## Related Code Files
- **Modify:** `src/lib/landing/landing-types.ts` — add `seo` field
- **Modify:** `src/components/admin/landing/landing-page-editor.tsx` — SEO settings section
- **Modify:** `src/pages/[landing].astro` — render SEO meta tags
- **Reuse:** `src/components/admin/seo-score-panel.tsx` (from articles)
- **Reuse:** `src/components/admin/landing/landing-image-field.tsx` (for OG image)

## Success Criteria
- Landing pages render `og:image` when set
- Editor has collapsible SEO section with ogImage, keywords, canonical, noindex
- `noindex` prevents search engine indexing when checked
