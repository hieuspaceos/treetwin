# Deployment Guide

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Git
- (Optional) Wrangler CLI for local Cloudflare Workers testing

### Quick Start (Local)

```bash
git clone https://github.com/hieuspaceos/treetwin.git my-site
cd my-site
npm install
cp .env.example .env.local

# Dev mode (Astro SSR with local SQLite fallback)
npm run dev
# Frontend: http://localhost:4321
# Admin: http://localhost:4321/admin
# Keystatic: http://localhost:4321/keystatic
```

**No database setup needed locally.** Uses SQLite fallback when `TURSO_URL` not set.

## Admin Interfaces

### Keystatic (Content Editor)

```
http://localhost:4321/keystatic
```

Git-based CMS for Markdown/YAML content.

**Features:**
- Create/edit articles, notes, records
- All changes saved as files in `src/content/`
- GitHub storage mode for production

### Admin Dashboard (React SPA)

```
http://localhost:4321/admin
```

Full-featured admin UI for:
- Landing page builder (D&D editor, 32+ section types)
- Feature builder (AI-assisted feature generation)
- Entity management (custom data schemas)
- Media management (Cloudflare R2)
- Analytics dashboard
- Email campaigns
- Social distribution

**Local auth:** Default password in `.env.local` (see `.env.example`)
**Production auth:** Better Auth + Google OAuth (set `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`)

## Cloudflare Pages Deployment

### Prerequisites

- GitHub account + repo
- Cloudflare account (free tier OK)
- Turso database (free tier available at turso.tech)

### Deploy Steps

1. Push repo to GitHub

2. Link Cloudflare Pages to GitHub:
   - Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Pages → Create project → Connect to Git
   - Select your repository
   - Build settings: auto-detected (Astro + wrangler)

3. Set environment variables in Cloudflare dashboard:

**Required (prod):**
- `PUBLIC_SITE_URL` — Your deployed domain
- `TURSO_URL` — Turso database URL (from turso.tech)
- `TURSO_AUTH_TOKEN` — Turso auth token

**Optional (SaaS):**
- `TURSO_PLATFORM_TOKEN` — For tenant provisioning
- `TURSO_ORG` — Organization name
- `TURSO_GROUP` — Group name
- `GOOGLE_CLIENT_ID` — OAuth provider
- `GOOGLE_CLIENT_SECRET` — OAuth secret
- `BETTER_AUTH_SECRET` — Auth session key (32+ chars)

**Optional (integrations):**
- `GEMINI_API_KEY` — AI features
- `RESEND_API_KEY` — Email service
- `R2_*` variables — Media storage
- `GA_MEASUREMENT_ID` — Analytics
- `POSTIZ_API_KEY` — Social scheduling

4. Trigger deployment:
   - Git push to main branch
   - Or manually trigger in Cloudflare dashboard

### First Deploy

1. Verify `wrangler.toml` exists and build settings are correct
2. Push to GitHub (or manual trigger in Cloudflare dashboard)
3. Wait for build (~2-3 min)
4. Visit your deployed URL
5. Admin dashboard available at `/admin` (if `BETTER_AUTH_SECRET` set)

## Build Verification

### Local Build

```bash
npm run build
# Creates dist/ with static HTML
# Output: "✓ Finished in XXms"
```

### Build Checklist

- [ ] No syntax errors (`npm run lint`)
- [ ] All markdown parses correctly
- [ ] Images/assets load (check `dist/`)
- [ ] Search index generated (check `dist/pagefind/`)
- [ ] Sitemap present (`dist/sitemap.xml`)

## Database Setup (Turso)

### Create Turso Database

1. Sign up at [turso.tech](https://turso.tech)
2. Create a new database in the dashboard
3. Copy the database URL and authentication token
4. Add to your deployment env vars:

```env
TURSO_URL=libsql://your-db-xxxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGc...
```

**Local development:** SQLite fallback auto-activates when `TURSO_URL` not set. No setup needed.

### Tenant Provisioning (SaaS)

For multi-tenant deployments:

1. Enable on Turso Platform API
2. Generate API token at turso.tech/settings
3. Add env vars:

```env
TURSO_PLATFORM_TOKEN=your-api-token
TURSO_ORG=your-org-name
TURSO_GROUP=group-name
```

The provisioner auto-creates per-tenant databases on signup.

## Cloudflare R2 Setup (Optional)

Only needed if enabling `videoFactory` feature.

### 1. Create R2 Bucket

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. R2 → Create bucket
3. Name: `treetwin-media` (or your choice)
4. Region: `wnam` or nearest
5. Create

### 2. Create API Token

1. R2 → Settings → API Tokens
2. Create API Token
3. Name: `treetwin-api`
4. Permissions: Admin (all buckets)
5. Copy credentials

### 3. Set Environment Variables

In `.env.local` (local) or Vercel dashboard (production):

```env
R2_ACCESS_KEY_ID=xxxx
R2_SECRET_ACCESS_KEY=xxxx
R2_ENDPOINT=12345.r2.cloudflarestorage.com
R2_BUCKET=treetwin-media
R2_REGION=auto
R2_PUBLIC_URL=https://media.example.com  # Or R2 public URL
```

### 4. Enable in site-config.ts

```typescript
features: {
  videoFactory: true,  // Enable
  search: true,
}
```

## Troubleshooting

### Build Fails: "Cannot find module X"

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Keystatic Admin Not Loading

- Verify Keystatic config: `keystatic.config.ts` exists
- Astro integration added: check `astro.config.mjs` includes `keystatic()`
- Restart dev server: `npm run dev`

### Search Not Working

- Pagefind index not generated: rebuild with `npm run build`
- Search page not loading: check `src/pages/search.astro` exists
- Check browser console for errors

### R2 Upload Fails

- Verify credentials: Test with Cloudflare dashboard first
- Check bucket name: Must match `R2_BUCKET` env var
- Check CORS: R2 bucket should allow your domain

### Vercel Deployment Fails

1. Check **Vercel Logs** (Deployments tab)
2. Common issues:
   - `PUBLIC_SITE_URL` not set
   - Node.js version mismatch (use 18+)
   - Build timeout (increase to 600s in Settings)

## Performance Optimization

### Lighthouse Scores

TreeTwin typically scores:
- Performance: 95+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

### Cache Headers

- HTML pages: Cache-Control revalidate in 1 hour (Astro ISR)
- Images: Cached long-term if on CDN
- Search index: Cached per deploy
- API routes: Vary by content

### Image Optimization

- Use WebP format where possible
- Resize large images before uploading
- R2 URL can serve optimized images via Cloudflare Workers (advanced)

## Maintenance

### Backup Content

Content is git-tracked, so backups are automatic:

```bash
# Every commit is a backup
git log --oneline
```

To recover an old version:
```bash
git revert <commit-hash>
# or
git checkout <commit-hash> -- src/content/
```

### Monitor Site Health

1. **Vercel Analytics** — Check speed, real user metrics
2. **Pagefind Index** — Rebuild occasionally if search feels slow
3. **Search Console** — Monitor indexing via Google

## FAQ

**Q: Can I use a custom domain?**
A: Yes. Add domain to Vercel project settings, then update DNS. See [Vercel docs](https://vercel.com/docs/projects/domains).

**Q: Where is my data stored?**
A: In git (`src/content/` files). Vercel doesn't store it.

**Q: Can I self-host instead of Vercel?**
A: Yes. `npm run build` produces static HTML in `dist/`. Deploy to any static host (GitHub Pages, Netlify, etc.).

**Q: How do I password-protect the site?**
A: Not built-in. Use Vercel Password Protection (project settings) as a workaround, or self-host with auth middleware.

**Q: Can I integrate my own database?**
A: Yes, but changes needed. Astro's `getCollection()` assumes file-based content. For DB integration, see Astro loaders.

---

For more help, see [README.md](../README.md), [Astro Docs](https://docs.astro.build), or [Keystatic Docs](https://keystatic.com/docs).
