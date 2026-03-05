# Phase 2: Payload CMS Collections & Schema

## Context Links
- [Payload CMS 3.0 Research](../reports/researcher-260305-1704-payload-cms-3-nextjs-integration.md) — Sections 3 (Collections API), 4 (Search Plugin)
- [Phase 1](./phase-01-project-setup-infrastructure.md)

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 5h
- **Depends on:** Phase 1
- Define Articles, Notes, Records, Media collections with video-factory contract fields. Configure Search plugin. Implement afterChange hooks for ISR revalidation.

## Key Insights
- All 3 seed collections share common base fields (title, slug, status, tags, seo, video, links)
- Use a shared `baseSeedFields` array to DRY field definitions
- Video-factory contract fields are LOCKED — must match spec exactly
- `@payloadcms/plugin-search` indexes Articles + Notes for full-text search
- Slug auto-generation via `beforeValidate` hook (title → kebab-case)
- Lexical editor for Articles rich text; textarea for Notes

## Requirements

### Functional
- **Articles:** title, description, slug (auto), type, status (draft|published), publishedAt, updatedAt, tags, category, seo group, cover, richText (Lexical), video group, links group
- **Notes:** same base fields, textarea content instead of richText, same video + links
- **Records:** same base + `recordType` (project|product|experiment), `recordData` (JSON), same video + links
- **Media:** upload collection using R2, alt text field
- **Search:** Articles + Notes indexed via Payload Search Plugin
- **Hooks:** slug auto-gen, publishedAt auto-set, ISR revalidation on publish

### Non-Functional
- All collections use TypeScript types (auto-generated)
- Access control: read=public, create/update/delete=admin only

## Architecture

### Shared Base Fields (DRY)
```typescript
// src/collections/fields/base-seed-fields.ts
import type { Field } from 'payload'

export const baseSeedFields: Field[] = [
  { name: 'title', type: 'text', required: true },
  { name: 'description', type: 'textarea', required: true },
  {
    name: 'slug', type: 'text', required: true, unique: true,
    admin: { readOnly: true, position: 'sidebar' },
  },
  {
    name: 'status', type: 'select',
    options: [
      { label: 'Draft', value: 'draft' },
      { label: 'Published', value: 'published' },
    ],
    defaultValue: 'draft', required: true,
  },
  { name: 'publishedAt', type: 'date', admin: { readOnly: true, position: 'sidebar' } },
  {
    name: 'tags', type: 'array',
    fields: [{ name: 'tag', type: 'text', required: true }],
  },
  { name: 'category', type: 'text' },
  // SEO group
  {
    name: 'seo', type: 'group',
    fields: [
      { name: 'seoTitle', type: 'text' },
      { name: 'ogImage', type: 'text' },
      { name: 'noindex', type: 'checkbox', defaultValue: false },
    ],
  },
  // Cover image
  {
    name: 'cover', type: 'group',
    fields: [
      { name: 'url', type: 'text' },
      { name: 'alt', type: 'text' },
    ],
  },
  // Video-factory contract (LOCKED)
  {
    name: 'video', type: 'group',
    fields: [
      { name: 'enabled', type: 'checkbox', defaultValue: false },
      {
        name: 'style', type: 'select',
        options: [
          { label: 'Cinematic', value: 'cinematic' },
          { label: 'Tutorial', value: 'tutorial' },
          { label: 'Vlog', value: 'vlog' },
        ],
      },
      {
        name: 'sections', type: 'array',
        fields: [
          { name: 'sectionId', type: 'text', required: true },
          { name: 'timestamp', type: 'text' },
          { name: 'narration', type: 'textarea' },
          { name: 'bRollQuery', type: 'text' },
          { name: 'onScreenText', type: 'text' },
          {
            name: 'mediaRefs', type: 'array',
            fields: [{ name: 'ref', type: 'text' }],
          },
        ],
      },
    ],
  },
  // Zettelkasten links (Phase 2 activation, define now)
  {
    name: 'links', type: 'group',
    fields: [
      {
        name: 'outbound', type: 'array',
        fields: [{ name: 'slug', type: 'text' }],
      },
    ],
  },
]
```

### Collection-Specific Differences
- **Articles:** adds `richText` field (Lexical editor)
- **Notes:** adds `content` textarea field
- **Records:** adds `recordType` select + `recordData` JSON field

## Related Code Files

### Create
- `src/collections/fields/base-seed-fields.ts` — shared field definitions
- `src/collections/Articles.ts`
- `src/collections/Notes.ts`
- `src/collections/Records.ts`
- `src/collections/Media.ts`
- `src/collections/hooks/auto-slug.ts` — beforeValidate hook
- `src/collections/hooks/set-published-at.ts` — beforeChange hook
- `src/collections/hooks/revalidate-page.ts` — afterChange hook for ISR

### Modify
- `src/payload.config.ts` — register collections + search plugin

## Implementation Steps

1. **Create `src/collections/fields/base-seed-fields.ts`** — shared field array as shown in Architecture section.

2. **Create `src/collections/hooks/auto-slug.ts`:**
   ```typescript
   import type { CollectionBeforeValidateHook } from 'payload'

   export const autoSlug: CollectionBeforeValidateHook = ({ data, operation }) => {
     if (operation === 'create' && data?.title && !data?.slug) {
       data.slug = data.title
         .toLowerCase()
         .replace(/[^a-z0-9]+/g, '-')
         .replace(/(^-|-$)/g, '')
     }
     return data
   }
   ```

3. **Create `src/collections/hooks/set-published-at.ts`:**
   ```typescript
   import type { CollectionBeforeChangeHook } from 'payload'

   export const setPublishedAt: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
     if (data.status === 'published' && originalDoc?.status !== 'published') {
       data.publishedAt = new Date().toISOString()
     }
     return data
   }
   ```

4. **Create `src/collections/hooks/revalidate-page.ts`:**
   ```typescript
   import type { CollectionAfterChangeHook } from 'payload'
   import { revalidatePath } from 'next/cache'

   export const revalidatePage: CollectionAfterChangeHook = ({ doc }) => {
     if (doc.status === 'published') {
       revalidatePath(`/seeds/${doc.slug}`)
       revalidatePath('/')
     }
     return doc
   }
   ```

5. **Create `src/collections/Articles.ts`:**
   - Import `baseSeedFields`, spread into fields array
   - Add `content` field with `type: 'richText'` (Lexical)
   - Register hooks: autoSlug, setPublishedAt, revalidatePage
   - `admin.useAsTitle: 'title'`

6. **Create `src/collections/Notes.ts`:**
   - Import `baseSeedFields`
   - Add `content` field with `type: 'textarea'`
   - Same hooks as Articles

7. **Create `src/collections/Records.ts`:**
   - Import `baseSeedFields`
   - Add `recordType` select: project|product|experiment
   - Add `recordData` JSON field
   - Same hooks minus revalidatePage (records not displayed as pages in MVP)

8. **Create `src/collections/Media.ts`:**
   ```typescript
   import type { CollectionConfig } from 'payload'

   export const Media: CollectionConfig = {
     slug: 'media',
     access: { read: () => true },
     upload: true,
     fields: [
       { name: 'alt', type: 'text', required: true },
     ],
   }
   ```

9. **Update `src/payload.config.ts`:**
   - Import all 4 collections + Users
   - Add `searchPlugin({ collections: ['articles', 'notes'] })`
   - Add `s3Storage()` plugin for Media collection
   - Register all collections

10. **Run type generation:**
    ```bash
    npx payload generate:types
    npx payload migrate:create add-collections
    ```

11. **Verify:** Admin panel shows all collections with correct fields.

## Todo List

- [ ] Create `src/collections/fields/base-seed-fields.ts`
- [ ] Create `src/collections/hooks/auto-slug.ts`
- [ ] Create `src/collections/hooks/set-published-at.ts`
- [ ] Create `src/collections/hooks/revalidate-page.ts`
- [ ] Create `src/collections/Articles.ts`
- [ ] Create `src/collections/Notes.ts`
- [ ] Create `src/collections/Records.ts`
- [ ] Create `src/collections/Media.ts`
- [ ] Update `src/payload.config.ts` with collections + plugins
- [ ] Run `payload generate:types`
- [ ] Run `payload migrate:create add-collections`
- [ ] Verify all collections visible in admin panel
- [ ] Verify slug auto-generation works
- [ ] Verify publishedAt auto-set on publish
- [ ] Verify search plugin indexes Articles + Notes

## Success Criteria
- All 4 collections (+ Users) visible in Payload admin
- Creating an Article auto-generates slug from title
- Changing status to "published" sets `publishedAt`
- Video group fields match locked contract exactly
- Search collection returns results for indexed content
- Media uploads go to R2 (not local filesystem)

## Risk Assessment
- **Field schema drift:** Video-factory contract is locked; any changes require versioned migration
- **Search plugin compatibility:** Verify `@payloadcms/plugin-search` works with `@payloadcms/db-postgres` — research report flagged uncertainty about PG indexing
- **Large base fields array:** 10+ shared fields — keep in single file; don't over-abstract

## Security Considerations
- Access control: `read: () => true` for public content, admin-only for mutations
- No user-uploaded executable files — Media collection should validate MIME types
- JSON field (`recordData`) should be validated/sanitized before storage

## Next Steps
- Phase 4 depends on these collections for frontend data fetching
- Phase 6 adds video-manifest afterChange hook to Articles + Notes
