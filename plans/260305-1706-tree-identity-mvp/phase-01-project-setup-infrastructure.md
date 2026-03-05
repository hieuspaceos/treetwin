# Phase 1: Project Setup & Infrastructure

## Context Links
- [Payload CMS 3.0 Research](../reports/researcher-260305-1704-payload-cms-3-nextjs-integration.md)
- [CLI Research](../reports/researcher-260305-1704-create-tree-id-cli-research.md)

## Overview
- **Priority:** P1 (blocking all other phases)
- **Status:** Pending
- **Effort:** 5h
- Scaffold Next.js 14 + TypeScript project, wire Payload CMS 3.0, configure Supabase PostgreSQL and Cloudflare R2 storage adapters

## Key Insights
- Payload 3.0 runs entirely within Next.js App Router — no separate Express server
- `withPayload()` ESM wrapper required in `next.config.ts`
- Supabase pooler (port 6543) required for serverless deployment on Vercel
- R2 uses `@payloadcms/storage-s3` with `region: "auto"` and custom endpoint
- Admin panel lives in `/(payload)` route group to isolate styles/layouts

## Requirements

### Functional
- Next.js 14 App Router with TypeScript strict mode
- Payload CMS 3.0 admin accessible at `/admin`
- PostgreSQL connection to Supabase via `@payloadcms/db-postgres`
- Cloudflare R2 media storage via `@payloadcms/storage-s3`
- `site-config.ts` as single source of truth for site metadata
- Initial migration generation working

### Non-Functional
- ESLint configured
- Tailwind CSS + Shadcn/UI initialized
- `.env.example` documenting all required env vars
- TypeScript strict mode enabled

## Architecture

```
src/
├── app/
│   ├── (payload)/
│   │   ├── layout.tsx
│   │   ├── admin/[[...segments]]/page.tsx
│   │   ├── admin/[[...segments]]/not-found.tsx
│   │   ├── api/[...slug]/route.ts
│   │   └── graphql/route.ts (optional)
│   ├── (frontend)/
│   │   └── ... (Phase 4)
│   └── layout.tsx
├── config/
│   └── site-config.ts
├── collections/ (Phase 2)
├── payload.config.ts
└── payload-types.ts (auto-generated)
```

## Related Code Files

### Create
- `package.json` — deps: next, payload, @payloadcms/*, tailwindcss, shadcn
- `next.config.ts` — `withPayload()` wrapper
- `tsconfig.json` — strict mode, path aliases (`@/` → `src/`)
- `src/payload.config.ts` — buildConfig with db, storage, editor, admin
- `src/config/site-config.ts` — site metadata schema
- `src/app/(payload)/admin/[[...segments]]/page.tsx` — Payload admin catch-all
- `src/app/(payload)/admin/[[...segments]]/not-found.tsx` — 404 for admin
- `src/app/(payload)/layout.tsx` — Payload-scoped layout
- `src/app/(payload)/api/[...slug]/route.ts` — REST API catch-all
- `src/app/layout.tsx` — root layout with Tailwind
- `.env.example` — all env var placeholders
- `.gitignore` — node_modules, .next, .env.local
- `tailwind.config.ts` — Tailwind + Shadcn config
- `postcss.config.js`
- `components.json` — Shadcn/UI config

## Implementation Steps

1. **Init project manually** (not create-next-app, we control everything):
   ```bash
   npm init -y
   ```

2. **Install core dependencies:**
   ```bash
   npm install next@14 react react-dom typescript @types/react @types/node
   npm install payload @payloadcms/next @payloadcms/db-postgres @payloadcms/richtext-lexical @payloadcms/storage-s3
   npm install sharp
   npm install tailwindcss postcss autoprefixer
   npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
   ```

3. **Create `tsconfig.json`** with strict mode + path aliases:
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "lib": ["dom", "dom.iterable", "esnext"],
       "strict": true,
       "moduleResolution": "bundler",
       "module": "ESNext",
       "jsx": "preserve",
       "paths": { "@/*": ["./src/*"] },
       "baseUrl": "."
     },
     "include": ["src", "next-env.d.ts", "**/*.ts", "**/*.tsx"],
     "exclude": ["node_modules"]
   }
   ```

4. **Create `next.config.ts`:**
   ```typescript
   import type { NextConfig } from 'next'
   import { withPayload } from '@payloadcms/next/withPayload'

   const nextConfig: NextConfig = {
     reactStrictMode: true,
     images: {
       remotePatterns: [
         { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
       ],
     },
   }

   export default withPayload(nextConfig)
   ```

5. **Create `src/config/site-config.ts`:**
   ```typescript
   export const siteConfig = {
     name: 'Tree Identity',
     description: 'Digital Twin content engine',
     url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
     author: {
       name: '',
       email: '',
       url: '',
     },
     socialLinks: {
       twitter: '',
       github: '',
       linkedin: '',
     },
     theme: {
       primaryColor: '#0f172a',
       accentColor: '#3b82f6',
       fontFamily: 'Inter, sans-serif',
     },
     features: {
       videoFactory: false,
       search: true,
     },
     r2: {
       publicUrl: process.env.R2_PUBLIC_URL || '',
     },
   } as const

   export type SiteConfig = typeof siteConfig
   ```

6. **Create `src/payload.config.ts`** — minimal config with Users collection, db adapter, storage adapter, Lexical editor. Full collections added in Phase 2.

7. **Create Payload route files** — admin catch-all page, not-found, layout, REST API route.

8. **Create root `src/app/layout.tsx`** — HTML shell with Tailwind imports.

9. **Create `.env.example`:**
   ```
   # Database (Supabase)
   DATABASE_URL=postgresql://postgres:PASSWORD@db.REGION.supabase.co:6543/postgres

   # Cloudflare R2
   R2_ACCESS_KEY_ID=
   R2_SECRET_ACCESS_KEY=
   R2_ENDPOINT=ACCOUNT_ID.r2.cloudflarestorage.com
   R2_BUCKET=tree-id-media
   R2_REGION=auto
   R2_PUBLIC_URL=

   # App
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   PAYLOAD_SECRET=your-secret-key-min-32-chars
   ```

10. **Init Tailwind + Shadcn/UI:**
    ```bash
    npx tailwindcss init -p
    npx shadcn@latest init
    ```

11. **Generate types + create initial migration:**
    ```bash
    npx payload generate:types
    npx payload migrate:create initial
    ```

12. **Verify `npm run dev` starts** and `/admin` loads Payload dashboard.

## Todo List

- [ ] Create `package.json` with all dependencies
- [ ] Create `tsconfig.json` with strict mode
- [ ] Create `next.config.ts` with `withPayload()`
- [ ] Create `src/payload.config.ts` (minimal: Users + db + storage)
- [ ] Create `src/config/site-config.ts`
- [ ] Create `src/app/(payload)/admin/[[...segments]]/page.tsx`
- [ ] Create `src/app/(payload)/admin/[[...segments]]/not-found.tsx`
- [ ] Create `src/app/(payload)/layout.tsx`
- [ ] Create `src/app/(payload)/api/[...slug]/route.ts`
- [ ] Create `src/app/layout.tsx`
- [ ] Create `.env.example`
- [ ] Create `.gitignore`
- [ ] Init Tailwind CSS + Shadcn/UI
- [ ] Run `payload generate:types`
- [ ] Run `payload migrate:create initial`
- [ ] Verify dev server starts + admin loads

## Success Criteria
- `npm run dev` starts without errors
- `/admin` shows Payload dashboard with login screen
- TypeScript compiles with no errors in strict mode
- `site-config.ts` exports typed config object
- `.env.example` documents all required variables

## Risk Assessment
- **Payload 3.0 breaking changes:** Pin exact version in package.json (e.g., `3.43.0`)
- **ESM issues:** Ensure `next.config.ts` (not `.js`) and all imports are ESM-compatible
- **Supabase connection:** Pooler port 6543 required for Vercel; direct 5432 for local dev. Document both in `.env.example`

## Security Considerations
- `PAYLOAD_SECRET` must be min 32 chars, randomly generated
- `.env.local` in `.gitignore` — never commit credentials
- R2 credentials scoped to single bucket (principle of least privilege)

## Next Steps
- Phase 2: Add Articles, Notes, Records, Media collections to `payload.config.ts`
