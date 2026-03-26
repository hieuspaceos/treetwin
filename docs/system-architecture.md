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
| `/admin/[...path]` | SSR (hybrid) | Custom admin dashboard (auth protected) |
| `/api/admin/*` | API Route | Admin CRUD: content, auth, media, voice operations |
| `/api/admin/voice-analyze` | API Route | Gemini-powered voice effectiveness scoring (2026-03-19) |
| `/api/admin/voice-preview` | API Route | AI-generated voice sample paragraphs (2026-03-19) |
| `/api/goclaw/health` | API Route | GoClaw health check (Bearer auth, 503 if not configured) |
| `/api/goclaw/webhook` | API Route | GoClaw event webhook receiver (HMAC verified) |

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

## Admin Dashboard Architecture

**Custom admin at `/admin`** — Premium React SPA replacing Keystatic's default UI. Fully config-driven, exportable as npm package.

### Admin Stack
- **Frontend:** React islands in Astro (client-side routing)
- **Editor:** CodeMirror 6 with Live Preview, vim mode, typewriter mode (11 modules)
- **UI:** Radix UI headless + Tailwind CSS 4 glass-panel styling
- **Auth:** Env-var password + 7-day session cookies via Astro middleware

### Admin Architecture
```
POST /admin/[...path]
  ↓
Astro SSR shell (prerender: false)
  ├─ Auth check via middleware (admin cookie)
  └─ Render React AdminApp island
        ├─ AdminSidebar (nav: Dashboard, Articles, Notes, Records, Media)
        ├─ AdminTopbar (breadcrumbs, session indicator)
        └─ Content area (dynamic per route)
              ├─ ContentList (table + pagination)
              ├─ ContentEditor (form + Markdown textarea + preview)
              └─ MediaBrowser (grid + upload zone)

POST /api/admin/* (API Routes)
  ├─ /api/admin/login (username + password → session cookie)
  ├─ /api/admin/content (GET list, POST create, PUT update, DELETE)
  ├─ /api/admin/media (GET list, DELETE file)
  ├─ /api/admin/upload (multipart: file → R2)
  └─ All routes protected by auth middleware
```

### Admin Features
- **Content CRUD:** Create, read, update, delete articles/notes/records
- **Rich text:** CodeMirror 6 editor — Markdoc output, Live Preview, vim mode, image widgets, callout blocks
- **Media browser:** Drag-drop upload to R2, thumbnails, search, delete
- **Media integration:** "Browse" buttons in cover/OG image fields, image insertion in editor
- **Preview:** Opens seed detail page in new tab with draft content
- **Keyboard shortcuts:** ? = help, Ctrl+S = save, Escape = close dialogs
- **Error recovery:** Error boundary catches React crashes with recovery UI
- **Loading states:** Skeleton components for async operations

### Admin Configuration
**File:** `src/config/site-config.ts`
```typescript
admin: {
  title: 'Admin',         // shown in sidebar
  brandColor: '#3b82f6',  // accent color (optional)
}
```

### Admin Styling (Modularized 2026-03-19)
**Base file:** `src/styles/admin.css` imports 7 modular partials:
- `admin/tokens.css` — CSS variable definitions (glass layers, colors, spacing)
- `admin/layout.css` — Shell structure (sidebar, topbar, main area, footer)
- `admin/components.css` — UI components (buttons, forms, panels, modals, badges, status icons)
- `admin/editor.css` — CodeMirror 6 editor theme and integration
- `admin/table.css` — Content list tables (pagination, filters, sorting, status badges)
- `admin/media.css` — Media browser grid (upload zone, thumbnails, cards, deletion feedback)
- `admin/responsive.css` — Mobile breakpoints (<768px sidebar collapse, stacked layouts, touch-friendly)

**Design System (2026-03-19):**
- Typography: Fira Sans (UI), Fira Code (monospace)
- Glass morphism: 3 layers (primary bg, secondary overlay, tertiary cards)
- Colors: semantic tokens (`--admin-success`, `--admin-error`, `--admin-warning`)
- Animations: smooth transitions on panels, fade-in lists, pulse on loading
- Accessibility: focus rings, keyboard navigation, high contrast checked

---

## Media Management Architecture

**Media storage & browser for admin dashboard.** Files upload to Cloudflare R2 with browser UI for selection/deletion.

### Media Flow
```
User drag-drops file
  ↓
MediaUploadZone component
  ├─ Client-side validation (type, size < 10MB)
  └─ POST to /api/admin/upload (FormData: file + path)
        ↓
    Astro API route (SSR)
      ├─ Validate file (MIME type, extension, size)
      ├─ Sanitize filename (lowercase, hyphens)
      └─ PutObjectCommand to R2 at media/{path}/{timestamp}-{filename}
            ↓
        Return { url, key }
            ↓
    MediaBrowser updates grid (optimistic UI)
      ├─ Show thumbnail preview
      └─ Enable copy/delete buttons
```

### Media API Routes
- **GET /api/admin/media** — `ListObjectsV2` R2 objects with prefix `media/`
  - Returns: `{ items: MediaItem[], hasMore, configured }`
  - Query: `?prefix=media/shared/` (optional filter)
  - Pagination: 1000 items per request, `ContinuationToken` for next page

- **POST /api/admin/upload** — Multipart file upload
  - Field: `file` (binary), `path` (form field, e.g., "shared" or "articles")
  - Validation: type, size, extension on server
  - Returns: `{ url, key }`

- **DELETE /api/admin/media** — Remove file
  - Body: `{ key: string }`
  - Returns: `{ ok: true }`

### Media Components
- **MediaBrowser** (`src/components/admin/media-browser.tsx`)
  - Modes: page (`/admin/media`) or dialog (from form fields)
  - Top: search bar + upload zone
  - Main: thumbnail grid (lazy-loaded)
  - Selected: detail panel + actions

- **MediaUploadZone** (`src/components/admin/media-upload-zone.tsx`)
  - Drag-drop area with dashed border
  - File input fallback
  - Progress indicator (XHR progress event)
  - Multiple file upload support
  - Client-side validation feedback

- **MediaGrid** (`src/components/admin/media-grid.tsx`)
  - Responsive CSS grid (2 cols mobile, 4 cols desktop)
  - MediaCard for each item
  - Intersection observer for lazy thumbnail loading
  - Empty state when no media

- **MediaCard** (`src/components/admin/media-card.tsx`)
  - Thumbnail (images) or icon (non-images)
  - Filename + size
  - Hover overlay: "Select" (dialog) or "Copy URL" (page) + "Delete"
  - Glass-card styling

### Media Integration Points
1. **Cover image field** — ObjectField in content editor
   - Browse Media button opens MediaBrowser dialog
   - On select: sets `cover.url` to selected media URL

2. **OG image field** — `seo.ogImage` text field
   - Same integration as cover image

3. **Editor image insertion** — Markdown textarea
   - Image button opens MediaBrowser dialog
   - On select: inserts `![alt](url)` Markdoc syntax

### Media R2 Setup
**Environment variables:** (optional, set to enable media)
```
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_BUCKET=my-bucket
R2_PUBLIC_URL=https://r2.example.com
```

**R2 bucket structure:**
```
media/
  ├── shared/
  │   ├── logo.png
  │   └── hero-bg.jpg
  ├── articles/
  │   ├── my-article/
  │   │   ├── cover.jpg
  │   │   └── diagram.png
  │   └── another-article/
  └── notes/
      └── trading-journal-001/
```

**Key naming:** `media/{collection}/{slug}/{timestamp}-{filename}`
- Timestamp prevents collisions
- Prefix-based: `GET /api/admin/media?prefix=media/articles/my-article/` lists only that article's media

### Graceful Degradation
- If R2 not configured (env vars missing): media UI hidden, text fields remain functional
- Users can paste external URLs directly (Unsplash, Imgur, etc.)
- No breaking changes to content editor workflow

---

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
4. **Admin:** Media browser integrations auto-available via `schema-registry.ts`
5. **Rebuild:** `npm run build`

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

### Customize Admin

1. **Branding:** Update `site-config.ts` → `admin.title`, `admin.brandColor`
2. **Theme:** Modify `src/themes/liquid-glass.ts`, CSS vars auto-apply
3. **Components:** Edit React components in `src/components/admin/`
4. **Export:** Components are tree-shakeable, exportable as npm package

---

**Design Philosophy:**

TreeID prioritizes **simplicity, speed, and maintainability** over feature richness:
- **No database** → No ops burden, git is backup
- **Static by default** → Fast, no server latency
- **Minimal JS** → Fast interaction, no bloat
- **Git-based CMS** → No lock-in, full control
- **Type-safe content** → Catch errors at build time
- **Admin as product** → Config-driven, exportable, white-label ready

---

## Voice Management System (2026-03-19)

### Voice Profiles Collection

**Purpose:** Store writing voice profiles for AI-powered content generation and analysis.

**Fields:**
- `id`: Unique identifier (slug)
- `name`: Display name (e.g., "Tech Casual VI")
- `tone`: select (casual, professional, technical, storytelling, persuasive, academic)
- `industry`: select (technology, business, travel, lifestyle, finance, health, education, food, general)
- `audience`: select (junior-dev, senior-dev, non-tech, students, business, general)
- `pronoun`: First-person word (e.g., "I", "tôi")
- `language`: EN or VI
- `samples[]`: Array of `{context, text}` — example paragraphs to mimic style
- `avoid[]`: Array of phrases to never use
- `status`: published or draft

**Admin UI:** `/admin/voices`
- Full CRUD (create, list, edit, delete)
- Live effectiveness scoring (6 dimensions)
- AI analysis button → modal with suggestions
- Voice preview button → generates sample opening paragraphs

### Voice Effectiveness Scoring (2026-03-19)

**Endpoint:** POST `/api/admin/voice-analyze`

**Dimensions (heuristic + Gemini feedback):**
1. **Emotional Resonance** — Does voice connect with audience emotionally?
2. **Clarity** — Is message clear and jargon-appropriate?
3. **Audience Alignment** — Does voice match target audience?
4. **Tone Consistency** — Does voice maintain consistent tone throughout?
5. **Engagement Level** — Does voice keep reader engaged?
6. **Authenticity** — Does voice feel genuine and unique?

**Return value:**
```json
{
  "score": 0-100,
  "dimensions": {
    "emotionalResonance": { "score": 0-100, "feedback": "..." },
    "clarity": { "score": 0-100, "feedback": "..." }
    // ... 6 total
  },
  "suggestions": ["Use more...", "Avoid...", "Consider..."],
  "overallFeedback": "..."
}
```

### Voice Preview Generator (2026-03-19)

**Endpoint:** POST `/api/admin/voice-preview`

**Purpose:** Generate sample opening paragraphs in a voice style to test before applying to articles.

**Input:**
```json
{
  "articleSlug": "my-article",
  "voiceProfile": { "name": "...", "tone": "...", ... }
}
```

**Output:**
```json
{
  "preview": "Paragraph 1...\n\nParagraph 2...",
  "wordCount": 220,
  "language": "en"
}
```

**System Instruction:** Gemini generates 200+ word opening paragraphs that:
- Match voice profile (tone, industry, audience, pronoun, language)
- Include samples as style references
- Avoid listed phrases
- Are suitable for article openings
- Are split into 2-3 paragraphs for readability

### i18n Module (2026-03-19)

**Purpose:** Centralized translations for admin UI and chip-select defaults.

**Collections:**
- `src/content/translations/` — YAML files per language/section
- Schema: `{ [key]: { [language]: string } }`

**Admin UI:** `/admin/settings/translations`
- Edit translations by language (EN/VI tabs)
- Add new keys dynamically
- Used for voice tone/industry/audience dropdown defaults
- Extensible for future i18n features

---

## Feature Module System (2026-03-26)

### Registry-Based Feature Toggling

Dynamic admin UI and API gating system for optional features. Registry-driven approach with zero runtime cost when features are enabled.

**Architecture:**
- `src/lib/admin/feature-registry.ts` — Static registry with 7 optional features (email, goclaw, distribution, analytics, media, voices, translations)
- `src/lib/admin/feature-guard.ts` — Server-side feature checks with 5s caching of settings file
- `src/components/admin/feature-toggles-panel.tsx` — Settings UI for feature toggles

**Three-Layer Gating:**
1. **Admin Sidebar** — Dynamic nav items from `getFeaturesBySection()`, lazy-loaded route pages
2. **API Routes** — All 20 feature-specific endpoints guarded with `checkFeatureEnabled()` returning 403 when disabled
3. **Public Components** — Email subscribe form and GA4 script conditionally rendered via `isFeatureEnabledServer()`

**Data Structure:**
```yaml
# src/content/site-settings/index.yaml
enabledFeatures:
  email: true
  goclaw: true
  distribution: true
  analytics: true
  media: true
  voices: true
  translations: true
```

**Backward Compatibility:**
- Missing `enabledFeatures` key defaults all features to `true` (same as current behavior)
- No visual change when all features enabled — identical to hardcoded UI before refactor

**Key Benefits:**
- Cleaner codebase: no scattered feature flags or env var checks for optional features
- Settings-driven: toggle features without code changes via admin UI
- Security: disabled features return 403 API responses, not silently accepted
- Tree-shakeable: unused feature pages only load when navigated to

---

## GoClaw External Agent Integration (Phase 1 — 2026-03-25)

### Architecture

Tree Identity acts as a **content API** for external AI orchestration systems (like GoClaw). Multi-step content pipeline:

```
GoClaw Orchestration
  ├─ Research agents generate article drafts
  ├─ POST /api/goclaw/content (create with status: draft)
  │   ↓
  │ Tree Identity API
  │   └─ Stores in src/content/articles/ as YAML (never public)
  │
  └─ Human-in-the-loop
     ├─ Admin reviews draft at /admin/articles/{slug}
     ├─ Optionally: runs SEO analysis via /api/goclaw/seo-analyze
     ├─ Updates + publishes (sets status: published)
     │
     └─ Callback
        └─ POST /api/goclaw/webhook (event: article_published, agentId, taskId)
           ↓
        GoClaw records success + feedback for model improvement
```

### API Tiers (Access Control)

**Three authentication tiers:**

| Tier | Auth | Endpoints | Use Case |
|------|------|-----------|----------|
| **Public** | None | `/`, `/seeds/*`, `/search`, `/og` | Browser, AI crawlers |
| **Admin** | Session JWT | `/admin/*`, `/api/admin/*` | Human editors |
| **GoClaw** | Bearer API Key | `/api/goclaw/*` | External AI agents |

### GoClaw Endpoints (Phase 1 Complete)

#### Health Check
```
GET /api/goclaw/health
Authorization: Bearer <GOCLAW_API_KEY>

Response (200):
{
  "ok": true,
  "version": "2.1.0"
}

Response (503 if GOCLAW_API_KEY not set):
{
  "ok": false,
  "error": "GoClaw integration not configured"
}

Response (401 if token invalid):
{
  "ok": false,
  "error": "Invalid API key"
}
```

#### Webhook Receiver
```
POST /api/goclaw/webhook
Authorization: Bearer <GOCLAW_API_KEY>
X-GoClaw-Signature: sha256=<HMAC>

Body:
{
  "event": "article_published",
  "agentId": "research-001",
  "taskId": "task-12345",
  "result": { "slug": "my-article", "title": "..." },
  "timestamp": "2026-03-25T10:30:00Z"
}

Response (200):
{
  "ok": true,
  "data": {
    "received": true,
    "event": "article_published"
  }
}

Signature verification (HMAC-SHA256):
- If GOCLAW_WEBHOOK_SECRET set: validates signature via x-goclaw-signature header
- If missing secret: webhook accepted without signature (graceful degradation)
```

### Write Policy (Security Critical)

**All GoClaw writes must force `status: draft`:**

```typescript
// In /api/goclaw/content (Phase 2 future)
export const POST: APIRoute = async ({ request }) => {
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response

  const payload = await request.json()

  // FORCE draft — human approval required
  payload.status = 'draft'

  // Save to src/content/articles/{slug}/index.mdoc
  // Never auto-publish
}
```

**Why:** Prevents AI agents from publishing unreviewed content. Single source of truth: human judgment.

### Files & Dependencies

**Auth + Types:**
- `src/lib/goclaw/api-auth.ts` — `verifyGoclawApiKey()` helper
- `src/lib/goclaw/types.ts` — WebhookPayload, GoclawApiResponse interfaces

**Endpoints:**
- `src/pages/api/goclaw/health.ts` — Service status
- `src/pages/api/goclaw/webhook.ts` — Event receiver + HMAC verification

**Environment:**
- `GOCLAW_API_KEY` — Bearer token (required to enable feature)
- `GOCLAW_WEBHOOK_SECRET` — Optional webhook signature verification

### Future Phases

**Phase 2:** Content CRUD
- POST `/api/goclaw/content` — Create article (force draft)
- GET `/api/goclaw/content/{slug}` — Read article metadata
- PUT `/api/goclaw/content/{slug}` — Update article (draft only)

**Phase 3:** Voice Profiles Reader
- GET `/api/goclaw/voices` — List published voices for style reference

**Phase 4:** SEO Analysis Trigger
- POST `/api/goclaw/seo-analyze` — Trigger analysis on article slug

### Comparison: Manual vs GoClaw Pipeline

**Without GoClaw (current):**
1. Human writes in /admin/articles
2. Publishes (status: published)
3. Public

**With GoClaw (Phase 1+):**
1. AI agent calls POST /api/goclaw/content (status: draft)
2. Stored as draft in git
3. Human reviews + edits in /admin/articles
4. Human publishes
5. Webhook callback to GoClaw (success signal)
6. Public

**Key benefit:** AI agents become content **initiators** (not creators), humans remain **decision makers** (final approval).

---

## Landing Page Builder System (2026-03-26)

### Overview

Modular landing page system with YAML-driven configuration, 10 reusable section components, custom entity system, 5 product templates, and AI-powered setup wizard.

```
Admin creates landing page
  ↓
Choose template (optional)
  ↓
YAML config in src/content/landing-pages/{slug}/
  ├─ sections: [hero, features, pricing, testimonials, faq, cta, stats, how-it-works, team, logo-wall]
  └─ entities: references to custom data (testimonials, team members, etc.)
  ↓
Build-time rendering
  ├─ Astro loads LandingPage config
  ├─ Dynamically imports section components
  ├─ Loads entity data from src/content/entities/
  └─ Generates static HTML
  ↓
Deployed as /[landing-slug] route

External AI agents (GoClaw)
  ↓
POST /api/goclaw/landing (create with status: draft)
  ↓
AI setup wizard (optional)
  ├─ POST /api/admin/setup/generate (product description → AI → landing config)
  └─ Human reviews + edits
  ↓
Admin publishes (status: published)
  ↓
Public at /{landing-slug}
```

### Landing Page Architecture

**10 Section Components** (`src/components/landing/`):
1. `hero.astro` — Main value prop with CTA
2. `features.astro` — Product features grid
3. `pricing.astro` — Pricing tiers/plans
4. `testimonials.astro` — Social proof carousel
5. `faq.astro` — Accordion-style FAQ
6. `cta.astro` — Call-to-action section
7. `stats.astro` — Key metrics/achievements
8. `how-it-works.astro` — Step-by-step process
9. `team.astro` — Team members grid (from entity data)
10. `logo-wall.astro` — Client/partner logos

**Configuration Schema** (`src/lib/landing/landing-types.ts`):
```typescript
interface LandingConfig {
  slug: string
  title: string
  description: string
  status: 'draft' | 'published'
  publishedAt?: string
  sections: LandingSection[]
  entities: EntityReference[]
  metadata: {
    theme: string
    locale: 'en' | 'vi'
  }
}

interface LandingSection {
  id: string
  type: SectionComponentName  // hero | features | pricing | ...
  props: Record<string, unknown>  // component-specific config
}

interface EntityReference {
  definition: string  // 'testimonial' | 'team-member' | ...
  instances: string[]  // instance slugs to load
}
```

### YAML Configuration Example

```yaml
slug: my-saas-landing
title: My SaaS Product
description: Modern B2B SaaS platform
status: published
publishedAt: 2026-03-26
sections:
  - id: hero-1
    type: hero
    props:
      headline: "Build faster with MyProduct"
      subheadline: "Ship to market in days, not months"
      ctaText: "Start Free Trial"
      ctaUrl: "#pricing"
      heroImage: "/landing/hero.png"

  - id: features-1
    type: features
    props:
      title: "Why teams choose us"
      features:
        - icon: zap
          title: "Lightning fast"
          description: "Sub-second response times"
        - icon: lock
          title: "Enterprise security"
          description: "SOC 2 Type II certified"

  - id: testimonials-1
    type: testimonials
    props:
      title: "Loved by our customers"
      autoRotate: true
      interval: 5000

  - id: pricing-1
    type: pricing
    props:
      title: "Simple, transparent pricing"
      currency: "$"
      plans:
        - name: Starter
          price: 29
          features: ["Feature A", "Feature B"]
        - name: Pro
          price: 99
          featured: true
          features: ["All Starter", "Feature C"]

entities:
  - definition: testimonial
    instances: [customer-1, customer-2, customer-3]
  - definition: team-member
    instances: [founder-1, founder-2]

metadata:
  theme: liquid-glass
  locale: en
```

### Custom Entity System

**Entity Definitions** (`src/content/entity-definitions/`):
- Define custom data types via YAML schema
- Field types: text, textarea, number, select, checkbox, date
- Generated admin CRUD interface

**Entity Instances** (`src/content/entities/{definition-id}/`):
- Data records for custom types
- Auto-validated against definition schema
- Accessible in landing sections via entity references

**Example: Testimonial Definition**
```yaml
id: testimonial
name: Testimonial
description: Customer testimonial for landing pages
fields:
  - name: author
    label: Author Name
    type: text
    required: true
  - name: quote
    label: Quote
    type: textarea
    required: true
  - name: image
    label: Profile Image URL
    type: text
  - name: role
    label: Job Title
    type: text
  - name: company
    label: Company Name
    type: text
```

**Example: Testimonial Instance**
```yaml
slug: customer-1
definition: testimonial
author: John Doe
quote: "MyProduct saved us 20 hours per week on deployment overhead."
image: /media/john-doe.jpg
role: CTO
company: TechStartup Inc
```

### Product Templates

**5 Pre-built Templates** (`src/content/templates/`):
- `saas.yaml` — SaaS product landing
- `agency.yaml` — Service agency landing
- `course.yaml` — Online course landing
- `ecommerce.yaml` — E-commerce shop landing
- `portfolio.yaml` — Portfolio/case studies landing

Each template includes:
- Pre-configured sections (hero, features, CTA, etc.)
- Recommended entity types (testimonials, portfolio items, etc.)
- Sample content + placeholder images
- Design guidelines per section

**Apply Template Flow:**
1. User creates new landing page
2. Selects template (or creates blank)
3. Template sections merged with user config
4. User can override/customize sections
5. Entities pre-populated from template examples

### Admin Landing Editor

**Routes:**
- `GET /admin/landing` — List all landing pages (table view)
- `GET /admin/landing/create` — New landing wizard (template selector → blank/template)
- `GET /admin/landing/[slug]` — Edit landing page (YAML editor + preview)
- `DELETE /admin/landing/[slug]` — Delete landing page

**Features:**
- YAML editor with syntax highlighting
- Section component picker (dropdown of 10 components)
- Inline section props editor (form builder from component schema)
- Live iframe preview (shows draft content)
- Section reorder (drag-drop in preview panel)
- Entity picker (select instances to include)
- Status toggle (draft ↔ published)

### Admin Entity Manager

**Routes:**
- `GET /admin/entities` — List all entity types (with instance counts)
- `GET /admin/entities/{definition-id}` — List instances of type
- `POST /admin/entities/{definition-id}` — Create new instance
- `PUT /admin/entities/{definition-id}/{slug}` — Edit instance
- `DELETE /admin/entities/{definition-id}/{slug}` — Delete instance

**Features:**
- Auto-generated form from entity definition
- Type validation (text, textarea, number, select, etc.)
- Bulk import (paste CSV → create instances)
- Bulk delete (checkbox select)
- Search/filter by entity type

### AI Setup Wizard

**Endpoint:** `POST /api/admin/setup/generate`

**Flow:**
1. User enters product description (2-3 paragraphs)
2. AI (Gemini Flash) analyzes description
3. Generates landing page config (all sections pre-filled)
4. Shows preview of generated landing
5. User can edit/approve before saving
6. Saves to `src/content/landing-pages/{auto-slug}/`

**Prompt Engineering:**
- Gemini system prompt includes:
  - All 10 section component specs
  - Example configs for each section
  - Markdown formatting guidelines
  - JSON output schema for landing config

**Supported Languages:**
- Input: English or Vietnamese
- Output: Matched to input language
- Multi-language landing pages via metadata.locale

### Dynamic Landing Page Rendering

**Build-time Route** (`src/pages/[landing-slug].astro`):
```typescript
export async function getStaticPaths() {
  const landings = await getCollection('landing-pages')
  return landings
    .filter(l => l.data.status === 'published')
    .map(l => ({ params: { 'landing-slug': l.data.slug } }))
}

export default async function LandingPage({ params }) {
  const config = await readLandingConfig(params['landing-slug'])
  const entityData = await resolveEntities(config.entities)

  return <LandingPageRenderer config={config} entities={entityData} />
}
```

**Section Rendering:**
- Dynamic component loading: `await import(`src/components/landing/${section.type}.astro`)`
- Props passed directly from config: `<SectionComponent {...section.props} />`
- Entity data injected: `<Testimonials instances={entityData.testimonials} />`
- Fully static output at build time

### GoClaw Landing Integration (Phase 2 Future)

**AI Agent Endpoints:**
- `GET /api/goclaw/landing` — List published landings (read-only)
- `GET /api/goclaw/landing/[slug]` — Get landing config
- `POST /api/goclaw/landing` — Create landing (force draft)
- `PUT /api/goclaw/landing/[slug]` — Update landing (draft only)
- `GET /api/goclaw/templates` — List available templates
- `POST /api/goclaw/setup/generate` — AI-generated landing

**Write Policy:**
- All writes forced to `status: draft`
- Human approval required before publishing
- Webhook callback on publish (for GoClaw feedback loop)

### Files & Dependencies

**New Directories:**
- `src/components/landing/` — 10 section components
- `src/lib/landing/` — Config reader, renderer, template helpers, AI generator
- `src/lib/admin/entity-io.ts` — Entity CRUD operations
- `src/content/landing-pages/` — Landing page configs (YAML)
- `src/content/templates/` — 5 product templates (YAML)
- `src/content/entity-definitions/` — Custom entity schemas (YAML)
- `src/content/entities/` — Entity instances (YAML, organized by type)

**Modified Files:**
- `keystatic.config.ts` — Added landing-pages, templates, entity-definitions, entities collections
- `src/content.config.ts` — Added Zod schemas for new collections
- `src/pages/[landing-slug].astro` — New dynamic landing route
- `src/pages/admin/landing/[...path].astro` — Landing admin pages
- `src/pages/admin/entities/[...path].astro` — Entity admin pages
- `src/pages/api/admin/landing/[...].ts` — Landing CRUD endpoints
- `src/pages/api/admin/entities/[...].ts` — Entity CRUD endpoints
- `src/pages/api/admin/templates/[...].ts` — Template endpoints
- `src/pages/api/admin/setup/[...].ts` — Setup wizard endpoint
- `src/pages/api/goclaw/landing/[...].ts` — GoClaw landing endpoints
- `src/pages/api/goclaw/entities/[...].ts` — GoClaw entity endpoints
- `src/pages/api/goclaw/templates.ts` — GoClaw template endpoint
- `src/pages/api/goclaw/setup.ts` — GoClaw setup endpoint
- `src/lib/admin/feature-registry.ts` — Added landing, entities, setup-wizard features
- `src/components/admin/feature-toggles-panel.tsx` — Updated to show 3 new features

**New NPM Packages:**
- None required (uses existing: Astro, Zod, Gemini API)

---

**Last updated:** 2026-03-26
