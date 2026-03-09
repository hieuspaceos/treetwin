# Phase 5: SEO Engine

## Context Links
- [Phase 4](./phase-04-frontend-cortex-interface.md)

## Overview
- **Priority:** P2
- **Status:** COMPLETE
- **Effort:** 4h
- **Depends on:** Phase 4 (pages must exist)
- Implement Next.js Metadata API for all pages, JSON-LD structured data, OG image generation, dynamic sitemap, robots.txt

## Key Insights
- Next.js App Router `generateMetadata()` runs at build/request time per page
- JSON-LD: `Article` for articles, `BlogPosting` for notes, `WebSite` for homepage
- `@vercel/og` generates OG images as edge functions (no Puppeteer)
- Sitemap uses Payload Local API to list all published seeds
- Merge `siteConfig` defaults with per-document `seo` field overrides

## Requirements

### Functional
- Every page has proper `<title>`, `<meta description>`, OG tags
- JSON-LD schema on all seed pages + homepage
- Dynamic OG images with title + description
- `/sitemap.xml` listing all published seeds
- `/robots.txt` allowing crawlers, pointing to sitemap

### Non-Functional
- OG images generated in < 500ms (edge runtime)
- Sitemap regenerates on each request (ISR-compatible)

## Architecture

```
src/lib/seo/
├── generate-metadata.ts    # Next.js Metadata object builder
└── json-ld.ts              # JSON-LD schema generators
src/app/
├── og/route.tsx            # OG image generation (Edge)
├── sitemap.ts              # Dynamic sitemap
└── robots.ts               # robots.txt
```

## Related Code Files

### Create
- `src/lib/seo/generate-metadata.ts`
- `src/lib/seo/json-ld.ts`
- `src/app/og/route.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`

### Modify
- `src/app/(frontend)/page.tsx` — add `generateMetadata` + JSON-LD
- `src/app/(frontend)/seeds/[slug]/page.tsx` — add `generateMetadata` + JSON-LD

## Implementation Steps

1. **Create `src/lib/seo/generate-metadata.ts`:**
   ```typescript
   import type { Metadata } from 'next'
   import { siteConfig } from '@/config/site-config'

   interface SeedMeta {
     title: string
     description: string
     slug: string
     seo?: { seoTitle?: string; ogImage?: string; noindex?: boolean }
     publishedAt?: string
     updatedAt?: string
   }

   export function generateSeedMetadata(seed: SeedMeta): Metadata {
     const title = seed.seo?.seoTitle || seed.title
     const ogImageUrl = seed.seo?.ogImage ||
       `${siteConfig.url}/og?title=${encodeURIComponent(title)}&desc=${encodeURIComponent(seed.description)}`

     return {
       title: `${title} | ${siteConfig.name}`,
       description: seed.description,
       openGraph: {
         title,
         description: seed.description,
         url: `${siteConfig.url}/seeds/${seed.slug}`,
         siteName: siteConfig.name,
         images: [{ url: ogImageUrl, width: 1200, height: 630 }],
         type: 'article',
         publishedTime: seed.publishedAt,
         modifiedTime: seed.updatedAt,
       },
       twitter: {
         card: 'summary_large_image',
         title,
         description: seed.description,
         images: [ogImageUrl],
       },
       robots: seed.seo?.noindex ? { index: false, follow: false } : undefined,
     }
   }

   export function generateHomeMetadata(): Metadata {
     return {
       title: siteConfig.name,
       description: siteConfig.description,
       openGraph: {
         title: siteConfig.name,
         description: siteConfig.description,
         url: siteConfig.url,
         siteName: siteConfig.name,
         type: 'website',
       },
     }
   }
   ```

2. **Create `src/lib/seo/json-ld.ts`:**
   ```typescript
   import { siteConfig } from '@/config/site-config'

   export function articleJsonLd(seed: { title: string; description: string; slug: string; publishedAt?: string }) {
     return {
       '@context': 'https://schema.org',
       '@type': 'Article',
       headline: seed.title,
       description: seed.description,
       url: `${siteConfig.url}/seeds/${seed.slug}`,
       datePublished: seed.publishedAt,
       author: { '@type': 'Person', name: siteConfig.author.name },
       publisher: { '@type': 'Organization', name: siteConfig.name },
     }
   }

   export function websiteJsonLd() {
     return {
       '@context': 'https://schema.org',
       '@type': 'WebSite',
       name: siteConfig.name,
       url: siteConfig.url,
       description: siteConfig.description,
     }
   }
   ```

3. **Create `src/app/og/route.tsx`:**
   ```typescript
   import { ImageResponse } from '@vercel/og'
   import { siteConfig } from '@/config/site-config'

   export const runtime = 'edge'

   export async function GET(request: Request) {
     const { searchParams } = new URL(request.url)
     const title = searchParams.get('title') || siteConfig.name
     const desc = searchParams.get('desc') || siteConfig.description

     return new ImageResponse(
       (
         <div style={{
           display: 'flex', flexDirection: 'column', justifyContent: 'center',
           width: '100%', height: '100%', padding: '48px',
           background: siteConfig.theme.primaryColor, color: 'white',
         }}>
           <h1 style={{ fontSize: 60, margin: 0 }}>{title}</h1>
           <p style={{ fontSize: 28, opacity: 0.8, marginTop: 16 }}>{desc}</p>
           <p style={{ fontSize: 20, opacity: 0.5, marginTop: 'auto' }}>{siteConfig.name}</p>
         </div>
       ),
       { width: 1200, height: 630 }
     )
   }
   ```

4. **Create `src/app/sitemap.ts`:**
   ```typescript
   import type { MetadataRoute } from 'next'
   import { getPayloadClient } from '@/lib/payload-helpers'
   import { siteConfig } from '@/config/site-config'

   export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
     const payload = await getPayloadClient()
     const articles = await payload.find({ collection: 'articles', where: { status: { equals: 'published' } }, limit: 1000 })
     const notes = await payload.find({ collection: 'notes', where: { status: { equals: 'published' } }, limit: 1000 })

     const seedUrls = [...articles.docs, ...notes.docs].map(doc => ({
       url: `${siteConfig.url}/seeds/${doc.slug}`,
       lastModified: doc.updatedAt,
       changeFrequency: 'weekly' as const,
       priority: 0.8,
     }))

     return [
       { url: siteConfig.url, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
       { url: `${siteConfig.url}/search`, changeFrequency: 'monthly', priority: 0.3 },
       ...seedUrls,
     ]
   }
   ```

5. **Create `src/app/robots.ts`:**
   ```typescript
   import type { MetadataRoute } from 'next'
   import { siteConfig } from '@/config/site-config'

   export default function robots(): MetadataRoute.Robots {
     return {
       rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
       sitemap: `${siteConfig.url}/sitemap.xml`,
     }
   }
   ```

6. **Update seed detail page** — add `generateMetadata` export:
   ```typescript
   export async function generateMetadata({ params }) {
     const seed = await getSeedBySlug('articles', params.slug) || await getSeedBySlug('notes', params.slug)
     if (!seed) return {}
     return generateSeedMetadata(seed)
   }
   ```

7. **Update homepage** — add `generateMetadata` export calling `generateHomeMetadata()`.

8. **Add JSON-LD script tags** to seed detail and homepage layouts:
   ```tsx
   <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(seed)) }} />
   ```

## Todo List

- [x] Install `@vercel/og`
- [x] Create `src/lib/seo/generate-metadata.ts`
- [x] Create `src/lib/seo/json-ld.ts`
- [x] Create `src/app/og/route.tsx`
- [x] Create `src/app/sitemap.ts`
- [x] Create `src/app/robots.ts`
- [x] Add `generateMetadata` to homepage
- [x] Add `generateMetadata` to seed detail page
- [x] Add JSON-LD to homepage
- [x] Add JSON-LD to seed detail page
- [x] Verify OG image renders at `/og?title=Test`
- [x] Verify `/sitemap.xml` lists published seeds
- [x] Verify `/robots.txt` correct
- [x] Test with Google Rich Results Test tool

## Success Criteria
- Every page has unique `<title>` and `<meta description>`
- OG images render correctly with title + description
- JSON-LD validates in Google Rich Results Test
- `/sitemap.xml` includes all published seeds
- `/robots.txt` disallows `/admin` and `/api`
- `noindex` field in CMS correctly adds robots noindex

## Risk Assessment
- **OG image edge runtime:** `@vercel/og` requires edge runtime; custom fonts need explicit loading
- **Sitemap size:** At 10K+ seeds, single sitemap may exceed 50MB limit. Use sitemap index for scale. Not needed for MVP.

## Security Considerations
- OG route: sanitize query params to prevent XSS in image generation
- Sitemap: only expose published content URLs

## Next Steps
- Phase 7 documents SEO fields in site-config reference
