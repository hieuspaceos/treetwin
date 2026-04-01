# Phase 5 — Performance + Code Quality

**Priority:** P2
**Effort:** Medium (3-4 hours)
**Status:** Planned

## Context

- [Performance Audit](../reports/performance-260331-2057-codebase-performance-review.md)

## 5.1 Gemini API Timeouts (High)

**Files:** `ai-setup-generator.ts`, `voice-analyze.ts`, `distribution-generator.ts`, `voice-preview.ts`

**Fix:**
- [ ] Add `AbortSignal.timeout(30000)` to all Gemini fetch calls
- [ ] For SDK calls, pass `requestOptions: { timeout: 30000 }`
- [ ] Return user-friendly "AI request timed out" error

## 5.2 Astro Image Optimization (High)

**Problem:** All landing pages use raw `<img>` — no WebP/AVIF, no responsive srcset.

**Fix:**
- [ ] Use Astro `<Image>` component in landing sections that display user images
- [ ] Add `loading="lazy"` to below-fold images
- [ ] Priority: hero, gallery, team, image-text sections

## 5.3 Landing Page Collection Query (Medium)

**File:** `src/pages/[landing].astro`

**Fix:**
- [ ] Replace `getCollection('landingPages')` + filter with `getEntry('landingPages', slug)`
- [ ] Only call `getCollection('products')` when page has product association

## 5.4 Google Fonts Self-Hosting (Medium)

**Problem:** Homepage loads DM Sans/DM Serif Display via Google Fonts CDN (200-400ms delay).

**Fix:**
- [ ] Download DM Sans + DM Serif Display to `public/fonts/`
- [ ] Use `@font-face` declarations like existing Inter font
- [ ] Remove Google Fonts `<link>` tags

## 5.5 Remove Global Mutable State (Medium)

**File:** `src/lib/admin/clone-ai-utils.ts`

**Fix:**
- [ ] Remove `_lastMarkdown` global state (already marked @deprecated)
- [ ] Return markdown as part of `firecrawlFetch()` return value
- [ ] Update all callers

## 5.6 API Response Caching Headers (Medium)

**Fix:**
- [ ] Add `Cache-Control: public, max-age=300` on read-only endpoints (marketplace products, templates, landing configs)
- [ ] Add `Cache-Control: no-store` on auth/admin endpoints

## 5.7 Gemini Retry Logic (Low)

**File:** `src/lib/admin/clone-ai-utils.ts`

**Fix:**
- [ ] Add single retry with 2s backoff on 429/503 errors
- [ ] Log retry attempts

## Success Criteria

- [ ] All AI endpoints have 30s timeout
- [ ] Landing images use Astro Image component
- [ ] No global mutable state in clone pipeline
- [ ] Read-only APIs return cache headers
