# Tree Identity — Codebase Summary

**Status:** v2.4.1 — Recent Enhancements (SEO/Accessibility, Landing Builder v2 Phase 2)
**Last Updated:** 2026-03-27
**Stack:** Astro 5 + Keystatic + Pagefind + Cloudflare R2 (optional)
**Deployment:** Vercel

## Overview

Tree Identity is a personal content engine with optional landing page builder — zero database, git-tracked content, zero JS by default. Built with Astro 5 (SSG), Keystatic (git-based CMS), Pagefind (static search), and Vercel.

**Why Astro + Keystatic:**
- No database overhead (was: PostgreSQL + Supabase)
- Content tracked in git (Markdown + YAML)
- Admin UI at `/keystatic` (dev only, not production)
- Static search (Pagefind, zero runtime cost)
- Faster builds, zero JS by default
- Better for RAG/AI (Markdown > Lexical JSON)

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Astro 5 | SSG, content-first, zero JS by default |
| CMS | Keystatic | Git-based admin UI + content file storage |
| Content Format | Markdoc (articles) + YAML (notes/records) | Type-safe, semantic |
| Search | Pagefind | Static index, zero runtime cost |
| Storage | Cloudflare R2 | Optional, for video manifests + media |
| Styling | Tailwind CSS 4 | Utility-first, theme variables |
| Deploy | Vercel | Serverless, ISR-ready |

## Key Design Decisions

- **No database** — Content is git-tracked Markdown/YAML in `src/content/`
- **Git-based CMS** — Keystatic edits save as files, no DB writes
- **Static by default** — `output: 'static'`; SSR endpoints use `prerender: false`
- **Custom admin dashboard** — Full-featured React UI at `/admin`, not Keystatic
- **Theme system** — CSS variables (`--t-*`) for glass morphism UI
- **Island architecture** — Astro by default, React only for interactive components
- **Landing page system** — YAML-driven modular sections, 23 component types, D&D editor
- **Multi-tenant products** — Per-product admin, scoped API, feature toggles per product
- **Self-hosted assets** — Fonts in `public/fonts/`, no external CDN dependencies
- **Shared head component** — `base-head.astro` for OG/Twitter/accessibility metadata

## Directory Structure

```
tree-id/
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
│   │   ├── landing/                # Landing page sections (23 types)
│   │   │   ├── nav.astro           # NEW v2.4.0
│   │   │   ├── footer.astro        # NEW v2.4.0
│   │   │   ├── layout.astro        # NEW v2.4.0
│   │   │   ├── divider.astro       # NEW v2.4.0
│   │   │   ├── rich-text.astro     # NEW v2.4.0
│   │   │   ├── banner.astro        # NEW v2.4.0
│   │   │   ├── map.astro           # NEW v2.4.0
│   │   │   ├── gallery.astro       # NEW v2.4.0
│   │   │   ├── video.astro         # NEW v2.4.0
│   │   │   ├── image.astro         # NEW v2.4.0
│   │   │   ├── image-text.astro    # NEW v2.4.0
│   │   │   ├── countdown.astro     # NEW v2.4.0
│   │   │   ├── contact-form.astro  # NEW v2.4.0
│   │   │   ├── (10 v2.3 sections)
│   │   ├── admin/
│   │   │   ├── landing/
│   │   │   │   ├── landing-dnd-editor.tsx    # NEW v2.4.0: D&D reorder
│   │   │   │   ├── landing-live-preview.tsx  # NEW v2.4.0: Real-time preview
│   │   │   │   ├── device-toggle.tsx         # NEW v2.4.0: Mobile/tablet/desktop
│   │   │   │   ├── section-picker-toolbar.tsx # NEW v2.4.0: 23-section picker
│   │   │   │   ├── page-settings-panel.tsx   # NEW v2.4.0: Metadata editor
│   │   │   │   └── (v2.3.0 components)
│   │   │   ├── entities/
│   │   │   ├── templates/
│   │   │   ├── setup/
│   │   │   ├── products/            # NEW v2.4.0: Product admin components
│   │   │   └── ... (existing)
│   │   └── ...
│   ├── lib/
│   │   ├── landing/                # NEW: Landing page system
│   │   │   ├── landing-types.ts    # TypeScript types
│   │   │   ├── landing-config-reader.ts   # YAML read/write
│   │   │   ├── landing-renderer.ts # YAML → HTML
│   │   │   ├── ai-setup-generator.ts      # Gemini integration
│   │   │   └── template-apply.ts   # Template helper
│   │   ├── admin/
│   │   │   ├── entity-io.ts        # NEW: Entity CRUD operations
│   │   │   ├── feature-registry.ts # Feature modules
│   │   │   └── ... (existing)
│   │   └── ...
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
├── keystatic.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── vercel.json
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
quote: "Tree ID is amazing..."
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

## Pages & Routes

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
- `goclaw` — External AI agent integration
- `distribution` — Social media post generation
- `analytics` — GA4 tracking
- `media` — Cloudflare R2 file upload
- `voices` — Voice profile management
- `translations` — i18n translations
- **`landing`** — NEW: Landing page builder (toggleable)
- **`entities`** — NEW: Custom entity definitions (toggleable)
- **`setup-wizard`** — NEW: AI landing setup wizard (toggleable)

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

### New in v2.3.0

| Variable | Required | Description |
|----------|----------|-------------|
| (No new env vars) | — | Landing system uses file-based config + settings toggles |

**Feature flags:** Toggled via `enabledFeatures` in site settings (no env vars needed).

### All Optional Features

| Variable | Feature | Description |
|----------|---------|-------------|
| `RESEND_API_KEY` | email | Email newsletter via Resend |
| `GA_MEASUREMENT_ID` | analytics | Google Analytics 4 |
| `GOCLAW_API_KEY` | goclaw | GoClaw API adapter |
| `GEMINI_API_KEY` | all | AI features (voice, setup wizard, content distribution) |
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

## Recent Changes (2026-03-27)

### Accessibility & SEO Enhancements
- **Shared head component:** `base-head.astro` centralizes OG/Twitter meta, aria-labels, form labels, unique section IDs
- **Self-hosted Inter font:** Removed Google Fonts CDN dependency, fonts now in `public/fonts/`
- **Iframe titles:** All iframes require titles for accessibility
- **Form labels:** All form inputs require proper labels
- **Section IDs:** Unique IDs on all major sections for anchor linking

### Product Admin Improvements
- **Product settings:** Separate settings page (not combined with core site settings)
- **No product dashboard:** Redirects to product settings page instead
- **Back-to-site links:** Product admin navbar links back to product landing page
- **Auto landing page:** Products auto-create landing page on creation
- **Self-editing:** Products can edit their own landing page without enabling landing module

### Features Hub
- **Marketplace-style page:** New features discovery page at `/admin/features`
- **Search & filters:** Search by name, filter by category/status
- **Live status:** Shows enabled/disabled per feature

### Sidebar Redesign
- **Core admin simplified:** Dashboard + Features (expand/collapse) + Products + Settings
- **Feature submenu:** Expandable/collapsible Features menu in sidebar
- **Back-to-site:** Quick link to product landing page in product admin

### Entity System Fixes
- **Route ordering:** Fixed via wouter Switch route ordering
- **Field schema editor:** Inline add/remove/reorder fields, batch save
- **Delete entity type API:** New endpoint + UI for entity type deletion
- **Update definition API:** New endpoint for entity definition updates

### Landing Builder v2 Phase 2
- **Layout/grid section:** Column presets (50/50, 33/67, etc.) with quick-add buttons
- **Nested sections:** Sections within layout columns
- **Empty state:** Layout columns show "Add section" when empty
- **Dropdown quick-add:** Sections can be moved into layout columns via dropdown

### UI Polish
- **Breadcrumb fix:** Hidden on single-segment pages
- **Topbar fix:** Role badge only shown when username != role
- **Records removed:** Replaced entirely by Entities system

---

**Last updated:** 2026-03-27
