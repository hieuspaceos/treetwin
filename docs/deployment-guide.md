# Deployment Guide

## Development Setup

### Prerequisites

- Node.js 18+ (check: `node --version`)
- npm 9+ (check: `npm --version`)
- Git
- Text editor (VS Code recommended)

### Quick Start (Local)

```bash
# 1. Clone the repo
git clone https://github.com/hieuspaceos/treetwin.git my-site
cd my-site

# 2. Install dependencies
npm install

# 3. Create .env.local
cp .env.example .env.local
# (Edit .env.local if using R2 — otherwise defaults work locally)

# 4. Start dev server
npm run dev

# 5. Open browser
# Frontend: http://localhost:4321
# Keystatic admin: http://localhost:4321/keystatic
```

## Admin Panel (Keystatic)

Keystatic is a git-based CMS with a web UI. Content saves as files in `src/content/`.

### In Development

```
http://localhost:4321/keystatic
```

**Capabilities:**
- Create/edit articles (Markdoc), notes (YAML), records (YAML)
- Edit global site settings (theme ID)
- All changes save to disk as files (git-tracked)

**Workflow:**
1. Edit content in Keystatic UI
2. Files auto-save to `src/content/`
3. Commit changes: `git add . && git commit -m "..."` (manual)
4. Push to GitHub (optional, for CI/CD)

### In Production (Vercel)

Keystatic admin is **disabled** on production. To edit content:

1. Clone repo locally
2. Run dev server: `npm run dev`
3. Edit at `http://localhost:4321/keystatic`
4. Commit + push to GitHub
5. Vercel auto-deploys on push

## Vercel Deployment

### Prerequisites

- GitHub account + repo
- Vercel account (free tier OK)

### Deploy Steps

**Option 1: Deploy Button (Fastest)**

Click "Deploy to Vercel" in [README.md](../README.md) or:

```
https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhieuspaceos%2Ftreetwin
```

**Option 2: Manual Setup**

1. Push repo to GitHub
2. Visit [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repo
4. Set environment variables (see below)
5. Click Deploy

### Environment Variables (Vercel Dashboard)

**Required:**
- `PUBLIC_SITE_URL` — Your deployed domain (e.g., `https://my-site.vercel.app`)

**Optional (R2 video manifests):**
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET`, `R2_REGION`, `R2_PUBLIC_URL`

**Optional (GoClaw AI agent integration):**
- `GOCLAW_API_KEY` — Bearer token for external orchestration systems
- `GOCLAW_WEBHOOK_SECRET` — HMAC-SHA256 secret for webhook signature verification

Add these under **Settings → Environment Variables** in Vercel dashboard.

### First Deploy

After environment variables are set:
1. Trigger new deployment (Vercel dashboard or `git push`)
2. Wait for build (2-3 min)
3. Visit your deployed URL

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

TreeID typically scores:
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
