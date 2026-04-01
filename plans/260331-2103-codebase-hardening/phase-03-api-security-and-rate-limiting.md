# Phase 3 — API Security + Rate Limiting

**Priority:** P1
**Effort:** Medium (3-4 hours)
**Status:** Planned
**Depends on:** Phase 1 (auth patterns established)

## Context

- [Security Audit Report](../reports/security-260331-2057-codebase-security-audit.md)
- Findings: M1-M10

## Fixes

### 3.1 Rate Limiting (M1)

**Files:** All `src/pages/api/**/*.ts`

**Fix:**
- [ ] Create `src/lib/rate-limiter.ts` — in-memory sliding window (Map-based, resets on deploy)
- [ ] Apply to auth endpoints: 5 attempts/min per IP
- [ ] Apply to AI endpoints (clone, voice-analyze, distribution): 10 req/min per session
- [ ] Apply to subscribe endpoint: 3 req/min per IP
- [ ] Return 429 with `Retry-After` header

### 3.2 CSRF Protection (M2)

**Fix:**
- [ ] Add CSRF token generation in admin auth flow
- [ ] Validate token on all admin POST/PUT/DELETE endpoints
- [ ] Or use SameSite=Strict on auth cookies (simpler, sufficient for same-origin)

### 3.3 Prompt Injection Hardening (M3)

**Files:**
- `src/lib/admin/landing-clone-ai.ts` — clone pipeline
- `src/pages/api/marketplace/intent.ts` — AI search
- `src/pages/api/admin/voice-analyze.ts` — voice analysis

**Fix:**
- [ ] Sanitize user input before embedding in prompts (strip control chars, limit length)
- [ ] Use system prompt + user prompt separation (already partially done)
- [ ] Add output validation — reject AI responses that contain suspicious patterns

### 3.4 Path Traversal in Content I/O (M4)

**Files:**
- `src/lib/admin/content-io-local.ts`
- `src/lib/admin/entity-io.ts`

**Fix:**
- [ ] Validate slugs: reject `..`, `/`, null bytes
- [ ] Resolve paths and verify within allowed directory before read/write

### 3.5 Error Message Sanitization (M5)

**Fix:**
- [ ] Create standard error response helper: `apiError(status, publicMsg, internalErr?)`
- [ ] Replace raw `error.message` in responses with generic messages in production
- [ ] Log detailed errors server-side only

### 3.6 Missing Try-Catch on 13 API Routes (M6)

**Fix:**
- [ ] Add try-catch to all API routes lacking them
- [ ] Use consistent error response format

## Success Criteria

- [ ] Rate limiting active on auth + AI endpoints
- [ ] No internal error details leaked in API responses
- [ ] Path traversal blocked on content I/O
- [ ] All API routes have error handling
