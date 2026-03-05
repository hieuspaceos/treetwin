# Payload CMS 3.0 + Next.js 14 App Router Research Report

**Date:** 2026-03-05 | **Researcher:** claude-researcher | **Focus:** Payload CMS 3.0 integration patterns with Next.js 14 App Router

---

## Executive Summary

Payload CMS 3.0 is fundamentally rewritten as "Next.js native"—Express is gone, Payload runs entirely within Next.js App Router. Admin panel, REST API, and GraphQL API all route through Next.js. This enables single-artifact deployment and seamless integration with existing Next.js applications.

Key findings:
- **No separate server**: Payload's HTTP layer is built on Next.js
- **Admin at `/(payload)/admin`**: Route group encapsulation prevents style/layout bleed
- **withPayload() wrapper**: ESM-based Next.js plugin for config integration
- **PostgreSQL + Supabase**: Direct support via `@payloadcms/db-postgres` + connection pooling
- **S3/R2 storage**: `@payloadcms/storage-s3` adapter (S3-compatible)
- **Search plugin**: `@payloadcms/plugin-search` creates indexed search collection
- **Auto-generated REST API**: Full CRUD endpoints with filtering, pagination, sorting

---

## 1. Payload CMS 3.0 + Next.js App Router Setup

### 1.1 Architecture Overview

**Payload 3.0 is ESM-native and runs entirely within Next.js.** No Express server, no separate port. The entire Payload system (admin panel, APIs) routes through Next.js App Router using:

- **`/(payload)` route group**: Boundary for admin panel UI, styles, layouts
  - `/(payload)/admin/[[...segments]]/page.tsx` → Admin dashboard
  - `/(payload)/api/*` → REST API endpoints (auto-generated from collections)
  - `/(payload)/graphql` → GraphQL endpoint

**Directory structure:**
```
src/
├── app/
│   ├── (payload)/
│   │   ├── layout.tsx              # Payload-specific layout
│   │   ├── custom.scss             # Admin panel styles
│   │   ├── admin/
│   │   │   └── [[...segments]]/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── [collection]/
│   │   │   │   ├── [[...path]]/route.ts
│   │   └── graphql/
│   │       └── route.ts
│   ├── (frontend)/                 # Your app pages
│   │   ├── page.tsx
│   │   └── ...
├── collections/
│   ├── articles.ts
│   ├── notes.ts
│   ├── users.ts
├── globals/
│   └── settings.ts
├── payload.config.ts
├── payload-types.ts                # Auto-generated
└── next.config.ts
```

### 1.2 `payload.config.ts` Structure

**Location:** Root or next to `/app` folder.

**Basic example:**
```typescript
import { buildConfig } from 'payload/config'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { Users } from '@/collections/Users'
import { Articles } from '@/collections/Articles'

export default buildConfig({
  // Server URL for API generation
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',

  // Admin configuration
  admin: {
    user: 'users',  // Collection slug for auth
    importMap: {
      baseDir: path.resolve(import.meta.url),
    },
  },

  // Collections (array of collection configs)
  collections: [Users, Articles],

  // Globals (single-record configurations)
  globals: [Settings],

  // Database adapter
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),

  // Rich text editor
  editor: lexicalEditor(),

  // TypeScript auto-generation
  typescript: {
    outputFile: path.resolve(import.meta.url, '../payload-types.ts'),
  },

  // Image optimization
  sharp,
})
```

### 1.3 `next.config.ts` with `withPayload()`

**Payload is an ESM-only module.** `next.config.ts` must use ESM syntax.

**Example:**
```typescript
import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  // Standard Next.js config
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.cloudflare-r2.com', // R2 domain
      },
    ],
  },
}

// withPayload() wraps the config and sets up Payload within Next.js
export default withPayload(nextConfig)
```

**What `withPayload()` does:**
- Enables Payload's HTTP layer within Next.js
- Configures dynamic routes for admin panel
- Wires up REST API and GraphQL routes
- Handles asset optimization for admin UI

### 1.4 Admin Panel Routing

Admin panel lives at `/(payload)/admin`. The route group `(payload)` is a Next.js convention that:
- Scopes layouts and styles (no bleed to frontend routes)
- Keeps URL structure clean (`/admin` not `/payload/admin`)
- Allows separate `layout.tsx` for admin-specific setup

**The `/(payload)/admin/[[...segments]]/page.tsx` catches all admin routes:**
- `/admin` → Dashboard
- `/admin/collections/articles` → Article editor
- `/admin/collections/articles/123` → Edit article
- `/admin/account/profile` → User settings

Payload's React admin component automatically handles routing within this catch-all.

---

## 2. S3/Cloudflare R2 Storage Adapter

### 2.1 Setup Overview

Cloudflare R2 is **S3-compatible**, so use `@payloadcms/storage-s3` directly. No special R2 binding required.

**Key R2 differences from AWS S3:**
- Region: Use `"auto"` (not a real AWS region code)
- Endpoint: Must be constructed from account ID and bucket name
- Egress: FREE (unlike AWS)
- Credentials: R2 API tokens (same S3-like interface)

### 2.2 Environment Variables

```bash
# Required
R2_ACCESS_KEY_ID=your_r2_api_token_id          # From R2 API tokens page
R2_SECRET_ACCESS_KEY=your_r2_api_token_secret
R2_ENDPOINT=bucketname.xxxxxxxx.r2.cloudflarestorage.com  # No https://
R2_BUCKET=bucketname
R2_REGION=auto

# Optional (for public URL rewrites)
R2_PUBLIC_URL=https://cdn.example.com  # Custom domain or R2 public URL
```

**Endpoint format:**
- R2 gives you: `https://xxxxxxxx.r2.cloudflarestorage.com`
- Extract just: `xxxxxxxx.r2.cloudflarestorage.com` (no protocol)
- Payload adds `https://` automatically

### 2.3 Collection Configuration with S3 Storage

```typescript
import { s3Storage } from '@payloadcms/storage-s3'

export const Media = {
  slug: 'media',
  access: {
    read: () => true,
    create: isAdminUser,
    update: isAdminUser,
    delete: isAdminUser,
  },
  upload: {
    // Enable uploads on this collection
    staticDir: false, // Don't store locally
    adminThumbnail: 'image', // Show preview in admin
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}

// Register in payload.config.ts plugins:
// upload: s3Storage({
//   bucket: process.env.R2_BUCKET,
//   config: {
//     credentials: {
//       accessKeyId: process.env.R2_ACCESS_KEY_ID,
//       secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
//     },
//     region: process.env.R2_REGION || 'auto',
//     endpoint: `https://${process.env.R2_ENDPOINT}`,
//   },
//   disableLocalStorage: true,
// }),
```

### 2.4 Full Payload Config with S3

```typescript
import { buildConfig } from 'payload/config'
import { s3Storage } from '@payloadcms/storage-s3'

export default buildConfig({
  collections: [{ slug: 'media', upload: true, fields: [] }],

  upload: s3Storage({
    bucket: process.env.R2_BUCKET!,
    config: {
      region: process.env.R2_REGION || 'auto',
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      endpoint: `https://${process.env.R2_ENDPOINT}`,
    },
    disableLocalStorage: true,
  }),
})
```

---

## 3. Collections API (TypeScript)

### 3.1 Collection Structure

Collections are defined as objects exported from separate files (by convention). Each collection has:
- `slug`: Unique identifier for API routes
- `admin`: UI settings (labels, icons, descriptions)
- `fields`: Field definitions (text, relationship, array, etc.)
- `access`: Row/field-level access control
- `hooks`: Lifecycle hooks (beforeValidate, afterChange, etc.)
- `timestamps`: Enable `createdAt` and `updatedAt`
- `versions`: Enable versioning with drafts/publishing
- `defaultSort`: Default sort order in admin

### 3.2 Example Collections

**Articles collection:**
```typescript
import type { CollectionConfig } from 'payload'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    description: 'Blog articles with draft/publish workflow',
  },
  access: {
    read: () => true,
    create: isAdminUser,
    update: isAdminUser,
    delete: isAdminUser,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { hidden: true },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: ['draft', 'published', 'archived'],
      defaultValue: 'draft',
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
}
```

**Notes collection (lightweight):**
```typescript
export const Notes: CollectionConfig = {
  slug: 'notes',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
  ],
  timestamps: true,
}
```

**Records collection (flexible schema):**
```typescript
export const Records: CollectionConfig = {
  slug: 'records',
  fields: [
    {
      name: 'type',
      type: 'select',
      options: ['invoice', 'order', 'feedback', 'other'],
      required: true,
    },
    {
      name: 'data',
      type: 'json',
      required: true,
    },
    {
      name: 'relatedArticle',
      type: 'relationship',
      relationTo: 'articles',
      hasMany: false,
    },
  ],
  timestamps: true,
}
```

### 3.3 `afterChange` Hook Example

The `afterChange` hook runs **after** a document is created or updated. Useful for:
- Invalidating ISR caches
- Syncing to external systems
- Triggering webhooks
- Publishing to search indices

```typescript
import type { CollectionConfig, CollectionAfterChangeHook } from 'payload'

const publishedArticleHook: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Only revalidate if status changed to published
  if (
    operation === 'create' && doc.status === 'published' ||
    operation === 'update' &&
      previousDoc?.status !== 'published' &&
      doc.status === 'published'
  ) {
    // Revalidate ISR page
    try {
      await fetch('http://localhost:3000/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: doc.slug }),
      })
    } catch (err) {
      console.error('Revalidation failed:', err)
    }
  }

  return doc
}

export const Articles: CollectionConfig = {
  slug: 'articles',
  // ... fields ...
  hooks: {
    afterChange: [publishedArticleHook],
  },
}
```

**Another example — sync to webhook:**
```typescript
const webhookSyncHook: CollectionAfterChangeHook = async ({ doc, operation }) => {
  if (operation === 'create') {
    await fetch(process.env.WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'article.created',
        article: doc,
        timestamp: new Date(),
      }),
    })
  }
  return doc
}
```

---

## 4. Search Plugin (`@payloadcms/plugin-search`)

### 4.1 Overview

`@payloadcms/plugin-search` creates a dedicated **search collection** that:
- Indexes only the fields you specify (not entire documents)
- Updates automatically when documents change (via hooks)
- Supports full-text search across multiple collections
- Uses database indices for fast queries

**How it works:**
1. Creates a `search` collection internally
2. Hooks into `afterChange` on indexed collections
3. Extracts title/description/fields into search records
4. Associates search records with source documents

### 4.2 Configuration

```typescript
import { searchPlugin } from '@payloadcms/plugin-search'
import { buildConfig } from 'payload/config'

export default buildConfig({
  collections: [Articles, Notes, Records],
  plugins: [
    searchPlugin({
      // Collections to index for search
      collections: ['articles', 'notes'],

      // Default search priority per collection
      defaultPriorities: {
        articles: 20,
        notes: 10,
      },

      // Customize fields extracted for each collection
      beforeSync: (args) => {
        if (args.doc.collection === 'articles') {
          return {
            title: args.doc.title,
            description: args.doc.content?.slice(0, 200),
            published: args.doc.status === 'published' ? 1 : 0,
          }
        }
        return args.doc
      },
    }),
  ],
})
```

### 4.3 Querying Search Results

Search records are stored in the auto-created `search` collection. Query like any other collection:

```typescript
// REST API
GET /api/search?where[title][contains]=typescript&sort=-priority

// Local API
const results = await payload.find({
  collection: 'search',
  where: {
    title: { contains: 'typescript' },
  },
  sort: '-priority',
})
```

**Response structure:**
```json
{
  "docs": [
    {
      "id": "uuid",
      "title": "Advanced TypeScript Patterns",
      "priority": 20,
      "doc": {
        "relationTo": "articles",
        "value": "article-uuid"
      }
    }
  ]
}
```

---

## 5. PostgreSQL + Supabase Setup

### 5.1 Connection Configuration

`@payloadcms/db-postgres` uses Drizzle under the hood. Supabase provides PostgreSQL with built-in pooling.

**Environment variables:**
```bash
# Supabase connection string
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REGION].supabase.co:5432/postgres

# Or use pooler (for serverless)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REGION].supabase.co:6543/postgres
```

**Key difference:**
- **Direct**: `port 5432`, direct connection (good for local dev)
- **Pooler**: `port 6543`, connection pool (required for serverless/edge)

### 5.2 Payload Config with Postgres

```typescript
import { buildConfig } from 'payload/config'
import { postgresAdapter } from '@payloadcms/db-postgres'

export default buildConfig({
  db: postgresAdapter({
    // Simple connection string
    pool: {
      connectionString: process.env.DATABASE_URL,
    },

    // OR with advanced options
    pool: {
      host: process.env.DB_HOST,
      port: 5432,
      database: 'postgres',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20,  // Connection pool size
      idleTimeoutMillis: 30000,
    },

    // Migration settings (production)
    push: process.env.NODE_ENV === 'development', // Auto-push schema in dev
    migrationDir: './src/migrations',
  }),

  // ... rest of config
})
```

### 5.3 Supabase-Specific Considerations

**Connection pooler vs direct:**
- Use **pooler (`port 6543`)** if:
  - Running on Vercel, Netlify, or other serverless
  - Making many short connections
  - Running on Cloudflare Workers

- Use **direct (`port 5432`)** if:
  - Running on a long-running server (Node.js, Docker)
  - Long-lived database connections are acceptable

**Important:** Payload's database adapter manages connection pools internally, so prefer the pooler for Supabase.

**Example with Supabase pooler:**
```typescript
pool: {
  connectionString: `postgresql://postgres:[PASSWORD]@db.[REGION].supabase.co:6543/postgres?sslmode=require`,
}
```

**Schema management:**
- Use `push: false` in production (require migrations)
- Supabase auto-executes migrations if stored in a migrations table
- Keep migrations in `src/migrations/` and commit to git

---

## 6. REST API Auto-Generated Endpoints

### 6.1 Endpoint Format

Payload auto-generates REST endpoints for each collection:

```
GET    /api/{collection}              # List all (with pagination)
POST   /api/{collection}              # Create new
GET    /api/{collection}/{id}         # Get by ID
PATCH  /api/{collection}/{id}         # Update
DELETE /api/{collection}/{id}         # Delete
GET    /api/{collection}/{id}/versions # Get versions (if enabled)
```

**Examples:**
```
GET    /api/articles              # All articles
GET    /api/articles?limit=10&page=1
POST   /api/articles              # Create article
GET    /api/articles/uuid-123     # Get article by ID
PATCH  /api/articles/uuid-123     # Update article
```

### 6.2 Filtering with WHERE Clauses

Use bracket notation in query strings:

```typescript
// Example: Filter articles with status=published
GET /api/articles?where[status][equals]=published

// Multiple conditions (AND)
GET /api/articles?where[status][equals]=published&where[createdAt][greater_than]=2025-01-01

// Nested field filter
GET /api/records?where[data][title][contains]=typescript

// Using qs-esm to build complex queries
import qs from 'qs'

const query = {
  where: {
    status: { equals: 'published' },
    createdAt: { greater_than: '2025-01-01' },
  },
  sort: '-publishedAt',
  limit: 10,
}

const queryString = qs.stringify(query)
const url = `/api/articles?${queryString}`
```

### 6.3 Response Format

**List request:**
```json
{
  "docs": [
    {
      "id": "uuid-123",
      "title": "Getting Started with Payload",
      "slug": "getting-started-payload",
      "status": "published",
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-02-20T15:45:00Z"
    }
  ],
  "totalDocs": 42,
  "limit": 10,
  "totalPages": 5,
  "page": 1,
  "pagingCounter": 1,
  "hasPrevPage": false,
  "hasNextPage": true,
  "prevPage": null,
  "nextPage": 2
}
```

**Single document:**
```json
{
  "id": "uuid-123",
  "title": "Getting Started",
  "slug": "getting-started-payload",
  "content": "...",
  "status": "published",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-02-20T15:45:00Z"
}
```

### 6.4 Common Filter Operators

| Operator | Usage | Example |
|----------|-------|---------|
| `equals` | Exact match | `?where[status][equals]=published` |
| `not_equals` | Not equal | `?where[status][not_equals]=draft` |
| `contains` | Substring (text) | `?where[title][contains]=typescript` |
| `greater_than` | `>` (dates, numbers) | `?where[createdAt][greater_than]=2025-01-01` |
| `less_than` | `<` (dates, numbers) | `?where[price][less_than]=100` |
| `greater_than_equal` | `>=` | `?where[views][greater_than_equal]=1000` |
| `less_than_equal` | `<=` | `?where[views][less_than_equal]=5000` |
| `in` | Array match | `?where[status][in][0]=published&where[status][in][1]=archived` |

### 6.5 Pagination & Sorting

```
# Pagination
GET /api/articles?limit=20&page=2

# Sorting (prefix with - for descending)
GET /api/articles?sort=-createdAt        # Newest first
GET /api/articles?sort=title             # A-Z

# Field selection (only return specific fields)
GET /api/articles?select=title,slug,status

# Combined
GET /api/articles?where[status][equals]=published&sort=-publishedAt&limit=10&page=1
```

---

## 7. Unresolved Questions & Gaps

1. **Search plugin with PostgreSQL indexing**: Whether `@payloadcms/plugin-search` creates actual database indices or relies on Drizzle's query optimization
2. **Real-world afterChange hook performance**: No benchmark data on hook execution time for large documents
3. **R2 cost modeling**: Actual bandwidth costs with heavy file usage (documentation says "free egress" but no cache/CDN specifics)
4. **Payload version 3.x stability**: Current version (3.43.0+) production readiness vs breaking changes
5. **Supabase Row-Level Security (RLS)**: Whether Payload respects RLS policies or bypasses them

---

## Sources

- [Payload CMS Installation Documentation](https://payloadcms.com/docs/getting-started/installation)
- [Payload CMS Configuration Overview](https://payloadcms.com/docs/configuration/overview)
- [Storage Adapters Documentation](https://payloadcms.com/docs/upload/storage-adapters)
- [Collection Configuration Documentation](https://payloadcms.com/docs/configuration/collections)
- [Collection Hooks Documentation](https://payloadcms.com/docs/hooks/collections)
- [PostgreSQL Database Adapter](https://payloadcms.com/docs/database/postgres)
- [REST API Documentation](https://payloadcms.com/docs/rest-api/overview)
- [Search Plugin Documentation](https://payloadcms.com/docs/plugins/search)
- [@payloadcms/storage-s3 npm package](https://www.npmjs.com/package/@payloadcms/storage-s3)
- [@payloadcms/db-postgres npm package](https://www.npmjs.com/package/@payloadcms/db-postgres)
- [@payloadcms/plugin-search npm package](https://www.npmjs.com/package/@payloadcms/plugin-search)
- [Cloudflare Blog: Payload on Workers](https://blog.cloudflare.com/payload-cms-workers/)
- [Setting up Payload with Supabase](https://payloadcms.com/posts/guides/setting-up-payload-with-supabase-for-your-nextjs-app-a-step-by-step-guide)
- [Ultimate Guide to Next.js with Payload](https://payloadcms.com/posts/blog/the-ultimate-guide-to-using-nextjs-with-payload)
- [Payload 3.0 Release Blog](https://payloadcms.com/posts/blog/payload-30-the-first-cms-that-installs-directly-into-any-nextjs-app)
