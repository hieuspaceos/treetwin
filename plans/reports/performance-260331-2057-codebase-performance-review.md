# Codebase Performance & Code Quality Audit

**Date:** 2026-03-31  
**Scope:** TreeTwin codebase — 339 source files, ~32K LOC  
**Stack:** Astro 5 hybrid SSR + Keystatic + React 19 + Tailwind CSS 4 + Gemini AI + Supabase + Vercel

---

## 1. Build Performance

### 1.1 Astro Config — Clean (No Issues)
**File:** `astro.config.mjs`  
**Severity:** N/A

Config is minimal and correct: `react()`, `markdoc()`, `keystatic()`, `sitemap()`, `pagefind()`. No unnecessary plugins. Hybrid SSR mode (`output: 'server'`) is appropriate given the mix of static and dynamic pages.

### 1.2 Pagefind — No Issues Detected
Pagefind integration via `astro-pagefind` is standard. Static search index with zero runtime cost. No custom config overrides needed.

### 1.3 Tailwind CSS 4 — Clean
**File:** `postcss.config.mjs`, `src/styles/globals.css`  
PostCSS config is minimal (`@tailwindcss/postcss`). Globals use `@import "tailwindcss"` and `@plugin "@tailwindcss/typography"`. No bloat.

### 1.4 Prerendering Strategy — Minor Optimization Opportunity
**Severity:** Low  
**Effort:** S

Good: `index.astro`, `404.astro`, `about.astro`, `search.astro`, entity pages, seed pages are all `prerender = true`.

Only dynamic (SSR) pages: `[landing].astro`, admin pages, auth pages, dashboard. This is correct.

---

## 2. Runtime Performance

### 2.1 Landing Section Renderer — All Static Imports (No Code-Splitting)
**File:** `src/components/landing/landing-section-renderer.astro`  
**Category:** Runtime  
**Severity:** Low  
**Effort:** M

All 25 section components are imported eagerly at the top. Since these are Astro components (server-rendered, zero JS), this affects **build time** and **server-side render time**, not client bundle. The componentMap approach is clean.

**Not a real issue** — Astro server components don't ship JS to client. Tree-shaking at build is handled by Vite.

### 2.2 `[landing].astro` — Double `getCollection` Call
**File:** `src/pages/[landing].astro` lines 17, 39  
**Category:** Runtime  
**Severity:** Medium  
**Effort:** S

```ts
const yamlPages = await getCollection('landingPages')  // line 17
// ... later ...
try { products = await getCollection('products') } catch {}  // line 39
```

The `getCollection('products')` is called on every YAML landing page load even when no product association is needed. Additionally, `getCollection('landingPages')` returns ALL pages when only one is needed — should use `getEntry()` instead.

**Fix:** Use `getEntry('landingPages', landing)` instead of filtering the full collection. Only call `getCollection('products')` if the page actually needs product data.

### 2.3 Local SQLite `listUserOrders` — Fetches ALL Items and Products
**File:** `src/lib/supabase/marketplace-queries.ts` lines 56-76  
**Category:** Runtime / DB  
**Severity:** Medium  
**Effort:** S

```ts
const { data: allItems } = await client.from('order_items').select('*')
const { data: allProducts } = await client.from('products').select('*')
```

For the local SQLite fallback path, `listUserOrders` fetches **every row** from `order_items` and `products` tables, then filters in memory. Same pattern in `listUserLicenses` (lines 100-101).

**Fix:** Add `.eq('order_id', ...)` filtering or use SQL JOIN in the SQLite QueryBuilder. For a dev-only fallback this is acceptable, but wasteful as data grows.

### 2.4 Gemini API Calls — No Timeout on Most Endpoints
**File:** Multiple AI endpoints  
**Category:** Runtime  
**Severity:** High  
**Effort:** S

Only `clone-ai-utils.ts` has `AbortSignal.timeout()` on fetch calls. The following Gemini callers have **no timeout**:

- `src/lib/landing/ai-setup-generator.ts` line 43 — `fetch()` with no signal
- `src/pages/api/admin/voice-analyze.ts` line 108 — `fetch()` with no signal
- `src/lib/admin/distribution-generator.ts` line 124 — `model.generateContent()` with no signal
- `src/pages/api/admin/voice-preview.ts` — likely same pattern

On Vercel serverless, function timeout is 10-60s. A slow Gemini response could exhaust the function timeout without cleanup, leaving the user with a generic timeout error instead of a graceful "AI request timed out".

**Fix:** Add `signal: AbortSignal.timeout(30000)` to all `fetch()` calls hitting Gemini. For SDK calls (`GoogleGenerativeAI`), pass `requestOptions: { timeout: 30000 }`.

### 2.5 `geminiCall` — No Retry Logic
**File:** `src/lib/admin/clone-ai-utils.ts` line 92  
**Category:** Runtime  
**Severity:** Low  
**Effort:** S

Single attempt, no retry on transient 429/503 errors. For the clone pipeline (most expensive AI operation), a single retry with backoff would improve reliability.

### 2.6 Global Mutable State — Race Condition Risk
**File:** `src/lib/admin/clone-ai-utils.ts` lines 33-35  
**Category:** Runtime  
**Severity:** Medium  
**Effort:** S

```ts
/** @deprecated Use firecrawlFetchWithMarkdown instead — global state causes race conditions */
let _lastMarkdown = ''
export function getLastMarkdown(): string { return _lastMarkdown }
export function setLastMarkdown(md: string) { _lastMarkdown = md }
```

The code already acknowledges this is deprecated with a race condition note, but `firecrawlFetch()` still writes to `_lastMarkdown` (line 57). If two clone operations run concurrently, they corrupt each other's markdown state.

**Fix:** Return markdown as part of `firecrawlFetch()` return value. Already noted as deprecated — clean it up.

---

## 3. Client-side Performance

### 3.1 Admin React Bundle — Large but Correctly Isolated
**File:** `src/pages/admin/[...path].astro`  
**Category:** Client-side  
**Severity:** Low  
**Effort:** N/A (acceptable)

Admin uses `client:only="react"` — React never SSRs, only hydrates client-side. This is correct for a full SPA admin panel. CodeMirror is lazy-loaded in `landing-section-forms.tsx`:

```tsx
const MarkdocEditor = lazy(() => import('../field-renderers/markdoc-editor'))
```

Good practice. The admin bundle is large (~1300 LOC in section-forms alone, 1167 in live-preview) but since it's behind auth and `client:only`, it doesn't affect public page performance.

### 3.2 No Astro Image Component Used — Missing Optimization
**File:** All landing components, `landing-hero.astro`, etc.  
**Category:** Client-side  
**Severity:** High  
**Effort:** M

**Zero usage of `astro:assets` Image component** across the entire codebase. All images use raw `<img>` tags:

```html
<img src={backgroundImage} alt={headline} ... loading="lazy" />
```

This means:
- No automatic WebP/AVIF conversion
- No responsive `srcset` generation
- No build-time optimization
- Larger image payloads on all pages

Good: Most images do have `loading="lazy"` which prevents waterfall loading.

**Fix:** For static/known images, use Astro's `<Image>` component. For dynamic CMS images (user-uploaded URLs), this is harder — consider a Vercel Image Optimization approach or Cloudflare Image Resizing.

### 3.3 Font Loading — Good for Core, Suboptimal for Admin/Landing
**Category:** Client-side  
**Severity:** Medium  
**Effort:** S

**Core site (base-head.astro):** Self-hosted Inter with `font-display: swap` and `woff2`. Well done.

**Admin (admin/[...path].astro line 28):**
```html
<link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Fira+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
```
Uses Google Fonts CDN (not self-hosted), loading 2 font families with multiple weights. Has `display=swap` (good) and `preconnect` (good).

**Homepage (index.astro line 36):**
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet" />
```
Another 2 Google Font families on the homepage. This adds ~200-400ms to initial render due to the external CSS fetch blocking render.

**Fix:** Self-host DM Serif Display and DM Sans fonts as woff2 files (like Inter). Or add `rel="preload"` for the Google Fonts CSS. Admin fonts are less critical (behind auth) so lower priority.

### 3.4 React Hydration — Minimal and Correct
**Category:** Client-side  
**Severity:** N/A (Good)

Only 3 files use React hydration directives:
- `admin/[...path].astro` — `client:only="react"` (correct for SPA)
- `[product]/admin/[...path].astro` — same
- `admin/distribution.astro` — island
- `seeds/[slug].astro` — island
- `islands/toc.tsx` — `client:load` (scroll-spy needs immediate JS)
- `islands/distribution-table.tsx` — island

Public pages are almost entirely zero-JS. The Astro islands architecture is well-used.

---

## 4. Code Quality Issues

### 4.1 API Routes Without try-catch — Unhandled Errors
**File:** Multiple API routes  
**Category:** Code Quality  
**Severity:** High  
**Effort:** S

13 API routes have **no try-catch at all**:

- `src/pages/api/products/[slug]/settings.ts`
- `src/pages/api/unsubscribe.ts`
- `src/pages/api/admin/landing/clone-stats.ts`
- `src/pages/api/admin/integrations.ts`
- `src/pages/api/admin/templates/index.ts`
- `src/pages/api/goclaw/[product]/templates/[name].ts`
- `src/pages/api/goclaw/[product]/templates/index.ts`
- `src/pages/api/goclaw/[product]/entities/index.ts`
- `src/pages/api/goclaw/templates/[name].ts`
- `src/pages/api/goclaw/templates/index.ts`
- `src/pages/api/goclaw/health.ts`
- `src/pages/api/goclaw/entities/index.ts`
- `src/pages/api/docs.ts`

An unhandled exception in these routes would return a raw 500 error to the client, potentially leaking stack traces.

**Fix:** Wrap each handler body in try-catch returning `{ ok: false, error: 'Internal error' }` with status 500.

### 4.2 console.log in Production — Webhook Handler
**File:** `src/pages/api/goclaw/webhook.ts` line 60  
**Category:** Code Quality  
**Severity:** Low  
**Effort:** S

```ts
console.log('[goclaw/webhook] received event:', payload.event, { ... })
```

This is the only `console.log` in production code (other console calls are `console.error`/`console.warn` which are appropriate for error logging). The comment says "Phase 4 will add event processing — log and acknowledge for now" — this is intentional temporary logging.

**Fix:** Replace with structured logging or remove when Phase 4 event processing is implemented.

### 4.3 Oversized Files — Two Files Significantly Over 200 Lines
**File:** `landing-section-forms.tsx` (1319 LOC), `landing-live-preview.tsx` (1167 LOC)  
**Category:** Code Quality  
**Severity:** Medium  
**Effort:** M

Both files far exceed the 200-line project guideline. `landing-section-forms.tsx` contains form components for all 25+ section types in a single file. `landing-live-preview.tsx` contains preview renderers for all section types.

**Fix:** Split by section type groups (e.g., `landing-section-forms-content.tsx`, `landing-section-forms-media.tsx`, `landing-section-forms-layout.tsx`). Each group handles 5-8 related section types.

### 4.4 Proxy Image Endpoint — SSRF Risk
**File:** `src/pages/api/proxy-image.ts`  
**Category:** Code Quality / Security  
**Severity:** High  
**Effort:** S

```ts
const imageUrl = url.searchParams.get('url')
const res = await fetch(imageUrl, { ... })
```

No URL validation or allowlisting. An attacker can use this endpoint to:
- Fetch internal network resources (`http://169.254.169.254/` — cloud metadata)
- Port scan internal services
- Fetch `file://` URLs (depending on runtime)

**Fix:** Validate that the URL scheme is `https://`, reject private IP ranges, and optionally maintain a domain allowlist.

### 4.5 Middleware — Iterating All Headers for Cookie Detection
**File:** `src/middleware.ts` lines 53-55  
**Category:** Code Quality  
**Severity:** Low  
**Effort:** S

```ts
const hasAuthCookie =
  context.cookies.has('sb-access-token') ||
  [...context.request.headers.entries()].some(([k]) => k.includes('sb-'))
```

Spreading all headers into an array to search for a cookie is unnecessary overhead on every request. The Supabase auth cookie has a known name.

**Fix:** Check `context.cookies.has('sb-access-token')` only, or use `request.headers.get('cookie')?.includes('sb-')`.

### 4.6 React useEffect Cleanup — Properly Handled
**Category:** Code Quality  
**Severity:** N/A (Good)

Checked `admin-app.tsx`, `toc.tsx`, `landing-page-editor.tsx`, `landing-icon-picker.tsx`, `landing-clone-modal.tsx`, `content-editor.tsx` — all `useEffect` hooks with event listeners or observers have proper cleanup (`return () => ...`). No memory leak concerns.

---

## 5. API Response Quality

### 5.1 Inconsistent Error Response Format
**Category:** API  
**Severity:** Medium  
**Effort:** M

Most API routes use `{ ok: true/false, data/error }` pattern, which is good. But some routes diverge:

- `proxy-image.ts` returns plain text errors: `new Response('Missing url param', { status: 400 })`
- `clone-stats.ts` returns raw JSON without the `ok` wrapper
- `unsubscribe.ts` returns HTML (intentional — user-facing endpoint)

**Fix:** Standardize: all JSON API routes should return `{ ok, data?, error? }`. The unsubscribe HTML response is correct (public endpoint).

### 5.2 No Cache-Control Headers on Read APIs
**Category:** API  
**Severity:** Medium  
**Effort:** S

Only 2 of 80+ API routes set `Cache-Control`:
- `proxy-image.ts` — `max-age=3600`
- `manifests/[slug].ts` — likely cached

Missing on read-heavy endpoints:
- `GET /api/admin/integrations` — rarely changes, could cache 60s
- `GET /api/goclaw/health` — could cache 10-30s
- `GET /api/goclaw/templates/*` — templates are static, could cache 300s
- `GET /api/marketplace/products` — could cache 60s with `stale-while-revalidate`

**Fix:** Add `Cache-Control: private, max-age=60` to admin read endpoints. Add `Cache-Control: public, max-age=300, stale-while-revalidate=600` to public read endpoints.

### 5.3 Gemini API Key in URL Query Parameter
**File:** `src/lib/landing/ai-setup-generator.ts` line 43, `src/pages/api/admin/voice-analyze.ts` line 106, `src/lib/admin/clone-ai-utils.ts` line 93  
**Category:** API / Security  
**Severity:** Medium  
**Effort:** S

```ts
const url = `...?key=${apiKey}`
```

API key passed as URL query parameter. While this is Google's documented approach for Gemini REST API, URL params can leak in server logs, Vercel function logs, and HTTP referer headers. The `@google/generative-ai` SDK (already a dependency, used in `distribution-generator.ts`) handles auth via headers.

**Fix:** Use the SDK (`GoogleGenerativeAI`) consistently instead of raw `fetch()` with key in URL. The SDK is already installed and used in one file.

---

## Summary by Severity

| Severity | Count | Key Items |
|----------|-------|-----------|
| **Critical** | 0 | — |
| **High** | 3 | Missing image optimization, no AI timeout handling, SSRF in proxy-image, missing try-catch on 13 API routes |
| **Medium** | 6 | Global race condition, font loading, oversized files, double getCollection, inconsistent error format, missing cache headers |
| **Low** | 5 | console.log in webhook, header iteration, no retry logic, SQLite fetch-all, admin bundle |

## Quick Wins (Effort = S, Severity >= Medium)

1. Add `AbortSignal.timeout(30000)` to all Gemini fetch calls — 4 files, ~10 min
2. Add URL validation to `proxy-image.ts` (block private IPs, require HTTPS) — 1 file, ~15 min
3. Wrap 13 API routes in try-catch — ~30 min
4. Use `getEntry()` instead of `getCollection()` in `[landing].astro` — 1 file, ~5 min
5. Self-host DM Sans/DM Serif Display fonts — ~20 min
6. Add Cache-Control headers to read-only API routes — ~20 min
7. Remove deprecated `_lastMarkdown` global state — ~10 min

---

## Unresolved Questions

1. Is the `@google/generative-ai` SDK dependency intentionally used alongside raw REST calls? If so, could all Gemini calls be unified through the SDK?
2. Are there plans to migrate landing page images from raw URLs to a CDN with image optimization (Cloudflare Images, Vercel OG, etc.)?
3. The `better-sqlite3` package is included for local dev fallback — does it add significant weight to the Vercel serverless bundle? (It's a native module and may cause cold start issues.)
