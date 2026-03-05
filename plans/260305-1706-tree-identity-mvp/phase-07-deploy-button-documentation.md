# Phase 7: Vercel Deploy Button & Documentation

## Context Links
- [CLI Research](../reports/researcher-260305-1704-create-tree-id-cli-research.md) — Section 7 (Vercel Deploy)
- All previous phases

## Overview
- **Priority:** P3
- **Status:** Pending
- **Effort:** 3h
- **Depends on:** All other phases
- Create Vercel deploy button config, README, video-factory contract docs, site-config reference

## Key Insights
- Vercel deploy button uses query params for env var prompts
- `vercel.json` env definitions show in Vercel UI during deploy
- README must cover both CLI path (npx) and manual path
- Video-factory contract doc is the interface agreement between Tree Identity and video-factory

## Requirements

### Functional
- `vercel.json` with env var definitions for one-click deploy
- `README.md` with: overview, quick start (CLI + manual), env vars table, deploy button
- `docs/video-factory-contract.md` with: manifest schema, R2 path convention, versioning policy
- `docs/site-config-reference.md` with: all config fields documented

### Non-Functional
- README readable in 2 minutes
- Deploy button works from GitHub repo page

## Related Code Files

### Create
- `vercel.json`
- `README.md`
- `docs/video-factory-contract.md`
- `docs/site-config-reference.md`

## Implementation Steps

1. **Create `vercel.json`:**
   ```json
   {
     "$schema": "https://openapi.vercel.sh/vercel.json",
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "env": [
       { "key": "DATABASE_URL", "description": "Supabase PostgreSQL connection string (use pooler port 6543)", "required": true },
       { "key": "PAYLOAD_SECRET", "description": "Random secret key (min 32 chars)", "required": true },
       { "key": "NEXT_PUBLIC_SITE_URL", "description": "Your deployed site URL (e.g. https://my-site.vercel.app)", "required": true },
       { "key": "R2_ACCESS_KEY_ID", "description": "Cloudflare R2 S3-compatible access key" },
       { "key": "R2_SECRET_ACCESS_KEY", "description": "Cloudflare R2 S3-compatible secret key" },
       { "key": "R2_ENDPOINT", "description": "R2 endpoint (ACCOUNT_ID.r2.cloudflarestorage.com)" },
       { "key": "R2_BUCKET", "description": "R2 bucket name" },
       { "key": "R2_REGION", "description": "R2 region (use 'auto')" }
     ]
   }
   ```

2. **Create `README.md`:**
   - Hero: project name + one-line description
   - Deploy button badge (Vercel)
   - **Quick Start — CLI Method:**
     ```bash
     npx create-tree-id my-site
     cd my-site
     npm run dev
     ```
   - **Quick Start — Manual Method:**
     1. Clone repo
     2. Copy `.env.example` → `.env.local`, fill values
     3. `npm install`
     4. `npx payload migrate`
     5. `npm run dev`
   - **Environment Variables table:** all vars from `.env.example` with descriptions
   - **Tech Stack** section (brief)
   - **Project Structure** (brief tree)
   - Link to `docs/` for detailed reference

3. **Create `docs/video-factory-contract.md`:**
   - **Version:** 1.0
   - **Manifest location:** `s3://{R2_BUCKET}/manifests/{slug}.json`
   - **Schema:** full JSON schema with field descriptions
   - **Trigger:** Payload afterChange hook when `video.enabled && status === 'published'`
   - **Consumer contract:** video-factory reads R2 directly, no API calls
   - **Versioning policy:** `treeIdentityVersion` field; backward-compatible additions only; breaking changes bump major version
   - **Error handling:** manifest upload failures are non-blocking; video-factory should handle missing manifests gracefully

4. **Create `docs/site-config-reference.md`:**
   - Full field table: field name, type, default, description
   - Sections: Identity, Author, Social Links, Theme, Features, R2
   - Example complete config
   - How theme CSS variables propagate to UI

## Todo List

- [ ] Create `vercel.json`
- [ ] Create `README.md`
- [ ] Create `docs/video-factory-contract.md`
- [ ] Create `docs/site-config-reference.md`
- [ ] Verify deploy button URL works (paste in browser)
- [ ] Verify README renders correctly on GitHub

## Success Criteria
- Clicking Vercel deploy button opens Vercel with correct env var prompts
- README provides clear path from zero to running site in < 15 min
- Video-factory contract doc is sufficient for video-factory team to implement consumer
- Site-config reference covers all fields with examples

## Risk Assessment
- **Deploy button env vars:** If any required env var is missing, Vercel build fails. Make only truly required vars `required: true` (DATABASE_URL, PAYLOAD_SECRET, SITE_URL)
- **Stale docs:** If schema changes in code but docs not updated. Mitigate: reference docs in PR template checklist

## Security Considerations
- Deploy button: sensitive env vars (DB password, R2 keys) entered manually in Vercel UI, never in URL
- README: never include actual credentials in examples
- `.env.example` contains only placeholder values

## Next Steps
- Publish `create-tree-id` to npm
- Set up CI/CD pipeline (GitHub Actions)
- Phase 2 planning: Zettelkasten backlinks, theme engine, TinaCMS upgrade
