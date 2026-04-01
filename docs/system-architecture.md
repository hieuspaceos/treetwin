# System Architecture

**Version:** v3.4.0 — Database-First Migration
**Last Updated:** 2026-04-01
**Deployment:** Cloudflare Pages + Turso DB
**Framework:** Astro 5 (Hybrid SSR) + Keystatic + Better Auth

## Overview

TreeTwin is a **content + marketplace hybrid** combining:

- **Static Layer:** Git-tracked articles/notes (zero database)
- **Dynamic Layer:** User auth, SaaS features, per-tenant provisioning
- **Database Layer:** Turso (serverless SQLite) for user state, orders, licenses
- **Deployment:** Cloudflare Workers/Pages (serverless)

**Key Innovation:** IO Factory Pattern abstracts storage backend — code works with Turso, Local SQLite, or GitHub without changes.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cloudflare Pages                          │
│  (Astro 5 SSR + Workers for API routes)                          │
└──────────┬────────────────────────────────────────────┬──────────┘
           │                                            │
    ┌──────▼──────┐                          ┌─────────▼───────┐
    │  Static     │                          │ Serverless API  │
    │  Content    │                          │ Routes (/api/*)│
    │             │                          │                 │
    │ • Articles  │                          │ • Auth          │
    │ • Landing   │                          │ • Products      │
    │ • Pages     │                          │ • Checkout      │
    └─────────────┘                          └────────┬────────┘
                                                      │
    ┌─────────────────────────────────────────────────▼──────────┐
    │               IO Factory Layer (Backend Agnostic)           │
    │                                                             │
    │  getContentIO() → ContentIO                                │
    │  getEntityIO()  → EntityIO                                 │
    │  getProductIO() → ProductIO                                │
    │  getSubscriberIO() → SubscriberIO                          │
    │                                                             │
    │  Selection logic:                                           │
    │  - PROD + TURSO_URL → TursoIO                              │
    │  - DEV → TursoIO (if TURSO_URL) or LocalIO (SQLite)        │
    │  - GitHub storage mode → GitHubIO                          │
    └──────────┬──────────────────────┬────────────┬─────────────┘
               │                      │            │
        ┌──────▼──────┐        ┌──────▼──────┐  ┌─▼─────────┐
        │  Turso DB   │        │  SQLite     │  │  GitHub   │
        │ (Production)│        │  (Dev Local)│  │  Storage  │
        │             │        │             │  │  (Prod    │
        │ • Content   │        │ • Fallback  │  │   Free)   │
        │ • Users     │        │ • Testing   │  │           │
        │ • Products  │        │ • Offline   │  │           │
        │ • Orders    │        │             │  │           │
        │ • Licenses  │        │             │  │           │
        └─────────────┘        └─────────────┘  └───────────┘
```

## Data Layer (Turso + IO Factories)

### Turso Database Schema

**Shared (all tenants):**

| Table | Purpose | Owner |
|-------|---------|-------|
| `tenants` | Organization metadata | Tenant provisioning |
| `better_auth_accounts`, `better_auth_sessions` | User auth (Better Auth) | Auth system |

**Per-Tenant (provisioned dynamically):**

| Table | Purpose |
|-------|---------|
| `content_entries` | Articles, notes, records, metadata |
| `entity_definitions` | Custom entity schemas |
| `entity_instances` | Entity data |
| `site_settings` | Global config (theme, features) |
| `landing_pages` | Landing page definitions |
| `landing_page_templates` | Preset templates |
| `products` | Product catalog |
| `product_configs` | Per-product settings |
| `subscribers` | Email list |
| `distribution_logs` | Social post history |

**ORM:** Drizzle + `@libsql/client` (native SQLite driver)

### IO Factory Pattern

All data access routes through factories that **automatically select backend:**

```typescript
// src/lib/admin/content-io.ts (barrel)
export function getContentIO(db?: any): ContentIO {
  if (import.meta.env.PROD && import.meta.env.TURSO_URL) {
    return new TursoContentIO(db)
  } else if (import.meta.env.TURSO_URL) {
    return new TursoContentIO(db)
  } else {
    return new LocalContentIO()  // SQLite fallback
  }
}
```

**Backend Implementations:**

| Class | Location | Used When | Storage |
|-------|----------|-----------|---------|
| `TursoContentIO` | `content-io-turso.ts` | `TURSO_URL` set | Turso DB (serverless) |
| `LocalContentIO` | `content-io-local.ts` | `TURSO_URL` missing | SQLite via better-sqlite3 |
| `GitHubContentIO` | `content-io-github.ts` | GitHub storage mode | GitHub REST API |

**All implement same interface** (`ContentIO`, `EntityIO`, etc.) — code never cares which backend is used.

### Type Safety

```typescript
// Interface (storage-agnostic)
interface ContentIO {
  createEntry(type: string, data: any): Promise<Entry>
  updateEntry(id: string, data: any): Promise<Entry>
  deleteEntry(id: string): Promise<void>
  listEntries(type?: string): Promise<Entry[]>
}

// Usage (works with any backend)
const io = getContentIO()
const entries = await io.listEntries('articles')  // Works identically on Turso/Local/GitHub
```

## Application Layer

### API Routes

**Static Content** (`src/pages`):
- `/` — Home page
- `/articles` — Article listing
- `/articles/[slug]` — Article detail
- `/[landing-slug]` — Landing page renderer
- `/about`, `/404` — Static pages
- `/search` — Pagefind search

**Dynamic Routes** (SSR + prerendered hybrid):
- `/admin` — React SPA for admin dashboard
- `/checkout/[slug]` — Product checkout
- `/dashboard` — User dashboard (auth protected)

**API Routes** (`src/pages/api`):

| Namespace | Endpoints | Purpose |
|-----------|-----------|---------|
| `/api/admin/*` | Content CRUD, entities, landing builder | Admin operations |
| `/api/auth/*` | Login, logout, session | Better Auth hooks |
| `/api/products/*` | Product catalog, search | Public marketplace |
| `/api/checkout/*` | Payment creation/confirmation | Checkout flow |
| `/api/saas/*` | Tenant provisioning, user profile | SaaS operations |
| `/api/goclaw/*` | External AI agent integration | Third-party API |

### Admin Dashboard (React SPA)

Located at `/admin`, full-featured React application:

**Core Features:**
- Content editor (Keystatic + CodeMirror 6)
- Landing page builder (D&D, 32+ sections)
- Feature builder (AI-assisted generation)
- Entity management (custom data schemas)
- Product management (catalog + pricing)
- Media manager (Cloudflare R2)
- Analytics dashboard (GA4)
- Email campaigns (Resend)
- Social distribution (Gemini + Postiz)

**Architecture:**
- SPA app shell at `src/pages/admin/index.astro`
- Components in `src/components/admin/`
- Modularized: codemirror, landing, entities, products, etc.
- Auth middleware guards protected routes

### Component Library

**Landing Page Sections** (32 types, 50+ variants):
- Hero, Features, Pricing, Testimonials, CTA
- FAQ, Stats, Gallery, Video, Contact Form
- Comparison, Social Proof, Newsletter, and more

All render as **Astro components** (zero JS by default).

**Admin Components** (80+):
- React islands for interactivity
- CodeMirror 6 editor with plugins
- D&D landing builder
- Entity form fields (text, select, image, etc.)
- Media uploader (R2 integration)

## Auth & Multi-Tenancy

### Better Auth Integration

```typescript
// Hybrid: local password + Google OAuth
const auth = new BetterAuth({
  database,
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: { clientId, clientSecret }
  },
  session: { expiresIn: 60 * 60 * 24 * 7 }  // 1 week
})
```

**Session Flow:**
1. User logs in at `/api/auth/login`
2. Better Auth creates session in DB
3. Session cookie stored in browser
4. Protected routes check session + roles

### Per-Tenant Database Provisioning

```typescript
// src/lib/saas/tenant-provisioner.ts
async function createTenant(userId: string) {
  // 1. Call Turso Platform API
  // 2. Create new database for tenant
  // 3. Run schema migrations
  // 4. Store DB URL in tenants table
  // 5. Return connection string
}
```

**Auto-provisioning on signup** if `TURSO_PLATFORM_TOKEN` configured.

**Fallback behavior:** All tenants share single DB if platform token unavailable.

## Deployment

### Cloudflare Pages

```
wrangler deploy
```

**Build Configuration:**
- Framework: Astro
- Build command: `npm run build`
- Output directory: `dist/`
- Node.js compatibility: v18+

**Configuration** (`wrangler.toml`):

```toml
name = "treetwin"
compatibility_date = "2026-03-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "dist"
```

**Why Cloudflare:**
- Serverless Workers for API routes
- Free custom domain + DDoS protection
- Native R2 integration
- Global CDN for static assets
- Environment variable management

### Environment Configuration

**Development** (`.env.local`):
```env
PUBLIC_SITE_URL=http://localhost:4321
# No TURSO_URL = SQLite fallback auto-activates
```

**Production** (Cloudflare dashboard):
```env
PUBLIC_SITE_URL=https://treetwin.example.com
TURSO_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=eyJhbGc...
BETTER_AUTH_SECRET=...32+ chars...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Performance & Scalability

### Static Rendering (Content)

Articles, landing pages, public content **pre-rendered at build time**.

```typescript
// src/pages/articles/[slug].astro
export const prerender = true  // Static generation

export async function getStaticPaths() {
  const articles = await getPublishedArticles()
  return articles.map(a => ({ params: { slug: a.slug } }))
}
```

**Benefits:**
- Zero runtime cost for content delivery
- Cache hit on CDN
- Sub-100ms response times

### Dynamic Routes (Apps)

Checkout, dashboard, admin — rendered on-demand (SSR).

```typescript
// src/pages/checkout/[slug].astro
export const prerender = false  // On-demand SSR

export default async function CheckoutPage() {
  // Rendered at request time
  // Database queries run fresh
}
```

### Database Connection Pooling

```typescript
// src/db/client.ts — Singleton pattern for serverless
const db = (() => {
  let instance: Database | null = null
  return () => {
    if (!instance) {
      instance = new Database(TURSO_URL, { authToken: TURSO_AUTH_TOKEN })
    }
    return instance
  }
})()
```

**Why singleton:**
- Serverless containers reuse connections
- Avoids connection spam
- Better resource utilization

### Tenant Connection Cache

```typescript
// src/db/tenant-client.ts — LRU cache for per-tenant DBs
const cache = new LRU<string, Database>({ max: 100 })

export async function getTenantDatabase(tenantId: string): Promise<Database> {
  if (cache.has(tenantId)) return cache.get(tenantId)!

  const db = await createTenantConnection(tenantId)
  cache.set(tenantId, db)
  return db
}
```

**Limits:**
- Max 100 concurrent tenant DBs
- Auto-evicts least-used
- Fallback to shared DB if quota exceeded

## Security

### Input Validation

All API inputs validated with Zod:

```typescript
// src/lib/admin/validation.ts
export const createArticleSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(100),
  status: z.enum(['draft', 'published']),
  tags: z.array(z.string()).max(10)
})
```

### API Rate Limiting

```typescript
// src/lib/rate-limiter.ts
import Ratelimit from '@upstash/ratelimit'

const rateLimit = new Ratelimit({ redis: process.env.UPSTASH_REDIS_URL })

// Check before processing request
const { limit, success } = await rateLimit.limit(`user-${userId}`)
if (!success) return new Response('Too many requests', { status: 429 })
```

### CORS & CSRF

- CORS enabled only for same-origin requests
- CSRF tokens on forms
- SameSite=Strict cookie policy

### Data Protection

- Passwords hashed via Better Auth (bcrypt)
- SSL/TLS enforced on Cloudflare
- Secrets never logged
- Environment variables loaded from Cloudflare dashboard (never in code)

## Testing Strategy

### Unit Tests (Vitest)

```bash
npm test  # Run Vitest
```

Coverage areas:
- IO factory behavior (Turso/Local/GitHub)
- Content validation (Zod schemas)
- Auth flows (login, OAuth callback)
- Product queries (search, filtering)

### Integration Tests

Test full request/response flows:

```typescript
// POST /api/admin/articles
test('create article', async () => {
  const res = await fetch('/api/admin/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Test', content: '...', status: 'draft' })
  })
  expect(res.status).toBe(201)
})
```

### E2E Testing (Recommended)

Use Playwright for full user flows:
- Admin login → create article → publish
- Landing page builder → save → view
- Checkout flow → payment → dashboard access

## Monitoring & Debugging

### Logs

```typescript
// Astro routes + API log to stdout (visible in Cloudflare dashboard)
console.log('[API] Creating article:', { slug, title })

// Errors auto-reported
try {
  await db.insert(articles).values(data)
} catch (err) {
  console.error('[DB] Insert failed:', err)
  throw err
}
```

### Cloudflare Analytics

- Web Analytics: Page views, traffic sources, device types
- Worker Analytics: Request counts, error rates, latency

Configured in `astro.config.mjs`:

```javascript
adapter: cloudflare({ analytics: true })
```

## Roadmap & Planned Improvements

- [ ] Webhook system for tenant events
- [ ] Advanced caching strategy (Redis)
- [ ] Batch content imports (CSV → articles)
- [ ] Custom domain provisioning per tenant
- [ ] Advanced analytics (funnel, cohort)
- [ ] A/B testing framework for landing pages

---

**References:**
- [Turso Docs](https://turso.tech/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [Astro Hybrid Rendering](https://docs.astro.build/en/basics/rendering-modes/)
- [Cloudflare Workers](https://workers.cloudflare.com)
- [Better Auth](https://www.better-auth.com)
