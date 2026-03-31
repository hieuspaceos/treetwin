# Development Roadmap

Strategic roadmap for Tree Identity. Tracks active work, completed milestones, and future directions.

## Current Status (2026-03-29)

**Phase:** v3.2.0 — Clone v3: Layout System + Section Variants ✓ COMPLETE
**Completion:** v3.0.0 + v3.1.0 + v3.2.0 complete (Marketplace v1 + AI Clone v3 shipped)
**Active Team:** Solo (HieuSpace)
**Key Features Completed (v3.2.0):**
- Layout System: 8 responsive layout variants (grid, sidebar, asymmetric, thirds, hero-split, stacked, masonry)
- Section Variants: 14 new variants, 48 total (Hero: fullscreen/slider, Features: masonry/icon-strip/bento, Pricing: comparison/toggle, etc.)
- Smart Style Defaults: AI clone extracts colors/fonts and applies as section styles
- Variant-Aware Prompts: Gemini can select appropriate variant from all 48 during clone analysis
- Component Modularization: 13 new variant components, all under 200 LOC
- Backward Compatibility: Existing landings render unchanged, LayoutData optional

**Previous (v3.1.0):**
- Shared Clone Utilities: Extracted from landing-clone-ai.ts for reusability
- Auto-Retry Missing Sections: Fuzzy heading matching + single retry pass
- Design Extraction Phase: Separate Gemini call for CSS/color/font accuracy
- Per-Section Quality Assessment: good/partial/poor scoring with issue detection
- Layout System v2: Full-width sections, scoped CSS, data-section attributes
- 11 Auto-Fix Post-Processors: Hero bg, fonts, icons, contrast, color cleanup, etc.
- Enhanced Components: Features (5-col grid), pricing (horizontal scroll), nav (logo/topbar), video (2x2 grid)

**v3.0.0:**
- Marketplace backbone: Supabase + Google OAuth + license key delivery
- Astro Hybrid SSR: Server mode for marketplace/auth routes
- AI Intent Search: Gemini-powered product semantic matching
- Payment skeleton: `/checkout/[slug]` and `/dashboard` (local simulation)

---

## Phase 14 — Clone v3: Layout System + Section Variants ✓ COMPLETE

**Timeline:** 2026-03-29
**Status:** Complete
**Effort:** 6 hours (3 hrs layouts + 2 hrs variants + 1 hr prompts)

### Deliverables

**Layout System (8 Variants):**
- [x] Grid: Responsive multi-column (1-6 cols per device tier)
- [x] Sidebar-left/right: Fixed sidebar + main content area
- [x] Asymmetric: Unequal column ratios (2:1, 1:2)
- [x] Thirds: 3-column equal layout, stacked on mobile
- [x] Hero-split: 50/50 split with image + text, swappable via `mobileReverse`
- [x] Stacked: Full-width vertical stacking
- [x] Masonry: CSS columns for gallery-like layouts
- [x] Mobile-first CSS: All layouts responsive from 375px → 1024px+
- [x] LayoutData schema: variant, mobileReverse, alignItems fields

**Section Variants (34 → 48):**
- [x] Hero: fullscreen (100vh + ken-burns), slider (multi-slide)
- [x] Features: masonry, icon-strip, bento
- [x] Pricing: comparison (table layout), toggle (monthly/annual switch)
- [x] Testimonials: quote-wall, logo-strip
- [x] Nav: hamburger (overlay menu), mega (dropdown panels)
- [x] Footer: mega (newsletter signup), centered-social (stacked social icons)
- [x] Stats: counter (animated number count on scroll)
- [x] FAQ: searchable (keyword filter + instant results)

**Component Modularization (13 New Files):**
- [x] `hero-fullscreen.astro`, `hero-slider.astro`
- [x] `features-masonry.astro`, `features-icon-strip.astro`, `features-bento.astro`
- [x] `pricing-comparison.astro`, `pricing-toggle.astro`
- [x] `testimonials-quote-wall.astro`, `testimonials-logo-strip.astro`
- [x] `nav-hamburger.astro`, `nav-mega.astro`
- [x] `footer-mega.astro`, `footer-centered-social.astro`
- [x] `stats-counter.astro`, `faq-searchable.astro`

**Clone Pipeline Enhancements:**
- [x] Variant-aware prompts: All 48 variants in Gemini system prompt
- [x] Smart style defaults: Clone extracts section colors/fonts and applies styles
- [x] Layout inference: AI suggests layout variant based on HTML structure analysis

### Files Created/Modified

**New:**
- 13 variant component files (listed above), all <200 LOC

**Modified:**
- `src/content.config.ts` — Added `layout` field to landing sections
- `src/lib/admin/landing-clone-ai.ts` — Enhanced prompts + style extraction
- `src/lib/admin/landing-clone-post-processor.ts` — Apply layout defaults
- `src/components/landing/landing-section-renderer.astro` — Support layout props

### Architecture

- **Layout Flexibility:** Sections can override layout independently
- **Variant Selection:** Gemini selects best variant during clone analysis
- **Style Confidence:** Extracted styles applied via `scopedCss` for visual accuracy
- **Modular Components:** Each variant is self-contained, <200 LOC

### Success Criteria

- [x] All 8 layouts render correctly on mobile/tablet/desktop
- [x] All 48 variants instantiate without errors
- [x] Clone prompts successfully select variants matching original design
- [x] Backward compatible: existing landing pages unchanged
- [x] Zero regressions in existing functionality

---

## Phase 11 — AI Clone Auto-Improve & Post-Processing ✓ COMPLETE

**Timeline:** 2026-03-28 to 2026-03-29
**Status:** Complete
**Effort:** 14 hours (8 hrs auto-improve + 6 hrs post-processing)

### Deliverables - Phase 1 (Auto-Improve)
- [x] Shared clone utilities module: `clone-ai-utils.ts` extracted for reusability
- [x] Auto-retry missing sections: Fuzzy H2 heading matching + single Gemini retry pass
- [x] Design extraction phase: Separate CSS-aware Gemini call for accurate colors/fonts
- [x] Per-section quality assessment: good/partial/poor scoring with issue detection
- [x] Layout multi-column support: Enhanced prompts for side-by-side content blocks
- [x] Framework detection: 15+ framework patterns with tier/score analysis
- [x] Admin UI enhancements: Retry notice, quality badges, missing sections button
- [x] Site compatibility analysis: Real-time tier display while typing URL

### Deliverables - Phase 2 (Post-Processing v2.8)
- [x] 11 auto-fix post-processors (hero bg, fonts, icons, topbar, social, scoped CSS, nav logo, testimonials, colors, contrast, broken values)
- [x] Layout System v2: Full-width sections with data-section attributes for scoped CSS
- [x] Component enhancements: Features (5-col grid), pricing (scroll), nav (logo/topbar), video (2x2 grid), footer (icons + responsive)
- [x] Scoped CSS system: Per-section styling without hardcoded colors
- [x] Design variable enforcement: All colors use CSS variables (--lp-primary, --lp-accent, etc.)
- [x] Post-processor audit logging: Track all fixes applied per clone

**Files Created/Modified:**
- `src/lib/admin/clone-ai-utils.ts` — Shared utilities (HTML cleaning, Gemini API, JSON parsing)
- `src/lib/admin/landing-clone-post-processor.ts` — NEW: 11-stage post-processing pipeline
- `src/lib/admin/landing-clone-ai.ts` — Integrated post-processor into clone flow
- `src/components/admin/landing/landing-clone-modal.tsx` — UI for retry notice, quality dots, site analysis
- `src/components/landing/landing-section-renderer.astro` — Full-width + data-section support
- `src/components/landing/{features,pricing,nav,video,footer}.astro` — Component enhancements
- `src/content.config.ts` — Schema: style + scopedCss fields
- `docs/architecture/ai-clone-post-processing.md` — NEW: Comprehensive post-processor guide

**Architecture:**
- 3-phase pipeline: Direct clone → Design extract → Missing retry
- 11-stage post-processor: Sequential auto-fixes (hero bg → fonts → icons → colors → scoped CSS)
- Markdown caching: Reuse Firecrawl markdown across multiple Gemini calls
- Design merging: CSS-extracted design overrides Gemini-detected values
- Quality transparency: All cloned sections include assessment + fix audit log

**Key Insights:**
- Post-processing enables "immediately usable" clones without manual fix-up
- Full-width layout + scoped CSS enables per-section visual fidelity
- 11 fixes target most common clone issues (data contamination, font/icon normalization, design extraction)
- Design variables enforce consistency (no hardcoded colors in components)
- Enhanced components (5-col grid, horizontal scroll) handle modern site patterns

**Success Metrics:**
- 50%+ reduction in manual editing after clone (post-processors fix common issues)
- 95%+ of clones render without visual errors
- All design colors extracted from CSS or auto-corrected
- Section quality scores guide user refinement
- Reusable utilities + post-processor pipeline enable future clone variants

**Validation:**
- Post-processor audit log tracks all fixes applied
- Zero regressions: backward compatible with existing landing pages
- All new components render full-width correctly
- Design variables used consistently across all components

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
- [x] **Phase 7.9:** GoClaw Hub skill (treetwin-manager for agent orchestration)

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

## Phase 8 — Product Module Architecture ✓ COMPLETE

**Timeline:** 2026-03-26
**Status:** Complete
**Effort:** 6 hours

### Deliverables
- [x] Product module system: YAML-based product definitions at `src/content/products/`
- [x] Per-product admin: Isolated dashboard at `/{slug}/admin`
- [x] Per-product API: Scoped endpoints at `/api/products/{slug}/...`
- [x] Per-product auth: JWT with product claim for authorization
- [x] Product CRUD: Core admin at `/admin/products` (superadmin only)
- [x] Tenant isolation: Core admin access control + per-product routes

**Architecture:**
- Products collection in Keystatic
- Product-scoped admin routes with auth checks
- Feature filtering: only enabled features per product
- API routes use product claim from JWT

**Key Insights:**
- Product routing: `[product-slug]/admin/[...path]` enables tenant isolation
- Feature scoping: re-use existing feature registry, filter by product
- Auth: JWT claim approach avoids separate token system

---

## Phase 9 — Landing Builder v2 (Enhanced) ✓ COMPLETE

**Timeline:** 2026-03-26
**Status:** Complete
**Effort:** 10 hours

### Deliverables
- [x] 13 new section types: nav, footer, layout, divider, rich-text, banner, map, gallery, video, image, image-text, countdown, contact-form (23 total)
- [x] Drag-and-drop section reordering: @dnd-kit integration
- [x] Real-time live preview: No page reload, instant prop updates
- [x] Multi-device preview: Mobile (375px), tablet (768px), desktop (full)
- [x] Visual section picker: Sticky toolbar, 23 section types, search/filter
- [x] Page settings panel: Collapsible, metadata + layout options
- [x] Navigation as section: Auto-generate anchor links, toggle on/off
- [x] Footer as section: Same anchor linking, toggleable
- [x] Standalone landing layout: No core site nav/footer by default
- [x] New admin components: DnD editor, live preview, device toggle, section picker, settings panel

**Architecture:**
- Section components: 23 Astro components, props-driven
- D&D: @dnd-kit for accessible, performant reordering
- Live preview: React component with real-time rendering
- Config schema: Updated to support section IDs + layout nesting

**Key Insights:**
- Layout section enables arbitrary nesting (columns, subsections)
- Navigation/footer as sections = user control (not forced)
- Anchor generation: nav links auto-discover section IDs
- Device preview: CSS media queries applied per breakpoint

---

## Phase 10 — Feature Builder System (Phase 1 Complete — 2026-03-27)

**Timeline:** 2026-03-27 onwards
**Status:** Phase 1 Complete, Phases 2-4 Backlog
**Plan Location:** `plans/260327-0215-feature-builder/`
**Effort:** Phase 1 = 4 hours, Total = ~16 hours (estimated)

### Phase 1 Deliverables (Complete)

**Define + AI Clarify Wizard:**
- [x] Wizard UI at `/admin/feature-builder` (2-step: define + clarify)
- [x] Define step: User enters feature description (text input)
- [x] AI Clarify step: Gemini Flash generates follow-up questions (3-5 max)
- [x] API endpoint: `POST /api/admin/feature-builder/clarify`
- [x] Feature registration: System section, requires `GEMINI_API_KEY`
- [x] Files: `feature-builder-ai.ts`, 3 React components, 1 API route

**Files Created:**
- `src/lib/admin/feature-builder-ai.ts` — Gemini Flash integration
- `src/components/admin/feature-builder/feature-builder-wizard.tsx` — Multi-step shell
- `src/components/admin/feature-builder/feature-builder-define-step.tsx` — Description input
- `src/components/admin/feature-builder/feature-builder-clarify-step.tsx` — Q&A interface
- `src/pages/api/admin/feature-builder/clarify.ts` — Clarification API

### Phase Breakdown (Remaining)

**Phase 2 — Visual Schema Builder**
- Drag-drop field type selector
- Property editor for field validation rules
- Live preview of generated form

**Phase 3 — Component Generator**
- Auto-generate React/Astro components from schema
- API route scaffolds
- Admin page templates

**Phase 4 — Integration & Testing**
- Module installation into feature registry
- Feature toggle UI wiring
- End-to-end testing in admin

### Success Criteria
- Generate functional feature module from text prompt in <30 seconds
- Generated code is 100% editable + deletable
- Feature toggle immediately functional
- No production code breakage

---

## Phase 10.5 — Product-Scoped GoClaw API & Public Entity Rendering (Complete — 2026-03-27)

**Timeline:** 2026-03-27
**Status:** Complete
**Effort:** 6 hours

### Deliverables

**Product-Scoped GoClaw API:**
- [x] 15 new endpoints at `/api/goclaw/[product]/*`
- [x] Auth: Bearer token + product slug validation
- [x] Content filtering by `product.coreCollections`
- [x] Feature gating by `product.features`
- [x] Auth module: `src/lib/goclaw/product-scope.ts`
- [x] Endpoints: landing config, content, setup, voices, templates

**Public Entity Rendering:**
- [x] Entity definitions with public config (enabled, path, listTitle, listFields)
- [x] Static pages: `/e/{path}/` (list) and `/e/{path}/{slug}` (detail)
- [x] Components: `entity-list-view.astro`, `entity-detail-view.astro`
- [x] SEO integration via `BaseHead` (OG/Twitter meta)
- [x] Example: Customer entity configured at `/e/customers/`

### Files Created

**GoClaw Product Scope:**
- `src/lib/goclaw/product-scope.ts` — Product validation + filtering functions
- `src/pages/api/goclaw/[product]/landing/config.ts` — Landing config endpoints
- `src/pages/api/goclaw/[product]/content/[collection].ts` — Content listing
- `src/pages/api/goclaw/[product]/content/[collection]/[slug].ts` — Content detail
- `src/pages/api/goclaw/[product]/setup.ts` — AI setup generation
- `src/pages/api/goclaw/[product]/voices/*.ts` — Voice endpoints (2 files)
- `src/pages/api/goclaw/[product]/templates/*.ts` — Template endpoints (2 files)
- `src/pages/api/goclaw/[product]/entities/*.ts` — Entity endpoints (2 files)
- `src/pages/api/goclaw/[product]/landing/sections/*.ts` — Section endpoints (3 files)

**Entity Rendering:**
- `src/components/entity/entity-list-view.astro` — List page component
- `src/components/entity/entity-detail-view.astro` — Detail page component
- `src/pages/e/[entityType]/index.astro` — Dynamic list route
- `src/pages/e/[entityType]/[slug].astro` — Dynamic detail route

### Architecture
- Product-scoped: All endpoints validate product slug and filter content
- Backward compatible: Global `/api/goclaw/*` endpoints unchanged
- Feature gating: Respects product feature toggles
- SEO-friendly: Entity pages leverage existing `BaseHead` infrastructure

---

## Phase 13 — Marketplace Evolution (In Progress — 2026-03-28)

**Timeline:** 2026-03-28 onwards
**Status:** In Progress
**Plan Location:** TBD (marketplace implementation)
**Effort:** ~16 hours (estimated)

### Deliverables (Complete)

**Astro Hybrid SSR:**
- [x] Switch `output` from 'static' to 'server' for on-demand SSR
- [x] Landing pages remain static (pre-rendered); marketplace routes rendered on-demand

**Supabase Database Layer:**
- [x] 6 core tables: profiles, products, orders, order_items, licenses, payment_events
- [x] Supabase client setup with connection pooling
- [x] Row-level security (RLS) policies for data isolation
- [x] Migrations + schema initialization

**SQLite Fallback (Dev):**
- [x] better-sqlite3 integration for local development
- [x] Auto-initialize schema on server start
- [x] Fallback flag: `USE_SQLITE_FALLBACK=true`
- [x] Zero Supabase keys needed for offline development

**Google OAuth Integration:**
- [x] Supabase Auth client configuration
- [x] OAuth flow: `/api/auth/callback` handler
- [x] JWT token generation + session cookies
- [x] Logout endpoint: `/api/auth/logout`

**Marketplace Pages:**
- [x] `/marketplace` — Product catalog with AI search UI
- [x] `/marketplace/[slug]` — Product detail page
- [x] `/checkout/[slug]` — Checkout form (skeleton)
- [x] `/dashboard` — User dashboard with purchases + licenses

**AI Intent Search:**
- [x] `POST /api/marketplace/search` endpoint
- [x] Gemini 2.5-flash prompt for intent matching
- [x] Confidence scoring + explanation generation
- [x] Fallback to keyword search if Gemini unavailable

**License Key Delivery:**
- [x] Auto-generate unique license keys on order confirmation
- [x] Store in `licenses` table with activation status
- [x] Dashboard display with activation tokens
- [x] API: `GET /api/dashboard/licenses`

**Payment Skeleton:**
- [x] `POST /api/checkout/create` — Create order session
- [x] `POST /api/checkout/confirm` — Confirm payment (local: auto-success)
- [x] License key generation on confirmation
- [x] Ready for Stripe integration

### Files Created
- **Supabase layer:** 4 files (client, fallback, types, queries)
- **Marketplace services:** 4 files (products, orders, licenses, AI search)
- **Auth:** 3 files (supabase-auth, jwt-utils, session)
- **Pages:** 4 files (marketplace catalog/detail, checkout, dashboard)
- **API routes:** 8 files (marketplace, checkout, dashboard, auth)

### Architecture Decisions
- **Hybrid mode:** Astro SSR on-demand for auth + commerce; static for content
- **Database:** Supabase PostgreSQL primary; SQLite fallback for dev
- **Auth:** Supabase Auth + custom JWT middleware
- **Payment:** Skeleton with local simulation; production-ready for Stripe
- **Search:** Gemini-powered semantic search with keyword fallback

### Success Criteria (Complete)
- [x] Can list products and perform AI intent search
- [x] Users can authenticate with Google OAuth
- [x] Checkout creates orders and generates license keys
- [x] Dashboard shows purchases + activation tokens
- [x] Local dev works with SQLite (no Supabase needed)

### Next Steps
- Stripe integration for production payments
- Email confirmations for orders + license keys
- Advanced marketplace features (reviews, ratings, cart system)
- User profile customization

---

## Phase 12 — Landing Page v2 Upgrades ✓ COMPLETE

**Timeline:** 2026-03-28
**Status:** Complete
**Effort:** 8 hours

### Deliverables

**New Section Types (25 Total):**
- [x] social-proof: Customer testimonials with avatars and ratings grid
- [x] comparison: Feature/pricing comparison side-by-side table layout
- [x] ai-search: AI-powered search with autocomplete interface

**Admin Editor Enhancements:**
- [x] Icon picker: Material Icons / Feather Icons browser for nav + footer
- [x] Multi-CTA buttons: Multiple buttons per section with individual link/style/size
- [x] Testimonials carousel variant: Auto-rotating with pagination + pause-on-hover
- [x] Footer columns editor: Drag-drop multi-column builder (1-4 columns)
- [x] Pricing badges: Support for badge labels (Popular, Best Value, Limited Offer)
- [x] Scroll-to-highlight: Auto-highlight active section during scroll

**Rich Text & Video Enhancements:**
- [x] Markdown support: Rich text component accepts Markdown syntax
- [x] Markdown → HTML: Build-time conversion, zero runtime overhead
- [x] Video auto-detect: YouTube, Vimeo, custom URL auto-embedding detection

**Design Token Enhancements:**
- [x] glass-card: Landing page glass-morphism card override
- [x] btn-secondary: Secondary button variant (lighter contrast)
- [x] btn-outline: Outline button variant (border-only)
- [x] gradient-text: Text gradient utility class for hero sections

**AI Clone Improvements:**
- [x] Anti-duplication rules: Improved Gemini prompts to avoid duplicate extractions
- [x] Better design inference: Enhanced color/font/spacing detection
- [x] Schema validation: Stricter validation on cloned configs

### Files Created/Modified

**New Components:**
- `src/components/admin/landing/icon-picker.tsx` — Icon browser + selector
- `src/components/admin/landing/multi-cta-editor.tsx` — Multi-button CTA editor
- `src/components/admin/landing/testimonial-carousel.tsx` — Carousel variant
- `src/components/admin/landing/footer-columns-editor.tsx` — Multi-column builder
- `src/components/landing/social-proof.astro` — Social proof section
- `src/components/landing/comparison.astro` — Comparison table section
- `src/components/landing/ai-search.astro` — AI search component

**Updated Components:**
- `src/components/landing/rich-text.astro` — Added Markdown parsing
- `src/components/landing/video.astro` — Added auto-detect logic
- Various landing sections updated with new design tokens

**Styling:**
- New CSS classes: `.glass-card`, `.btn-secondary`, `.btn-outline`, `.gradient-text`
- Enhanced landing design system with expanded token set

### Architecture
- Section types: Now 25 total, organized by Structure/Content/Conversion/Media
- Rich text: Markdown parsing at build time, HTML output at runtime
- Video: Smart detection of platform from URL, fallback for custom sources
- Design tokens: Extended CSS variable set scoped to landing pages

---

## Phase 11 — Landing Design System + AI Clone + Feature Builder Phase 3 ✓ COMPLETE

**Timeline:** 2026-03-27
**Status:** Complete
**Effort:** 12 hours

### Deliverables

**Landing Page Design System (New):**
- [x] 6 design presets: clean-light, modern-dark, gradient-bold, startup-fresh, corporate-trust, warm-sunset
- [x] Per-page customization: Colors (primary, secondary, accent), fonts (headings, body), border-radius
- [x] Google Fonts integration: Auto-load via link tags, no external dependencies
- [x] CSS variables: `--lp-*` tokens for all landing sections
- [x] Design panel UI: Preset picker + custom editor at `/admin/landing/[slug]/design`
- [x] Live preview updates: Real-time design changes without save cycle

**Section Layout Variants (36 Total - New):**
- [x] Hero: 4 variants (centered, split, video-bg, minimal)
- [x] CTA: 5 variants (default, split, banner, minimal, with-image)
- [x] Features: 3 variants (grid, list, alternating)
- [x] Pricing: 3 variants (cards, simple, highlight-center)
- [x] Testimonials: 3 variants (cards, single, minimal)
- [x] FAQ: 3 variants (accordion, two-column, simple)
- [x] Stats: 3 variants (row, cards, large)
- [x] How It Works: 3 variants (numbered, timeline, cards)
- [x] Team: 3 variants (grid, list, compact)
- [x] Nav: 3 variants (default, centered, transparent)
- [x] Footer: 3 variants (simple, columns, minimal)
- [x] Tabbed section picker: Filters sections by category (All/Structure/Content/Conversion/Media)

**AI Landing Page Cloner (New):**
- [x] Clone endpoint: `POST /api/admin/landing/clone`
- [x] HTML analysis: Gemini 2.5 Flash parses URL, extracts sections + design
- [x] Config generation: Auto-generates YAML landing config from extracted content
- [x] Clone modal UI: URL input + clone button in landing editor
- [x] Design extraction: Analyzes colors, fonts, layout from source site

**Feature Builder Phase 3 (Enhanced):**
- [x] Hybrid code generation: AI + template combination for faster scaffolding
- [x] Categorized output: Code organized by data models, API routes, React components, tests
- [x] Generation guides: In-app help text for each artifact type
- [x] AI Fill: Auto-populate descriptions using Gemini
- [x] Code review step: Edit generated code before applying

**Gemini 2.5-flash Update:**
- [x] Upgrade all AI calls: 2.0-flash → 2.5-flash
- [x] Update in: feature-builder-ai.ts, ai-setup-generator.ts, voice-analyze, landing-clone
- [x] Reason: 2.0-flash deprecated, 2.5-flash faster + better context handling

**Admin UX Polish:**
- [x] Dashboard redirect: `/admin` → `/features`
- [x] Split preview default: Feature builder live preview enabled by default
- [x] Thin scrollbars: CSS improvements for admin UI scrolling
- [x] Import consolidation: All admin pages use same Gemini model constants

### Files Created/Modified

**New Components:**
- `src/components/admin/landing/landing-design-panel.tsx` — Design preset picker + custom editor
- `src/components/admin/landing/landing-clone-modal.tsx` — Clone URL input + button
- Multiple feature-builder components enhanced with code review + categorized output

**API Routes:**
- `src/pages/api/admin/landing/clone.ts` — Clone landing from URL

**Styling:**
- Landing section components updated with `--lp-*` CSS variable support
- Design system integration across all 11 section types

### Architecture
- Design system: Preset values + per-page overrides stored in landing config
- Variants: Each section type has multiple component variant implementations
- AI Clone: Gemini 2.5 Flash analyzes HTML, returns structured section + design data
- Code generation: Hybrid approach combines Gemini output with predefined templates

---

## Phase 12 — Future Enhancements (Backlog)

### 12A — Landing Page Advanced Features (Proposed)
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

### 12B — Analytics Dashboard (Proposed)
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

### 12C — Advanced Media Features (Proposed)
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

### 12D — Collaborative Editing (Proposed)
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

### 12E — Content Versioning & History (Proposed)
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

### 12F — Internationalization (i18n) Extended (Proposed)
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

### 12G — Plugin System (Proposed)
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

### 12H — Monetization Features (Proposed)
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

### 12I — Search Enhancements (Proposed)
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
| 8 — Product Modules | 2026-03-26 | 6h | HieuSpace | ✓ Complete |
| 9 — Landing Builder v2 | 2026-03-26 | 10h | HieuSpace | ✓ Complete |
| 9.5 — v2.4.1 Enhancements | 2026-03-27 | 4h | HieuSpace | ✓ Complete |
| 10 — Feature Builder Phase 1 | 2026-03-27 | 4h | HieuSpace | ✓ Complete |
| 10.5 — Product-Scoped API + Entity Rendering | 2026-03-27 | 6h | HieuSpace | ✓ Complete |
| 11 — Landing Design System + AI Clone + FB Phase 3 | 2026-03-27 | 12h | HieuSpace | ✓ Complete |
| 12 — Landing Page v2 Upgrades | 2026-03-28 | 8h | HieuSpace | ✓ Complete |
| 13 — Marketplace Evolution | 2026-03-28+ | 16h | HieuSpace | In Progress |
| 14 — Feature Builder Phase 4 | 2026-Q2 | 8h | — | Backlog |
| 15A — Stripe Integration | TBD | 8h | — | Proposed |
| 15B — Landing Advanced | TBD | 12h | — | Proposed |
| 15C — Analytics Dashboard | TBD | 12h | — | Proposed |
| 15D — Media+ | TBD | 8h | — | Proposed |
| 15E — Collaboration | TBD | 20h | — | Proposed |

---

## Release Schedule

| Release | Version | Target Date | Focus | Status |
|---------|---------|-------------|-------|--------|
| Current | v3.0.0 | 2026-03-28+ | Marketplace Evolution (Supabase, hybrid SSR, Google OAuth, AI search, license delivery) | In Progress |
| Planned | v3.1.0 | 2026-Q2 | Stripe Integration + Email Confirmations | Backlog |
| Planned | v3.2.0 | 2026-Q2 | Feature Builder Phase 4 (integration + module installation) | Backlog |
| Planned | v3.3.0 | 2026-Q2 | Landing Advanced (A/B testing, email capture, form analytics) | Backlog |
| Planned | v4.0.0 | 2026-Q3 | Analytics Dashboard + Content Versioning + Media Features | Backlog |
| Planned | v4.5.0 | 2026-Q4 | Extended i18n + Plugin System | Backlog |

---

## Notes

- **No database** philosophy preserved: git is the single source of truth
- **Configuration-driven**: site identity fully controlled via `site-config.ts`
- **Sellability**: admin dashboard is modular, exportable as npm package for white-label use
- **AI-first**: all content is structured for AI crawling and understanding
- **Performance-obsessed**: every release targets <100ms full-page load, zero layout shift

---

**Last updated:** 2026-03-28
**Next review:** 2026-04-10
**Next phase:** Feature Builder Phase 4 (integration + module installation) + Landing Advanced Features
