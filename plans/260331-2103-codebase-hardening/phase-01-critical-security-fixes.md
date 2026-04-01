# Phase 1 — Critical Security Fixes

**Priority:** P0 — Must fix before any public deployment
**Effort:** Small (2-3 hours)
**Status:** Planned

## Context

- [Security Audit Report](../reports/security-260331-2057-codebase-security-audit.md)

## Overview

4 critical vulnerabilities that allow authentication bypass, secret leakage, and server-side request forgery. All are exploitable without authentication.

## Fixes

### 1.1 Plaintext Password Comparison (C1 + C2)

**Files:**
- `src/lib/admin/auth.ts` lines 137-145
- `src/pages/api/admin/auth.ts` line 37

**Problem:** Multi-user mode and product-scoped login compare passwords with `!==` (plaintext). Single-user mode already uses PBKDF2 + constant-time compare.

**Fix:**
- [ ] Hash passwords in `ADMIN_USERS` env var using PBKDF2 (same as single-user)
- [ ] Replace `user.password !== password` with `await verifyPassword(password, user.passwordHash)`
- [ ] Hash product YAML `users[].password` fields similarly
- [ ] Add migration note in `.env.example` for existing users

### 1.2 ADMIN_SECRET Reused as Bearer Token (C3)

**File:** `src/lib/admin/product-api-auth.ts` lines 71-74

**Problem:** JWT signing secret accepted as API bearer token. One leaked secret = total compromise.

**Fix:**
- [ ] Add new `ADMIN_API_KEY` env var for bearer token auth
- [ ] Remove `adminSecret` as accepted bearer token
- [ ] Update `.env.example` with new var
- [ ] Update GoClaw/product API docs

### 1.3 SSRF via Image Proxy (C4)

**File:** `src/pages/api/proxy-image.ts` lines 8-30

**Problem:** Unauthenticated endpoint fetches any URL server-side. Can scan internal networks, steal cloud metadata.

**Fix:**
- [ ] Require admin auth on the endpoint
- [ ] Block private/internal IP ranges (RFC 1918, 169.254.x.x, 10.x.x.x, etc.)
- [ ] Whitelist allowed content-types (image/*)
- [ ] Set response size limit (e.g., 10MB)
- [ ] Block cloud metadata endpoints explicitly

## Success Criteria

- [ ] All 4 critical findings resolved
- [ ] No plaintext password comparisons remain
- [ ] ADMIN_SECRET only used for JWT signing
- [ ] proxy-image requires auth + validates URLs
- [ ] Existing tests pass
