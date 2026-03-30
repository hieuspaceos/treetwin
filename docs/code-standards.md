# Code Standards

Conventions for TreeID codebase (Astro 5 + Keystatic + React islands).

## File Organization

### Directory Structure

```
src/
├── content/               # Keystatic-managed (git-tracked files)
├── pages/                 # Astro routes
├── layouts/               # Astro layout templates
├── components/            # Astro + React components
│   └── islands/          # React client islands
├── lib/                   # Utility functions
├── themes/               # Theme definitions
├── config/               # Configuration
└── styles/               # Global CSS
```

### File Naming

- **Astro files:** `kebab-case.astro` (e.g., `seed-card.astro`)
- **React files:** `PascalCase.tsx` (e.g., `Toc.tsx`)
- **Utilities:** `kebab-case.ts` (e.g., `content-helpers.ts`)
- **Directories:** `kebab-case` (e.g., `src/lib/seo/`)

**Goal:** File name should indicate purpose at a glance.

### File Size

**Target:** Keep files under 200 lines of code.

**Guidelines:**
- **Components > 200 LOC** → Split into smaller components
- **Utilities > 200 LOC** → Extract into separate modules
- **Pages > 200 LOC** → Move logic to lib utilities

**Exception:** Configuration files, test files — no size limit.

## Astro Components

### Default: Zero JavaScript

By default, Astro components render to HTML with **zero client-side JavaScript**.

```astro
---
import { getCollection } from 'astro:content'

const articles = await getCollection('articles')
const published = articles.filter(a => a.data.status === 'published')
---

<div class="articles">
  {published.map(a => (
    <article>
      <h2>{a.data.title}</h2>
      <p>{a.data.description}</p>
    </article>
  ))}
</div>

<style>
  .articles { display: grid; gap: 1rem; }
</style>
```

**No `<script>` tag needed.** Content renders as static HTML.

### React Islands (Client Components)

Use React **only for interactivity.**

**When to use React:**
- Scroll spy (ToC component)
- Real-time search
- Form interactions
- State management

**When NOT to use React:**
- Static content (use Astro)
- SEO-critical content (render as HTML)
- Buttons that link somewhere (use `<a>` tag)

**Example: Interactive ToC Island**

```tsx
// src/components/islands/toc.tsx
import { useEffect, useState } from 'react'

export default function Toc() {
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.id)
          }
        })
      },
      { rootMargin: '0% 0% -80% 0%' }
    )

    document.querySelectorAll('h2, h3').forEach(el => {
      if (el.id) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <nav className="toc">
      {/* Render TOC items, highlight activeId */}
    </nav>
  )
}
```

**Usage in Astro:**

```astro
---
import Toc from '../components/islands/toc.tsx'
---

<article>
  <Toc client:visible />
  {/* client:visible = load JS only when visible */}
</article>
```

**Client directives:**
- `client:load` — Load JS immediately
- `client:visible` — Load JS when element enters viewport (preferred)
- `client:idle` — Load JS when browser idle

## Content Queries

All content queries use Astro's `getCollection()` API.

```typescript
import { getCollection } from 'astro:content'

// Get all entries (no filter)
const allArticles = await getCollection('articles')

// Filter by status
const published = allArticles.filter(a => a.data.status === 'published')

// Sort by date
const sorted = published.sort((a, b) => {
  const dateA = a.data.publishedAt ? new Date(a.data.publishedAt).getTime() : 0
  const dateB = b.data.publishedAt ? new Date(b.data.publishedAt).getTime() : 0
  return dateB - dateA
})
```

**Security:** Always filter `status === 'published'` before rendering.

**Use helpers:** See `src/lib/content-helpers.ts` for pre-built queries.

## TypeScript

### Strict Mode

All `.ts` and `.tsx` files use TypeScript strict mode.

```typescript
// ✅ Good
function getName(person: { name: string }): string {
  return person.name
}

// ❌ Avoid
function getName(person: any): any {
  return person.name
}
```

### Content Type Safety

Keystatic + Astro provide type-safe content:

```typescript
import type { CollectionEntry } from 'astro:content'

type ArticleEntry = CollectionEntry<'articles'>

function renderArticle(article: ArticleEntry) {
  const { title, description, content } = article.data
  // TypeScript knows structure of article.data
}
```

### Component Props

Always type props:

```typescript
interface Props {
  slug: string
  title: string
  date?: Date  // optional
}

export default function SeedCard({ slug, title, date }: Props) {
  return <article>{title}</article>
}
```

## Styling

### Tailwind CSS

Use Tailwind utility classes for all styling.

```astro
<div class="flex gap-4 px-6 py-4 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
  <h2 class="text-2xl font-bold text-white">Title</h2>
</div>
```

### CSS Variables (Themes)

For theme-aware styling, use CSS variables:

```css
/* Define in theme files (src/themes/my-theme.ts) */
--t-primary: #3b82f6
--t-background: #ffffff
--t-border: #e5e7eb
```

```astro
<div style={`color: var(--t-primary)`}>
  Themed text
</div>
```

### Scoped Styles

Use `<style>` block in Astro components (auto-scoped):

```astro
<article>
  <h2>Title</h2>
</article>

<style>
  /* Only applies to <h2> in this component */
  h2 {
    font-size: 1.5rem;
  }
</style>
```

## Error Handling

### Try-Catch for Async Operations

```typescript
async function getSeed(slug: string) {
  try {
    const entries = await getCollection('articles')
    return entries.find(e => e.slug === slug)
  } catch (error) {
    console.error(`Failed to fetch seed: ${slug}`, error)
    return null  // Graceful fallback
  }
}
```

### API Endpoints

```typescript
// src/pages/api/my-endpoint.ts
export async function GET(context) {
  try {
    const data = await fetchSomeData()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    )
  }
}
```

## Comments

Add comments for **complex logic only**, not obvious code.

```typescript
// ✅ Good: Explains WHY
// Filter published only to prevent draft content leaks
const published = articles.filter(a => a.data.status === 'published')

// ❌ Unnecessary: States obvious
// Filter articles by status
const published = articles.filter(a => a.data.status === 'published')
```

### JSDoc for Public Functions

```typescript
/**
 * Fetch all published articles, sorted by date (newest first)
 * @returns Array of articles filtered by status === 'published'
 */
export async function getPublishedArticles() {
  // ...
}
```

## Imports

### Astro-Specific

```typescript
// Content collections (type-safe)
import { getCollection } from 'astro:content'
import type { CollectionEntry } from 'astro:content'

// Components
import MyComponent from '../components/my-component.astro'
```

### Order Imports

1. Astro imports
2. External packages
3. Local imports
4. Types (separate section)

```typescript
// Astro
import { getCollection } from 'astro:content'
import type { CollectionEntry } from 'astro:content'

// External
import { someLib } from 'some-package'

// Local
import { helper } from '../lib/helpers'
import SeedCard from '../components/seed-card.astro'

// Types
import type { Props } from '../types'
```

## Environment Variables

### Public Variables

Prefix with `PUBLIC_` (accessible in browser):

```bash
PUBLIC_SITE_URL=https://example.com
```

```typescript
const url = import.meta.env.PUBLIC_SITE_URL
```

### Private Variables

No prefix (server-only):

```bash
R2_SECRET_ACCESS_KEY=xxx
GOCLAW_API_KEY=xxx
```

```typescript
// Server-side only (pages, API routes)
const secret = import.meta.env.R2_SECRET_ACCESS_KEY
const apiKey = import.meta.env.GOCLAW_API_KEY
```

**Never expose secrets in client code.**

## GoClaw API Authentication Pattern

For external AI agent integrations, use Bearer token auth in `src/pages/api/goclaw/*` endpoints:

```typescript
import { verifyGoclawApiKey } from '@/lib/goclaw/api-auth'

export const POST: APIRoute = async ({ request }) => {
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response  // 401 or 503

  // Process authenticated request
}
```

**Key patterns:**
- Returns 503 if `GOCLAW_API_KEY` env var not configured (graceful degradation)
- Returns 401 if token invalid
- All writes force `status: draft` (human approval required)
- Use `GOCLAW_WEBHOOK_SECRET` for HMAC-SHA256 signature verification on incoming webhooks

## Git Workflow

### Commit Messages

Use conventional commits:

```bash
feat: add search page with Pagefind integration
fix: prevent draft content from leaking in sidebar
docs: update deployment guide for Vercel
refactor: extract content helpers into separate module
test: add unit tests for content queries
```

### Branch Names

```bash
feature/search-implementation
fix/draft-content-leak
docs/update-readme
```

## Performance

### Lazy Loading

Use `client:visible` for components below the fold:

```astro
<Toc client:visible /> {/* Load JS only when visible */}
<SearchInput client:visible />
```

### Image Optimization

Use WebP, size appropriately:

```astro
<img
  src="/images/cover.webp"
  alt="Article cover"
  width="600"
  height="400"
/>
```

### Build Optimization

- Keep components small (under 200 LOC)
- Extract business logic to `lib/` utilities
- Minimize client-side code (React islands only)

## Landing Page Components (v3.2.0+)

### Layout System (8 Variants)

Each section supports a `layout` prop with 8 responsive variants:

| Layout | Description | Example |
|--------|-------------|---------|
| **grid** | Multi-column responsive grid (1-6 cols) | Features, team, testimonials |
| **sidebar-left** | Fixed left sidebar + main content | Pricing, documentation |
| **sidebar-right** | Fixed right sidebar + main content | Blog, product pages |
| **asymmetric** | Unequal columns (2:1 or 1:2 ratio) | Hero with image, feature showcase |
| **thirds** | Three equal columns (desktop), stacked (mobile) | Stats, stats counter |
| **hero-split** | 50/50 split with image + text | Hero, testimonials |
| **stacked** | Full-width vertical stacking | Content-heavy sections |
| **masonry** | CSS columns for gallery layouts | Portfolio, gallery sections |

**LayoutData schema:**
```typescript
interface LayoutData {
  variant: 'grid' | 'sidebar-left' | 'sidebar-right' | 'asymmetric' | 'thirds' | 'hero-split' | 'stacked' | 'masonry'
  mobileReverse?: boolean  // Swap order on mobile (hero-split only)
  alignItems?: 'start' | 'center' | 'end'  // Vertical alignment
}
```

### Full-Width Section Layout

All landing page sections render full-width with edge-to-edge backgrounds:

```astro
---
// src/components/landing/my-section.astro
interface Props {
  data: Record<string, any>
  style?: Record<string, string>
  scopedCss?: Array<{ selector: string; css: string }>
}

const { data, style, scopedCss } = Astro.props
---

<div
  class="landing-section-wrapper"
  data-section={`section-${data.id}`}
  style={buildSectionStyle(style)}
>
  <div class="landing-section">
    {/* Inner content here */}
  </div>

  {scopedCss && (
    <style>
      {scopedCss.map(s => `[data-section="section-${data.id}"] ${s.selector} { ${s.css} }`).join('\n')}
    </style>
  )}
</div>

<style>
  .landing-section-wrapper {
    width: 100vw;
    /* bg color/image from style prop */
  }

  .landing-section {
    max-width: 72rem;
    margin: 0 auto;
    /* content padding here, not wrapper */
  }
</style>
```

### Design Variables (No Hardcoding)

Landing page component CSS must use design variables, never hardcoded colors:

```astro
<!-- ✅ Good -->
<button style={`background: var(--lp-accent); color: white;`}>
  Click me
</button>

<!-- ❌ Avoid -->
<button style="background: #f59e0b; color: white;">
  Click me
</button>
```

**Available variables:**
- `--lp-primary` — Primary brand color
- `--lp-secondary` — Secondary accent
- `--lp-accent` — Call-to-action color
- `--lp-text` — Main text color
- `--lp-text-muted` — Lighter text (captions, hints)
- `--lp-background` — Section background
- `--lp-border` — Border/divider color

### Scoped CSS

Each component can include auto-generated scoped CSS (from AI clone post-processor):

```json
{
  "scopedCss": [
    { "selector": ".card", "css": "background: rgba(var(--lp-accent-rgb), 0.1);" },
    { "selector": ".icon", "css": "color: var(--lp-accent);" }
  ]
}
```

Rendered as:
```html
<style>
  [data-section="section-features"] .card {
    background: rgba(var(--lp-accent-rgb), 0.1);
  }
  [data-section="section-features"] .icon {
    color: var(--lp-accent);
  }
</style>
```

### Section Variants (48 Total)

All section types support multiple variants (v3.2.0):

| Section Type | Variants | Total | Examples |
|--------------|----------|-------|----------|
| Hero | 6 | 6 | centered, split, video-bg, minimal, fullscreen, slider |
| Features | 6 | 6 | grid, list, alternating, masonry, icon-strip, bento |
| Pricing | 5 | 5 | cards, simple, highlight-center, comparison, toggle |
| Testimonials | 5 | 5 | cards, single, minimal, quote-wall, logo-strip |
| CTA | 5 | 5 | default, split, banner, minimal, with-image |
| Nav | 5 | 5 | default, centered, transparent, hamburger, mega |
| Footer | 5 | 5 | simple, columns, minimal, mega, centered-social |
| Stats | 4 | 4 | row, cards, large, counter |
| FAQ | 4 | 4 | accordion, two-column, simple, searchable |
| Others | 3 | 3 | rich-text, video, contact-form (simplified layout) |

**Total: 48 variants** across 10+ section types.

### Component Size Limits

Landing page components **must stay under 200 LOC**:

| Component Type | Max LOC | Modularization Strategy |
|--------|---------|----------|
| Base section | 100 | Extract complex variant logic to separate files |
| Variant component | 150 | Single variant per file, shared utilities via `src/lib/landing-helpers.ts` |
| Nested child | 80 | Use sub-components for repeated patterns (cards, items, buttons) |

**If logic exceeds limit:**
- Extract variant logic to separate `{name}-{variant}.astro` files
- Move calculations to `src/lib/landing-helpers.ts`
- Use sub-components for repeated patterns (cards, testimonials, team items, etc.)

## Testing

### Manual Testing Checklist

Before deploying:
- [ ] Content renders without errors
- [ ] Search works (Pagefind index generated)
- [ ] Images load
- [ ] Links work
- [ ] Metadata correct (OG, JSON-LD)
- [ ] Mobile responsive
- [ ] No console errors

### Build Verification

```bash
npm run build
# Check: No errors, dist/ has content, pagefind/ generated
```

---

**Reference:**
- [Astro Docs](https://docs.astro.build)
- [Keystatic Docs](https://keystatic.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [React Docs](https://react.dev)
