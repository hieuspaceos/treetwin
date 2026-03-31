# Site Configuration Reference

Tree Identity configuration is split between two places:

1. **`src/config/site-config.ts`** — Site identity (name, author, theme)
2. **`keystatic.config.ts`** — Content collection schemas
3. **`.env.local`** — Secrets (API keys, URLs)

## Site Config (`src/config/site-config.ts`)

Central configuration file that controls site branding and features.

```typescript
export const siteConfig = {
  // Your site/brand name (nav, footer, OG images)
  name: string

  // One-line description (hero, meta tags, JSON-LD)
  description: string

  // Deployed URL (set via PUBLIC_SITE_URL env var)
  url: string

  // Author info (JSON-LD, meta tags)
  author: {
    name: string       // e.g. 'Jane Doe'
    email: string      // e.g. 'jane@example.com'
    url: string        // e.g. 'https://janedoe.com'
  }

  // Social links (nav bar — empty string to hide)
  socialLinks: {
    twitter: string    // Full URL: https://twitter.com/...
    github: string     // Full URL: https://github.com/...
    linkedin: string   // Full URL: https://linkedin.com/in/...
  }

  // Active theme (must match theme-resolver.ts registry)
  theme: {
    id: 'liquid-glass'  // Built-in: 'liquid-glass'
  }

  // Feature toggles
  features: {
    videoFactory: boolean  // Requires R2_* env vars
    search: boolean        // Pagefind search at /search
  }

  // Cloudflare R2 (optional, for video manifests)
  r2: {
    publicUrl: string  // CDN URL for media
  }
}
```

## Environment Variables

All optional except `PUBLIC_SITE_URL`.

### Core (Required)

| Variable | Example | Description |
|----------|---------|-------------|
| `PUBLIC_SITE_URL` | `https://my-site.vercel.app` | Your deployed domain |

### Cloudflare R2 (Optional)

| Variable | Example | Description |
|----------|---------|-------------|
| `R2_ACCESS_KEY_ID` | `abc123...` | S3 access key |
| `R2_SECRET_ACCESS_KEY` | `xyz789...` | S3 secret key |
| `R2_ENDPOINT` | `12345.r2.cloudflarestorage.com` | Account endpoint (no https://) |
| `R2_BUCKET` | `treetwin-media` | Bucket name |
| `R2_REGION` | `auto` | Always `auto` |
| `R2_PUBLIC_URL` | `https://media.example.com` | Public CDN URL |

Create `.env.local` from `.env.example` and fill in your values.

## Content Collections

### Articles

**Path:** `src/content/articles/{title}/index.mdoc`

Schema fields:
- `title` (slug) — Auto-generates URL from title
- `description` (text) — Short description
- `content` (Markdoc) — Long-form article body
- `status` (select) — `draft` or `published`
- `publishedAt` (date) — Publication date
- `tags` (array) — Tag strings
- `category` (text) — Category label
- `cover` (object) — Cover image URL + alt text
- `seo` (object) — Custom SEO title, OG image, noindex flag
- `video` (object) — Video factory enabled + style
- `links` (object) — Outbound link references

### Notes

**Path:** `src/content/notes/{title}.yaml`

Same fields as articles, but:
- `content` is plain text (not Markdoc)
- No rich formatting, just quick captures

### Records

**Path:** `src/content/records/{title}.yaml`

Structured data for portfolios/catalogs:
- `recordType` (select) — `project`, `product`, or `experiment`
- `recordData` (JSON text) — Freeform structured data
- All other seed fields apply

### Site Settings (Singleton)

**Path:** `src/content/site-settings/index.yaml`

Global configuration:
- `themeId` — Active theme ID (e.g., `liquid-glass`)

Editable via Keystatic UI in dev.

## SEO Configuration

All metadata generated automatically from content fields:

- **Page title:** `seo.seoTitle` if set, else `title`
- **Description:** `description` field
- **OG image:** `seo.ogImage` URL if set, else auto-generated via `/og` endpoint
- **Robots:** Respects `seo.noindex` flag per page
- **Sitemap:** Auto-generated at `/sitemap.xml`
- **JSON-LD:** Article schema for articles, CreativeWork for notes

Set `seo.noindex: true` to exclude a page from search engine indexing.

## Theme Configuration

Themes defined in `src/themes/`:

- **theme-types.ts** — TypeScript types for theme object
- **theme-resolver.ts** — Theme registry (maps ID → theme object)
- **liquid-glass.ts** — Glass morphism theme with CSS variables

### Creating a Custom Theme

1. Create `src/themes/my-theme.ts`:
```typescript
export const myTheme = {
  colors: { ... },
  tokens: { '--t-primary': '#...', ... }
}
```

2. Register in `theme-resolver.ts`:
```typescript
export const themeRegistry = {
  'liquid-glass': liquidGlass,
  'my-theme': myTheme,  // Add here
}
```

3. Set in `site-config.ts`:
```typescript
theme: { id: 'my-theme' }
```

## Keystatic Admin

The Keystatic CMS UI is available at `http://localhost:4321/keystatic` during development.

**In production:** Admin UI is disabled (Keystatic checks environment).

**To enable admin edits:**
1. Clone repo
2. `npm install && npm run dev`
3. Visit `http://localhost:4321/keystatic`
4. Edit content (saves to `src/content/`)
5. Commit to git when ready

---

For more details, see [Keystatic Docs](https://keystatic.com/docs/configuration) and [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/).
