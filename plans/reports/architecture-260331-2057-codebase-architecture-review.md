# Codebase Architecture Review

**Date:** 2026-03-31  
**Scope:** TreeTwin — Astro 5 + Keystatic + React 19 + Gemini AI  
**Stats:** ~339 source files, ~40K LOC (src/), 84 SSR endpoints  

---

## 1. File Size Violations (200 LOC Limit)

### Critical (>500 LOC) — Must Split

| File | LOC | Issue | Recommended Modularization |
|------|-----|-------|---------------------------|
| `src/components/admin/landing/landing-section-forms.tsx` | 1319 | 27 form components in one file, one giant export map at bottom | Split into per-section files: `section-forms/hero-form.tsx`, `section-forms/pricing-form.tsx`, etc. Keep barrel `section-forms/index.ts` re-exporting `sectionFormMap`. Shared helpers (`Field`, `InlineRow`, `CollapsibleItems`, `ArrayField`, `detectSocialIcon`) go to `section-forms/form-primitives.tsx`. |
| `src/components/admin/landing/landing-live-preview.tsx` | 1167 | 26 preview renderers (one per section type) plus layout/wiring | Split into `preview-renderers/` directory. Each section preview ~30-60 LOC. `preview-nav.tsx`, `preview-hero.tsx`, etc. Main file keeps only wiring/scroll/highlight logic. |
| `src/components/admin/landing/landing-page-editor.tsx` | 657 | Editor + SEO panel + section catalog + drag-and-drop all in one | Extract `SeoSettingsPanel` (~60 LOC) to own file. Extract `SECTION_CATALOG` constant + add-section UI to `section-catalog.ts`. Extract clone integration logic to hook `useLandingClone.ts`. |
| `src/lib/admin/clone-post-processor.ts` | 512 | Color math + preset matching + style defaults + quality assessment + full post-processing | Split: `clone-color-utils.ts` (hexToRgb, colorDistance, matchNearestPreset), `clone-quality-assessment.ts` (assessSectionQuality), keep `clone-post-processor.ts` as orchestrator calling both. |
| `src/components/landing/landing-ai-search.astro` | 547 | Full AI search widget with JS + CSS embedded | Extract inline `<script>` to `landing-ai-search-client.ts`, extract `<style>` to `landing-ai-search.css` if possible within Astro component model. |

### High (300-500 LOC) — Should Split

| File | LOC | Recommendation |
|------|-----|----------------|
| `src/components/admin/landing/landing-clone-modal.tsx` | 433 | Extract result display panel (~120 LOC) to `clone-result-display.tsx`. Heavy `as any` casting (15 instances) masks missing types. |
| `src/components/landing/landing-product-showcase.astro` | 425 | Extract product card template to `landing-product-card.astro`. |
| `src/components/landing/landing-nav.astro` | 425 | 3 nav variants in one file — extract `landing-nav-centered.astro`, `landing-nav-transparent.astro`. |
| `src/components/admin/admin-sidebar.tsx` | 387 | 152 LOC of inline SVG icon definitions. Extract to `admin-icons.tsx` constant map. |
| `src/components/admin/voice-score-panel.tsx` | 381 | Heuristic scoring logic + AI analysis + display. Extract scoring to `lib/admin/voice-score-calculator.ts`. |
| `src/components/admin/admin-translations-page.tsx` | 360 | Flatten/unflatten utils + section parsing + UI. Extract utils to `lib/i18n/translation-utils.ts`. |
| `src/lib/admin/landing-clone-ai.ts` | 364 | Main clone entry. Good module decomposition already exists. Acceptable as orchestrator. |
| `src/lib/admin/clone-prompts.ts` | 350 | All prompt strings. Acceptable — prompts are data, not logic. |
| `src/lib/supabase/local-database.ts` | 336 | SQLite schema + seed data + query builder. Extract `local-database-schema.ts` (DDL + seeds) and keep query builder in main file. |
| `src/lib/admin/api-client.ts` | 331 | Centralized API client. Acceptable — cohesive single-responsibility. |
| `src/lib/admin/feature-registry.ts` | 294 | Feature definitions + helpers. Borderline acceptable. |

---

## 2. Architecture Patterns

### 2A. Code Duplication — Critical

**Category:** Architecture  
**Severity:** Critical

**GoClaw endpoint duplication.** There are two parallel sets of GoClaw API endpoints:

- `src/pages/api/goclaw/` — root-level (13 files)
- `src/pages/api/goclaw/[product]/` — product-scoped (13 files)

These are nearly identical, differing only in auth guard (`verifyGoclawApiKey` vs `verifyProductScope`) and one extra collection-permission check. Each pair duplicates business logic (list, create, read, update, delete patterns).

**Impact:** 26 files share ~80% identical code. Bug fixes must be applied in 2 places.

**Fix:** Create shared handler factories in `lib/goclaw/handlers/`:
```ts
export function createContentListHandler(authFn: AuthFn) { ... }
```
Then API route files become 5-line wrappers calling the factory.

**`json()` helper duplication.** 69 files define their own `function json(data, status)`. Same 3-line function copy-pasted everywhere.

**Fix:** Export from `lib/api-response.ts`:
```ts
export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}
```

**`Response(JSON.stringify(...))` raw construction.** 81 files construct Response objects manually with JSON headers.

**Fix:** Same `json()` utility covers this.

### 2B. Three Auth Systems in Middleware

**Category:** Architecture  
**Severity:** Medium

`src/middleware.ts` (113 LOC) handles three coexisting auth systems:
1. Admin JWT — custom cookie-based
2. Better Auth — SaaS users (Turso)
3. Supabase — marketplace users

This is documented and intentional, but the Supabase integration is incomplete:
```ts
locals.user = { id: 'pending-ssr-integration' }  // line 56
```
This is a placeholder. Any code checking `locals.user` gets a fake object.

**Fix:** Complete the Supabase SSR integration or remove the placeholder to avoid false positives.

### 2C. Separation of Concerns

**Category:** Architecture  
**Severity:** Low

The `lib/` → `components/` → `pages/` layering is well-maintained:
- `lib/` contains business logic, API clients, type definitions
- `components/` contains UI components (admin React, landing Astro, islands)
- `pages/` contains route handlers

Clone AI pipeline is well-modularized across 7 files (`clone-ai-utils.ts`, `clone-prompts.ts`, `clone-design-extractor.ts`, `clone-post-processor.ts`, `clone-pipeline-v3.ts`, `clone-section-logger.ts`, `clone-site-analyzer.ts`) with clear single-responsibility.

### 2D. API Route Consistency

**Category:** Architecture  
**Severity:** Medium

**Inconsistent error handling.** Some API routes lack try-catch:
- `src/pages/api/products/[slug]/settings.ts` — no try-catch
- `src/pages/api/unsubscribe.ts` — no try-catch
- `src/pages/api/admin/landing/clone-stats.ts` — no try-catch

**Inconsistent feature guard usage.** Admin API routes use different auth patterns:
- Some check `checkFeatureEnabled()` + verify token
- Some rely solely on middleware auth guard
- GoClaw routes check feature guard + API key

No standard middleware-level guard for admin routes — each route handles its own.

**Fix:** Consider a shared `withAdminAuth()` or `withGoclawAuth()` wrapper that standardizes auth + feature guard + try-catch + json response formatting.

---

## 3. Scalability Concerns

### 3A. File-System YAML Reading at Scale

**Category:** Scalability  
**Severity:** High

**Affected:** `src/lib/landing/landing-config-reader.ts`

`listLandingConfigs()` reads and parses ALL YAML files synchronously on every call:
```ts
return fs.readdirSync(dir)
  .filter(f => f.endsWith('.yaml'))
  .map(f => { readLandingConfig(slug) })  // parses each YAML
```

**At 100+ landing pages:** Every list request triggers 100+ `fs.readFileSync` + `yaml.load` calls. Same pattern in `listTemplates()`.

**At 1000+ products:** `src/lib/admin/product-io.ts` and `content-io-local.ts` have identical read-all-then-filter patterns.

**Fix (short-term):** Add in-memory cache with filesystem watcher invalidation:
```ts
const configCache = new Map<string, { data: LandingPageConfig; mtime: number }>()
```

**Fix (long-term):** Build a lightweight index file (`landing-pages-index.json`) that stores metadata (slug, title, sectionCount) and is regenerated on write operations. List endpoints read only the index.

### 3B. Feature Guard Disk I/O Per Request

**Category:** Scalability  
**Severity:** Medium

**Affected:** `src/lib/admin/feature-guard.ts`

Has a 5-second cache, which is good. But `readEnabledFeatures()` uses synchronous `fs.readFileSync` which blocks the event loop.

**Fix:** Switch to async `fs.promises.readFile` and cache the Promise (not the result) to avoid thundering herd.

### 3C. Concurrent AI Clone Operations

**Category:** Scalability  
**Severity:** High

**Affected:** `src/lib/admin/clone-ai-utils.ts` (line 33-35)

```ts
/** @deprecated Use firecrawlFetchWithMarkdown instead — global state causes race conditions */
let _lastMarkdown = ''
export function getLastMarkdown(): string { return _lastMarkdown }
```

Global mutable state for storing last-fetched markdown. The deprecation comment acknowledges the race condition, but the code is still exported and used by `landing-clone-ai.ts`.

**Two concurrent clone operations will overwrite each other's markdown.**

**Fix:** Remove global state. Pass markdown as return value through the pipeline:
```ts
export async function firecrawlFetch(url: string, apiKey: string): Promise<{ html: string; markdown: string }>
```

### 3D. SQLite Local Database for Marketplace

**Category:** Scalability  
**Severity:** Low (dev-only)

**Affected:** `src/lib/supabase/local-database.ts`

Singleton SQLite with WAL mode. Fine for local dev. The Supabase fallback pattern is reasonable. No issue at scale since production uses Supabase.

---

## 4. Type Safety

### 4A. Excessive `as any` Casting

**Category:** Code Quality  
**Severity:** High

**60+ instances of `as any` in non-test production code.** Key hotspots:

| File | Count | Worst Offenders |
|------|-------|-----------------|
| `landing-clone-modal.tsx` | 15 | `(result as any).usage`, `(result as any).chunks`, `(result as any).missingSections` — clone result type is underspecified |
| `landing-section-forms.tsx` | 8 | `type as any`, `data as any`, `variant as any` — form data types are loose |
| `landing-page-editor.tsx` | 5 | `(res.data as any)?.slug`, `(lo.section.data as any).columns` |
| `[landing].astro` | 4 | `product: any`, `products: any[]` — page-level type erasure |

**Root cause:** `CloneResult` type in `clone-ai-utils.ts` uses `Record<string, unknown>` for section data, and API response types are `unknown`. Downstream consumers resort to `as any` to access fields.

**Fix:**
1. Extend `CloneResult` with optional typed fields for `usage`, `chunks`, `missingSections`, `sectionQuality`
2. Type API client responses properly instead of returning `adminFetch<unknown>`
3. Use discriminated unions for section data based on section type

### 4B. Untyped API Client Methods

**Category:** Code Quality  
**Severity:** Medium

**Affected:** `src/lib/admin/api-client.ts`

Multiple methods return `adminFetch<unknown>`:
```ts
landing: {
  list: () => adminFetch<unknown>('/api/admin/landing'),
  read: (slug: string) => adminFetch<unknown>(`/api/admin/landing/${slug}`),
  clone: (url: string, intent?: string) => adminFetch<unknown>('/api/admin/landing/clone', ...),
}
entities: {
  listDefinitions: () => adminFetch<unknown>('/api/admin/entity-definitions'),
  listInstances: (name: string) => adminFetch<unknown>(`/api/admin/entities/${name}`),
}
```

Every caller must cast: `(res.data as any)?.entries || []`

**Fix:** Define response types for each endpoint and use them:
```ts
landing: {
  list: () => adminFetch<{ entries: LandingPageMeta[] }>('/api/admin/landing'),
}
```

---

## 5. Dead Code & Deprecated Patterns

### 5A. Duplicate Template Picker

**Category:** Maintainability  
**Severity:** Medium

Two template picker components exist:
- `src/components/admin/landing/template-picker.tsx` (used by `landing-setup-wizard.tsx`)
- `src/components/admin/landing/landing-template-picker.tsx` (used by `landing-pages-list.tsx`)

Both fetch templates from the API and display a selection grid. Near-identical functionality.

**Fix:** Consolidate into one component. The `landing-template-picker.tsx` version has better typing (`TemplateMeta` vs `any`). Migrate `landing-setup-wizard.tsx` to use it and delete `template-picker.tsx`.

### 5B. Deprecated Global State Still in Use

**Category:** Code Quality  
**Severity:** Medium

`clone-ai-utils.ts` exports `getLastMarkdown()` / `setLastMarkdown()` marked `@deprecated` but still actively called by `firecrawlFetch()` and consumed by `landing-clone-ai.ts`.

### 5C. Section Type Lists Defined in Multiple Places

**Category:** Maintainability  
**Severity:** Low

- `SECTION_TYPES` in `clone-ai-utils.ts` (26 types, string array)
- `SECTION_CATALOG` in `landing-page-editor.tsx` (typed objects with labels/descriptions)
- `NESTED_SECTION_TYPES` in `landing-section-forms.tsx` (subset)
- `sectionFormMap` in `landing-section-forms.tsx` (27 entries)
- `sectionLabels` in `landing-live-preview.tsx` (8 entries)

Adding a new section type requires updating 5+ files.

**Fix:** Single source of truth in `lib/landing/landing-section-catalog.ts`:
```ts
export const SECTION_CATALOG = [ { type: 'hero', label: 'Hero', icon: '...', ... }, ... ] as const
export const SECTION_TYPES = SECTION_CATALOG.map(s => s.type)
export type SectionType = typeof SECTION_TYPES[number]
```

---

## 6. Architectural Wins (What's Working Well)

- **Content IO abstraction** — `ContentIO` interface with `LocalContentIO` and `GitHubContentIO` implementations. Clean strategy pattern.
- **Feature guard with cache** — Server-side feature flags via YAML with TTL cache. Simple and effective.
- **Clone pipeline decomposition** — AI clone split across 7 focused modules. Good separation of prompts, utils, design extraction, post-processing.
- **API client centralization** — Single `api-client.ts` for all admin API calls with auto-401 redirect.
- **Astro hybrid SSR** — 84 SSR routes for dynamic content, static pages for public-facing content. Correct usage pattern.
- **Landing type system** — 470 LOC of comprehensive type definitions shared across Astro, React, and API layers.

---

## Summary by Priority

| Priority | Count | Key Actions |
|----------|-------|-------------|
| Critical | 3 | GoClaw endpoint duplication (26 files), `json()` helper duplication (69 files), Global state race condition in clone pipeline |
| High | 5 | File-size violations (5 files >500 LOC), `as any` proliferation (60+ instances), FS-based YAML read-all-at-scale, Untyped API client methods, Section type list fragmentation |
| Medium | 5 | Incomplete Supabase auth placeholder, Inconsistent API error handling, Duplicate template picker, Feature guard sync I/O, Deprecated code still in use |
| Low | 2 | Local SQLite dev-only concern, Section label maps scattered |

### Top 3 High-Impact Refactors

1. **Extract shared `json()` + API handler utilities** — Touches 69+ files but eliminates massive duplication and standardizes error handling. Could be done incrementally.

2. **Split `landing-section-forms.tsx` (1319 LOC)** — Highest LOC file. Each of 27 forms becomes its own file (~30-60 LOC). Mechanical refactor, low risk, high readability win.

3. **Create GoClaw handler factories** — Collapses 26 near-duplicate files into 13 thin wrappers + shared handlers. Eliminates bug-fix-in-two-places risk.

---

## Unresolved Questions

- Is the Supabase marketplace auth (`locals.user = { id: 'pending-ssr-integration' }`) actively used in production, or is it a placeholder for future work?
- Are the root-level GoClaw endpoints (`/api/goclaw/content/...`) still needed, or were they superseded by product-scoped ones (`/api/goclaw/[product]/content/...`)?
- What is the expected max landing page count? If >50, the YAML read-all pattern needs caching urgently.
