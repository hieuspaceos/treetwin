# Phase 2 — XSS Sanitization + Auth Hardening

**Priority:** P0
**Effort:** Medium (3-4 hours)
**Status:** Planned

## Context

- [Security Audit Report](../reports/security-260331-2057-codebase-security-audit.md)
- Findings: H1-H8

## Fixes

### 2.1 XSS Sanitization Chain (H4 + H5 + H6)

**Problem:** `set:html` with only `<script>` stripping. Misses `<img onerror>`, `<svg onload>`, event handlers, iframes, CSS injection. `sanitize-html` already installed but unused in render path.

**Files:**
- `src/components/landing/landing-rich-text.astro` lines 44-55
- `src/components/landing/landing-hero.astro` lines 71, 102, 145
- `src/components/landing/landing-section-renderer.astro` line 174

**Fix:**
- [ ] Create `src/lib/landing/html-sanitizer.ts` — wrapper around `sanitize-html` with strict allowlist
- [ ] Apply sanitizer to all `set:html` in landing components (rich-text, hero embed)
- [ ] Create `src/lib/landing/css-sanitizer.ts` — strip `url()` with external domains, `expression()`, `@import`, `position: fixed`, `javascript:` from AI-generated CSS
- [ ] Apply CSS sanitizer in section-renderer before `<style set:html=...>`

### 2.2 Timing-Safe Comparisons (H1 + H2)

**Files:**
- `src/lib/goclaw/api-auth.ts` line 24
- `src/pages/api/goclaw/webhook.ts` line 35

**Fix:**
- [ ] Replace `token !== apiKey` with `crypto.timingSafeEqual()`
- [ ] Replace `expected === incoming` HMAC compare with `crypto.timingSafeEqual()`
- [ ] Add length pre-check before timing-safe compare

### 2.3 Webhook HMAC Required When API Key Set (H3)

**File:** `src/pages/api/goclaw/webhook.ts` lines 49-50

**Fix:**
- [ ] Log prominent warning when `GOCLAW_API_KEY` set but `GOCLAW_WEBHOOK_SECRET` missing
- [ ] Or require both when either is configured

### 2.4 Checkout Auth Guard (H7)

**Files:**
- `src/pages/api/checkout/create.ts`
- `src/pages/api/checkout/confirm.ts`

**Fix:**
- [ ] Gate `local-user` hardcode to `!import.meta.env.PROD`
- [ ] Require Better Auth / Supabase session in production
- [ ] Use actual authenticated user ID for orders

### 2.5 Feature Builder Path Validation (H8)

**File:** `src/pages/api/admin/feature-builder/generate.ts` lines 51-62

**Fix:**
- [ ] Validate all resolved paths start with `process.cwd()`
- [ ] Add `path.resolve()` + `startsWith` check before any `fs.writeFile`

## Success Criteria

- [ ] All 8 high findings resolved
- [ ] XSS test: `<img onerror=alert(1)>` in rich-text renders safely
- [ ] CSS injection test: `url(https://evil.com)` stripped from scoped CSS
- [ ] Timing attacks mitigated on all auth comparisons
- [ ] Checkout requires real auth in production mode
