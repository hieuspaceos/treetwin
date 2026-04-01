# Phase 6 — Architecture Cleanup + Scalability

**Priority:** P2
**Effort:** Large (4-6 hours)
**Status:** Planned
**Depends on:** Phase 4 (dedup done first)

## Context

- [Architecture Review](../reports/architecture-260331-2057-codebase-architecture-review.md)

## 6.1 Type Safety — Remove `as any` Casts (60+)

**Problem:** `adminFetch<unknown>` returns force downstream `(res.data as any)` casting.

**Fix:**
- [ ] Add proper generics to `adminFetch<T>` with typed response interfaces
- [ ] Define response types for each API endpoint
- [ ] Remove `as any` casts incrementally (admin landing, products, entities)

## 6.2 Unified Auth Middleware

**File:** `src/middleware.ts`

**Problem:** 3 auth systems coexist (Admin JWT, Better Auth, Supabase). Supabase has `locals.user = { id: 'pending-ssr-integration' }` placeholder.

**Fix:**
- [ ] Complete Supabase SSR integration or remove placeholder
- [ ] Document auth flow decision: which system handles what
- [ ] Consider consolidating to Better Auth if Supabase auth is no longer needed

## 6.3 Consistent API Error Handling

**Problem:** Some routes lack try-catch, inconsistent error formats, different auth patterns.

**Fix:**
- [ ] Create `src/lib/api-middleware.ts` — shared `withAuth()`, `withFeatureGuard()` wrappers
- [ ] Standardize error response format: `{ error: string, code?: string }`
- [ ] Apply to all admin + GoClaw routes

## 6.4 Section Type Registry (Scattered Definitions)

**Problem:** Adding a section type requires updates in 5+ files.

**Fix:**
- [ ] Create `src/lib/landing/section-registry.ts` — single source of truth for section types
- [ ] All files reference registry instead of maintaining their own lists
- [ ] Auto-generate section catalog for admin UI from registry

## 6.5 FS-Based Landing Page Scaling

**Problem:** `listLandingConfigs()` parses every YAML file on each call. Degrades at 100+ pages.

**Fix:**
- [ ] Add in-memory cache with TTL (invalidate on write)
- [ ] Or use Astro content layer caching (already optimized for getCollection)
- [ ] Index landing page metadata for list views (avoid full YAML parse)

## 6.6 Duplicate Template Picker Components

**Fix:**
- [ ] Consolidate `template-picker.tsx` and `landing-template-picker.tsx` into one
- [ ] Use props to differentiate context (setup wizard vs editor)

## Success Criteria

- [ ] `as any` count reduced by >80%
- [ ] Auth middleware unified with clear documentation
- [ ] API error handling standardized
- [ ] Section types defined in single registry
- [ ] Landing page listing performant at 100+ pages
