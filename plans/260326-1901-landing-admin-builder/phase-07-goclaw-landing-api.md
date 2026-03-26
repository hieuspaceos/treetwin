# Phase 7: GoClaw Landing API

## Context Links
- GoClaw auth: `src/lib/goclaw/api-auth.ts`
- Existing GoClaw endpoints: `src/pages/api/goclaw/`
- Feature guard: `src/lib/admin/feature-guard.ts`
- Landing config reader: `src/lib/landing/landing-config-reader.ts` (Phase 2)
- Entity IO: `src/lib/admin/entity-io.ts` (Phase 5)
- AI setup generator: `src/lib/landing/ai-setup-generator.ts` (Phase 6)
- GoClaw docs: `docs/system-architecture.md`

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 4h
- **Depends on:** Phase 2, Phase 5
- **Description:** GoClaw REST API endpoints for landing pages, sections, entities, templates, and AI setup. Enables GoClaw Hub to dispatch AI agents to work on individual modules in parallel.

## Key Insights
- Every endpoint follows existing GoClaw pattern: Bearer auth + feature guard + JSON response
- Landing section endpoints operate on individual sections within a landing page (not the whole page)
- Entity endpoints are generic -- work for any user-defined entity type
- All GoClaw writes forced to `status: draft` (same as existing content API)
- Setup endpoint wraps same Gemini integration as admin wizard
- Endpoint design maps to GoClaw Hub orchestration: 1 section = 1 agent task

## Requirements

### Functional

**Landing endpoints:**
- `GET /api/goclaw/landing/config` -- read full landing page config (defaults to `home`)
- `PUT /api/goclaw/landing/config` -- update full landing page config
- `GET /api/goclaw/landing/sections` -- list all sections for a landing page
- `GET /api/goclaw/landing/sections/[id]` -- read a specific section by index/type
- `PUT /api/goclaw/landing/sections/[id]` -- update a specific section's data
- `POST /api/goclaw/landing/sections` -- add a new section
- `DELETE /api/goclaw/landing/sections/[id]` -- remove a section

**Entity endpoints:**
- `GET /api/goclaw/entities` -- list all entity definitions
- `GET /api/goclaw/entities/[name]` -- list instances of an entity
- `POST /api/goclaw/entities/[name]` -- create entity instance
- `GET /api/goclaw/entities/[name]/[slug]` -- read entity instance
- `PUT /api/goclaw/entities/[name]/[slug]` -- update entity instance
- `DELETE /api/goclaw/entities/[name]/[slug]` -- delete entity instance

**Template endpoints:**
- `GET /api/goclaw/templates` -- list available templates
- `GET /api/goclaw/templates/[name]` -- read template config

**Setup endpoint:**
- `POST /api/goclaw/setup` -- AI-powered landing page generation from description

### Non-functional
- All endpoints: `prerender = false` (server-side)
- Bearer token auth on every endpoint
- Feature guard: `goclaw` feature must be enabled
- JSON responses with `{ ok, data?, error? }` envelope
- Rate-safe: no expensive operations, just YAML read/write

## Architecture

### Endpoint File Structure
```
src/pages/api/goclaw/
  landing/
    config.ts                  -- GET/PUT full config
    sections/
      index.ts                 -- GET list / POST add
      [id].ts                  -- GET/PUT/DELETE individual section
  entities/
    index.ts                   -- GET list definitions
    [name]/
      index.ts                 -- GET list / POST create instance
      [slug].ts                -- GET/PUT/DELETE instance
  templates/
    index.ts                   -- GET list
    [name].ts                  -- GET read
  setup.ts                     -- POST AI setup
```

### Section ID Strategy

Sections are identified by their **index in the sections array** (0-based). This is simpler than generating unique IDs for YAML items.

Alternative: use `type` as identifier (but allows only one section per type). Decision: use **index** since users might want multiple sections of same type (e.g., two CTA sections).

Query param `?page=home` selects which landing page to operate on (defaults to `home`).

### Landing Config Endpoint

```typescript
// src/pages/api/goclaw/landing/config.ts
import type { APIRoute } from 'astro'
import { checkFeatureEnabled } from '@/lib/admin/feature-guard'
import { verifyGoclawApiKey } from '@/lib/goclaw/api-auth'
import { getContentIO } from '@/lib/admin/content-io'

export const prerender = false

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** GET /api/goclaw/landing/config?page=home */
export const GET: APIRoute = async ({ request, url }) => {
  const fc = checkFeatureEnabled('goclaw')
  if (!fc.enabled) return fc.response
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response

  const page = url.searchParams.get('page') || 'home'
  const io = getContentIO()
  const config = await io.readEntry('landing-pages' as any, page)
  if (!config) return json({ ok: false, error: 'Landing page not found' }, 404)

  return json({ ok: true, data: config })
}

/** PUT /api/goclaw/landing/config?page=home */
export const PUT: APIRoute = async ({ request, url }) => {
  const fc = checkFeatureEnabled('goclaw')
  if (!fc.enabled) return fc.response
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response

  const page = url.searchParams.get('page') || 'home'
  try {
    const body = await request.json()
    const io = getContentIO()
    await io.writeEntry('landing-pages' as any, page, { slug: page, ...body } as any)
    return json({ ok: true, data: { slug: page } })
  } catch {
    return json({ ok: false, error: 'Failed to update config' }, 500)
  }
}
```

### Section Endpoints

```typescript
// src/pages/api/goclaw/landing/sections/[id].ts

/** GET -- read section by index */
export const GET: APIRoute = async ({ params, request, url }) => {
  // ... auth checks
  const page = url.searchParams.get('page') || 'home'
  const id = parseInt(params.id!, 10)

  const io = getContentIO()
  const config = await io.readEntry('landing-pages' as any, page)
  if (!config?.sections?.[id]) {
    return json({ ok: false, error: 'Section not found' }, 404)
  }

  return json({ ok: true, data: config.sections[id] })
}

/** PUT -- update section data by index */
export const PUT: APIRoute = async ({ params, request, url }) => {
  // ... auth checks
  const page = url.searchParams.get('page') || 'home'
  const id = parseInt(params.id!, 10)
  const body = await request.json()

  const io = getContentIO()
  const config = await io.readEntry('landing-pages' as any, page) as any
  if (!config?.sections?.[id]) {
    return json({ ok: false, error: 'Section not found' }, 404)
  }

  // Merge: keep type/order/enabled, update data
  config.sections[id] = {
    ...config.sections[id],
    ...body,
    type: config.sections[id].type, // prevent type change
  }

  await io.writeEntry('landing-pages' as any, page, config)
  return json({ ok: true, data: config.sections[id] })
}

/** DELETE -- remove section by index */
export const DELETE: APIRoute = async ({ params, request, url }) => {
  // ... auth checks
  const page = url.searchParams.get('page') || 'home'
  const id = parseInt(params.id!, 10)

  const io = getContentIO()
  const config = await io.readEntry('landing-pages' as any, page) as any
  if (!config?.sections?.[id]) {
    return json({ ok: false, error: 'Section not found' }, 404)
  }

  config.sections.splice(id, 1)
  // Reindex order
  config.sections.forEach((s: any, i: number) => { s.order = i + 1 })

  await io.writeEntry('landing-pages' as any, page, config)
  return json({ ok: true })
}
```

### Entity Endpoints

```typescript
// src/pages/api/goclaw/entities/[name]/index.ts
import {
  getEntityDefinition,
  listEntityInstances,
  writeEntityInstance,
} from '@/lib/admin/entity-io'
import { slugify, uniqueSlug } from '@/lib/admin/slug'

export const prerender = false

/** GET -- list instances */
export const GET: APIRoute = async ({ params, request }) => {
  // ... auth checks
  const { name } = params
  const def = getEntityDefinition(name!)
  if (!def) return json({ ok: false, error: 'Entity not found' }, 404)

  const instances = listEntityInstances(name!)
  return json({ ok: true, data: { definition: def, entries: instances, total: instances.length } })
}

/** POST -- create instance */
export const POST: APIRoute = async ({ params, request }) => {
  // ... auth checks
  const { name } = params
  const def = getEntityDefinition(name!)
  if (!def) return json({ ok: false, error: 'Entity not found' }, 404)

  const body = await request.json()
  const labelField = def.labelField || def.fields[0]?.name || 'name'
  const slugSource = (body[labelField] || 'item') as string
  const existing = listEntityInstances(name!).map(i => i.slug)
  const slug = uniqueSlug(slugify(slugSource), existing)

  writeEntityInstance(name!, slug, body)
  return json({ ok: true, data: { slug } }, 201)
}
```

### Setup Endpoint

```typescript
// src/pages/api/goclaw/setup.ts
import { generateLandingConfig } from '@/lib/landing/ai-setup-generator'
import { getContentIO } from '@/lib/admin/content-io'

export const prerender = false

/** POST /api/goclaw/setup -- AI-powered landing page generation */
export const POST: APIRoute = async ({ request }) => {
  // ... auth checks (goclaw feature + API key)

  const body = await request.json()
  if (!body.productDescription) {
    return json({ ok: false, error: 'productDescription is required' }, 400)
  }

  const config = await generateLandingConfig({
    productDescription: body.productDescription,
    language: body.language || 'en',
  })

  if (!config) {
    return json({ ok: false, error: 'AI generation failed' }, 500)
  }

  // Optionally auto-save if saveLandingPage flag is set
  if (body.save) {
    const io = getContentIO()
    const slug = config.slug || 'generated'
    await io.writeEntry('landing-pages' as any, slug, {
      slug,
      title: config.title,
      sections: config.sections,
    } as any)
    config.slug = slug
  }

  return json({ ok: true, data: config })
}
```

### GoClaw Hub Orchestration Pattern

```
Hub receives: "Create landing page for chatbot SaaS"
  |
  v
POST /api/goclaw/setup { productDescription: "...", save: true }
  -> Returns config with slug "chatbot-saas"
  |
  v (parallel dispatches)
  |
  +-> Agent 1: PUT /api/goclaw/landing/sections/0?page=chatbot-saas
  |   Body: { data: { headline: "refined hero headline", ... } }
  |
  +-> Agent 2: PUT /api/goclaw/landing/sections/1?page=chatbot-saas
  |   Body: { data: { items: [refined feature list] } }
  |
  +-> Agent 3: PUT /api/goclaw/landing/sections/2?page=chatbot-saas
  |   Body: { data: { plans: [refined pricing] } }
  |
  +-> Agent 4: PUT /api/goclaw/landing/sections/4?page=chatbot-saas
  |   Body: { data: { items: [generated FAQ] } }
  |
  v
Hub: GET /api/goclaw/landing/config?page=chatbot-saas
  -> Verify all sections populated
  -> Human reviews in admin at /admin/landing/chatbot-saas
  -> Publish
```

## Related Code Files

### Create
- `src/pages/api/goclaw/landing/config.ts` -- GET/PUT full landing config
- `src/pages/api/goclaw/landing/sections/index.ts` -- GET list / POST add section
- `src/pages/api/goclaw/landing/sections/[id].ts` -- GET/PUT/DELETE individual section
- `src/pages/api/goclaw/entities/index.ts` -- GET list entity definitions
- `src/pages/api/goclaw/entities/[name]/index.ts` -- GET list / POST create instance
- `src/pages/api/goclaw/entities/[name]/[slug].ts` -- GET/PUT/DELETE instance
- `src/pages/api/goclaw/templates/index.ts` -- GET list templates
- `src/pages/api/goclaw/templates/[name].ts` -- GET read template
- `src/pages/api/goclaw/setup.ts` -- POST AI setup

### Modify
- `docs/system-architecture.md` -- document new GoClaw endpoints

## Implementation Steps

1. Create landing config endpoint (`config.ts`) with GET/PUT
2. Create sections list endpoint (`sections/index.ts`) with GET/POST
3. Create section detail endpoint (`sections/[id].ts`) with GET/PUT/DELETE
4. Create entity definitions list endpoint (`entities/index.ts`)
5. Create entity instances endpoints (`entities/[name]/index.ts`, `entities/[name]/[slug].ts`)
6. Create templates list endpoint (`templates/index.ts`)
7. Create template detail endpoint (`templates/[name].ts`)
8. Create setup endpoint (`setup.ts`) with Gemini integration
9. Test all endpoints with `curl` or API client:
   - Landing CRUD: create page, add sections, read, update section, delete section
   - Entity CRUD: list definitions, create instance, read, update, delete
   - Templates: list, read individual
   - Setup: generate from description
10. Update GoClaw documentation in `docs/system-architecture.md`

## Todo List
- [ ] Create landing config GET/PUT endpoint
- [ ] Create sections list/add endpoints
- [ ] Create section detail GET/PUT/DELETE endpoint
- [ ] Create entity definitions list endpoint
- [ ] Create entity instances list/create endpoint
- [ ] Create entity instance GET/PUT/DELETE endpoint
- [ ] Create templates list endpoint
- [ ] Create template detail endpoint
- [ ] Create AI setup endpoint
- [ ] Test all endpoints with curl
- [ ] Update documentation

## Success Criteria
- All 17 endpoints functional with proper auth
- Section endpoints allow parallel agent writes without conflicts
- Entity endpoints work for any user-defined entity type
- Setup endpoint generates valid landing config from description
- All endpoints return consistent `{ ok, data?, error? }` format
- Feature guard blocks when `goclaw` feature is disabled
- Existing GoClaw endpoints unaffected

## Risk Assessment
- **Risk:** Concurrent section writes cause race conditions -> **Mitigation:** sections identified by index; Hub should serialize writes to same page or use section-level locking (future)
- **Risk:** Entity name injection -> **Mitigation:** validate entity name as valid slug, check definition exists before any operation
- **Risk:** Large YAML files for pages with many sections -> **Mitigation:** unlikely to exceed 50KB even with 10 sections; YAML handles this fine

## Security Considerations
- Bearer token auth on every endpoint (existing `verifyGoclawApiKey`)
- Feature guard check (`checkFeatureEnabled('goclaw')`)
- Entity names validated against existing definitions (no arbitrary file access)
- Section index bounds-checked before access
- Landing page slugs validated with `isValidSlug`
