# Phase 4: Admin Landing Editor

## Context Links
- Admin layout: `src/components/admin/admin-layout.tsx`
- Admin sidebar: `src/components/admin/admin-sidebar.tsx`
- Content editor pattern: `src/components/admin/content-editor.tsx`
- Schema registry: `src/lib/admin/schema-registry.ts`
- Feature registry: `src/lib/admin/feature-registry.ts`
- Landing types: `src/lib/landing/landing-types.ts`

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 5h
- **Depends on:** Phase 2
- **Description:** React admin pages for managing landing page configs -- list pages, edit sections (reorder, toggle, edit content), preview.

## Key Insights
- Reuse existing admin patterns: `ContentList` for page list, form fields for section editing
- Section reorder via drag-drop (`@dnd-kit/core` -- lightweight, React-native) or simple up/down buttons (simpler, KISS)
- Each section type has a form generated from its typed props (similar to schema-registry field renderers)
- Live preview = open landing page URL in new tab (no in-admin iframe needed -- YAGNI)
- Admin reads/writes via `/api/admin/landing/*` endpoints (not direct file I/O from client)

## Requirements

### Functional
- List all landing pages with title, template, section count, status
- Create new landing page (blank or from template)
- Edit landing page: metadata (title, description) + sections
- Section management: add, remove, reorder, enable/disable, edit content
- Per-section inline editor with typed form fields
- Template selector when creating new page

### Non-functional
- Lazy-loaded React page (code-split from main admin bundle)
- Responsive admin UI consistent with existing glass morphism theme
- Optimistic UI updates with error rollback

## Architecture

### Admin Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/landing` | `LandingPagesList` | List all landing pages |
| `/admin/landing/new` | `LandingPageEditor` (new mode) | Create from template |
| `/admin/landing/:slug` | `LandingPageEditor` (edit mode) | Edit page + sections |

### API Endpoints (Admin)

```
GET    /api/admin/landing              -- list landing pages
POST   /api/admin/landing              -- create landing page
GET    /api/admin/landing/[slug]       -- read landing page config
PUT    /api/admin/landing/[slug]       -- update landing page config
DELETE /api/admin/landing/[slug]       -- delete landing page
GET    /api/admin/templates            -- list available templates
```

### Component Architecture

```
LandingPagesList (list view)
  -> LandingPageCard (per page)

LandingPageEditor (edit view)
  -> LandingPageMetaForm (title, description, template)
  -> SectionList (sortable list of sections)
    -> SectionCard (per section -- collapsible)
      -> SectionTypeIcon
      -> EnableToggle
      -> MoveUp/MoveDown buttons
      -> SectionContentForm (type-specific form fields)
        -> HeroForm / FeaturesForm / PricingForm / etc.
  -> AddSectionButton (dropdown of available section types)
  -> PreviewButton (opens landing page in new tab)
```

### Section Form Registry

```typescript
// src/components/admin/landing/section-form-registry.ts
import type { ComponentType } from 'react'

/** Maps section type to its form editor component */
export const sectionFormMap: Record<string, ComponentType<{ data: any; onChange: (data: any) => void }>> = {
  hero: HeroSectionForm,
  features: FeaturesSectionForm,
  pricing: PricingSectionForm,
  testimonials: TestimonialsSectionForm,
  faq: FaqSectionForm,
  cta: CtaSectionForm,
  stats: StatsSectionForm,
  'how-it-works': HowItWorksSectionForm,
  team: TeamSectionForm,
  'logo-wall': LogoWallSectionForm,
}
```

### Section Reorder Strategy

**KISS approach: up/down buttons** (not drag-drop)
- Avoid `@dnd-kit` dependency (12KB gzipped)
- Up/down arrows per section card
- Reorder updates `order` field in YAML
- Can upgrade to drag-drop later if users demand it

```typescript
function moveSection(sections: LandingSection[], index: number, direction: 'up' | 'down') {
  const newSections = [...sections]
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= newSections.length) return newSections
  ;[newSections[index], newSections[target]] = [newSections[target], newSections[index]]
  return newSections.map((s, i) => ({ ...s, order: i + 1 }))
}
```

### Landing Page Admin API Implementation

```typescript
// src/pages/api/admin/landing/index.ts
import type { APIRoute } from 'astro'
import { getContentIO } from '@/lib/admin/content-io'
import { verifySession } from '@/lib/admin/auth'

export const prerender = false

export const GET: APIRoute = async ({ request }) => {
  const auth = verifySession(request)
  if (!auth.ok) return auth.response

  const io = getContentIO()
  // Read all YAML files from landing-pages directory
  const pages = await io.listCollection('landing-pages')
  return json({ ok: true, data: { entries: pages } })
}

export const POST: APIRoute = async ({ request }) => {
  const auth = verifySession(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const io = getContentIO()
  await io.writeEntry('landing-pages', body.slug, body)
  return json({ ok: true, data: { slug: body.slug } }, 201)
}
```

## Related Code Files

### Create
- `src/components/admin/landing/landing-pages-list.tsx` -- list view
- `src/components/admin/landing/landing-page-editor.tsx` -- main edit view
- `src/components/admin/landing/landing-section-card.tsx` -- collapsible section card
- `src/components/admin/landing/landing-section-forms.tsx` -- per-type form components (bundled)
- `src/components/admin/landing/section-form-registry.ts` -- type->form mapping
- `src/pages/api/admin/landing/index.ts` -- list + create
- `src/pages/api/admin/landing/[slug].ts` -- read + update + delete
- `src/pages/api/admin/templates/index.ts` -- list templates

### Modify
- `src/components/admin/admin-layout.tsx` -- add landing routes (lazy-loaded)
- `src/lib/admin/api-client.ts` -- add `landing` and `templates` API methods
- `src/lib/admin/content-io-types.ts` -- may need landing-specific path helpers
- `src/lib/admin/validation.ts` -- add `'landing-pages'` to ALLOWED_COLLECTIONS

## Implementation Steps

1. Add `'landing-pages'` to `ALLOWED_COLLECTIONS` in `validation.ts`
2. Create admin API endpoints:
   - `src/pages/api/admin/landing/index.ts` (GET list, POST create)
   - `src/pages/api/admin/landing/[slug].ts` (GET read, PUT update, DELETE)
   - `src/pages/api/admin/templates/index.ts` (GET list templates)
3. Add `landing` API methods to `api-client.ts`
4. Create `section-form-registry.ts` mapping section types to form components
5. Create `landing-section-forms.tsx` -- form components for each section type:
   - `HeroSectionForm`: headline, subheadline, CTA text/url inputs
   - `FeaturesSectionForm`: dynamic array of {icon, title, description}
   - `PricingSectionForm`: dynamic array of plans with feature lists
   - `TestimonialsSectionForm`: dynamic array of {quote, name, role, company}
   - `FaqSectionForm`: dynamic array of {question, answer}
   - `CtaSectionForm`: headline, subheadline, CTA, variant select
   - `StatsSectionForm`: dynamic array of {value, label, prefix, suffix}
   - `HowItWorksSectionForm`: dynamic array of {title, description}
   - `TeamSectionForm`: dynamic array of {name, role, photo, social links}
   - `LogoWallSectionForm`: dynamic array of {name, image, url}
6. Create `landing-section-card.tsx` -- collapsible card with enable toggle + move buttons + section form
7. Create `landing-page-editor.tsx` -- metadata form + section list + add section + preview button
8. Create `landing-pages-list.tsx` -- grid of page cards with create new button
9. Add lazy routes to `admin-layout.tsx`:
   ```tsx
   const LazyLandingList = lazy(() => import('./landing/landing-pages-list'))
   const LazyLandingEditor = lazy(() => import('./landing/landing-page-editor'))
   ```
10. Test full CRUD flow: create from template -> edit sections -> reorder -> preview

## Todo List
- [ ] Add `'landing-pages'` to `ALLOWED_COLLECTIONS`
- [ ] Create admin landing API endpoints (3 files)
- [ ] Create templates list API endpoint
- [ ] Add API client methods for landing + templates
- [ ] Create section form registry
- [ ] Create section form components (10 types)
- [ ] Create section card component
- [ ] Create landing page editor
- [ ] Create landing pages list
- [ ] Add lazy routes to admin-layout
- [ ] Test full CRUD flow

## Success Criteria
- Admin can list, create, edit, delete landing pages
- Sections can be added, removed, reordered, enabled/disabled
- Per-section forms correctly edit all fields
- Template selection works on create
- Preview opens correct landing page URL
- All admin interactions persist to YAML via API

## Risk Assessment
- **Risk:** Section forms become complex (pricing with nested arrays) -> **Mitigation:** use existing array field renderer pattern from content-editor; keep forms simple with add/remove item buttons
- **Risk:** Admin bundle size increase -> **Mitigation:** lazy-load entire landing editor module
- **Risk:** Content-IO doesn't handle landing-pages collection -> **Mitigation:** landing pages are YAML same as notes/records, so content-io pattern works with minimal extension

## Security Considerations
- All admin endpoints require JWT session (existing `verifySession` middleware)
- Feature guard checks `landing` feature toggle
- Slug validation prevents path traversal (existing `isValidSlug`)

## GoClaw Integration Points
- Admin API endpoints share the same content-io layer as GoClaw endpoints
- Both admin and GoClaw write to same YAML files
- Admin provides visual editing, GoClaw provides programmatic editing
