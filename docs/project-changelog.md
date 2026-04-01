# Project Changelog

All notable changes to TreeTwin are documented here.

## Releases

### v4.0.0 — SaaS Stable (2026-04-02)

#### Landing Page Builder
- 28 section types (added popup, product-showcase, map, divider, countdown, ai-search)
- Per-section custom CSS: admin-editable textarea, scoped to `#section-{type}`, sanitized
- CSS badge indicator on section cards when customCss is set
- 18 design presets (10 new: Midnight Neon, Forest Calm, Ocean Breeze, Rose Minimal, Slate Pro, Retro Pop, Aurora Gradient, Charcoal Gold, Candy Pastel, Monochrome Sharp)
- Auto preset matching: clone extracts colors → matches nearest preset or generates palette
- Removed scopedCss system (replaced by per-section customCss)

#### Clone Pipeline
- Gemini prompts synced with all 28 section types
- customCss prompt uses CSS variables (var(--lp-*)) for preset compatibility
- Design-system-derived CSS rules: consistency rule (shared radius, shadow, button style)
- Clear rules for when to use/omit customCss per section type

#### UX
- Smooth scroll for nav anchor links (JS-based, desktop + mobile)
- Mobile menu: close overlay before scrolling with delay for overflow reset
- Amber timeout hint instead of red error on AI timeout ("AI server is busy, retry")

#### Architecture
- Database-first migration: Turso DB + Cloudflare Workers (6 phases)
- IO Factory Pattern: code works with Turso, Local SQLite, or GitHub
- Better Auth + Google OAuth for SaaS auth
- Per-tenant database provisioning

### v3.4.0 — Codebase Hardening (2026-04-01)

#### Security
- PBKDF2 password hashing for multi-user + product-scoped admin login
- Separate ADMIN_API_KEY from JWT signing secret
- SSRF protection on image proxy (admin auth, IP blocklist, content-type validation, 10MB limit)
- XSS prevention: sanitize-html allowlist for landing HTML + embeds
- CSS sanitizer for AI-generated scoped styles
- Timing-safe API key + HMAC comparison
- Rate limiting: auth 5/min, subscribe 3/min, AI endpoints 10/min per IP
- Path traversal prevention in content I/O and entity I/O
- Production auth guard on checkout endpoints
- Path validation in feature builder file generation
- Error message sanitization (no internal details in API responses)

#### Performance
- 30s timeout on all Gemini API calls (60s for clone pipeline)
- Removed global mutable state from clone pipeline
- Optimized landing page query (getEntry instead of getCollection)

#### Code Quality
- Extracted shared json() + apiError() helpers (replaced 60+ duplicates)
- Split landing-section-forms.tsx: 1319 LOC → 6 LOC + 11 modular files
- Split landing-live-preview.tsx: 1167 LOC → 146 LOC + 11 modular files
- Removed Supabase auth placeholder from middleware
- Removed deprecated global markdown state

### v3.3.0 — Homepage Redesign + Better Auth + Product Showcase (2026-03-31)

#### Rebrand
- Tree Identity → TreeTwin (treetwin.io)

#### Better Auth
- Email/password signup with verification flow
- Better Auth schema tables (user, session, account, verification)
- Start Free → login → dashboard flow

#### Homepage
- DM Serif Display font + gold accent theme
- AI search input hero, live demo iframe preview
- Live examples showcase (3 real landing pages)
- Comparison table: TreeTwin vs Bolt vs Lovable

#### Product Showcase
- New product-showcase section type with merge logic
- AI search multi-select feature cards

#### Landing Polish
- Nav CTA button + hero badge support
- CSS var defaults to :root
- Video section replacing GIF rich-text

### v3.2.0 — Clone v3: Layout System + Section Variants + Enhanced Pipeline (2026-03-29)

**Status:** Complete

Layout-first redesign with 8 responsive layout variants, 48 total section variants (expanded from 34), smart style defaults from AI clone post-processor, and enhanced Gemini prompts for variant-aware section extraction.

#### Phase 1: Layout System (8 Variants)

**Mobile-first responsive layouts** with per-section override support:

| Variant | Description | Use Case |
|---------|-------------|----------|
| **grid** | Responsive multi-column grid (1-6 cols) | Default, flexible layouts |
| **sidebar-left** | Fixed left sidebar + main content | Documentation, blog layout |
| **sidebar-right** | Fixed right sidebar + main content | Product pages, tutorials |
| **asymmetric** | Unequal columns (2:1 or 1:2 ratio) | Feature highlights |
| **thirds** | Three equal columns (desktop), stacked (mobile) | Statistics, team grids |
| **hero-split** | Split viewport: image left/right, text opposite | Hero intro, showcase |
| **stacked** | Full-width vertical stacking, no columns | Content-heavy sections |
| **masonry** | Masonry grid (CSS columns) | Portfolio, gallery layout |

**LayoutData schema update:**
- `variant: string` — Which layout to use
- `mobileReverse: boolean` — Swap order on mobile (hero-split only)
- `alignItems: 'start' | 'center' | 'end'` — Vertical alignment

All layouts mobile-first with responsive breakpoints (375px, 768px, 1024px+).

#### Phase 2: Section Variants (34 → 48)

**14 new variants across 7 section types:**

| Section | New Variants | Total | Details |
|---------|-------------|-------|---------|
| Hero | fullscreen (100vh + ken-burns), slider (multi-slide) | 6 | + centered, split, video-bg, minimal |
| Features | masonry, icon-strip, bento | 6 | + grid, list, alternating |
| Pricing | comparison (table), toggle (monthly/annual) | 5 | + cards, simple, highlight-center |
| Testimonials | quote-wall, logo-strip | 5 | + cards, single, minimal |
| Nav | hamburger (overlay), mega (dropdown panels) | 5 | + default, centered, transparent |
| Footer | mega (newsletter), centered-social | 5 | + simple, columns, minimal |
| CTA | — | 5 | (existing) |
| Stats | counter | 4 | + row, cards, large |
| FAQ | searchable | 4 | + accordion, two-column, simple |

**Total: 48 section variants** (up from 34), organized by type in section picker UI.

#### Phase 3: Enhanced Clone Pipeline

**AI variant selection:** Updated Gemini prompts include all 48 variants so Gemini can intelligently select appropriate variants during HTML analysis phase.

**Style defaults:** AI clone now extracts section styles (colors, fonts, spacing) and applies as `style` and `scopedCss` during post-processing, reducing manual design tweaks.

#### Component Modularization

13 new `.astro` files created for variant components:
- `hero-{fullscreen|slider}.astro` — Hero variants
- `features-{masonry|icon-strip|bento}.astro` — Feature variants
- `pricing-{comparison|toggle}.astro` — Pricing variants
- `testimonials-{quote-wall|logo-strip}.astro` — Testimonial variants
- `nav-{hamburger|mega}.astro` — Nav variants
- `footer-{mega|centered-social}.astro` — Footer variants
- `stats-counter.astro` — Stats counter
- `faq-searchable.astro` — Searchable FAQ

Each under 200 LOC, following component size limits in code standards.

#### Files Modified/Created

**Modified:**
- `src/content.config.ts` — Added `layout` field with variant/mobileReverse/alignItems
- `src/lib/admin/landing-clone-ai.ts` — Enhanced Gemini prompts with all 48 variants + style extraction
- `src/lib/admin/landing-clone-post-processor.ts` — Style defaults from clone analysis

**Created:**
- 13 new variant component files (listed above)

#### Success Metrics

- All 48 variants render correctly with responsive breakpoints
- Clone prompts successfully select variants matching original site design
- Layout system reduces manual re-sizing in admin UI
- Backward compatible: existing landings render unchanged

---

### v3.1.0 — AI Clone Auto-Improve & Post-Processing (2026-03-29)

**Status:** Complete

Advanced AI landing page cloner with 11 auto-fix post-processors, refined layout system with full-width sections, scoped CSS per-section styling, and enhanced component support for features (5-col grid), nav (logo/topbar), pricing (horizontal scroll), video (multi-grid), and improved design tokens.

#### AI Clone Post-Processing Auto-Fixes (v2 Enhancement)

**11 Auto-Fix Pipeline** — After Gemini cloning, apply intelligent post-processors to fix common issues:

1. **Hero Background:** Extracts slider JPG URLs from CSS (e.g., `background-image: url(...)`) and removes `style.backgroundImage` — lets hero component own its background
2. **Subheadline Cleaning:** Strips raw form field syntax, raw data artifacts, HTML fragments from cloned subheadings
3. **Font Mapping:** Auto-maps non-Google fonts (Arial, Verdana, etc.) to nearest Google Font equivalents (e.g., Arial → Roboto)
4. **TopBar Auto-Fix:** Converts Font Awesome classes to emoji, relocates image URLs to `icon` field (e.g., `fa-phone` → `📞`)
5. **SocialLinks Emoji:** Maps icon names to emoji (e.g., `icon: "twitter"` → `icon: "𝕏"`)
6. **Scoped CSS Injection:** Auto-injects section-level CSS for visual fidelity (Dancing Script font only for cursive sites, accent-colored buttons)
7. **Nav Logo Auto-Find:** Scans cloned HTML for logo image URLs, auto-populates `nav.logo.image` field
8. **Testimonial Card Style:** Detects dark backgrounds and auto-switches to light card mode for readability
9. **Design Color Fixes:** Auto-extracts primary color from nav, accent from CTAs; fixes textMuted contrast
10. **High-Contrast Text:** Auto-corrects inverted contrast (dark bg → white text, light bg → remove white text)
11. **Broken Colors:** Cleans hex values missing digits (e.g., `"#"` → auto-detect or fallback)

**Implementation:** Post-processors run in pipeline order, applied before sections saved to Keystatic. All fixes logged to section metadata for audit trail.

#### Layout System v2

**Full-Width Sections:** All sections now render full-width by default with edge-to-edge backgrounds.

- **Wrapper behavior:** `.landing-section-wrapper` renders at 100vw (full viewport width)
- **Content width:** `.landing-section` container = transparent, max-width 72rem, auto margins (centers on desktop)
- **Padding strategy:** Inner section children control padding (prevents bg color gaps between sections)
- **Data attribute:** All wrappers include `data-section={sectionId}` for scoped CSS matching
- **Schema update:** `content.config.ts` Zod schema now includes `style` and `scopedCss` fields on all sections

**Scoped CSS Principle:** No hardcoded colors in component CSS — use only layout, animation, card modes. All colors flow from design variables (`--lp-primary`, `--lp-secondary`, `--lp-accent`).

#### Component Enhancements

**Features:**
- Image overlay cards for each feature item
- 5-column grid layout (mobile: stacked, tablet: 2-3 cols, desktop: 5)
- CSS class: `landing-grid-5` for responsive 5-col support

**Pricing:**
- Horizontal scroll mode for 5+ travel/plan cards (prevents layout break)
- Touch-friendly swipe on mobile

**Nav:**
- Logo image rendering (replaces text logo)
- Top bar section with phone/email/country flags
- Centered nav variant
- SocialLinks now render as icons (emoji or image URLs)

**Video:**
- Multi-video 2x2 grid via `items` array (up to 4 videos per section)
- Fallback: single video if `items` array < 2

**Rich-Text & Video:**
- Heading + subheading support on both section types
- Reduces need for separate hero + content sections

**How-it-works:**
- Numbered circles with accent color (primary/accent blend)
- Animated number counter (0 → N on scroll)

**Footer:**
- Icon image rendering (supports both emoji and image URLs)
- Responsive column layout (mobile: 1 col, desktop: 4 cols)
- Styled content wrapper prevents background bleed

#### Scoped CSS & Design Variables

**Auto-scoped CSS:** Each cloned section can include a `scopedCss` array with selector + CSS declarations.

Example:
```
scopedCss: [
  { selector: ".footer-icon", css: "width: 24px; height: 24px;" },
  { selector: ".cta-button", css: "background: var(--lp-accent);" }
]
```

**Implementation:** Rendered in `<style>` tag scoped to section, preventing style bleed across sections.

#### Files Modified
- `src/lib/admin/landing-clone-ai.ts` — Added 11 post-processor functions in separate module
- `src/components/landing/landing-section-renderer.astro` — Supports full-width + data-section attribute
- `src/content.config.ts` — Schema update: style + scopedCss fields
- `src/components/landing/features.astro` — 5-col grid + image overlays
- `src/components/landing/pricing.astro` — Horizontal scroll for 5+ cards
- `src/components/landing/nav.astro` — Logo image + topBar support
- `src/components/landing/video.astro` — 2x2 grid mode
- `src/components/landing/footer.astro` — Icon image + responsive columns

#### Breaking Changes
None — Post-processors are non-destructive and backward compatible. Older landing pages render unchanged.

#### Shared Clone Utilities (New)
- **Module:** `src/lib/admin/clone-ai-utils.ts` — Extracted from landing-clone-ai.ts for reusability
- **Exports:** CloneResult interface, SECTION_TYPES constant, Gemini API client, HTML cleaning functions
- **Key functions:**
  - `directFetch()` — Simple HTTP fetch with timeout
  - `firecrawlFetch()` — Firecrawl API integration with Markdown side-effect
  - `cleanBasic()` — Remove scripts/styles/SVGs
  - `cleanForStructure()` — Aggressive sanitization for semantic extraction
  - `geminiCall()` — Unified Gemini API wrapper with token usage tracking
  - `safeJsonParse()` — JSON parsing with jsonrepair fallback
  - `validateDesign()` — Design object validation
  - `normalizeSections()` — Normalize section order and structure
  - `addUsage()` — Accumulate token usage across multiple API calls
- **Markdown caching:** `getLastMarkdown()`/`setLastMarkdown()` for reusing Firecrawl markdown output

#### Auto-Retry Missing Sections (Enhanced)
- **Detection:** Compare page H2 headings vs cloned section headings using fuzzy word matching
- **Retry logic:** Single pass through Gemini targeting missing headings only (additive)
- **Output:** `missingSections` array in CloneResult if any headings remain unmatched after retry
- **Implementation:** `retryMissingSections()` function with parallel Gemini call
- **Threshold:** Ignores if > 8 missing sections (page too complex)

#### Design Extraction Phase (New)
- **Separate call:** Design extraction now calls Gemini independently with HTML+CSS
- **Accuracy:** Keeps `<style>` tags for CSS variable detection (previously stripped)
- **Prompt:** `DESIGN_EXTRACT_PROMPT` specializes in color/font/radius extraction
- **Merging:** Design results merged with main clone, CSS styles take priority
- **Token tracking:** Design tokens added to total usage cost estimate
- **Fallback:** Design extraction failure is non-critical (main clone continues)

#### Per-Section Quality Assessment (New)
- **Scoring:** Each section rated as 'good', 'partial', or 'poor'
- **Logic:** Based on content completeness (presence of heading/items/text)
- **Output:** `sectionQuality` array in CloneResult with per-section issues
- **Issues detected:** Empty content, truncated items, missing required fields, incomplete data
- **Usage:** Admin UI displays quality indicators (3-dot badge per section)

#### Layout Section Support (Enhanced)
- **Type:** `layout` section for multi-column side-by-side content
- **Structure:** `columns` (array of widths) + `children` (per-column sections)
- **Prompt:** Updated DIRECT_CLONE_PROMPT with detailed layout examples
- **Use case:** Stats next to testimonials, image next to form, multi-card grids
- **Validation:** Schema checks for valid column/children structure

#### Admin UI Enhancements
- **Retry notice:** Modal shows "Retry attempted, X sections still missing" when `retried: true`
- **Quality dots:** Section review shows visual quality badges (🟢 good, 🟡 partial, 🔴 poor)
- **Add missing sections button:** UI prompt to manually add/import remaining unmatched headings
- **Site analysis:** Real-time tier/score display while typing URL (Tier 1-4 with framework detection)

#### Framework Detection (Enhanced)
- **Detectors:** 15+ framework patterns (Astro, Hugo, Next.js, Nuxt, SvelteKit, Remix, Gatsby, Jekyll, WordPress, Shopify, Webflow, Wix, Squarespace, Ghost)
- **Scoring:** Base score 50 + framework boost/penalty (Astro +20, React SPA -15, Angular -20, Cloudflare -30)
- **Metrics:** Word count (30-2000 word sweet spot), semantic tags count, HTML size
- **Output:** `SiteAnalysis` interface with tier (1-4), score (0-100), framework name, canClone boolean

#### Files Modified
- `src/lib/admin/clone-ai-utils.ts` — NEW: Shared utilities module
- `src/lib/admin/landing-clone-ai.ts` — Phase 3 design extraction, Phase 1 auto-retry, quality assessment
- `src/components/admin/landing/landing-clone-modal.tsx` — Retry notice UI, quality dots, missing sections button

#### Breaking Changes
None — Backward compatible. New fields (missingSections, sectionQuality, retried) optional in CloneResult.

#### Architecture Notes
- **Three-phase pipeline:** Clone → Design Extract → Missing Retry
- **Token efficiency:** Reuses Markdown from Firecrawl for multiple Gemini calls
- **Design priority:** CSS-extracted design overrides Gemini-detected values
- **Quality transparency:** All cloned sections include assessment, enabling informed editing

---

### v3.0.0 — Marketplace Evolution (2026-03-28)

**Status:** In Progress

Digital marketplace implementation: Astro hybrid SSR mode, Supabase backend with 6 core tables, Google OAuth authentication, product catalog with AI intent search, checkout flow skeleton, and license key delivery system.

#### Astro Hybrid SSR (New)
- **Mode switch:** `output: 'server'` enables on-demand SSR for auth + marketplace routes
- **Benefits:** Static site + dynamic auth/commerce on-demand
- **Trade-off:** Some routes now server-rendered; landing pages remain static

#### Supabase Integration (New)
- **Core tables:** profiles, products, orders, order_items, licenses, payment_events
- **Auth:** Google OAuth via Supabase Auth (redirects to `/api/auth/callback`)
- **JWT:** Server-side token management + session cookies
- **Fallback:** SQLite via better-sqlite3 for local dev (no Supabase key required)

#### Marketplace Pages (New)
- **`/marketplace`** — Product catalog with AI-powered search
- **`/marketplace/[slug]`** — Product details, pricing, reviews
- **`/checkout/[slug]`** — Checkout form (skeleton with local dev simulation)
- **`/dashboard`** — User purchases, license keys, activation tokens

#### AI Intent Search (New)
- **Feature:** `/api/marketplace/search` — Gemini 2.5-flash analyzes natural language queries
- **Request:** `{ query: "I need a tool for X", limit: 5 }`
- **Response:** Matched products ranked by intent confidence
- **Example:** "email marketing software" → suggests email/newsletter products
- **Requires:** `GEMINI_API_KEY`

#### Payment Skeleton (New)
- **Endpoints:**
  - `POST /api/checkout/create` — Create order (returns draft)
  - `POST /api/checkout/confirm` — Confirm payment (local: simulates success)
- **Status:** Not yet integrated with Stripe/payment provider
- **Local dev:** Payments auto-succeed; license keys generated
- **Production:** Ready for Stripe integration

#### License Key Delivery (New)
- **Auto-generation:** On order confirmation, generates unique license key
- **Activation:** Keys stored in `licenses` table with optional activation timestamp
- **Dashboard:** `/dashboard` shows all licenses with status + download links
- **API:** `GET /api/dashboard/licenses` returns user's active/inactive keys

#### Dependencies Added
- `@supabase/supabase-js` — Supabase client SDK
- `better-sqlite3` — SQLite fallback for local dev

#### Environment Variables (New)
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Anonymous key for client auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin operations |
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth secret |
| `USE_SQLITE_FALLBACK` | Set to `true` for local SQLite (dev only) |

#### Files Created
**Marketplace Core:**
- `src/lib/supabase/client.ts` — Supabase client + connection pooling
- `src/lib/supabase/db-fallback.ts` — SQLite fallback initialization
- `src/lib/supabase/types.ts` — Database schema TypeScript types
- `src/lib/supabase/queries.ts` — Reusable database query helpers

**Marketplace Services:**
- `src/lib/marketplace/product-service.ts` — Product queries + filtering
- `src/lib/marketplace/order-service.ts` — Order creation + management
- `src/lib/marketplace/license-service.ts` — License key generation + validation
- `src/lib/marketplace/ai-intent-search.ts` — Gemini intent search integration

**Authentication:**
- `src/lib/auth/supabase-auth.ts` — Supabase Auth client wrapper
- `src/lib/auth/jwt-utils.ts` — JWT token encoding/decoding
- `src/lib/auth/session.ts` — Session middleware + cookie management

**Pages:**
- `src/pages/marketplace/index.astro` — Product catalog + search UI
- `src/pages/marketplace/[slug].astro` — Product detail page
- `src/pages/checkout/[slug].astro` — Checkout form
- `src/pages/dashboard/index.astro` — User dashboard (auth required)

**API Routes:**
- `src/pages/api/marketplace/products.ts` — List/filter products
- `src/pages/api/marketplace/search.ts` — AI intent search
- `src/pages/api/marketplace/[slug].ts` — Product details
- `src/pages/api/checkout/create.ts` — Create order
- `src/pages/api/checkout/confirm.ts` — Confirm payment + generate license
- `src/pages/api/dashboard/purchases.ts` — User orders
- `src/pages/api/dashboard/licenses.ts` — User licenses
- `src/pages/api/auth/callback.ts` — Google OAuth callback
- `src/pages/api/auth/logout.ts` — Session cleanup

#### Architecture Notes
- **SSR requirement:** Marketplace routes need server context for Supabase queries + auth
- **Static optimization:** Landing pages remain fully static (prerendered)
- **Dev experience:** SQLite fallback allows offline development without Supabase credentials
- **Security:** Service role key kept server-side; client uses anon key + RLS policies
- **Payment:** Skeleton ready for Stripe; local dev simulates successful transactions

---

### v2.7.0 — Landing Page v2 Upgrades (2026-03-28)

**Status:** Complete

Landing page section types expanded to 25 with new `social-proof`, `comparison`, and `ai-search` components. Admin enhanced with icon picker, multi-CTA buttons, testimonials carousel, footer columns editor, and scroll-to-highlight. Rich text now supports Markdown. Video embedding auto-detects platforms. Design tokens improved with glass-card override, secondary/outline button variants, and gradient-text class. AI clone improved with anti-duplication rules.

#### Section Types Expanded (25 Total - New)
- **social-proof:** Customer testimonials grid with avatars, ratings, company logos
- **comparison:** Feature/pricing comparison with side-by-side table layout
- **ai-search:** AI-powered search interface with autocomplete

#### Admin Editor Enhancements (New)
- **Icon picker:** Browse Material Icons / Feather Icons for nav items and footer links
- **Multi-CTA buttons:** Add multiple buttons per section (link, style, size per button)
- **Testimonials carousel variant:** Auto-rotate with pagination + pause-on-hover
- **Footer columns editor:** Drag-drop column builder (1-4 columns, link groups)
- **Pricing badges:** Support badge icons (Popular, Best Value, Limited Offer, etc.)
- **Scroll-to-highlight:** Auto-detect scroll position, highlight active section in nav

#### Rich Text System (Enhanced)
- **Markdown support:** Rich text component now accepts Markdown syntax (in addition to HTML)
- **Markdown → HTML:** Build-time conversion, no runtime parsing overhead
- **Example:** Links, emphasis, code blocks, blockquotes all render correctly

#### Video Component (Enhanced)
- **Auto-detect embedding:** Recognize YouTube, Vimeo, custom URLs and render native embeds
- **Fallback:** Graceful fallback for unsupported video sources

#### Design Tokens (Enhanced)
- **glass-card:** Landing page override for glass-morphism cards (primary-accent blend)
- **btn-secondary:** Secondary button variant (lighter contrast, hover state)
- **btn-outline:** Outline button variant (border-only, background on hover)
- **gradient-text:** Text gradient utility class (vibrant animated gradients for hero text)
- **All tokens:** Respect per-landing design system values (colors, fonts, radius)

#### AI Landing Clone (Enhanced)
- **Anti-duplication:** Improved Gemini prompts to avoid extracting duplicate sections
- **Design inference:** Better color/font/spacing detection from source HTML
- **Schema validation:** Stricter schema validation before saving cloned configs

---

### v2.6.0 — Landing Design System + AI Clone + Feature Builder Phase 3 (2026-03-27)

**Status:** Complete

Landing page builder enhancements: per-page design system with presets, CSS variables, section layout variants across 11 types (36 variants total), AI landing page cloner from URL, and Feature Builder Phase 3 hybrid code generation engine.

#### Landing Page Design System (New)
- **6 design presets:** clean-light, modern-dark, gradient-bold, startup-fresh, corporate-trust, warm-sunset
- **Per-page customization:** Colors (primary, secondary, accent), fonts (headings, body), border-radius
- **Google Fonts integration:** Auto-loaded via link tags, no external CDN
- **CSS variables:** `--lp-*` tokens for colors, fonts, spacing in landing sections
- **Design panel UI:** `/admin/landing/[slug]/design` with preset picker + custom editor
- **Live preview integration:** Real-time design updates without save

#### Section Layout Variants (36 Total - New)
All 11 section types now support multiple layout variants:
- **Hero:** centered, split, video-bg, minimal (4 variants)
- **CTA:** default, split, banner, minimal, with-image (5 variants)
- **Features:** grid, list, alternating (3 variants)
- **Pricing:** cards, simple, highlight-center (3 variants)
- **Testimonials:** cards, single, minimal (3 variants)
- **FAQ:** accordion, two-column, simple (3 variants)
- **Stats:** row, cards, large (3 variants)
- **How It Works:** numbered, timeline, cards (3 variants)
- **Team:** grid, list, compact (3 variants)
- **Nav:** default, centered, transparent (3 variants)
- **Footer:** simple, columns, minimal (3 variants)
- **Tabbed section picker:** Admin UI filters sections by All/Structure/Content/Conversion/Media

#### AI Landing Page Cloner (New)
- **Feature:** Paste URL → AI analyzes HTML → extracts sections, design, content → auto-generates landing config
- **Implementation:** `POST /api/admin/landing/clone` endpoint
- **AI Model:** Gemini 2.5 Flash for fast HTML analysis + section extraction
- **Output:** YAML landing config with extracted sections + design system values
- **UX:** Modal in landing editor with URL input + clone button

#### Feature Builder Phase 3 (Enhanced)
- **Hybrid code generation engine:** Combines AI + templates for faster component scaffolding
- **Categorized output:** Generated code organized by: data models, API routes, React components, tests
- **Generation guides:** In-app help text for each generated artifact
- **AI Fill button:** Auto-populate field descriptions using Gemini
- **Code review step:** User can edit generated code before applying

#### Gemini Model Update (2026-03-27)
- **Upgrade:** All Gemini API calls updated from `gemini-2.0-flash` → `gemini-2.5-flash`
- **Reason:** 2.0-flash deprecated; 2.5-flash available (faster, better context handling)
- **Files updated:** AI setup generator, voice analysis, feature builder, landing clone

#### Admin UX Improvements (Various)
- **Dashboard deprecation:** `/admin` no longer shows dashboard; redirects to `/features`
- **Split preview default:** Feature builder live preview panel enabled by default
- **Thin scrollbars:** Admin UI uses CSS scrollbar-width improvements
- **Import updates:** All admin pages use updated Gemini model constants

#### Breaking Changes
- **Gemini model version:** Projects using custom Gemini API keys must update to 2.5-flash (or equivalent)
- **Landing design tokens:** Landing sections now use `--lp-*` variables (previously hardcoded colors)

---

### v2.5.0 — Feature Builder Phase 1 + Product-Scoped API + Public Entity Rendering (2026-03-27)

**Status:** Complete

Three major features released: AI-assisted feature builder, product-scoped GoClaw API, and public entity page rendering.

#### Feature Builder Phase 1 (New)
- **Wizard UI:** `/admin/feature-builder` with Define + AI Clarify steps
- **AI Clarification:** Gemini Flash generates follow-up questions (3-5 max) to refine feature spec
- **Components:** Define step (description input), Clarify step (Q&A interface)
- **API endpoint:** `POST /api/admin/feature-builder/clarify` — Calls Gemini
- **Feature registration:** System section, requires `GEMINI_API_KEY`, opt-in via feature registry
- **Files added:** `feature-builder-ai.ts`, 3 React components, 1 API route

#### Product-Scoped GoClaw API (New)
- **15 new endpoints:** `/api/goclaw/[product]/*` (landing, content, setup, voices, templates, entities, sections)
- **Auth:** Bearer token (`GOCLAW_API_KEY`) + product slug validation
- **Content filtering:** All responses filtered by `product.coreCollections` (per-product content access)
- **Feature gating:** Endpoints respect `product.features` enabled status
- **Auth module:** `src/lib/goclaw/product-scope.ts` with product validation + filtering
- **Backward compatible:** Global `/api/goclaw/*` endpoints remain unchanged
- **Files added:** Product-scoped auth module + 14 new API route files

#### Public Entity Rendering (New)
- **Configuration:** Entity definitions support new `public` config block: `enabled`, `path`, `listTitle`, `listFields`
- **Static pages:** Routes at `/e/{path}/` (list view) and `/e/{path}/{slug}` (detail view)
- **Components:** `entity-list-view.astro`, `entity-detail-view.astro` for dynamic rendering
- **SEO:** Dynamic OG/Twitter meta tags via existing `BaseHead` component
- **Example:** Customer entity configured as test case at `/e/customers/`
- **Files added:** 2 entity view components + 2 dynamic route pages

---

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
9. **GoClaw Hub Skill** — treetwin-manager skill for agent orchestration

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

**Last updated:** 2026-03-28
**Version:** v2.7.0
