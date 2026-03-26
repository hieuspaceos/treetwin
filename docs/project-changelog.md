# Project Changelog

All notable changes to Tree Identity are documented here.

## Releases

### v2.4.1 — Accessibility, SEO & Landing Builder Enhancements (2026-03-27)

**Status:** Complete

Focused on accessibility improvements, SEO enhancements, product admin refinements, and landing builder phase 2 features.

#### Accessibility & SEO (New)
- **Shared head component:** `base-head.astro` centralizes OG/Twitter meta, aria-labels, form labels, unique section IDs
- **Self-hosted fonts:** Inter font moved to `public/fonts/`, removed Google Fonts CDN
- **Iframe titles:** All iframes require title attributes for accessibility
- **Form labels:** All form inputs require associated labels
- **Section IDs:** Unique IDs on major sections for anchor linking

#### Product Admin Improvements (Enhanced)
- **Separate settings page:** Product settings isolated from core site settings
- **No product dashboard:** Redirects to product settings instead
- **Back-to-site links:** Product admin navbar links back to product landing
- **Auto landing page:** Products auto-create landing page on creation
- **Self-editing:** Products can edit their own landing without enabling module

#### Features Hub (New)
- **Marketplace page:** `/admin/features` with search and filters
- **Search capability:** Filter by name/description
- **Category filters:** Filter by integration/content/media/distribution/analytics
- **Status filters:** Toggle feature enabled/disabled state

#### Sidebar Redesign (Enhanced)
- **Core admin simplified:** Dashboard + Features (expandable) + Products + Settings
- **Features submenu:** Expandable/collapsible Features menu showing enabled features
- **Product-scoped nav:** Per-product admin has product-specific navigation
- **Back-to-site quick link:** Navigate back to product landing from product admin

#### Landing Builder v2 Phase 2 (Enhanced)
- **Layout/grid section:** Column presets (50/50, 33/67, 25/75)
- **Nested sections:** Add sections inside layout columns
- **Quick-add buttons:** Empty state UI with "Add section" CTA
- **Dropdown quick-add:** Move existing sections into columns
- **Empty states:** Clear guidance for empty layout columns

#### Entity System Fixes (Enhanced)
- **Route ordering:** Fixed via wouter Switch route precedence
- **Field schema editor:** Inline add/remove/reorder with batch save
- **Delete entity API:** New endpoint for deleting entity types
- **Update definition API:** New endpoint for updating schemas

#### UI Polish (Various)
- **Breadcrumb fix:** Hidden on single-segment pages (avoid redundancy)
- **Topbar fix:** Role badge only shown when username differs from role
- **Records removed:** Completely replaced by Entities system
- **Accessibility improvements:** More aria-labels, better keyboard navigation

---

### v2.4.0 — Product Module Architecture + Landing Builder Enhancements (2026-03-26)

**Status:** Complete

Multi-tenant product module system with per-product admin, API scoping, and expanded landing page builder with 23 section types and drag-and-drop editor.

#### Product Module Architecture (New)
- **Product definitions:** YAML-based at `src/content/products/*.yaml`
- **Per-product admin:** Dashboard at `/{slug}/admin` with scoped feature access
- **Per-product API:** REST endpoints at `/api/products/{slug}/...`
- **Per-product auth:** JWT with product claim for authorization
- **Product CRUD:** Core admin at `/admin/products` (superadmin only)
- **Tenant isolation:** Core admin = superadmin, product users = scoped access

#### Landing Page Builder Enhancements (Phase 2)
- **23 section types:** nav, footer, hero, features, pricing, testimonials, faq, cta, stats, how-it-works, team, logo-wall, video, image, image-text, gallery, map, rich-text, divider, countdown, contact-form, banner, layout
- **Standalone landing layout:** No core site nav/footer inheritance (optional toggles)
- **Navigation & footer:** Toggleable sections with auto-generated anchor links
- **Drag-and-drop reordering:** @dnd-kit section reordering
- **Real-time live preview:** React-based preview, no save needed
- **Multi-device preview:** Mobile (375px), tablet (768px), desktop (full width) toggles
- **Layout/grid section:** Column presets (50/50, 33/67, etc.) with nested sections
- **Visual section picker:** Sticky toolbar with section type picker
- **Collapsible page settings:** Metadata editor in sidebar
- **Smooth scroll anchors:** Nav/footer auto-link to sections

#### Architecture
- Product system: YAML config + file-based storage
- Landing sections: 23 composable Astro components
- Admin UI: React components for drag-drop, live preview, device toggles
- DnD library: @dnd-kit for performant section reordering
- Type-safe: Zod validation for product + section schemas

---

### v2.3.0 — Landing Page Builder System (2026-03-26)

**Status:** Complete

Modular landing page builder with AI setup wizard, custom entity system, and 5 product templates.

#### 9 Phases Complete
1. **10 Astro Section Components** — hero, features, pricing, testimonials, faq, cta, stats, how-it-works, team, logo-wall
2. **Landing Config Renderer** — YAML-to-static-HTML pipeline via content collections
3. **5 Product Templates** — saas, agency, course, ecommerce, portfolio at `src/content/templates/`
4. **Admin Landing Editor** — React pages for landing CRUD with per-section inline editors
5. **Custom Entity System** — Dynamic YAML-schema entities with auto-generated admin CRUD
6. **AI Setup Wizard** — Gemini Flash generates landing configs from product descriptions
7. **GoClaw Landing API** — 9 REST endpoints for external AI agent integration
8. **Feature Registry** — 3 new toggleable modules (landing, entities, setup-wizard)
9. **GoClaw Hub Skill** — tree-id-manager skill for agent orchestration

#### Key Deliverables
- **10 section components** fully implemented (all in `src/components/landing/`)
- **YAML config system** with type-safe schema (`src/lib/landing/landing-types.ts`)
- **Entity system** with schema definitions + instance CRUD (`src/lib/admin/entity-io.ts`)
- **Template library** with 5 pre-built product templates
- **Admin UI** for landing pages, entities, templates, and setup wizard
- **AI generation** — Gemini Flash converts product description → landing config
- **Dynamic rendering** — Build-time static HTML generation from YAML configs
- **GoClaw integration** — 9 REST endpoints with draft-forcing security policy
- **Feature toggles** — Landing builder can be toggled on/off in settings

#### Files Added
- `src/lib/landing/landing-types.ts` — Shared TypeScript types (LandingConfig, LandingSection, EntityReference)
- `src/lib/landing/landing-config-reader.ts` — YAML read/write operations
- `src/lib/landing/landing-renderer.ts` — Dynamic component rendering
- `src/lib/landing/ai-setup-generator.ts` — Gemini Flash integration
- `src/lib/landing/template-apply.ts` — Template merge helper
- `src/lib/admin/entity-io.ts` — Entity CRUD + schema validation
- 10 section components in `src/components/landing/`
- Admin React components in `src/components/admin/landing/` and `src/components/admin/entities/`
- Admin API routes: `/api/admin/landing/*`, `/api/admin/entities/*`, `/api/admin/templates/*`, `/api/admin/setup/*`
- GoClaw API routes: `/api/goclaw/landing/*`, `/api/goclaw/entities/*`, `/api/goclaw/templates/*`, `/api/goclaw/setup`
- Admin pages: `/admin/landing`, `/admin/entities`, `/admin/templates`, `/admin/setup`
- Dynamic landing route: `/[landing-slug].astro`

#### Architecture Highlights
- **Section Components**: Props-driven Astro components, no React needed (zero JS)
- **YAML-first**: Landing configs live in git, fully type-safe via Zod schemas
- **Entity System**: Extensible custom data types (testimonials, team members, portfolio items, etc.)
- **Build-time Rendering**: All landings pre-rendered to static HTML at build time
- **AI-Powered**: Gemini generates landing configs from product descriptions in EN/VI
- **GoClaw Integration**: External AI agents can create/update landings via authenticated API
- **Feature Toggles**: Landing, entities, and setup-wizard can be toggled on/off independently

#### Security
- All GoClaw writes force `status: draft` (human approval required)
- Entity schema validation via Zod before save
- HMAC signature verification on webhook callbacks

---

### v2.2.0 — Feature Module System (2026-03-26)

**Status:** Complete

Registry-driven feature toggle system for optional modules. Enables/disables features via admin settings without code changes.

#### Feature Module System (2026-03-26)
- **Feature Registry:** Static registry with 7 optional features (email, goclaw, distribution, analytics, media, voices, translations)
- **Registry Core:** `FeatureModule` interface, lazy-loading helpers, getEnabledFeatures() function
- **Dynamic Admin Layout:** Sidebar nav items and lazy-loaded routes rendered from registry based on enabled state
- **Settings UI:** Feature Modules section in admin settings with toggle switches per feature
- **API Guards:** All 20 feature endpoints protected with `checkFeatureEnabled()`, returns 403 when disabled
- **Public Guards:** Email subscribe form and GA4 analytics script conditionally rendered based on feature toggles
- **Caching:** 5s cache of settings file to minimize disk reads
- **Testing:** 60 new unit + integration tests, feature-registry.test.ts + feature-guard.test.ts

**Architecture:**
- 3-layer gating: UI (sidebar + routes), API (request guards), public (component rendering)
- Backward compatible: missing enabledFeatures key defaults all to true
- Tree-shakeable: unused feature pages only loaded when navigated to
- No env vars needed: toggled via admin settings UI

**Key Benefits:**
- Cleaner codebase: optional features now declarative in registry
- Simplified feature management: no scattered feature flags or env checks
- Settings-driven: toggle features without code or env var changes
- Security: disabled API endpoints return 403, not silently accepted

---

### v2.1.0 — Voice Profiles + i18n System + Admin UI Redesign (2026-03-12 → 2026-03-19)

**Status:** Complete

Major admin enhancements: voice profile management, translations editor, AI-powered voice analysis, and comprehensive UI redesign with modularized CSS.

#### Voice System & i18n (2026-03-19)
- **Voice profiles collection:** Create/edit/delete voice profiles in admin UI (`/admin/voices`)
- **i18n module:** Multi-language translations with sub-sections, EN/VI support, add new keys dynamically
- **Translations editor:** `/admin/settings/translations` — edit keys, values, language tabs
- **Voice effectiveness scoring:** 6-dimension heuristic evaluation (emotional resonance, clarity, audience alignment, tone consistency, engagement level, authenticity) with visual score badge
- **AI voice analysis:** Gemini-powered evaluation with bilingual feedback (EN/VI)
- **Voice preview generator:** Pick article → AI generates opening paragraphs in voice style (200-word samples)
- **Chip-select integration:** Voice options for tone/industry/audience default to i18n translations system
- **ArrayField enhancement:** Fixed to handle object items with nested properties (e.g., `{context, text}` samples)
- **Content list UX:** Hidden status/published fields for config collections (voices, categories)
- **pickMeta fallback:** Title field falls back to `name` for voices collection

#### Admin UI Redesign (2026-03-19)
- **Design system refresh:** Fira Sans for UI, Fira Code for monospace — Figma-approved typography
- **CSS variable tokens:** New `--admin-*` theme tokens (glass layers, accent, semantic colors)
- **3-tier glass morphism:** Primary (glass bg), secondary (glass overlay), tertiary (glass cards)
- **Modularized CSS:** Split `admin.css` into 7 focused partials: `tokens.css`, `layout.css`, `components.css`, `editor.css`, `table.css`, `media.css`, `responsive.css` (total ~1K LOC, modular for future scaling)
- **Animations:** Smooth transitions on glass panels, fade-in for list items, pulse for loading states
- **Mobile responsive:** Sidebar collapse on <768px, stacked layouts, touch-friendly
- **Color consistency:** Unified palette across all admin pages (sidebar, topbar, editors, modals)

#### MVP Feature Bundle (2026-03-12)
- Multi-user auth: `ADMIN_USERS` env var (JSON array), username+password, roles (admin/editor)
- About page: `/about` with hero, bio, skills, projects grid from Records collection
- 404 page polish: glass-themed, tree metaphor, Pagefind search integration
- Email capture: Resend API + git-tracked YAML subscribers, subscribe/unsubscribe/broadcast APIs
- GA4 analytics: gtag.js conditional on `GA_MEASUREMENT_ID`, admin analytics page
- Integration status panel in admin settings
- New env vars: `ADMIN_USERS`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `GA_MEASUREMENT_ID`

#### CodeMirror 6 Editor (2026-03-12)
- Replaced textarea with Obsidian-like CM6 editor (11 modules in `codemirror/`)
- Live Preview, smart lists, auto-pairs, heading fold, image preview widget
- Callout blocks, typewriter mode, vim mode (lazy-loaded), drag-drop upload
- Glass morphism theme matching admin CSS vars

#### SEO Score Panel (2026-03-12)
- RankMath-style real-time SEO analysis with 18 checks
- Score badge in content list, detail panel in editor sidebar

#### Testing & Consolidation (2026-03-19)
- Vitest setup with 88 tests across 6 test files
- Tests cover: auth (JWT, password hashing, multi-user), content I/O (CRUD round-trips), SEO analyzer, subscriber I/O, validation, schema registry
- Modularized `content-io.ts` (379 LOC → 4 files, each <200 LOC)
- Updated README, changelog, roadmap, version alignment (v2.0.0)

---

### v2.0.0 — Custom Admin Dashboard (2026-03-11)

**Status:** Complete

Major feature release: replaced Keystatic's default UI with a premium custom admin dashboard built entirely from scratch using React + Astro + Tailwind CSS.

#### Phase 1-5: Foundation & Content Editor (Complete)
- Custom admin shell with sidebar navigation, topbar, and glass-panel styling
- Admin API layer for CRUD operations (read/write content files, auth)
- Content management UI: listing, filtering, pagination for articles/notes/records
- Rich Markdown editor (enhanced textarea with formatting toolbar):
  - Keyboard shortcuts (Ctrl+B/I/U, Ctrl+E for lists, etc.)
  - Code blocks with syntax highlighting
  - Block quotes, horizontal rules, heading levels
  - Marks: bold, italic, strikethrough, code inline
  - Full Markdoc serialization

#### Phase 6: Media Management (Complete)
- Drag-and-drop file upload with progress indicator
- Cloudflare R2 integration for media storage
- Media browser grid with thumbnails and lazy loading
- Media search by filename
- Integration with content editor:
  - Browse media button on cover/OG image fields
  - Image insertion in Markdown editor from media library
  - Copy media URL to clipboard
- Delete media files from grid
- Graceful degradation when R2 not configured

#### Phase 7: Preview & Polish (Complete)
- Live preview in content editor (opens seed detail page in new tab)
- Loading skeleton components for async operations
- Error boundary for crash recovery with user-friendly messaging
- Keyboard shortcuts cheat sheet (? key opens modal)
  - ? → open shortcuts
  - Ctrl+S → save entry
  - Escape → close dialogs
- Admin configuration in `site-config.ts` (title, brand color)
- Admin CSS styling complete (glass panels, media grid, upload zone, dialogs, skeletons)

#### Architecture & Files Created
**API Routes:**
- `src/pages/api/admin/media.ts` — GET list, DELETE files
- `src/pages/api/admin/upload.ts` — POST file uploads to R2

**React Components:**
- `src/components/admin/media-browser.tsx` — page + dialog modes
- `src/components/admin/media-upload-zone.tsx` — drag-drop area
- `src/components/admin/media-grid.tsx` — thumbnail grid
- `src/components/admin/admin-error-boundary.tsx` — crash recovery
- `src/components/admin/keyboard-shortcuts.tsx` — shortcuts modal
- `src/components/admin/loading-skeleton.tsx` — skeleton components

**Utilities:**
- `src/lib/admin/api-client.ts` — MediaItem type + media list/remove methods
- `src/lib/admin/schema-registry.ts` — mediaBrowse flag for cover/seo fields

**Files Modified:**
- `src/components/admin/field-renderers/text-field.tsx` — Browse Media button
- `src/components/admin/field-renderers/markdoc-editor.tsx` — image insertion
- `src/components/admin/field-renderers/render-field.tsx` — mediaBrowse prop passing
- `src/components/admin/admin-sidebar.tsx` — Media nav item + image icon
- `src/components/admin/admin-layout.tsx` — /media route
- `src/components/admin/admin-app.tsx` — ErrorBoundary, keyboard shortcuts
- `src/components/admin/content-editor.tsx` — Preview button
- `src/config/site-config.ts` — admin config section
- `src/styles/admin.css` — styles for all new components

**Build Status:**
- `astro check` → 0 errors
- `astro build` → succeeds
- Deployed to Vercel with custom admin at `/admin`

#### Breaking Changes
- Admin is now at `/admin` (was `/keystatic`)
- Keystatic no longer user-facing; only used internally for data schema/migration
- `/keystatic` redirected to `/admin` via `vercel.json`

---

### v1.2.0 — Content Distribution Workflow (2026-03-11)

**Status:** Complete

Implemented end-to-end social media post generation and distribution logging.

#### Features
- `scripts/distribute-content.py` — Generates social posts via Gemini Flash
  - Reads article markdown from `src/content/articles/{slug}/index.mdoc`
  - Prompts Gemini with content-distribution rules
  - Outputs posts for: Twitter, LinkedIn, Dev.to, Hashnode, Reddit, Facebook, Medium, Hacker News, Threads, Viblo
  - Logs to CSV: platform, post content, timestamp, status
- `docs/marketing-metrics.md` — bi-weekly tracking template for distribution campaigns
- `/distribute <slug>` skill for quick post generation
- `/marketing-review` skill for campaign analytics review
- Requires `GEMINI_API_KEY` env var (free tier sufficient)

---

### v1.1.0 — GEO Optimization (2026-03-10)

**Status:** Complete

Enhanced AI/LLM discoverability through structured data and crawler-friendly standards.

#### Phase 1-5: Enhanced SEO
- JSON-LD: Article + BreadcrumbList + Person schema with rich metadata
- llms.txt: Site overview for AI model training (speculative signal)
- AI meta tags: Dublin Core + citation_* attributes for semantic understanding
- RSS feed: `@astrojs/rss` for Bing/ChatGPT feed freshness signals
- robots.txt per-agent: blocking training crawlers (GPTBot, ClaudeBot, Meta-ExternalAgent), allowing search crawlers (OAI-SearchBot, Claude-SearchBot, PerplexityBot, Gemini-Deep-Research)
- mainEntityOfPage + citation_url linking patterns
- Summary field added to articles for cleaner AI extraction

#### Security
- `safeJsonLd()` function escapes `</script>` XSS vectors
- Single canonical link in base-layout prevents duplication issues

---

### v1.0.0 — Astro + Keystatic Migration (2026-03-10)

**Status:** Complete

Complete rebuild from Next.js 15 + Payload CMS + PostgreSQL to Astro 5 + Keystatic + git-based content.

#### Major Changes
- **Framework:** Next.js → Astro 5 (static site generation)
- **CMS:** Payload → Keystatic (git-based, GitHub storage mode)
- **Database:** PostgreSQL → git (no database needed)
- **Content:** All articles/notes/records migrated to Markdown/YAML
- **Search:** Pagefind static indexing
- **Deploy:** Vercel (same hosting, vastly simpler infra)
- **Theme:** Liquid glass morphism with CSS variable tokens

#### Architecture
- Zero-database design: all content in git
- Static-first: 99%+ pages are pre-rendered at build time
- Minimal JS: only React for ToC scroll spy and search UI
- File-based CMS: Keystatic reads/writes Markdown directly to git
- Type-safe: Astro content collections with Zod validation

#### Build & Deploy
- `astro check` → 0 errors
- `astro build` → succeeds
- Vercel Analytics + Speed Insights configured
- `/hs-admin` → `/keystatic` redirect via `vercel.json`

---

## Legend

- **Status:** Proposed | In Progress | Complete | Archived
- **Phases:** Breaking down large features into sequential, dependency-ordered tasks
- **Breaking Changes:** Highlighted for migration guide updates

---

---

## Architecture Changes (2026-03-19)

### New Collections
- **Voices:** Custom profiles for AI voice generation + writing style management
  - Fields: `name`, `tone`, `industry`, `audience`, `pronoun`, `language`, `samples[]`, `avoid[]`
  - Admin UI at `/admin/voices` with full CRUD

### New API Endpoints
- **POST `/api/admin/voice-analyze`** — Gemini-powered voice effectiveness evaluation
  - Body: `{ content: string, voiceProfile: VoiceProfile }`
  - Returns: `{ score: number, dimensions: {}, suggestions: {} }`

- **POST `/api/admin/voice-preview`** — Generate article opening in voice style
  - Body: `{ articleSlug: string, voiceProfile: VoiceProfile }`
  - Returns: `{ preview: string, wordCount: number }`

### New Components
- `voice-preview-modal.tsx` — Modal for previewing AI-generated voice samples
- `voice-score-panel.tsx` — Visual score badge + dimension breakdown + AI suggestions

### Styling Modularization
Split `src/styles/admin.css` (1247 LOC) into 7 modules for maintainability:
- `tokens.css` — CSS variable definitions (glass layers, colors, spacing)
- `layout.css` — Admin shell layout (sidebar, topbar, main content area)
- `components.css` — Reusable UI components (buttons, forms, modals, glass panels)
- `editor.css` — Content editor specific (CodeMirror, preview, toolbar)
- `table.css` — Content list tables (pagination, filters, status badges)
- `media.css` — Media browser grid (upload zone, thumbnails, modal)
- `responsive.css` — Mobile breakpoints and responsive behaviors

All partials imported in `admin.css` for single stylesheet generation.

---

**Last updated:** 2026-03-27
