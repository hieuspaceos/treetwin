# TreeTwin — Project Overview & PDR

**Version:** v3.4.0 — Database-First Architecture
**Status:** In Production
**Last Updated:** 2026-04-01
**Deployment:** Cloudflare Pages + Workers

## Executive Summary

TreeTwin is a **content + SaaS hybrid platform** enabling creators to build digital identities with blogs, landing pages, and micro-products. Combines **zero-database static content** (articles via git) with **serverless SaaS infrastructure** (Turso DB, Better Auth, per-tenant provisioning).

**Core Value:**
- Blog/portfolio (static-first, zero JS)
- Product marketplace with AI search
- Admin dashboard (landing builder, feature builder, analytics)
- Multi-tenant SaaS ready (per-tenant database provisioning)

**Target Users:** Individual creators, small agencies, digital product builders

## Business Requirements

### Functional Requirements

#### Content Management
- [x] Create/edit articles in Markdown (Markdoc)
- [x] Git-tracked content (all articles in version control)
- [x] Keystatic web UI for non-technical users
- [x] Tags, categories, metadata per article
- [x] Draft/published status control
- [x] SEO metadata (title, description, OG images)

#### Landing Pages
- [x] Visual builder with D&D reordering
- [x] 32 pre-built section types (hero, features, pricing, etc.)
- [x] 50+ layout variants per section
- [x] Design system (colors, fonts, spacing)
- [x] 6 template presets (SaaS, agency, course, ecommerce, portfolio, landing)
- [x] AI landing cloner (paste URL → auto-extract sections/design)
- [x] Preview on mobile/tablet/desktop
- [x] Publish custom domains

#### Products & Marketplace
- [x] Product catalog with pricing tiers
- [x] Product detail pages
- [x] AI intent search (Gemini-powered)
- [x] License key generation on purchase
- [x] User dashboard (purchases, license keys)
- [x] Checkout flow with payment skeleton

#### Authentication & Users
- [x] Email/password login + registration
- [x] Google OAuth integration
- [x] Admin dashboard (password-protected local, OAuth prod)
- [x] Multi-user support (admin/editor roles)
- [x] Session management + JWT tokens
- [x] Per-tenant database provisioning (optional)

#### Admin Dashboard
- [x] Content editor (Keystatic + CodeMirror 6)
- [x] Landing page builder (D&D, preview, publish)
- [x] Feature builder (AI-assisted code generation)
- [x] Entity management (custom data schemas)
- [x] Media manager (Cloudflare R2)
- [x] Analytics dashboard (GA4)
- [x] Email campaigns (Resend)
- [x] Social distribution (Gemini + Postiz scheduling)
- [x] Feature toggles (enable/disable per instance)

#### SEO & Distribution
- [x] Automatic JSON-LD (Article, BreadcrumbList, Person)
- [x] RSS feeds
- [x] Sitemap.xml auto-generation
- [x] Static search (Pagefind)
- [x] AI-powered social post generation (Gemini)
- [x] Multi-platform distribution (Twitter, LinkedIn, Dev.to, etc.)

### Non-Functional Requirements

#### Performance
- [ ] Content pages: <100ms response time
- [ ] Admin dashboard: <500ms initial load
- [ ] API endpoints: <200ms response time
- [ ] Static asset caching: 1 year (content hash)
- [ ] Database queries: <50ms p99 latency

#### Scalability
- [ ] Support 1000+ concurrent users
- [ ] Support 100+ landing pages per user
- [ ] Support 1000s of articles
- [ ] Per-tenant database isolation
- [ ] Global CDN delivery (Cloudflare)

#### Reliability
- [ ] 99.9% uptime SLA
- [ ] Automatic error recovery
- [ ] Database backups
- [ ] Graceful degradation (SQLite fallback)

#### Security
- [x] HTTPS/TLS encryption
- [x] Input validation (Zod schemas)
- [x] SQL injection prevention (Drizzle ORM)
- [x] CSRF protection
- [x] Rate limiting on API endpoints
- [x] Environment variable secrets
- [x] No sensitive data in logs

#### Observability
- [x] Error tracking (console logs + Cloudflare dashboard)
- [x] Performance metrics (Web Vitals)
- [x] Analytics integration (GA4)
- [x] Cloudflare Web Analytics beacon

## Technical Architecture

### Stack
- **Framework:** Astro 5 (hybrid SSR + static)
- **Database:** Turso (serverless SQLite) + Drizzle ORM
- **Auth:** Better Auth + Google OAuth
- **Deployment:** Cloudflare Pages + Workers
- **Storage:** Cloudflare R2 (optional media)
- **Frontend:** React islands + Tailwind CSS 4
- **CMS:** Keystatic (git-based)
- **Testing:** Vitest

### Key Design Patterns

**IO Factory Pattern:**
All data access routes through factories that abstract storage backend.

```typescript
export function getContentIO(db?: any): ContentIO {
  // Auto-select: Turso (prod) or LocalIO (SQLite fallback)
  if (TURSO_URL) return new TursoContentIO(db)
  return new LocalContentIO()
}
```

**Hybrid Static + SSR:**
- Content pages pre-rendered at build (cache-friendly)
- App pages rendered on-demand (dynamic + interactive)

**Per-Tenant Provisioning:**
Turso Platform API auto-creates isolated databases per tenant (optional).

## Project Roadmap

### Phase 1: Foundation (v1.0 - v2.0) ✅
- [x] Astro + Keystatic integration
- [x] Git-tracked content
- [x] Admin dashboard
- [x] Pagefind search
- [x] Theme system

### Phase 2: Landing Pages (v2.3 - v2.7) ✅
- [x] Visual builder with D&D
- [x] 32 section types + 50+ variants
- [x] Landing page cloner (AI)
- [x] Design system + presets
- [x] Multi-device preview

### Phase 3: Marketplace (v2.4 - v3.0) ✅
- [x] Product catalog
- [x] Checkout flow
- [x] User dashboard + license keys
- [x] AI intent search
- [x] Payment skeleton

### Phase 4: SaaS Foundation (v3.1 - v3.2) ✅
- [x] Better Auth + Google OAuth
- [x] Email capture (Resend)
- [x] Social distribution (Gemini)
- [x] Feature builder (AI-assisted)
- [x] Entity system (custom schemas)

### Phase 5: Database-First (v3.3 - v3.4) ✅
- [x] Turso integration
- [x] IO Factory Pattern
- [x] Per-tenant provisioning
- [x] Drizzle ORM setup
- [x] Cloudflare Pages migration
- [x] SQLite fallback (local dev)

### Phase 6: Enterprise (v4.0 - planned)
- [ ] Advanced analytics (funnels, cohorts, A/B testing)
- [ ] Webhook system for tenant events
- [ ] Batch content imports (CSV → articles)
- [ ] Custom domain provisioning per tenant
- [ ] Advanced payment integration (Stripe)
- [ ] Team collaboration (multiple admins per tenant)

## Success Metrics

### User Adoption
- **Retention:** >80% after 30 days
- **DAU/MAU Ratio:** >40%
- **Content Published:** Avg 5+ articles per user within 90 days

### Product Performance
- **Page Load Time:** <2s for articles, <1s for landing pages
- **Search Latency:** <500ms for Pagefind queries
- **API Error Rate:** <0.1%
- **Uptime:** 99.9%+

### Business Metrics
- **Sign-ups:** Track via analytics
- **Free → Paid Conversion:** Target 5%+
- **Product Revenue:** Track per-tenant sales
- **NPS Score:** Target 50+

## Technical Debt & Known Issues

### Addressed in v3.4.0
- [x] Vercel → Cloudflare migration (serverless cost optimization)
- [x] Supabase → Turso (better cold start performance)
- [x] Storage abstraction (IO Factory enables easy swaps)
- [x] Local dev fallback (no DB setup for contributors)

### Remaining (low priority)
- [ ] Advanced caching strategy (Redis for frequently accessed data)
- [ ] Webhook system for tenant events
- [ ] Batch content processing (slow for large datasets)
- [ ] Real-time collaboration (landing builder)

## Deployment & Ops

### Environments

**Development**
- Local Astro dev server (`npm run dev`)
- SQLite fallback (no TURSO_URL)
- Keystatic at `http://localhost:4321/keystatic`
- Admin at `http://localhost:4321/admin`

**Staging** (optional)
- Cloudflare Pages preview deployment
- Staging Turso database
- Staging OAuth credentials

**Production**
- Cloudflare Pages + Workers
- Production Turso database
- Production OAuth + Resend + Gemini credentials

### Deployment Checklist
- [ ] All tests passing (`npm test`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Environment variables configured (Cloudflare dashboard)
- [ ] Database schema migrated (Drizzle)
- [ ] Git commit with semantic message
- [ ] Manual QA of core flows (login, create article, checkout)

## Team Responsibilities

### Core Team
- **Product Lead:** Feature prioritization, PRD updates, roadmap
- **Backend/Full-Stack:** API routes, database, admin logic
- **Frontend:** Admin dashboard, landing builder, components
- **DevOps:** Deployment, monitoring, database provisioning

### Part-Time Contributors
- **Content Marketing:** Articles, landing pages, distribution
- **QA:** Test coverage, bug reports, edge cases

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Database cold starts | Medium | High | Cloudflare Workers native support, connection pooling |
| Turso availability | Low | High | SQLite fallback for graceful degradation |
| AI cost overruns (Gemini) | Medium | Medium | Rate limiting, quota enforcement, fallback UX |
| Tenant isolation breach | Low | Critical | Drizzle ORM prevents injection, row-level security |
| Migration data loss | Low | Critical | Backup strategy, rollback plan, staged migration |

## Version History

| Version | Date | Highlights |
|---------|------|-----------|
| v1.0 | 2025-01-01 | Astro + Keystatic foundation |
| v2.0 | 2025-06-01 | Landing builder, visual editor |
| v2.7 | 2026-02-01 | Social distribution, feature builder |
| v3.0 | 2026-02-15 | Better Auth, multi-tenant, marketplace |
| v3.4 | 2026-04-01 | Database-first, Turso, Cloudflare Pages, IO factories |

---

**Next Steps:**
1. Review roadmap for Phase 6 priorities
2. Implement advanced analytics (funnels, cohorts)
3. Add webhook system for tenant events
4. Optimize cold start performance (measure + baseline)
