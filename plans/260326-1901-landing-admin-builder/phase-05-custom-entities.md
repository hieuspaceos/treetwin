# Phase 5: Custom Entities

## Context Links
- Content IO: `src/lib/admin/content-io.ts`, `src/lib/admin/content-io-local.ts`
- Schema registry: `src/lib/admin/schema-registry.ts`
- Validation: `src/lib/admin/validation.ts`
- Content list: `src/components/admin/content-list.tsx`
- Content editor: `src/components/admin/content-editor.tsx`
- Feature registry: `src/lib/admin/feature-registry.ts`

## Overview
- **Priority:** P2
- **Status:** Pending
- **Effort:** 5h
- **Depends on:** Phase 2 (content-io patterns)
- **Description:** Dynamic entity system -- user defines custom data types via YAML schema, gets admin CRUD + GoClaw API automatically.

## Key Insights
- Custom entities reuse existing ContentList + ContentEditor components -- the schema-registry pattern already supports dynamic field rendering
- Entity definitions are YAML files that describe fields (like a lightweight CMS schema)
- Entity instances (data) stored as individual YAML files in `src/content/custom-entities/[entity-name]/`
- No code generation needed -- admin components read entity schema at runtime and render appropriate form fields
- Key difference from collections: entities are user-defined, not hard-coded in `content.config.ts`
- Entity data is NOT registered as Astro content collections (too dynamic) -- read via content-io directly

## Requirements

### Functional
- Define custom entity types via YAML schema files in `src/content/entity-definitions/`
- Each entity definition specifies: name, label, icon, fields (with types)
- Admin CRUD pages auto-generated from entity definition
- Entity instances stored in `src/content/entities/[entity-name]/*.yaml`
- Supported field types: text, textarea, select, checkbox, date, number, array, email, url
- GoClaw API endpoints for each entity

### Non-functional
- Entity definitions validated on load (catch schema errors)
- Max 20 custom entities (prevent abuse)
- Entity names must be valid slugs (path-safe)
- No Astro content collection registration needed (server-side only)

## Architecture

### Entity Definition Schema

```yaml
# src/content/entity-definitions/customers.yaml
name: customers
label: Customers
icon: users
labelField: email  # which field to show as title in list view
fields:
  - name: email
    type: email
    label: Email
    required: true
  - name: name
    type: text
    label: Full Name
    required: true
  - name: plan
    type: select
    label: Plan
    options:
      - { label: "Starter", value: "starter" }
      - { label: "Pro", value: "pro" }
      - { label: "Enterprise", value: "enterprise" }
  - name: status
    type: select
    label: Status
    options:
      - { label: "Active", value: "active" }
      - { label: "Trial", value: "trial" }
      - { label: "Churned", value: "churned" }
  - name: signupDate
    type: date
    label: Signup Date
  - name: notes
    type: textarea
    label: Notes
```

### Entity Instance Data

```yaml
# src/content/entities/customers/john-doe.yaml
email: john@example.com
name: John Doe
plan: pro
status: active
signupDate: "2026-03-15"
notes: "Upgraded from starter after 2 weeks trial"
```

### Entity IO Module

```typescript
// src/lib/admin/entity-io.ts
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import { slugify, uniqueSlug } from './slug'

export interface EntityDefinition {
  name: string
  label: string
  icon: string
  labelField?: string
  fields: EntityFieldDef[]
}

export interface EntityFieldDef {
  name: string
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'number' | 'array' | 'email' | 'url'
  label: string
  required?: boolean
  options?: Array<{ label: string; value: string }>
  defaultValue?: unknown
}

const DEFS_DIR = 'src/content/entity-definitions'
const DATA_DIR = 'src/content/entities'

/** List all entity definitions */
export function listEntityDefinitions(basePath = process.cwd()): EntityDefinition[] {
  const dir = path.join(basePath, DEFS_DIR)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.yaml'))
    .map(f => yaml.load(fs.readFileSync(path.join(dir, f), 'utf-8')) as EntityDefinition)
    .filter(d => d?.name && d?.fields)
}

/** Get a single entity definition by name */
export function getEntityDefinition(name: string, basePath = process.cwd()): EntityDefinition | null {
  const filePath = path.join(basePath, DEFS_DIR, `${name}.yaml`)
  if (!fs.existsSync(filePath)) return null
  return yaml.load(fs.readFileSync(filePath, 'utf-8')) as EntityDefinition
}

/** List all instances of an entity */
export function listEntityInstances(entityName: string, basePath = process.cwd()): Array<Record<string, unknown> & { slug: string }> {
  const dir = path.join(basePath, DATA_DIR, entityName)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.yaml'))
    .map(f => {
      const slug = f.replace('.yaml', '')
      const data = yaml.load(fs.readFileSync(path.join(dir, f), 'utf-8')) as Record<string, unknown>
      return { slug, ...data }
    })
}

/** Read a single entity instance */
export function readEntityInstance(entityName: string, slug: string, basePath = process.cwd()): Record<string, unknown> | null {
  const filePath = path.join(basePath, DATA_DIR, entityName, `${slug}.yaml`)
  if (!fs.existsSync(filePath)) return null
  return yaml.load(fs.readFileSync(filePath, 'utf-8')) as Record<string, unknown>
}

/** Write an entity instance */
export function writeEntityInstance(entityName: string, slug: string, data: Record<string, unknown>, basePath = process.cwd()): void {
  const dir = path.join(basePath, DATA_DIR, entityName)
  fs.mkdirSync(dir, { recursive: true })
  const { slug: _, ...rest } = data
  fs.writeFileSync(path.join(dir, `${slug}.yaml`), yaml.dump(rest, { lineWidth: 120 }))
}

/** Delete an entity instance */
export function deleteEntityInstance(entityName: string, slug: string, basePath = process.cwd()): boolean {
  const filePath = path.join(basePath, DATA_DIR, entityName, `${slug}.yaml`)
  if (!fs.existsSync(filePath)) return false
  fs.unlinkSync(filePath)
  return true
}
```

### Admin API Endpoints

```
GET    /api/admin/entities                    -- list entity definitions
GET    /api/admin/entities/[name]             -- list instances of entity
POST   /api/admin/entities/[name]             -- create instance
GET    /api/admin/entities/[name]/[slug]      -- read instance
PUT    /api/admin/entities/[name]/[slug]      -- update instance
DELETE /api/admin/entities/[name]/[slug]      -- delete instance
GET    /api/admin/entity-definitions          -- list definitions (for admin form generation)
POST   /api/admin/entity-definitions          -- create new entity type
PUT    /api/admin/entity-definitions/[name]   -- update entity definition
DELETE /api/admin/entity-definitions/[name]   -- delete entity type
```

### Admin Component Strategy

**Key insight:** Reuse existing `ContentList` and `ContentEditor` by making them entity-aware.

Option A (KISS, recommended): Create thin wrapper components that convert entity definitions to schema-registry format and delegate to existing components.

```typescript
// Convert EntityDefinition fields to FieldSchema format
function entityFieldsToSchema(def: EntityDefinition): FieldSchema[] {
  return def.fields.map(f => ({
    name: f.name,
    type: f.type === 'email' || f.type === 'url' || f.type === 'number' ? 'text' : f.type,
    label: f.label,
    required: f.required,
    options: f.options,
    defaultValue: f.defaultValue,
  }))
}
```

Option B: New dedicated entity list/editor components. More flexible but more code.

**Decision: Option A** -- maximizes code reuse, aligns with KISS/DRY. Add `entityName` prop to ContentList/ContentEditor and make them check entity definitions when `collection` is not a standard collection.

### Sidebar Integration

Dynamic nav items for enabled custom entities:

```typescript
// In admin-sidebar.tsx, after standard content items
{entityDefs.map(def => (
  <NavItem
    key={def.name}
    href={`/entities/${def.name}`}
    icon={icons[def.icon] || icons.database}
    label={def.label}
    collapsed={collapsed}
  />
))}
```

## Related Code Files

### Create
- `src/lib/admin/entity-io.ts` -- entity CRUD operations (definitions + instances)
- `src/content/entity-definitions/` -- directory for entity schemas
- `src/content/entities/` -- directory for entity data
- `src/pages/api/admin/entities/index.ts` -- list definitions
- `src/pages/api/admin/entities/[name]/index.ts` -- list + create instances
- `src/pages/api/admin/entities/[name]/[slug].ts` -- read + update + delete instance
- `src/pages/api/admin/entity-definitions/index.ts` -- CRUD entity definitions
- `src/components/admin/entities/entity-list-page.tsx` -- wrapper for ContentList with entity support
- `src/components/admin/entities/entity-editor-page.tsx` -- wrapper for ContentEditor with entity support
- `src/components/admin/entities/entity-definitions-page.tsx` -- manage entity types

### Modify
- `src/components/admin/admin-layout.tsx` -- add entity routes
- `src/components/admin/admin-sidebar.tsx` -- add dynamic entity nav items
- `src/lib/admin/api-client.ts` -- add entity API methods

## Implementation Steps

1. Create `src/lib/admin/entity-io.ts` with all CRUD functions
2. Create directories: `src/content/entity-definitions/`, `src/content/entities/`
3. Create sample entity definition `customers.yaml` for testing
4. Create admin API endpoints:
   - `src/pages/api/admin/entity-definitions/index.ts` (GET list, POST create)
   - `src/pages/api/admin/entities/[name]/index.ts` (GET list, POST create instance)
   - `src/pages/api/admin/entities/[name]/[slug].ts` (GET, PUT, DELETE instance)
5. Add entity API methods to `api-client.ts`
6. Create `entity-list-page.tsx` -- fetches entity definition, converts to schema, uses ContentList-like UI
7. Create `entity-editor-page.tsx` -- fetches definition, renders dynamic form from field definitions
8. Create `entity-definitions-page.tsx` -- list/create/edit entity types (admin-only)
9. Add entity routes to `admin-layout.tsx` (lazy-loaded)
10. Add dynamic entity nav items to `admin-sidebar.tsx` (fetch definitions on mount)
11. Create sample data in `customers/` for testing
12. Test full flow: define entity -> create instance -> list -> edit -> delete

## Todo List
- [ ] Create `entity-io.ts` with CRUD functions
- [ ] Create directories + sample definition
- [ ] Create entity definition API endpoints
- [ ] Create entity instance API endpoints
- [ ] Add entity methods to api-client
- [ ] Create entity list page component
- [ ] Create entity editor page component
- [ ] Create entity definitions management page
- [ ] Add routes to admin-layout
- [ ] Add dynamic nav items to sidebar
- [ ] Test full CRUD flow

## Success Criteria
- Can define custom entity types via YAML
- Admin auto-generates list + edit pages from entity definition
- All CRUD operations work (create, read, update, delete instances)
- Entity definitions can be managed from admin UI
- Dynamic sidebar nav shows custom entities
- Data persists as YAML files in git

## Risk Assessment
- **Risk:** Schema changes break existing entity instances -> **Mitigation:** fields are additive; read with defaults for missing fields
- **Risk:** Too many entities degrade admin performance -> **Mitigation:** cap at 20 entity definitions
- **Risk:** Entity names conflict with existing routes -> **Mitigation:** namespace under `/entities/[name]`

## Security Considerations
- Validate entity names as valid slugs (no path traversal)
- Sanitize field values before YAML serialization
- Entity operations require admin auth (JWT session)
- Feature guard gates entire entity system

## GoClaw Integration Points
- `GET /api/goclaw/entities` -- list entity definitions
- `GET /api/goclaw/entities/[name]` -- list instances
- `POST /api/goclaw/entities/[name]` -- create instance (draft)
- `GET /api/goclaw/entities/[name]/[slug]` -- read instance
- `PUT /api/goclaw/entities/[name]/[slug]` -- update instance
- Each entity = independent GoClaw task target for Hub orchestration
