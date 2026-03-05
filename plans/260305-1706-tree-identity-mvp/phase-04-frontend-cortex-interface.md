# Phase 4: Frontend — Cortex Interface

## Context Links
- [Payload CMS 3.0 Research](../reports/researcher-260305-1704-payload-cms-3-nextjs-integration.md) — Section 6 (REST API)
- [Phase 2](./phase-02-payload-collections-schema.md)

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 6h
- **Depends on:** Phase 2 (collections must exist)
- Build frontend pages: homepage (seed list), seed detail with ToC, search page. All components consume `site-config.ts`. ISR with on-demand revalidation.

## Key Insights
- Use Payload Local API (server-side) for data fetching — no REST calls from server components
- `payload.find()` and `payload.findBySlug()` in RSCs, not `fetch('/api/...')`
- Dynamic ToC via heading extraction from Lexical serialized content
- IntersectionObserver for scroll-spy (client component)
- ISR: `revalidate = 3600` + on-demand via Payload afterChange hook (already in Phase 2)
- Search via Payload REST API from client (search collection)

## Requirements

### Functional
- Homepage: list latest published seeds (Articles + Notes), paginated
- Seed detail: render content with dynamic ToC + scroll-spy
- Search page: query Payload search collection, display results
- Navigation: site name + social links from site-config.ts
- Breadcrumbs: Home > Collection > Seed title
- Responsive design (mobile-first)

### Non-Functional
- ISR with 1h revalidation + on-demand
- Core Web Vitals: LCP < 2.5s
- All styles via Tailwind + CSS variables from site-config theme

## Architecture

```
src/app/
├── (frontend)/
│   ├── layout.tsx        # Nav + Footer
│   ├── page.tsx          # Homepage — latest seeds
│   ├── seeds/
│   │   └── [slug]/
│   │       └── page.tsx  # Seed detail + ToC
│   └── search/
│       └── page.tsx      # Search UI
src/components/
├── nav.tsx
├── seed-card.tsx
├── toc.tsx               # Client component
├── breadcrumb.tsx
├── lexical-renderer.tsx  # Serialize Lexical JSON → React
└── search-input.tsx      # Client component
src/lib/
└── payload-helpers.ts    # getPayload() + typed query wrappers
```

## Related Code Files

### Create
- `src/app/(frontend)/layout.tsx`
- `src/app/(frontend)/page.tsx`
- `src/app/(frontend)/seeds/[slug]/page.tsx`
- `src/app/(frontend)/search/page.tsx`
- `src/components/nav.tsx`
- `src/components/seed-card.tsx`
- `src/components/toc.tsx`
- `src/components/breadcrumb.tsx`
- `src/components/lexical-renderer.tsx`
- `src/components/search-input.tsx`
- `src/lib/payload-helpers.ts`

## Implementation Steps

1. **Create `src/lib/payload-helpers.ts`:**
   ```typescript
   import { getPayload } from 'payload'
   import config from '@/payload.config'

   export async function getPayloadClient() {
     return getPayload({ config })
   }

   export async function getPublishedSeeds(collection: 'articles' | 'notes', limit = 10, page = 1) {
     const payload = await getPayloadClient()
     return payload.find({
       collection,
       where: { status: { equals: 'published' } },
       sort: '-publishedAt',
       limit,
       page,
     })
   }

   export async function getSeedBySlug(collection: 'articles' | 'notes', slug: string) {
     const payload = await getPayloadClient()
     const result = await payload.find({
       collection,
       where: { slug: { equals: slug } },
       limit: 1,
     })
     return result.docs[0] || null
   }
   ```

2. **Create `src/components/nav.tsx`** — server component:
   - Import `siteConfig`
   - Render site name as link to `/`
   - Render social links from config
   - Mobile hamburger menu (Shadcn Sheet component)

3. **Create `src/components/seed-card.tsx`** — server component:
   - Props: `{ title, description, slug, publishedAt, tags, collection }`
   - Card layout with title, description excerpt, date, tags
   - Link to `/seeds/{slug}`

4. **Create `src/app/(frontend)/layout.tsx`:**
   - Import Nav component
   - Apply CSS variables from `siteConfig.theme`
   - Footer with site name + year

5. **Create `src/app/(frontend)/page.tsx`** — homepage:
   ```typescript
   import { getPublishedSeeds } from '@/lib/payload-helpers'
   import { SeedCard } from '@/components/seed-card'

   export const revalidate = 3600

   export default async function HomePage() {
     const articles = await getPublishedSeeds('articles', 6)
     const notes = await getPublishedSeeds('notes', 6)
     // Merge + sort by publishedAt, render grid of SeedCards
   }
   ```

6. **Create `src/components/lexical-renderer.tsx`:**
   - Use `@payloadcms/richtext-lexical/react` to serialize Lexical JSON to React elements
   - Extract heading nodes for ToC generation
   - Add `id` attributes to headings for anchor linking

7. **Create `src/components/toc.tsx`** — client component (`'use client'`):
   - Props: `{ headings: { id, text, level }[] }`
   - Render nested list of anchor links
   - IntersectionObserver: observe all heading elements, highlight active
   - Sticky sidebar on desktop, collapsible on mobile

8. **Create `src/app/(frontend)/seeds/[slug]/page.tsx`:**
   ```typescript
   export const revalidate = 3600

   export default async function SeedPage({ params }: { params: { slug: string } }) {
     // Try articles first, then notes
     let seed = await getSeedBySlug('articles', params.slug)
     let collection = 'articles'
     if (!seed) {
       seed = await getSeedBySlug('notes', params.slug)
       collection = 'notes'
     }
     if (!seed) notFound()

     // Extract headings from Lexical content (articles only)
     // Render: Breadcrumb + Title + Meta + Content + ToC sidebar
   }

   export async function generateStaticParams() {
     const payload = await getPayloadClient()
     const articles = await payload.find({ collection: 'articles', where: { status: { equals: 'published' } }, limit: 100 })
     const notes = await payload.find({ collection: 'notes', where: { status: { equals: 'published' } }, limit: 100 })
     return [...articles.docs, ...notes.docs].map(doc => ({ slug: doc.slug }))
   }
   ```

9. **Create `src/components/breadcrumb.tsx`:**
   - Props: `{ items: { label, href }[] }`
   - Home > Seeds > Current title
   - Use Shadcn Breadcrumb component

10. **Create `src/components/search-input.tsx`** — client component:
    - Debounced text input (300ms)
    - Fetch `GET /api/search?where[title][contains]={query}`
    - Display results as list of links

11. **Create `src/app/(frontend)/search/page.tsx`:**
    - Render SearchInput component
    - Optional: server-side initial results from URL query param

12. **Apply CSS variables** from `siteConfig.theme` in root layout:
    ```typescript
    // In layout.tsx <html> style
    style={{
      '--color-primary': siteConfig.theme.primaryColor,
      '--color-accent': siteConfig.theme.accentColor,
    }}
    ```

## Todo List

- [ ] Create `src/lib/payload-helpers.ts`
- [ ] Create `src/components/nav.tsx`
- [ ] Create `src/components/seed-card.tsx`
- [ ] Create `src/app/(frontend)/layout.tsx`
- [ ] Create `src/app/(frontend)/page.tsx`
- [ ] Create `src/components/lexical-renderer.tsx`
- [ ] Create `src/components/toc.tsx` (client component)
- [ ] Create `src/app/(frontend)/seeds/[slug]/page.tsx`
- [ ] Create `src/components/breadcrumb.tsx`
- [ ] Create `src/components/search-input.tsx` (client component)
- [ ] Create `src/app/(frontend)/search/page.tsx`
- [ ] Apply CSS variables from site-config theme
- [ ] Verify homepage renders seed list
- [ ] Verify seed detail page with ToC scroll-spy
- [ ] Verify search returns results
- [ ] Test mobile responsiveness

## Success Criteria
- Homepage shows latest published Articles + Notes
- Seed detail page renders rich text with working ToC
- Scroll-spy highlights correct heading in ToC
- Search page returns relevant results
- Navigation shows site name + social links from config
- ISR works: stale page revalidates after 1h or on publish

## Risk Assessment
- **Lexical serialization:** `@payloadcms/richtext-lexical/react` may have API changes; pin version
- **Cross-collection slug collision:** Articles + Notes share `/seeds/[slug]` — slugs must be unique across collections. Add uniqueness check in auto-slug hook or use collection prefix
- **Search performance:** Payload search plugin uses DB queries, not full-text index. Acceptable for MVP scale (<1000 docs)

## Security Considerations
- Server components only — no API keys exposed to client
- Search input: sanitize query params before passing to Payload API
- `generateStaticParams` only returns published content

## Next Steps
- Phase 5 adds SEO metadata generation for all pages
