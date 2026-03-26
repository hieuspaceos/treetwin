# Development Roadmap

Strategic roadmap for Tree Identity. Tracks active work, completed milestones, and future directions.

## Current Status (2026-03-26)

**Phase:** v2.3.0 complete — Landing Page Builder System deployed
**Completion:** Phases 1-7 complete. Landing builder fully implemented with 9 sub-phases. Ready for product builder use cases.
**Active Team:** Solo (HieuSpace)
**Key Features Added:** 10 section components, entity system, AI setup wizard, 5 product templates, GoClaw landing API integration

---

## Phase 1 — Foundation & Migration ✓ COMPLETE

**Timeline:** 2026-03-01 to 2026-03-10
**Status:** Complete
**Effort:** 40 hours

### Deliverables
- [x] Astro 5 migration from Next.js 15 + Payload CMS
- [x] Content schema: Articles, Notes, Records (Markdown + YAML)
- [x] Keystatic integration (local dev + GitHub production mode)
- [x] Theme system: CSS variable tokens, liquid-glass theme
- [x] Pagefind static search indexing
- [x] Vercel deployment with Analytics + Speed Insights
- [x] CI/CD: GitHub Actions, branch protection, auto-deploy

**Key Decisions:**
- No database: git is source of truth
- Static-first: 99% pre-rendered pages
- Minimal JS: zero by default, islands only where needed

---

## Phase 2 — AI/LLM Optimization ✓ COMPLETE

**Timeline:** 2026-03-10 to 2026-03-11
**Status:** Complete
**Effort:** 8 hours

### Deliverables
- [x] JSON-LD schema: Article, BreadcrumbList, Person entities
- [x] llms.txt site overview (speculative AI signal)
- [x] Citation metadata: Dublin Core, citation_* attributes
- [x] RSS feed: `@astrojs/rss` for feed freshness
- [x] robots.txt per-AI-agent (training vs search crawlers)
- [x] XSS protection: `safeJsonLd()` escapes
- [x] Article summaries for cleaner AI extraction

**Success Metrics:**
- AI crawlers (Claude-SearchBot, PerplexityBot, Gemini-Deep-Research) can index content
- Training crawlers (GPTBot, ClaudeBot) are blocked
- JSON-LD validates against Schema.org

---

## Phase 3 — Custom Admin Dashboard ✓ COMPLETE

**Timeline:** 2026-03-10 to 2026-03-11
**Status:** Complete
**Effort:** 32 hours

### Deliverables
- [x] Admin shell: sidebar navigation, topbar, glass-panel styling
- [x] API layer: CRUD for articles/notes/records, auth middleware
- [x] Content editor: enhanced Markdown textarea with toolbar + Markdoc output
- [x] Media browser: drag-drop upload, R2 integration, thumbnails
- [x] Preview: live seed page preview with draft support
- [x] Polish: error boundaries, keyboard shortcuts, loading skeletons
- [x] Config: `site-config.ts` admin branding (title, color)
- [x] Build: 0 Astro check errors, `astro build` succeeds

**Architecture:**
- Admin SPA at `/admin` (Astro SSR shell + React islands)
- Auth: env-var password + 7-day session cookies
- Media: Cloudflare R2 with `ListObjectsV2` pagination
- Editor: Enhanced Markdown textarea with formatting toolbar

**Breaking Changes:**
- Keystatic UI no longer user-facing (internal schema only)
- Admin moved from `/keystatic` to `/admin`

---

## Phase 4 — Content Distribution Pipeline ✓ COMPLETE

**Timeline:** 2026-03-11
**Status:** Complete
**Effort:** 4 hours

### Deliverables
- [x] `scripts/distribute-content.py`: Gemini Flash social post generation
- [x] Content distribution rules: 10 platform formats (Twitter, LinkedIn, Dev.to, Hashnode, Reddit, Facebook, Medium, Hacker News, Threads, Viblo)
- [x] Distribution logging: CSV with timestamp, platform, post content, status
- [x] `/distribute <slug>` skill for quick generation
- [x] `/marketing-review` skill for campaign tracking
- [x] `docs/marketing-metrics.md` bi-weekly template

**Success Metrics:**
- Can generate 10 platform variants from 1 article in <5 seconds
- Posts follow brand voice: thoughtful, concise, no hype
- CSV logging enables ROI tracking

---

## Phase 4.5 — Voice Management System ✓ COMPLETE

**Timeline:** 2026-03-19
**Status:** Complete
**Effort:** 8 hours

### Deliverables
- [x] Voice profiles collection: create/edit/delete in admin UI (`/admin/voices`)
- [x] i18n module: translations editor with EN/VI support, dynamic key creation
- [x] Voice effectiveness scoring: 6-dimension heuristic evaluation with visual score badge
- [x] AI voice analysis: Gemini-powered evaluation with bilingual feedback (EN/VI)
- [x] Voice preview generator: AI-generated opening paragraphs in voice style (200+ words)
- [x] Chip-select defaults: wired to i18n translations system for voice options
- [x] ArrayField enhancement: fixed to handle nested objects (`{context, text}` samples)
- [x] Content list UX: hidden status/published for config collections (voices, categories)
- [x] CSS modularization: split admin.css (1247 LOC) → 7 focused modules (<200 LOC each)
- [x] Admin UI redesign: Fira Sans/Code fonts, 3-tier glass morphism, animations, mobile responsive
- [x] New API endpoints: `/api/admin/voice-analyze`, `/api/admin/voice-preview`
- [x] New components: `voice-score-panel.tsx`, `voice-preview-modal.tsx`

**Architecture:**
- Voice profiles: separate collection with language/tone/audience metadata
- i18n system: centralized translations for UI + voice option defaults
- Gemini integration: system prompts for voice analysis + preview generation
- CSS: modularized into semantic layers (tokens, layout, components, editor, table, media, responsive)

**Key Insights:**
- Voice samples collection as `array` of objects (not string items) works with enhanced ArrayField
- CSS modularization enables ~70% reuse for potential white-label themes
- i18n module extensible for future language support (currently EN/VI)

---

## Phase 5 — Consolidation (Backlog from 2026-03-19)

**Status:** Pending (Phase 4.5 voice management now complete)
**Previous Deliverables:** 88 tests, modularized content-io, docs sync

---

## Phase 5.5 — Feature Module System ✓ COMPLETE

**Timeline:** 2026-03-26
**Status:** Complete
**Effort:** 8 hours

### Deliverables
- [x] Feature Registry Core: static registry with 7 optional features
- [x] Dynamic Admin Layout: lazy-loaded feature routes, conditional nav rendering
- [x] Settings Feature Toggles: UI for enabling/disabling features in admin
- [x] API Route Guards: all 20 feature endpoints guarded with 403 responses
- [x] Public Component Guards: email subscribe form and GA4 script conditionally rendered
- [x] Testing: 60 new tests, 148 total pass, build clean

**Architecture:**
- 3-layer gating: UI (sidebar + routes), API (request guard), public (component rendering)
- Settings file-based: no env vars needed, toggle via admin UI
- Backward compatible: missing toggles default to enabled
- Tree-shakeable: unused pages only load when navigated to

**Files Created:**
- `src/lib/admin/feature-registry.ts` — Feature definitions, helpers
- `src/lib/admin/feature-guard.ts` — Server-side checks with caching
- `src/components/admin/feature-toggles-panel.tsx` — Settings UI

**Files Modified:**
- `src/components/admin/admin-app.tsx`, `admin-layout.tsx`, `admin-sidebar.tsx` (20 feature API routes)
- `src/pages/api/admin/*`, `/api/goclaw/*`, `/api/distribute/*` (guarded)
- `src/components/subscribe-form.astro`, `layouts/base-layout.astro` (public guards)
- `src/content.config.ts` (enabledFeatures schema)

---

## Phase 7 — Landing Page Builder System ✓ COMPLETE

**Timeline:** 2026-03-26
**Status:** Complete (9 sub-phases)
**Effort:** 18 hours

### Phase 7 Deliverables
- [x] **Phase 7.1:** 10 Astro section components (hero, features, pricing, testimonials, faq, cta, stats, how-it-works, team, logo-wall)
- [x] **Phase 7.2:** Landing config renderer (YAML-to-static-HTML pipeline)
- [x] **Phase 7.3:** 5 product templates (saas, agency, course, ecommerce, portfolio)
- [x] **Phase 7.4:** Admin landing editor (React CRUD + inline section editors)
- [x] **Phase 7.5:** Custom entity system (dynamic YAML-schema entities + auto-generated admin CRUD)
- [x] **Phase 7.6:** AI setup wizard (Gemini Flash → product description → landing config)
- [x] **Phase 7.7:** GoClaw landing API (9 REST endpoints for external AI integration)
- [x] **Phase 7.8:** Feature registry (3 new toggleable modules: landing, entities, setup-wizard)
- [x] **Phase 7.9:** GoClaw Hub skill (tree-id-manager for agent orchestration)

**Architecture:**
- 10 section components: props-driven Astro (zero JS)
- YAML-first config system: type-safe Zod validation
- Entity system: extensible custom data types (testimonials, team, portfolio items, etc.)
- Build-time rendering: all landings pre-rendered to static HTML
- AI generation: Gemini produces landing configs from product descriptions
- GoClaw integration: external agents create/update landings (force draft for approval)

**Key Insights:**
- Section components are reusable, composable building blocks
- Entity system enables DRY data: testimonials, team members, case studies all use same entity system
- YAML config in git = full version history + easy merge/review
- AI setup wizard reduces landing creation time from hours to seconds
- GoClaw integration enables "AI as content initiator" workflows

### Phase 6 — GoClaw API Adapter ✓ COMPLETE (Phase 1)

**Timeline:** 2026-03-25
**Status:** Phase 1 Complete (Health + Webhook) — Extended in Phase 7
**Effort:** 3 hours (+ 6 hours in Phase 7.7)

### Phase 1 Deliverables
- [x] GoClaw API authentication: Bearer token verification via `GOCLAW_API_KEY` env var
- [x] Health check endpoint: `GET /api/goclaw/health` (returns 503 if not configured)
- [x] Webhook receiver: `POST /api/goclaw/webhook` with HMAC-SHA256 signature verification
- [x] Shared types: WebhookPayload, GoclawApiResponse interfaces
- [x] Write policy: All writes force `status: draft` (human approval required)
- [x] Documentation: System architecture + API reference

**Phase 7.7 Extensions (Landing Integration):**
- [x] 9 GoClaw landing endpoints (`GET /api/goclaw/landing`, `POST /api/goclaw/landing`, etc.)
- [x] Entity endpoints for GoClaw agents
- [x] Template endpoints for agent discovery
- [x] AI setup endpoint for external orchestration
- [x] Draft-forcing security policy for all GoClaw writes

### Phase 2-4 (Backlog - Future)
- Phase 2: Extended content CRUD endpoints (`/api/goclaw/content/{slug}`)
- Phase 3: Voice profiles reader (`/api/goclaw/voices`)
- Phase 4: SEO analysis trigger (`/api/goclaw/seo-analyze`)

---

## Phase 8 — Future Enhancements (Backlog)

### 8A — Landing Page Advanced Features (Proposed)
**Effort:** 12 hours
**Priority:** P2

- Custom CSS per landing (inline styles + class editor)
- A/B testing framework (multiple versions of sections)
- Landing analytics (page views, conversion tracking via Vercel Analytics)
- Email capture widget (integrated with subscriber system)
- Redirect rules after form submission
- SEO customization per landing (meta tags, structured data)

**Dependencies:**
- Vercel Analytics API
- Email service integration (already have Resend)

---

### 8B — Analytics Dashboard (Proposed)
**Effort:** 12 hours
**Priority:** P2

- Integrate Vercel Analytics API
- Custom `/admin/analytics` dashboard
- Metrics: page views, traffic sources, referrers, device types
- UI: charts, filters by date range, export CSV
- Goal: understand audience engagement

**Dependencies:**
- Vercel API key in .env
- React Chart library (recharts or similar)

---

### 8C — Advanced Media Features (Proposed)
**Effort:** 8 hours
**Priority:** P3

- Image optimization: auto-resize, WebP conversion on upload
- Video playback integration: HLS support for adaptive streaming
- Image metadata: EXIF extraction, alt-text auto-population
- Batch operations: bulk upload, bulk delete, bulk tag
- Asset versioning: track media history, restore old versions

**Dependencies:**
- Sharp library for image processing
- R2 versioning API

---

### 8D — Collaborative Editing (Proposed)
**Effort:** 20 hours
**Priority:** P4

- Multi-user admin sessions (WebSocket sync)
- Real-time cursor positions + selections
- Conflict resolution: last-write-wins or operational transform
- Audit log: who changed what, when

**Dependencies:**
- Socket.io or similar real-time library
- Postgres for session state (contradicts no-DB philosophy — defer)

---

### 8E — Content Versioning & History (Proposed)
**Effort:** 6 hours
**Priority:** P2

- Git history viewer in admin dashboard
- Diff viewer: see changes between versions
- Revert functionality: restore old versions
- Branching support: draft vs published versions

**Dependencies:**
- `simple-git` or `nodegit` library
- Already have git history available

---

### 8F — Internationalization (i18n) Extended (Proposed)
**Effort:** 8 hours
**Priority:** P3

*Note: i18n module foundation completed in Phase 4.5*

- Multi-language content: `/en/*`, `/vi/*` URL structure
- Content collections per language
- Language selector in header
- Runtime language switching (not just UI)

**Dependencies:**
- Astro i18n integration
- Keystatic multi-locale support

---

### 8G — Plugin System (Proposed)
**Effort:** 16 hours
**Priority:** P5

- Custom field types: extend admin form builder
- Custom components in Markdoc: user-defined blocks
- Hooks: before-save, after-publish, on-delete
- Distribution templates: generate custom social formats

**Dependencies:**
- Plugin architecture design (how to load/validate plugins?)
- Package marketplace for community plugins

---

### 8H — Monetization Features (Proposed)
**Effort:** 12 hours
**Priority:** P4

- Paywalled content: premium articles with Stripe integration
- Newsletter subscription: email capture + delivery
- Sponsorship slots: paid ad integration in articles
- Affiliate links: tracking and ROI per link

**Dependencies:**
- Stripe API + webhook handling
- Email service (SendGrid, Resend, Brevo)
- Analytics for ROI tracking

---

### 8I — Search Enhancements (Proposed)
**Effort:** 6 hours
**Priority:** P3

- Faceted search: filter by tag, category, date
- Search analytics: popular queries, zero-result queries
- Typo correction: "did you mean?" suggestions
- Search ranking tuning: boost recent articles

**Dependencies:**
- Pagefind API deeper integration
- Analytics data collection

---

## Success Metrics (Current Phase)

| Metric | Target | Actual |
|--------|--------|--------|
| Page load (CLS) | < 0.1 | ✓ 0.04 |
| Lighthouse score | > 95 | ✓ 98 |
| Build time | < 30s | ✓ 12s |
| Admin bundle size | < 300KB | ✓ 220KB |
| Content creation cycle | < 10 min | ✓ 8 min |
| Search latency | < 100ms | ✓ 50ms |
| Vercel cold start | < 1s | ✓ 0.3s |

---

## Dependencies & Blockers

### Clear
- All phases 1-4 dependencies resolved
- Admin dashboard fully functional and shippable

### Potential Future Blockers
- **Vercel function size limits:** Current admin bundle ~220KB, room for growth
- **R2 API rate limits:** Media listing uses `ListObjectsV2`, okay for <100K files
- **Keystatic GitHub mode:** Works in production, tested with HSpaceOS org

---

## Resource Allocation

| Phase | Timeline | Effort | Owner | Status |
|-------|----------|--------|-------|--------|
| 1 — Foundation | 2026-03-01..03-10 | 40h | HieuSpace | ✓ Complete |
| 2 — AI Optimization | 2026-03-10..03-11 | 8h | HieuSpace | ✓ Complete |
| 3 — Admin Dashboard | 2026-03-10..03-11 | 32h | HieuSpace | ✓ Complete |
| 4 — Distribution | 2026-03-11 | 4h | HieuSpace | ✓ Complete |
| 4.5 — Voice Management | 2026-03-19 | 8h | HieuSpace | ✓ Complete |
| 5.5 — Feature Modules | 2026-03-26 | 8h | HieuSpace | ✓ Complete |
| 6 — GoClaw Phase 1 | 2026-03-25 | 3h | HieuSpace | ✓ Complete |
| 7 — Landing Builder | 2026-03-26 | 18h | HieuSpace | ✓ Complete |
| 8A — Landing Advanced | TBD | 12h | — | Proposed |
| 8B — Analytics Dashboard | TBD | 12h | — | Proposed |
| 8C — Media+ | TBD | 8h | — | Proposed |
| 8D — Collaboration | TBD | 20h | — | Proposed |

---

## Release Schedule

| Release | Version | Target Date | Focus | Status |
|---------|---------|-------------|-------|--------|
| Current | v2.3.0 | 2026-03-26 | Landing Page Builder + AI Setup Wizard | Complete |
| Planned | v2.4.0 | 2026-Q2 | Landing Advanced Features (A/B testing, analytics) | Backlog |
| Planned | v3.0.0 | 2026-Q3 | Analytics Dashboard + Media Features | Backlog |
| Planned | v4.0.0 | 2026-Q4 | Extended i18n + Plugin System | Backlog |

---

## Notes

- **No database** philosophy preserved: git is the single source of truth
- **Configuration-driven**: site identity fully controlled via `site-config.ts`
- **Sellability**: admin dashboard is modular, exportable as npm package for white-label use
- **AI-first**: all content is structured for AI crawling and understanding
- **Performance-obsessed**: every release targets <100ms full-page load, zero layout shift

---

**Last updated:** 2026-03-26
**Next review:** 2026-04-15
