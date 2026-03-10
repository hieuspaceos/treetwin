# System Architecture

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

## Theme System

Themes are **CSS variable tokens** injected at build time.

**Files:**
- `src/themes/theme-types.ts` — TypeScript interface
- `src/themes/theme-resolver.ts` — Registry (ID → theme object)
- `src/themes/liquid-glass.ts` — Glass morphism theme

**Runtime:**
1. `src/config/site-config.ts` sets `theme.id = 'liquid-glass'`
2. Build picks theme via `theme-resolver.ts`
3. CSS variables injected into `<html>` tag in root layout
4. Components reference `var(--t-primary)`, etc.

**To add a theme:**
1. Create `src/themes/my-theme.ts` (export theme object)
2. Register in `theme-resolver.ts`
3. Set `theme.id` in `site-config.ts`
4. Rebuild

## Search Architecture

**Search engine:** Pagefind (static, zero runtime cost)

**Index generation:**
1. Build extracts all published articles + notes
2. Pagefind indexes title + description + body
3. Writes index to `dist/pagefind/` (JSON + binary)

**At runtime:**
- Browser downloads index (JS library embeds it)
- Search is client-side, instant, zero server load
- Min 2-char query prevents spam

**Limitations:**
- Index is static (content changes require rebuild)
- No faceted search yet (tags, dates are title/desc searchable)

## Storage & Deployment

### Content Storage

- **Local:** Git repo, files in `src/content/`
- **Production:** GitHub repo (connected to Vercel)
- **Backup:** Git history (every commit = snapshot)

**No database.** All content versioned in git.

### Media Storage (Optional)

**R2 (Cloudflare):**
- Video manifests: `s3://bucket/manifests/{slug}.json`
- Media files: `s3://bucket/media/{filename}`
- Public URL: Via Cloudflare CDN (R2_PUBLIC_URL)

**Optional:** If `videoFactory: false` and no R2 vars, feature is disabled.

### Deployment Target

**Vercel:**
- Edge Network in 30+ regions
- Automatic rebuilds on git push
- Environment variables via dashboard
- Analytics + logs built-in
- Free tier supports TreeID

## Extension Points

### Add a New Page

```bash
# Create src/pages/about.astro
# Use Astro syntax, fetch data from getCollection()
```

### Add a New Collection

1. **Keystatic:** Add collection to `keystatic.config.ts`
2. **Astro:** Add collection to `src/content.config.ts`
3. **Pages:** Create `src/pages/my-collection/[slug].astro`
4. **Rebuild:** `npm run build`

### Add Custom CSS

```css
/* src/styles/custom.css */
/* Import in src/layouts/base-layout.astro */

/* Or use Tailwind classes directly in templates */
```

### Add API Endpoints

```typescript
// src/pages/api/my-endpoint.ts
export const prerender = false

export async function GET(context) {
  return new Response(JSON.stringify({ data: 'hello' }))
}
```

---

**Design Philosophy:**

TreeID prioritizes **simplicity, speed, and maintainability** over feature richness:
- **No database** → No ops burden, git is backup
- **Static by default** → Fast, no server latency
- **Minimal JS** → Fast interaction, no bloat
- **Git-based CMS** → No lock-in, full control
- **Type-safe content** → Catch errors at build time

---

**Last updated:** 2026-03-10
