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
vercel deploy
```

Set env vars on Vercel — only `PUBLIC_SITE_URL` is required.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PUBLIC_SITE_URL` | Yes | Your deployed URL |
| `ADMIN_PASSWORD` | No | Admin login password |
| `ADMIN_SECRET` | No | JWT signing key (min 32 chars) |
| `ADMIN_USERS` | No | Multi-user JSON array |
| `GITHUB_TOKEN` | No | GitHub API for production content writes |
| `RESEND_API_KEY` | No | Email newsletter via Resend |
| `RESEND_FROM_EMAIL` | No | Verified sender email |
| `GA_MEASUREMENT_ID` | No | Google Analytics 4 |
| `R2_*` variables | No | Cloudflare R2 for media storage |
| `GEMINI_API_KEY` | No | AI features (voice analysis, preview, content distribution) |
| `POSTIZ_API_KEY` | No | Social media scheduling |
| `GOCLAW_API_KEY` | No | GoClaw API adapter for external AI agents |
| `GOCLAW_WEBHOOK_SECRET` | No | HMAC-SHA256 webhook signature verification (GoClaw) |

See `.env.example` for the full list with descriptions.

## GoClaw API Integration

External AI agents (like GoClaw) can read/write Tree Identity content via authenticated API endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/goclaw/health` | GET | Service health check + version |
| `/api/goclaw/webhook` | POST | Receive GoClaw event callbacks (HMAC verified) |

**Authentication:** Bearer token via `GOCLAW_API_KEY` env var. Returns 503 if not configured.

**All writes force `status: draft`** — human approval required before publishing.

## Tech Stack

- **Astro 5** — zero JS by default, content-first SSG
- **Keystatic** — git-based CMS (schema + GitHub storage mode)
- **React 19** — admin dashboard islands
- **CodeMirror 6** — Obsidian-like Markdown editor
- **Pagefind** — static search index, zero runtime cost
- **Tailwind CSS 4** — utility-first with glass morphism theme
- **Vitest** — unit testing
- **Vercel** — deployment target

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
