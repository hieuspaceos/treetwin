# Development Roadmap

Strategic roadmap for Tree Identity. Tracks active work, completed milestones, and future directions.

## Current Status (2026-03-12)

**Phase:** Post-launch iteration — categories, editor refactoring, admin polish
**Completion:** 95% (core complete, categories feature in progress)
**Active Team:** Solo (HieuSpace)

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

## Phase 5 — Future Enhancements (Backlog)

### 5A — Analytics Dashboard (Proposed)
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

### 5B — Advanced Media Features (Proposed)
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

### 5C — Collaborative Editing (Proposed)
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

### 5D — Content Versioning & History (Proposed)
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

### 5E — Internationalization (i18n) (Proposed)
**Effort:** 10 hours
**Priority:** P4

- Multi-language content: `/en/*`, `/vi/*` URL structure
- Content collections per language
- Language selector in header
- Admin UI translation (EN + VI initially)

**Dependencies:**
- Astro i18n integration
- Keystatic multi-locale support

---

### 5F — Plugin System (Proposed)
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

### 5G — Monetization Features (Proposed)
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

### 5H — Search Enhancements (Proposed)
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
| 5A — Analytics | TBD | 12h | — | Proposed |
| 5B — Media+ | TBD | 8h | — | Proposed |
| 5C — Collaboration | TBD | 20h | — | Proposed |

---

## Release Schedule

| Release | Version | Target Date | Focus |
|---------|---------|-------------|-------|
| Stable | v2.0.0 | 2026-03-11 | Admin Dashboard Launch |
| Planned | v2.1.0 | 2026-Q2 | Analytics + Media Features |
| Planned | v2.2.0 | 2026-Q3 | Versioning + Advanced Search |
| Planned | v3.0.0 | 2026-Q4 | i18n + Plugin System |

---

## Notes

- **No database** philosophy preserved: git is the single source of truth
- **Configuration-driven**: site identity fully controlled via `site-config.ts`
- **Sellability**: admin dashboard is modular, exportable as npm package for white-label use
- **AI-first**: all content is structured for AI crawling and understanding
- **Performance-obsessed**: every release targets <100ms full-page load, zero layout shift

---

**Last updated:** 2026-03-12
**Next review:** 2026-04-01
