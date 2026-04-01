# TreeTwin

Your digital twin — a personal content engine. Fork, configure, deploy.

## Quick Start

```bash
git clone https://github.com/hieuspaceos/treetwin.git my-site
cd my-site
npm install
cp .env.example .env.local
npm run dev     # http://localhost:4321
```

Admin panel: http://localhost:4321/admin

## Features

- **Custom admin dashboard** — React SPA with glass morphism theme, CodeMirror 6 editor, modularized CSS
- **Voice profiles** — AI-powered voice management with effectiveness scoring & preview generator (Gemini)
- **i18n system** — Translations editor (EN/VI) with dynamic key creation, drives chip-select defaults
- **Content types** — Articles (Markdoc), Notes (YAML), Records (YAML), Voices (YAML)
- **Media management** — Cloudflare R2 integration with drag-drop upload
- **SEO score panel** — RankMath-style real-time analysis
- **Email capture** — Resend API with git-tracked YAML subscribers
- **Multi-user auth** — JSON-based roles (admin/editor) via env var
- **GA4 analytics** — Conditional on env var, admin analytics page
- **Content distribution** — Gemini Flash social post generation for 10 platforms
- **AI/LLM optimized** — JSON-LD, llms.txt, RSS, per-agent robots.txt
- **Static search** — Pagefind with zero runtime cost
- **GoClaw API adapter** — External AI agents integrate via `/api/goclaw/*` endpoints

All features are **opt-in via env vars**. No env var = feature hidden.

## Customize (edit ONE file)

Open `src/config/site-config.ts` and set:
- `name` — your site name
- `description` — one-line tagline
- `author` — your name, email, URL
- `socialLinks` — Twitter, GitHub, LinkedIn URLs

## Add Content

1. Visit http://localhost:4321/admin
2. Create articles (Markdown), notes (short text), or records (structured data)
3. Content saves as files in `src/content/` — committed to git

Or create files directly:
- Articles: `src/content/articles/my-post/index.mdoc`
- Notes: `src/content/notes/my-note.yaml`
- Records: `src/content/records/my-record.yaml`

## Deploy

```bash
npm run build      # Test build locally
wrangler deploy    # Deploy to Cloudflare Pages
```

Set env vars on Cloudflare — only `PUBLIC_SITE_URL` is required.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PUBLIC_SITE_URL` | Yes | Your deployed URL |
| `TURSO_URL` | Yes (prod) | Turso database connection URL |
| `TURSO_AUTH_TOKEN` | Yes (prod) | Turso authentication token |
| `TURSO_PLATFORM_TOKEN` | No | Turso Platform API for tenant provisioning |
| `TURSO_ORG` | No | Turso organization (for tenant provisioning) |
| `TURSO_GROUP` | No | Turso group (for tenant provisioning) |
| `BETTER_AUTH_SECRET` | No | Auth session signing key (min 32 chars) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth for SaaS auth |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth secret |
| `ADMIN_PASSWORD` | No | Admin login password |
| `ADMIN_USERS` | No | Multi-user JSON array |
| `GITHUB_TOKEN` | No | GitHub API for content writes |
| `RESEND_API_KEY` | No | Email via Resend |
| `RESEND_FROM_EMAIL` | No | Verified sender email |
| `GA_MEASUREMENT_ID` | No | Google Analytics 4 |
| `CF_ANALYTICS_TOKEN` | No | Cloudflare Web Analytics |
| `R2_*` variables | No | Cloudflare R2 for media |
| `GEMINI_API_KEY` | No | AI features |
| `POSTIZ_API_KEY` | No | Social scheduling |
| `GOCLAW_API_KEY` | No | GoClaw API adapter |
| `GOCLAW_WEBHOOK_SECRET` | No | GoClaw webhook signature |

See `.env.example` for full details.

## GoClaw API Integration

External AI agents (like GoClaw) can read/write Tree Identity content via authenticated API endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/goclaw/health` | GET | Service health check + version |
| `/api/goclaw/webhook` | POST | Receive GoClaw event callbacks (HMAC verified) |

**Authentication:** Bearer token via `GOCLAW_API_KEY` env var. Returns 503 if not configured.

**All writes force `status: draft`** — human approval required before publishing.

## Tech Stack

- **Astro 5** — hybrid SSR (static content + dynamic apps)
- **Keystatic** — git-based CMS with GitHub storage
- **Turso** — SQLite-based database (serverless)
- **Better Auth** — Authentication with Google OAuth
- **Drizzle ORM** — Type-safe database queries
- **React 19** — Admin dashboard + landing builder
- **CodeMirror 6** — Advanced Markdown editor
- **Pagefind** — Static search, zero runtime
- **Tailwind CSS 4** — Utility-first styling
- **Cloudflare Pages** — Deployment + Workers
- **Vitest** — Unit testing

## Extend

| Want to... | Do this... |
|------------|------------|
| Add a theme | Create `src/themes/my-theme.ts`, register in `theme-resolver.ts` |
| Add a page | Create `src/pages/about.astro` |
| Add a collection | Add to `keystatic.config.ts` + `src/content.config.ts` |
| Add an API route | Create `src/pages/api/my-endpoint.ts` |
| Import from WordPress | `npx wordpress-export-to-markdown` then copy to `src/content/` |

## License

MIT
