# Content Pipeline & Build Flow

## Architecture Overview

Tree Identity is a **static-first content engine** with zero database, zero JavaScript by default.

```
┌─────────────────────────────────────────────────────────┐
│              Developer (Local or Vercel)                │
│  Edit via Keystatic UI (/keystatic)                    │
│  OR edit files directly in src/content/                │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
      ┌──────────────────┐
      │  Git Repository  │  Source of truth
      │  src/content/    │  (Markdown + YAML)
      └────────┬─────────┘
               │
               ▼
      ┌──────────────────┐
      │  Astro 5 Build   │
      │  (SSG)           │
      │  ├─ Parse .mdoc  │
      │  ├─ Parse .yaml  │
      │  ├─ Generate     │
      │  │  static HTML  │
      │  └─ Build search │
      │     index        │
      └────────┬─────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
    ┌────────┐   ┌──────────────┐
    │ dist/  │   │ Pagefind     │
    │ (HTML) │   │ Index        │
    └────┬───┘   │ (SearchDB)   │
         │       └──────────────┘
         │
         ▼
    ┌──────────────────┐
    │  Vercel Deploy   │
    │  ├─ Serve HTML   │
    │  ├─ SSR routes   │
    │  │  (og, api)    │
    │  └─ Edge CDN     │
    └──────────────────┘
         │
         ▼
    Browser
    ├─ Static HTML (zero JS)
    ├─ Search island
    │  (React + Pagefind)
    └─ ToC island
       (React with scroll spy)
```

## Content Pipeline

### 1. Edit Phase

**Where:** Local dev or Vercel
**How:** Keystatic UI at `/keystatic` or direct file edits
**Output:** Files in `src/content/`

Content types:
- **Articles** → `src/content/articles/{slug}/index.mdoc` (Markdoc)
- **Notes** → `src/content/notes/{slug}.yaml` (YAML + text)
- **Records** → `src/content/records/{slug}.yaml` (YAML + JSON)
- **Settings** → `src/content/site-settings/index.yaml` (global config)

All fields shared: title, description, status, publishedAt, tags, category, seo, cover, video, links

### 2. Build Phase (Astro)

**Command:** `npm run build`
**Process:**

```
keystatic.config.ts + src/content.config.ts
        ↓
getCollection('articles')
getCollection('notes')
getCollection('records')
        ↓
Type-safe queries (Zod validation)
        ↓
Markdoc → HTML (articles)
YAML → JS objects (notes, records)
        ↓
Pages:
  - /               (home)
  - /seeds/[slug]   (detail)
  - /search         (Pagefind UI)
  - /api/*          (SSR endpoints)
  - /robots.txt, /sitemap.xml, /og
  - /llms.txt, /llms-full.txt (AI/LLM context)
        ↓
dist/ (static HTML)
pagefind/ (search index)
```

### 3. Deploy Phase (Vercel)

**Where:** Vercel Edge Network
**Serve:**
- Static HTML (cached, instant)
- SSR endpoints via Functions (for `/og`, `/api/manifests/*`)
- Pagefind index (embedded in static)

**Cache Strategy:**
- HTML pages: Served as static (no revalidation needed)
- New deploys: Push to main → Vercel rebuilds → Ships instantly

## Runtime Architecture

### SSG (Static Site Generation)

**Default:** All pages pre-rendered to HTML at build time.

```
Home Page (/)
├─ SQL: getCollection('articles') + getCollection('notes')
├─ Filter: status === 'published'
├─ Sort: by publishedAt DESC
└─ Render: Astro component → static HTML

Detail Page (/seeds/[slug])
├─ SQL: getCollection + filter by slug
├─ Render: Markdoc → HTML
├─ Inject: JSON-LD, OG meta tags
└─ Output: static HTML per unique slug
```

### SSR Endpoints

**When:** Dynamic responses needed (not pre-renderable)
**How:** `export const prerender = false` in .astro or .ts file

**SSR Routes:**

| Route | Type | Purpose |
|-------|------|---------|
| `/og` | Edge Function | Dynamic OG image (params: title, desc) |
| `/api/manifests/[slug]` | API Route | Video manifest JSON (manual trigger) |
| `/robots.txt` | Prerendered | Per-agent AI crawler policy |
| `/rss.xml` | Prerendered | RSS feed (Bing/ChatGPT freshness) |
| `/llms.txt` | Prerendered | AI/LLM site overview (speculative) |
| `/llms-full.txt` | Prerendered | Extended AI context with metadata |
| `/admin/[...path]` | SSR (hybrid) | Custom admin dashboard (auth protected) |
| `/api/admin/*` | API Route | Admin CRUD: content, auth, media, voice operations |
| `/api/goclaw/*` | API Route | GoClaw integration endpoints |

### Client-Side Islands

**Only 2 React islands** (zero JS by default):

1. **Table of Contents** (`components/islands/toc.tsx`)
   - Scroll spy on detail pages
   - Highlights active section
   - Interactive heading navigation

2. **Search UI** (`components/search-pagefind.astro` → Pagefind embed)
   - Full-text search at `/search`
   - Real-time results as user types
   - Min 2-char query guard

**All other components:** Astro (zero JS)

## Data Flow

### Home Page Load

```
Browser → Vercel CDN
         ↓
   Serve dist/index.html (cached, instant)
         ↓
   User sees articles + notes feed
   ↓
   (Search island loads React + Pagefind library)
```

### Detail Page Load

```
Browser → Vercel CDN
         ↓
   Serve dist/seeds/my-article/index.html (cached)
         ↓
   Parse Markdoc → Render as HTML
   ↓
   Inject JSON-LD + OG tags
   ↓
   (ToC island loads React, extracts headings, enables scroll spy)
```

### Search Query

```
Browser (user types in search box)
         ↓
   React island (search-pagefind)
   ↓
   Pagefind.debouncedSearch('query')
   ↓
   (Search happens in-browser, zero server roundtrip)
   ↓
   Render results live
```

### Video Manifest Request

```
Browser → /api/manifests/my-article
         ↓
   Vercel Function (SSR endpoint)
   ↓
   Read R2: s3://bucket/manifests/my-article.json
   ↓
   Return JSON + cache headers
   ↓
   Video-Factory service consumes JSON
```

---

**Last updated:** 2026-03-27
**Version:** v2.6.0
