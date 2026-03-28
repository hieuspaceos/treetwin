# System Architecture

Tree Identity is a **hybrid static + SSR platform** for content + commerce.
- **Content:** Static-first, zero JS by default (git-tracked Markdown/YAML)
- **Marketplace:** SSR-enabled for auth + database queries

**Quick Facts:**
- **Framework:** Astro 5 (hybrid: static + on-demand SSR)
- **CMS:** Keystatic (git-based)
- **Content:** Markdown + YAML (git-tracked)
- **Database:** Supabase PostgreSQL (marketplace) + SQLite fallback (dev)
- **Auth:** Google OAuth via Supabase Auth
- **Deploy:** Vercel
- **Admin:** Custom React SPA at `/admin`
- **Search:** Pagefind (static) + Gemini AI (intent search)
- **Design Philosophy:** Content-first, performance-optimized, DX-focused

## Contents

### Core Architecture
- [Content Pipeline](./content-pipeline.md) — Build flow, SSG, SSR endpoints, data flow
- [Theme System](./theme-system.md) — CSS variables, theme registry, customization
- [Search Architecture](./search.md) — Pagefind indexing, client-side search

### Marketplace (NEW — v3.0.0)
- [Marketplace Architecture](./marketplace.md) — Hybrid SSR, Supabase database, Google OAuth, AI intent search, license delivery

### Admin Dashboard
- [Admin Dashboard](./admin-dashboard.md) — React SPA, CRUD operations, CodeMirror editor, media browser
- [Admin Features](./admin-features.md) — Content management, voice analysis, analytics, feature toggles
- [Media Management](./media-management.md) — R2 storage, upload flow, media browser integration

### Landing Pages
- [Landing Page System](./landing-pages.md) — YAML config, 11 section types (36 variants), D&D editor
- [Landing Design System](./landing-design.md) — Per-page customization, 6 presets, CSS variables, AI clone
- [Section Components](./landing-sections.md) — 11 section types, variants, responsive design

### Product & Entity Systems
- [Product Module System](./products.md) — Multi-tenant products, per-product admin, API scoping
- [Entity System](./entities.md) — Custom entity schemas, CRUD, public rendering at `/e/*`
- [Feature Module Registry](./feature-registry.md) — Toggle-based features, UI/API/public gating

### External Integration
- [GoClaw Integration](./goclaw.md) — External AI agent integration, Phase 1-3+ endpoints, write policy
- [Product-Scoped GoClaw API](./goclaw-product.md) — Product filtering, feature gating, 15 endpoints
- [Feature Builder](./feature-builder.md) — AI-assisted module generation, Phase 1-3, hybrid code gen

### Voice & i18n
- [Voice Management](./voices.md) — Voice profiles, effectiveness scoring, AI analysis, preview generation
- [Translations System](./translations.md) — i18n module, multi-language support, admin editor

### Utilities & Extensions
- [Extension Points](./extension-points.md) — Adding pages, collections, styles, API routes, customizations

---

**Last updated:** 2026-03-28
**Version:** v3.0.0 (Marketplace Evolution)
