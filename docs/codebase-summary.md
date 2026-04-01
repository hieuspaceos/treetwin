# TreeTwin — Codebase Summary

**Status:** v3.4.0 — Database-First Architecture
**Last Updated:** 2026-04-01
**Stack:** Astro 5 (hybrid SSR) + Keystatic + Better Auth + Turso DB + Drizzle ORM + Gemini AI + Cloudflare Pages
**Deployment:** Cloudflare Pages + Workers

## Overview

TreeTwin combines **static content engine** with **SaaS multi-tenant platform**:

- **Content Layer:** Git-tracked articles/notes (zero database for public content)
- **SaaS Layer:** Turso DB for user auth, products, orders, licenses, per-tenant data
- **Backend:** IO Factory Pattern abstracts storage (Turso/LocalIO/GitHub)
- **Deployment:** Cloudflare Pages + Workers (serverless, global)

**Key Design:**
- **Content:** Keystatic (git CMS) + Markdoc articles remain static-first, zero DB
- **Database:** Turso (SQLite serverless) for user state, SaaS features, tenant provisioning
- **Auth:** Better Auth + Google OAuth for SaaS flows
- **IO Pattern:** All data access via factories — code works identically on Turso/Local/GitHub
- **Dev:** SQLite fallback (better-sqlite3) when `TURSO_URL` not set — no DB setup needed
- **Scale:** Per-tenant DB provisioning via Turso Platform API (optional, fallback to shared DB)

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Astro 5 | Hybrid SSR, static-first content |
| CMS | Keystatic | Git-based admin UI + file storage |
| Database | Turso (SQLite serverless) | User auth, products, orders, licenses, per-tenant data |
| Database (Dev) | SQLite via better-sqlite3 | Local fallback (no setup needed) |
| ORM | Drizzle ORM | Type-safe DB queries |
| Auth | Better Auth | Email/password + Google OAuth |
| Content Format | Markdoc (articles) + YAML (notes) | Type-safe, semantic |
| Search | Pagefind (static) + Gemini (AI) | Static index + intent search |
| Storage | Cloudflare R2 | Media uploads + manifests |
| Styling | Tailwind CSS 4 | Utility-first with variables |
| Deploy | Cloudflare Pages + Workers | Serverless, global CDN |
| Testing | Vitest | Unit + integration tests |

## Key Design Decisions

**Storage & Data Access:**
- **IO Factory Pattern** — All data access via factories (`getContentIO()`, `getEntityIO()`, etc.)
- **Backend abstraction** — Code works identically with Turso/LocalIO/GitHubIO
- **Git-tracked content** — Articles/notes in Markdown/YAML at `src/content/` (no DB)
- **Turso for SaaS** — Serverless SQLite for user auth, products, licenses, tenant data
- **Local dev fallback** — SQLite via better-sqlite3 when `TURSO_URL` not set (no setup)
- **Per-tenant provisioning** — Auto-create databases via Turso Platform API (optional)

**Framework & Architecture:**
- **Hybrid SSR** — `output: 'server'` for SSR routes; static pages use `prerender = true`
- **Island architecture** — Astro by default, React islands for interactivity only
- **Keystatic CMS** — Git-based file editing, admin at `/keystatic`
- **Admin SPA** — Full React dashboard at `/admin` (separate from Keystatic)

**Features:**
- **Landing builder** — 32 section types, 50+ layout variants, D&D editor, design system
- **Landing cloner** — AI extracts sections/design from URLs, auto-retry, quality scoring
- **Feature builder** — AI-assisted generation with hybrid code engine
- **Entity system** — Custom data schemas with dynamic form fields
- **Theme system** — CSS variables for glass morphism design
- **Multi-product** — Per-product admin, scoped API, feature toggles
- **Marketplace** — Product catalog with AI intent search, checkout flow, dashboard
- **Email** — Resend API + git-tracked YAML subscribers

**Deployment:**
- **Cloudflare Pages** — Serverless static + Workers for API routes
- **Global CDN** — Fast content delivery worldwide
- **Workers Node.js compat** — Full Node.js runtime for API routes
- **R2 storage** — Cloudflare R2 for media uploads (optional)

## Directory Structure

```
treetwin/
├── src/
│   ├── content/                     # Keystatic-managed content (git-tracked)
│   │   ├── articles/               # Long-form Markdoc articles
│   │   │   └── my-article/
│   │   │       └── index.mdoc      # Markdoc + frontmatter
│   │   ├── notes/                  # Short-form YAML notes
│   │   │   └── my-note.yaml
│   │   ├── records/                # Structured YAML records
│   │   │   └── my-record.yaml
│   │   ├── products/               # NEW v2.4.0: Product definitions
│   │   │   └── my-product.yaml
│   │   ├── landing-pages/          # Landing page configs (YAML)
│   │   │   └── my-landing/
│   │   │       └── index.yaml
│   │   ├── templates/              # Product landing templates
│   │   │   ├── saas.yaml
│   │   │   ├── agency.yaml
│   │   │   ├── course.yaml
│   │   │   ├── ecommerce.yaml
│   │   │   └── portfolio.yaml
│   │   ├── entity-definitions/     # Custom entity schemas
│   │   │   └── my-entity.yaml
│   │   ├── entities/               # Entity instances
│   │   │   └── my-entity-instance.yaml
│   │   └── site-settings/
│   │       └── index.yaml          # Global settings (theme, etc.)
│   ├── pages/                       # Astro page routes
│   │   ├── index.astro             # Home page
│   │   ├── [landing-slug].astro    # Dynamic landing page renderer
│   │   ├── marketplace/            # NEW: Marketplace pages
│   │   │   ├── index.astro         # Product catalog with AI search
│   │   │   └── [slug].astro        # Product detail page
│   │   ├── checkout/               # NEW: Checkout flow
│   │   │   └── [slug].astro        # Checkout for product
│   │   ├── dashboard/              # NEW: User dashboard
│   │   │   └── index.astro         # Purchases, license keys
│   │   ├── [product-slug]/         # NEW v2.4.0: Per-product routes
│   │   │   └── admin/[...path].astro  # Per-product admin shell
│   │   ├── admin/
│   │   │   ├── index.astro         # Admin dashboard home
│   │   │   ├── products/           # NEW v2.4.0: Product management
│   │   │   │   ├── index.astro
│   │   │   │   ├── [slug].astro
│   │   │   │   └── create.astro
│   │   │   ├── landing/
│   │   │   │   ├── index.astro
│   │   │   │   ├── [slug].astro
│   │   │   │   └── create.astro
│   │   │   ├── entities/
│   │   │   │   ├── index.astro
│   │   │   │   └── [...path].astro
│   │   │   ├── templates/
│   │   │   └── setup/
│   │   ├── api/
│   │   │   ├── marketplace/        # NEW: Marketplace API
│   │   │   │   ├── products.ts     # GET /api/marketplace/products
│   │   │   │   ├── search.ts       # POST /api/marketplace/search (AI intent)
│   │   │   │   └── [slug].ts       # GET /api/marketplace/[slug]
│   │   │   ├── checkout/           # NEW: Payment API
│   │   │   │   ├── create.ts       # POST /api/checkout/create
│   │   │   │   └── confirm.ts      # POST /api/checkout/confirm
│   │   │   ├── dashboard/          # NEW: User dashboard API
│   │   │   │   ├── purchases.ts    # GET /api/dashboard/purchases
│   │   │   │   └── licenses.ts     # GET /api/dashboard/licenses
│   │   │   ├── auth/               # NEW: Supabase auth
│   │   │   │   ├── callback.ts     # Google OAuth callback
│   │   │   │   └── logout.ts       # Session cleanup
│   │   │   ├── products/           # NEW v2.4.0: Per-product API
│   │   │   │   └── [slug]/[...].ts # Per-product content/media
│   │   │   ├── admin/
│   │   │   │   ├── products/       # NEW v2.4.0: Product CRUD
│   │   │   │   │   ├── index.ts
│   │   │   │   │   └── [slug].ts
│   │   │   │   ├── landing/
│   │   │   │   │   ├── index.ts    # GET/POST/DELETE
│   │   │   │   │   ├── [slug].ts   # PUT update
│   │   │   │   │   └── sections.ts # Section CRUD
│   │   │   │   ├── entities/
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── [slug].ts
│   │   │   │   │   └── definitions.ts
│   │   │   │   ├── templates/
│   │   │   │   └── setup/
│   │   │   └── goclaw/
│   │   │       ├── landing/
│   │   │       ├── entities/
│   │   │       ├── templates/
│   │   │       └── setup
│   │   └── ...
│   ├── layouts/
│   │   └── base-layout.astro       # Root layout with nav + footer
│   ├── components/
│   │   ├── landing/                # Landing page sections (25 types)
│   │   │   ├── nav.astro           # NEW v2.4.0
│   │   │   ├── footer.astro        # NEW v2.4.0
│   │   │   ├── layout.astro        # NEW v2.4.0
│   │   │   ├── divider.astro       # NEW v2.4.0
│   │   │   ├── rich-text.astro     # NEW v2.4.0: Markdown support added v2.7.0
│   │   │   ├── banner.astro        # NEW v2.4.0
│   │   │   ├── map.astro           # NEW v2.4.0
│   │   │   ├── gallery.astro       # NEW v2.4.0
│   │   │   ├── video.astro         # NEW v2.4.0: Auto-detect embed added v2.7.0
│   │   │   ├── image.astro         # NEW v2.4.0
│   │   │   ├── image-text.astro    # NEW v2.4.0
│   │   │   ├── countdown.astro     # NEW v2.4.0
│   │   │   ├── contact-form.astro  # NEW v2.4.0
│   │   │   ├── social-proof.astro  # NEW v2.7.0
│   │   │   ├── comparison.astro    # NEW v2.7.0
│   │   │   ├── ai-search.astro     # NEW v2.7.0
│   │   │   ├── (9 v2.3-v2.4 sections)
│   │   ├── admin/
│   │   │   ├── landing/
│   │   │   │   ├── landing-dnd-editor.tsx    # NEW v2.4.0: D&D reorder
│   │   │   │   ├── landing-live-preview.tsx  # NEW v2.4.0: Real-time preview
│   │   │   │   ├── device-toggle.tsx         # NEW v2.4.0: Mobile/tablet/desktop
│   │   │   │   ├── section-picker-toolbar.tsx # NEW v2.4.0: 25-section picker
│   │   │   │   ├── page-settings-panel.tsx   # NEW v2.4.0: Metadata editor
│   │   │   │   ├── landing-design-panel.tsx  # NEW v2.6.0: Design system + presets
│   │   │   │   ├── landing-clone-modal.tsx   # NEW v2.6.0: Clone landing from URL
│   │   │   │   ├── icon-picker.tsx           # NEW v2.7.0: Icon picker for nav/footer
│   │   │   │   ├── multi-cta-editor.tsx      # NEW v2.7.0: Multi-button CTA editor
│   │   │   │   ├── testimonial-carousel.tsx  # NEW v2.7.0: Carousel variant
│   │   │   │   ├── footer-columns-editor.tsx # NEW v2.7.0: Multi-column builder
│   │   │   │   ├── scroll-to-highlight.tsx   # NEW v2.7.0: Highlight on scroll
│   │   │   │   └── (v2.3-v2.6 components)
│   │   │   ├── entities/
│   │   │   ├── templates/
│   │   │   ├── setup/
│   │   │   ├── products/            # NEW v2.4.0: Product admin components
│   │   │   └── ... (existing)
│   │   └── ...
│   ├── lib/
│   │   ├── db/                     # Database layer (Turso + Drizzle)
│   │   │   ├── client.ts           # Turso connection singleton
│   │   │   ├── tenant-client.ts    # Per-tenant DB LRU cache
│   │   │   ├── schema.ts           # Drizzle schema (Better Auth tables)
│   │   │   ├── schema-content.ts   # Content tables
│   │   │   ├── schema-tenant.ts    # Tenant registry
│   │   │   ├── seed-content.ts     # YAML→DB migration
│   │   │   └── seed-templates.ts   # Template seeding
│   │   ├── admin/                  # Admin business logic
│   │   │   ├── content-io.ts       # Content factory (Turso/Local/GitHub)
│   │   │   ├── content-io-types.ts # ContentIO interface
│   │   │   ├── content-io-turso.ts # Turso implementation
│   │   │   ├── content-io-local.ts # SQLite fallback
│   │   │   ├── content-io-github.ts # GitHub storage
│   │   │   ├── entity-io.ts        # Entity factory
│   │   │   ├── entity-io-turso.ts  # Entity Turso impl
│   │   │   ├── entity-io-local.ts  # Entity local impl
│   │   │   ├── product-io.ts       # Product factory
│   │   │   ├── product-io-turso.ts # Product Turso impl
│   │   │   ├── product-io-local.ts # Product local impl
│   │   │   ├── clone-ai-utils.ts   # Shared clone utilities
│   │   │   ├── landing-clone-ai.ts # Landing page AI cloner
│   │   │   ├── validation.ts       # Zod schemas
│   │   │   └── feature-registry.ts # Feature toggles
│   │   ├── saas/                   # SaaS-specific logic
│   │   │   ├── tenant-provisioner.ts # Per-tenant DB provisioning
│   │   │   └── landing-page-db.ts   # Landing page DB queries
│   │   ├── landing/                # Landing page system
│   │   │   ├── landing-io.ts       # Landing page IO
│   │   │   ├── landing-types.ts    # TypeScript types
│   │   │   ├── template-apply.ts   # Template helpers
│   │   │   └── design-presets.ts   # Design system
│   │   ├── email/                  # Email integration
│   │   │   ├── subscriber-io.ts    # Subscriber factory
│   │   │   └── resend-client.ts    # Resend API client
│   │   ├── distribution/           # Social distribution
│   │   │   ├── distribution-io.ts  # Distribution logs
│   │   │   └── distribution-generator.ts # Gemini generation
│   │   └── ... (existing)
│   ├── themes/
│   │   ├── theme-types.ts
│   │   ├── theme-resolver.ts
│   │   └── liquid-glass.ts
│   └── config/
│       └── site-config.ts
├── docs/
│   ├── project-overview-pdr.md
│   ├── codebase-summary.md         # This file
│   ├── system-architecture.md
│   ├── deployment-guide.md
│   ├── code-standards.md
│   └── development-roadmap.md
├── .env.example
├── astro.config.mjs
├── wrangler.toml                  # Cloudflare Pages config
├── keystatic.config.ts
├── drizzle.config.ts              # Drizzle ORM config
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## Content Collections

Defined in `keystatic.config.ts` + `src/content.config.ts`. All inherit base fields from `baseSeedFields`.

### Products (New — 2026-03-26)

**Path:** `src/content/products/{slug}.yaml`
**Purpose:** Multi-tenant product definitions with per-product admin + API scoping

**Structure:**
```yaml
slug: my-product
title: My Product
description: Short description
features: []
metadata:
  theme: liquid-glass
  enabledFeatures:
    - landing
    - entities
```

**Admin UI:** `/admin/products` (superadmin only), per-product admin at `/{slug}/admin`

**Key Behaviors:**
- Auto-create landing page when product is created
- Product can edit its own landing page without enabling landing module
- Back-to-site link in product admin navbar
- No dashboard in product admin (redirects to settings)

### Landing Pages (New — 2026-03-26)

**Path:** `src/content/landing-pages/{slug}/index.yaml`
**Purpose:** Modular landing page configurations rendered to static HTML

**Structure:**
```yaml
slug: my-landing
title: My Product Landing
description: Short description
status: published
publishedAt: 2026-03-26
sections:
  - type: hero
    props: {...}
  - type: features
    props: {...}
  - type: pricing
    props: {...}
entities:
  - definition: testimonial
    instances: [...]
metadata:
  theme: liquid-glass
  locale: en
```

**Admin UI:** `/admin/landing` — YAML editor with section component picker + inline preview

### Entity Definitions (New — 2026-03-26)

**Path:** `src/content/entity-definitions/{id}.yaml`
**Purpose:** Custom entity schemas for dynamic collections (testimonials, team members, portfolio items, etc.)

**Structure:**
```yaml
id: testimonial
name: Testimonial
fields:
  - name: author
    type: text
    required: true
  - name: quote
    type: textarea
    required: true
  - name: image
    type: text
    required: false
  - name: role
    type: text
```

**Admin UI:** `/admin/entities` — Schema builder with field type selector

### Entity Instances (New — 2026-03-26)

**Path:** `src/content/entities/{definition-id}/{slug}.yaml`
**Purpose:** Data records for custom entity types (e.g., testimonials, team members)

**Structure:**
```yaml
slug: john-doe
definition: testimonial
author: John Doe
quote: "TreeTwin is amazing..."
image: /media/john.jpg
role: Product Manager
```

**Admin UI:** `/admin/entities/{definition-id}` — CRUD interface auto-generated from schema

### Templates (New — 2026-03-26)

**Path:** `src/content/templates/{id}.yaml`
**Purpose:** Pre-built landing page templates for quick setup

**Includes:**
- saas.yaml — SaaS product template
- agency.yaml — Service agency template
- course.yaml — Online course template
- ecommerce.yaml — E-commerce store template
- portfolio.yaml — Portfolio/case studies template

**Admin UI:** `/admin/templates` — Gallery view with preview + apply button

### Voices (2026-03-19)

**Path:** `src/content/voices/{id}.yaml`
**Purpose:** Voice profiles for AI-powered writing style generation and content analysis

### Shared Fields (All Seed Types)

| Field | Type | Path | Default |
|-------|------|------|---------|
| `title` | slug | — | Required |
| `description` | text (multiline) | — | Required |
| `summary` | text (multiline, max 300) | — | Optional (AI-optimized summary, falls back to description) |
| `status` | select | — | `draft` |
| `publishedAt` | date | — | Optional |

## Database Schema (NEW — Marketplace)

**Tables in Supabase PostgreSQL:**

### profiles
```
- id: UUID (primary key, auth.users.id)
- email: TEXT (unique)
- name: TEXT
- avatar_url: TEXT (optional)
- created_at: TIMESTAMP
```

### products
```
- id: UUID (primary key)
- slug: TEXT (unique)
- title: TEXT
- description: TEXT
- price: DECIMAL
- product_config: JSONB (metadata)
- created_at: TIMESTAMP
```

### orders
```
- id: UUID (primary key)
- user_id: UUID (foreign key → profiles.id)
- product_id: UUID (foreign key → products.id)
- total_amount: DECIMAL
- status: TEXT (pending, completed, failed)
- created_at: TIMESTAMP
```

### order_items
```
- id: UUID (primary key)
- order_id: UUID (foreign key → orders.id)
- product_id: UUID (foreign key → products.id)
- quantity: INT
- price: DECIMAL
```

### licenses
```
- id: UUID (primary key)
- order_id: UUID (foreign key → orders.id)
- product_id: UUID (foreign key → products.id)
- user_id: UUID (foreign key → profiles.id)
- key: TEXT (unique, generated)
- activated_at: TIMESTAMP (optional)
```

### payment_events
```
- id: UUID (primary key)
- order_id: UUID (foreign key → orders.id)
- event_type: TEXT (checkout_created, confirm_received, etc.)
- payload: JSONB
- created_at: TIMESTAMP
```

**SQLite Fallback (Local Dev):**
Same schema mapped to better-sqlite3 in-memory or file-based database. Auto-initializes on server start.

## Pages & Routes

### Marketplace Pages (NEW)

**`/marketplace`** — Product catalog with AI intent search
- GET /api/marketplace/products — List all products
- POST /api/marketplace/search — AI intent search (Gemini-powered)
  - Request: `{ query: string, limit?: int }`
  - Response: `{ products: [], confidence: float }`
- Requires `GEMINI_API_KEY` for AI search

**`/marketplace/[slug]`** — Product detail page
- GET /api/marketplace/[slug] — Product details + reviews
- Shows pricing, features, CTA to checkout
- Requires Google login to proceed

**`/checkout/[slug]`** — Checkout page
- POST /api/checkout/create — Create order (skeleton)
  - Requires auth (Google OAuth)
- POST /api/checkout/confirm — Confirm payment (skeleton)
  - Local dev: simulates payment success
  - Production: would integrate Stripe/payment provider
- Generates license key on success

**`/dashboard`** — User dashboard (auth required)
- GET /api/dashboard/purchases — User's orders
- GET /api/dashboard/licenses — License keys with status
- Shows activation tokens, download links, support CTA

### Home Page (`src/pages/index.astro`)

- Lists all published articles + notes
- Uses `getAllPublishedSeeds()` from `content-helpers.ts`
- Seed cards with cover, title, description, date
- Sorted by `publishedAt` descending

### Landing Page (`src/pages/[landing-slug].astro`) — NEW

- Dynamic routing for landing pages via `src/content/landing-pages/`
- YAML config → section components → static HTML
- No runtime rendering — fully static at build time
- Template support: can apply pre-built templates to landing configs

### Seed Detail Page (`src/pages/seeds/[slug].astro`)

- Dynamic routing via Astro `getStaticPaths()`
- Fetches single seed (article/note) by slug
- Renders Markdoc via Astro markdown integration
- Auto-generated ToC from headings (React island: `<Toc />`)
- JSON-LD schema injection

### Admin Pages (New — 2026-03-26)

- `/admin/landing` — Landing page list + editor
- `/admin/landing/create` — New landing page wizard
- `/admin/entities` — Entity type list
- `/admin/entities/{definition}` — CRUD for entity instances
- `/admin/templates` — Template gallery with previews
- `/admin/setup` — AI setup wizard (Gemini-powered)

## API Routes

### Marketplace API Routes (NEW — Marketplace Evolution)

**Product Endpoints:**
- `GET /api/marketplace/products` — List all products with filtering
- `GET /api/marketplace/[slug]` — Get product details (price, description, reviews)
- `POST /api/marketplace/search` — AI intent search
  - Body: `{ query: string, limit?: int }`
  - Returns: `{ products: Product[], confidence: float, explanation: string }`
  - Powered by Gemini 2.5-flash

**Checkout Endpoints:**
- `POST /api/checkout/create` — Create order session
  - Requires: Auth header + product slug
  - Body: `{ productId: string, quantity?: int }`
  - Returns: `{ orderId: string, sessionUrl?: string }`
  - Status: Skeleton (returns draft order)
- `POST /api/checkout/confirm` — Confirm payment
  - Requires: Auth header + order ID
  - Body: `{ orderId: string, paymentToken?: string }`
  - Returns: `{ confirmed: boolean, licenseKey: string, downloadUrl?: string }`
  - Status: Local dev simulates success; production requires payment provider

**Dashboard Endpoints:**
- `GET /api/dashboard/purchases` — User's order history
  - Requires: Auth header
  - Returns: `{ orders: Order[] }`
- `GET /api/dashboard/licenses` — User's license keys
  - Requires: Auth header
  - Returns: `{ licenses: License[] }`

**Auth Endpoints (NEW):**
- `GET /api/auth/callback` — Google OAuth callback handler
  - Receives: `code` + `state` from Google
  - Sets: Session cookie + JWT token
  - Redirects: `/dashboard`
- `POST /api/auth/logout` — Clear session
  - Clears: Session cookie + JWT
  - Redirects: `/`

### Admin API Routes (New — 2026-03-26)

**Landing CRUD:**
- `GET /api/admin/landing` — List landing pages
- `POST /api/admin/landing` — Create landing page
- `PUT /api/admin/landing/[slug]` — Update landing page
- `DELETE /api/admin/landing/[slug]` — Delete landing page
- `GET /api/admin/landing/[slug]/sections` — Get page sections
- `POST /api/admin/landing/[slug]/sections` — Add section
- `PUT /api/admin/landing/[slug]/sections/[id]` — Update section
- `DELETE /api/admin/landing/[slug]/sections/[id]` — Remove section

**Entity CRUD:**
- `GET /api/admin/entities` — List all entity types
- `GET /api/admin/entities/definitions` — List entity definitions
- `POST /api/admin/entities/definitions` — Create entity definition
- `GET /api/admin/entities/[definition-id]` — List instances of entity type
- `POST /api/admin/entities/[definition-id]` — Create entity instance
- `PUT /api/admin/entities/[definition-id]/[slug]` — Update entity
- `DELETE /api/admin/entities/[definition-id]/[slug]` — Delete entity

**Template API:**
- `GET /api/admin/templates` — List all templates
- `GET /api/admin/templates/[id]` — Get template config
- `POST /api/admin/landing` with `templateId` — Apply template to new landing

**Setup Wizard:**
- `POST /api/admin/setup/generate` — AI generates landing from product description
- `POST /api/admin/setup/preview` — Preview generated landing before saving

### GoClaw API Routes (New — 2026-03-26)

**Landing Endpoints:**
- `GET /api/goclaw/landing` — List landing pages (AI read-only)
- `GET /api/goclaw/landing/[slug]` — Get landing config
- `POST /api/goclaw/landing` — Create landing (force draft)
- `PUT /api/goclaw/landing/[slug]` — Update landing (draft only)

**Entity Endpoints:**
- `GET /api/goclaw/entities` — List entity definitions
- `GET /api/goclaw/entities/[definition-id]` — List entity instances
- `POST /api/goclaw/entities/[definition-id]` — Create entity instance

**Template Endpoints:**
- `GET /api/goclaw/templates` — List available templates

**Setup Endpoint:**
- `POST /api/goclaw/setup/generate` — AI generates landing config (with authentication)

## Admin Components (2026-03-26)

### Landing Management
| Component | Type | Purpose |
|-----------|------|---------|
| `landing-list.tsx` | React | Landing page table with status, publish date, actions |
| `landing-config-editor.tsx` | React | YAML editor for landing page config with syntax highlighting |
| `section-editor.tsx` | React | Component picker + inline props editor for sections |
| `landing-preview.tsx` | React | Live preview of landing page (iframe with draft content) |

### Entity Management
| Component | Type | Purpose |
|-----------|------|---------|
| `entity-list.tsx` | React | List entities by type, filter, search |
| `entity-crud.tsx` | React | Auto-generated form from entity schema |
| `entity-schema-editor.tsx` | React | Field type picker + field property editor |

### Template & Setup
| Component | Type | Purpose |
|-----------|------|---------|
| `template-gallery.tsx` | React | Grid of 5 template cards with preview modal |
| `template-preview.tsx` | React | Side-by-side template config + rendered preview |
| `setup-wizard.tsx` | React | Multi-step form: product description → AI generation → preview → save |
| `setup-form.tsx` | React | Textarea for product description input |
| `setup-preview.tsx` | React | Shows AI-generated landing before applying |

## Key Utilities

### Landing System (`lib/landing/`)

**landing-types.ts** — TypeScript types
```typescript
interface LandingConfig {
  slug: string
  title: string
  sections: LandingSection[]
  entities: EntityReference[]
  metadata: LandingMetadata
}

interface LandingSection {
  id: string
  type: SectionComponentName
  props: Record<string, unknown>
}

interface EntityReference {
  definition: string
  instances: string[]  // instance slugs
}
```

**landing-config-reader.ts** — File I/O
- `readLandingConfig(slug)` — Parse YAML
- `writeLandingConfig(slug, config)` — Serialize to YAML
- `deleteLandingConfig(slug)` — Remove file

**landing-renderer.ts** — Dynamic component rendering
- `renderLandingPage(config)` — Load section components dynamically
- `applyTemplate(config, templateId)` — Merge template sections

**ai-setup-generator.ts** — Gemini integration
- `generateLandingFromDescription(description)` — AI → landing config
- Uses Gemini Flash with system prompt for landing page generation
- Supports multi-language output

**template-apply.ts** — Template utilities
- `getTemplate(id)` — Load template config
- `mergeTemplate(userConfig, template)` — Smart merge preserving user sections

### Entity System (`lib/admin/entity-io.ts`)

- `readEntityDefinition(id)` — Load schema
- `writeEntityDefinition(id, schema)` — Save schema
- `createEntityInstance(definition, data)` — Create instance
- `readEntityInstance(definition, slug)` — Load instance
- `updateEntityInstance(definition, slug, data)` — Update instance
- `listEntityInstances(definition)` — List all instances
- `deleteEntityInstance(definition, slug)` — Delete instance
- `validateEntityData(definition, data)` — Zod validation against schema

## Feature Module System (2026-03-26)

Optional features managed via registry:
- `email` — Email newsletter capture
- `goclaw` — External AI agent integration (product-scoped in v2.5+)
- `distribution` — Social media post generation
- `analytics` — GA4 tracking
- `media` — Cloudflare R2 file upload
- `voices` — Voice profile management
- `translations` — i18n translations
- **`landing`** — Landing page builder (toggleable)
- **`entities`** — Custom entity definitions with public rendering (toggleable)
- **`setup-wizard`** — AI landing setup wizard (toggleable)
- **`feature-builder`** — AI-assisted feature generation (NEW, v2.5+, system section)

**Registry:** `src/lib/admin/feature-registry.ts`
**Guard:** `src/lib/admin/feature-guard.ts`
**Settings UI:** `src/components/admin/feature-toggles-panel.tsx`

## Content Workflow

### Build Pipeline

1. **Edit content** via Keystatic UI at `/keystatic` (dev-only) or admin at `/admin`
2. **Save to disk** as Markdown/YAML files in `src/content/`
3. **Commit to git** (manual or auto via Keystatic webhook)
4. **Build triggers** on Vercel (astro build)
5. **Astro parses** content via `getCollection()` (type-safe)
6. **Output:** Static HTML at `dist/`

### Landing Page Build Flow

1. YAML config in `src/content/landing-pages/{slug}/index.yaml`
2. Build-time Astro renders landing via dynamic `[landing-slug].astro` page
3. Section components load via dynamic imports from `src/components/landing/`
4. Entity data loaded from `src/content/entities/{definition}/`
5. Static HTML generated at build time
6. Deployed to Vercel (cached, instant load)

## Environment Variables

### Marketplace (NEW)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL (https://xxx.supabase.co) |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key for client-side auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key for server-side admin operations |
| `GOOGLE_OAUTH_CLIENT_ID` | Yes (for auth) | Google OAuth client ID from Google Cloud Console |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Yes (for auth) | Google OAuth client secret |

### Dev Environment (Fallback)

| Variable | Required | Description |
|----------|----------|-------------|
| `USE_SQLITE_FALLBACK` | No (default: false) | Set to `true` to use SQLite instead of Supabase |
| `SQLITE_PATH` | No | Path to SQLite database file (default: `.db/dev.sqlite`) |

**Note:** When `USE_SQLITE_FALLBACK=true`, Supabase env vars are ignored and SQLite is used via better-sqlite3.

### Hybrid SSR Mode

| Variable | Required | Description |
|----------|----------|-------------|
| (Astro auto) | — | `output: 'server'` enables SSR on-demand for auth + marketplace routes |

### All Features (Optional & Required)

| Variable | Feature | Description |
|----------|---------|-------------|
| `RESEND_API_KEY` | email | Email newsletter via Resend |
| `GA_MEASUREMENT_ID` | analytics | Google Analytics 4 |
| `GOCLAW_API_KEY` | goclaw | GoClaw API adapter |
| `GEMINI_API_KEY` | all | AI features (voice, setup wizard, content distribution, AI intent search) |
| `R2_*` variables | media | Cloudflare R2 for media storage |

See `.env.example` for full details.

## Code Standards

- **Astro components:** Default, zero JS (except landing sections may use React for interactivity)
- **React islands:** Interactive components only (landing sections with state, admin pages, search, ToC)
- **Error handling:** Try-catch with graceful fallbacks
- **File size:** Keep under 200 LOC (modularized CSS as example)
- **Comments:** For complex logic only
- **Styling:** Modular CSS partials, CSS variables for theming
- **Landing components:** Astro by default, props-driven via YAML config
- **Shared head:** `base-head.astro` for all pages (OG/Twitter meta, aria-labels, form labels, unique section IDs)
- **Accessibility:** Aria-labels on all interactive elements, form labels required, unique heading IDs
- **SEO:** Iframe titles required, section IDs for anchor linking, JSON-LD metadata injection

## Recent Changes (2026-04-01)

### v3.4.0 — Codebase Hardening (2026-04-01)

#### Security
- PBKDF2 password hashing for multi-user + product-scoped admin login
- Separate ADMIN_API_KEY from JWT signing secret
- SSRF protection on image proxy (admin auth, IP blocklist, content-type validation, 10MB limit)
- XSS prevention: sanitize-html allowlist for landing HTML + embeds; CSS sanitizer for AI styles
- Timing-safe API key + HMAC comparison
- Rate limiting: auth 5/min, subscribe 3/min, AI endpoints 10/min per IP
- Path traversal prevention in content I/O and entity I/O
- Production auth guard on checkout; path validation in feature builder
- Error message sanitization (no internal details in API responses)

#### Performance
- 30s timeout on Gemini API calls (60s for clone pipeline)
- Removed global mutable state from clone pipeline
- Optimized landing page query (getEntry instead of getCollection)

#### Code Quality
- Extracted shared json() + apiError() helpers (replaced 60+ duplicates)
- Split landing-section-forms.tsx: 1319 → 6 LOC + 11 modules
- Split landing-live-preview.tsx: 1167 → 146 LOC + 11 modules
- Removed Supabase auth placeholder from middleware
- Removed deprecated global markdown state

### v3.3.0 — Homepage Redesign + Better Auth + Product Showcase (2026-03-31)

#### Rebrand: Tree Identity → TreeTwin
- Project rebranded to TreeTwin (treetwin.io)
- All references updated: site name, URLs, package name

#### Better Auth Integration
- Email/password signup with verification flow
- Better Auth schema tables (user, session, account, verification)
- Start Free → login → dashboard flow wired end-to-end
- Replaces Supabase Auth for user authentication

#### Homepage Redesign
- DM Serif Display font + gold accent theme
- AI search input on hero section
- Live demo iframe preview with tab switcher
- Live examples showcase — 3 real landing pages as proof
- Admin editor demo GIF
- Comparison table: TreeTwin vs Bolt vs Lovable (highlighted column, check/cross icons)
- Video section replacing GIF rich-text

#### Product Showcase Section (New)
- New `product-showcase` section type for landing pages
- Feature product data schema with merge logic
- AI search upgraded to multi-select feature cards
- Dynamic rendering of product features

#### Landing Nav Enhancements
- CTA button support in navigation bar
- Hero badge support
- Sign In link + Sign Up Free CTA button
- CSS variable defaults moved to :root for better cascade

### v2.7.0 — Landing Page v2 Upgrades (2026-03-28)

#### New Section Types (25 Total)
- Added `social-proof` — Customer testimonials with avatar grid
- Added `comparison` — Feature comparison charts (side-by-side tables)
- Added `ai-search` — AI-powered search component

#### Admin Features (Enhanced)
- **Icon picker:** Browse/select icons for nav links and footer items
- **Multi-CTA buttons:** Support multiple CTA buttons per section with individual links/styles
- **Testimonials carousel variant:** Auto-rotating carousel with pagination controls
- **Footer columns editor:** Visual builder for multi-column footer layouts
- **Pricing badges:** Support for "Popular", "Best Value", "On Sale" badges
- **Scroll-to-highlight:** Auto-highlight sections as user scrolls past them

#### Rich Text Enhancements
- **Markdown support:** Rich text sections now accept Markdown in addition to HTML
- **Automatic parsing:** Markdown → HTML conversion at build time

#### Video Embedding (Enhanced)
- **Auto-detect:** Video component auto-detects YouTube/Vimeo/custom URLs and renders appropriate embed

#### Design Tokens (Enhanced)
- **Glass-card override:** Landing page context override for glass-morphism card styling
- **btn-secondary:** Secondary button variant for CTAs
- **btn-outline:** Outline button variant
- **gradient-text:** Text gradient CSS class for hero sections

#### AI Clone (Enhanced)
- **Anti-duplication rules:** Improved AI analysis to avoid duplicate section extraction
- **Better design inference:** More accurate color/font/spacing extraction from source sites

### v2.6.0 — Landing Design System + AI Clone + Feature Builder Phase 3

#### Landing Design System (New)
- **6 design presets:** clean-light, modern-dark, gradient-bold, startup-fresh, corporate-trust, warm-sunset
- **Per-page customization:** Colors (primary, secondary, accent), fonts (headings, body), border-radius
- **CSS variables:** `--lp-*` tokens for all landing section components
- **Google Fonts integration:** Auto-load via link tags (no external CDN)
- **Design panel UI:** `/admin/landing/[slug]/design` with preset picker + custom editor
- **Live preview:** Real-time design updates without save cycle

#### Section Layout Variants (36 Total - New)
- **Hero:** 4 variants (centered, split, video-bg, minimal)
- **CTA:** 5 variants (default, split, banner, minimal, with-image)
- **Features:** 3 variants (grid, list, alternating)
- **Pricing:** 3 variants (cards, simple, highlight-center)
- **Testimonials:** 3 variants (cards, single, minimal)
- **FAQ:** 3 variants (accordion, two-column, simple)
- **Stats:** 3 variants (row, cards, large)
- **How It Works:** 3 variants (numbered, timeline, cards)
- **Team:** 3 variants (grid, list, compact)
- **Nav:** 3 variants (default, centered, transparent)
- **Footer:** 3 variants (simple, columns, minimal)
- **Tabbed section picker:** Admin UI filters sections by category (All/Structure/Content/Conversion/Media)

#### AI Landing Clone (Enhanced v3.1.0)
- **Feature:** `POST /api/admin/landing/clone` — Paste URL → 3-phase pipeline → landing config
- **Phase 1:** Direct clone using Gemini 2.5 Flash + intent context
- **Phase 2:** Separate design extraction from HTML/CSS (overrides Phase 1 design)
- **Phase 3:** Auto-retry missing sections by comparing page headings vs cloned headings
- **Quality:** Per-section assessment (good/partial/poor) + layout multi-column support
- **UX:** Modal with URL/Code/File inputs, site tier analysis, retry notice, quality badges
- **Output:** YAML landing config with sections, design, usage tokens, quality metadata

#### Feature Builder Phase 3 (Enhanced)
- **Hybrid code generation:** AI + template combination for faster scaffolding
- **Categorized output:** Code organized by data models, API routes, React components, tests
- **Generation guides:** In-app help text for each artifact type
- **AI Fill:** Auto-populate field descriptions using Gemini
- **Code review step:** Edit generated code before applying

#### Gemini 2.5-flash Update
- **Upgrade:** All AI calls from `gemini-2.0-flash` → `gemini-2.5-flash`
- **Reason:** 2.0-flash deprecated, 2.5-flash faster + better context handling
- **Files updated:** feature-builder-ai.ts, ai-setup-generator.ts, voice-analyze, landing-clone
- **Breaking:** Projects using custom Gemini API keys must update to 2.5-flash

#### Admin UX Polish
- **Dashboard redirect:** `/admin` → `/features` (removed dashboard landing page)
- **Split preview default:** Feature builder live preview panel enabled by default
- **Thin scrollbars:** CSS improvements for admin UI scrolling
- **Import consolidation:** All admin pages use same Gemini model constants

### Previous Versions (v2.5.0 and earlier)

See git log for full history. Key components:
- Feature Builder Phase 1-2: Wizard UI, AI clarification, skill spec generation
- Product-Scoped GoClaw API: 15 endpoints with product filtering + feature gating
- Public Entity Rendering: Static pages at `/e/{path}/`
- Feature Module System: 10+ toggleable features via registry
- Landing Builder v1-v2: YAML-driven sections, D&D editor, 23 section types, templates
- Custom Admin Dashboard: React-based UI with media browser, CodeMirror 6 editor, voice analysis
- Voice Management: Profile system with effectiveness scoring + AI analysis
- i18n System: Multi-language translations with sub-sections
- Accessibility & SEO: Shared head component, self-hosted fonts, JSON-LD schemas

---

**Last updated:** 2026-04-01
**Version:** v3.4.0
