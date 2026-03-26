# Phase 8: Feature Registry Integration

## Context Links
- Feature registry: `src/lib/admin/feature-registry.ts`
- Feature guard: `src/lib/admin/feature-guard.ts`
- Admin layout: `src/components/admin/admin-layout.tsx`
- Admin sidebar: `src/components/admin/admin-sidebar.tsx`
- Schema registry: `src/lib/admin/schema-registry.ts`
- Validation: `src/lib/admin/validation.ts`
- Site settings: `src/content/site-settings.yaml`
- Settings editor: `src/components/admin/settings-editor.tsx`

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 4h
- **Depends on:** Phase 1-7
- **Description:** Register all new modules in feature-registry so they appear in admin Settings toggle panel and can be independently enabled/disabled.

## Key Insights
- Feature registry is the central toggle mechanism -- every new module MUST register here
- Admin sidebar and routes already consume registry dynamically -- no manual wiring needed per feature
- Feature guard on API endpoints ensures disabled features return 403
- Settings editor already renders checkboxes from `FEATURE_MODULES` array
- New section type: `'landing'` for landing-related features in sidebar grouping
- Custom entities are special: each entity type is a sub-feature, but the entity system itself is one feature toggle

## Requirements

### Functional
- Register 4 new feature modules:
  1. `landing` -- Landing page system (sections, renderer, templates)
  2. `entities` -- Custom entity system
  3. `setup-wizard` -- AI setup wizard
  4. `landing-api` -- GoClaw landing/entity/setup endpoints (separate from base `goclaw` toggle)
- Each module shows in Settings with description and env check
- Each module can be toggled on/off independently
- Disabled modules: hide from sidebar, block API routes, remove admin routes

### Non-functional
- No breaking changes to existing features
- Backward compatible -- existing `enabledFeatures` in site-settings.yaml continues to work
- New features default to `true` (enabled) when key missing in settings

## Architecture

### New Feature Module Registrations

```typescript
// Add to FEATURE_MODULES array in feature-registry.ts

{
  id: 'landing',
  label: 'Landing Pages',
  description: 'Modular landing page builder with section components and templates',
  section: 'content',
  iconKey: 'layout',
  routes: [
    {
      path: '/landing',
      component: () => import('@/components/admin/landing/landing-pages-list').then(m => ({ default: m.LandingPagesList })),
    },
    {
      path: '/landing/new',
      component: () => import('@/components/admin/landing/landing-page-editor').then(m => ({ default: m.LandingPageEditor })),
    },
    {
      path: '/landing/:slug',
      component: () => import('@/components/admin/landing/landing-page-editor').then(m => ({ default: m.LandingPageEditor })),
    },
  ],
  navItems: [{ href: '/landing', label: 'Landing Pages', iconKey: 'layout' }],
},
{
  id: 'entities',
  label: 'Custom Entities',
  description: 'Dynamic data types with YAML schema definitions and auto-generated admin CRUD',
  section: 'content',
  iconKey: 'database',
  routes: [
    {
      path: '/entity-definitions',
      component: () => import('@/components/admin/entities/entity-definitions-page').then(m => ({ default: m.EntityDefinitionsPage })),
    },
    {
      path: '/entities/:name',
      component: () => import('@/components/admin/entities/entity-list-page').then(m => ({ default: m.EntityListPage })),
    },
    {
      path: '/entities/:name/new',
      component: () => import('@/components/admin/entities/entity-editor-page').then(m => ({ default: m.EntityEditorPage })),
    },
    {
      path: '/entities/:name/:slug',
      component: () => import('@/components/admin/entities/entity-editor-page').then(m => ({ default: m.EntityEditorPage })),
    },
  ],
  navItems: [
    { href: '/entity-definitions', label: 'Entities', iconKey: 'database' },
  ],
},
{
  id: 'setup-wizard',
  label: 'AI Setup Wizard',
  description: 'AI-powered landing page generator from product description (requires Gemini)',
  section: 'system',
  iconKey: 'sparkles',
  envCheck: ['GEMINI_API_KEY'],
  routes: [
    {
      path: '/setup',
      component: () => import('@/components/admin/landing/landing-setup-wizard').then(m => ({ default: m.LandingSetupWizard })),
    },
  ],
  navItems: [{ href: '/setup', label: 'AI Setup', iconKey: 'sparkles' }],
},
```

Note: `landing-api` does NOT need a separate feature module -- it piggybacks on the existing `goclaw` feature toggle. The GoClaw landing endpoints check `checkFeatureEnabled('goclaw')` which is already registered.

### New Icons for Sidebar

```typescript
// Add to icons object in admin-sidebar.tsx
layout: (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
),
sparkles: (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
    <path d="M18 14l.67 2.33L21 17l-2.33.67L18 20l-.67-2.33L15 17l2.33-.67L18 14z" />
  </svg>
),
```

### Admin Layout Route Integration

The feature-registry's `routes` array is not yet dynamically consumed by admin-layout -- routes are currently hard-coded with lazy imports. Two approaches:

**Option A (KISS, recommended):** Continue hard-coding lazy routes in admin-layout, gated by `isFeatureEnabled()`. Consistent with existing pattern.

**Option B (dynamic):** Build a dynamic route renderer from feature-registry routes. More elegant but adds complexity.

**Decision: Option A** -- matches existing codebase pattern. Add new routes same way as existing feature routes.

```tsx
// In admin-layout.tsx, add after existing feature routes:

{/* Landing pages -- gated */}
{isFeatureEnabled('landing', ef) && (
  <>
    <Route path="/landing">
      <Suspense fallback={<RouteLoading />}><LazyLandingList /></Suspense>
    </Route>
    <Route path="/landing/new">
      <Suspense fallback={<RouteLoading />}><LazyLandingEditor /></Suspense>
    </Route>
    <Route path="/landing/:slug">
      {(params) => (
        <Suspense fallback={<RouteLoading />}><LazyLandingEditor slug={params.slug} /></Suspense>
      )}
    </Route>
  </>
)}

{/* Custom entities -- gated */}
{isFeatureEnabled('entities', ef) && (
  <>
    <Route path="/entity-definitions">
      <Suspense fallback={<RouteLoading />}><LazyEntityDefs /></Suspense>
    </Route>
    <Route path="/entities/:name">
      {(params) => (
        <Suspense fallback={<RouteLoading />}><LazyEntityList entityName={params.name} /></Suspense>
      )}
    </Route>
    <Route path="/entities/:name/new">
      {(params) => (
        <Suspense fallback={<RouteLoading />}><LazyEntityEditor entityName={params.name} /></Suspense>
      )}
    </Route>
    <Route path="/entities/:name/:slug">
      {(params) => (
        <Suspense fallback={<RouteLoading />}><LazyEntityEditor entityName={params.name} slug={params.slug} /></Suspense>
      )}
    </Route>
  </>
)}

{/* AI Setup Wizard -- gated */}
{isFeatureEnabled('setup-wizard', ef) && (
  <Route path="/setup">
    <Suspense fallback={<RouteLoading />}><LazySetupWizard /></Suspense>
  </Route>
)}
```

### Feature Guard on API Routes

Every admin and GoClaw API endpoint for landing/entities must check feature status:

```typescript
// Admin endpoints check their specific feature:
const fc = checkFeatureEnabled('landing')
if (!fc.enabled) return fc.response

// GoClaw endpoints check 'goclaw' (already existing):
const fc = checkFeatureEnabled('goclaw')
if (!fc.enabled) return fc.response
```

### Validation Updates

```typescript
// src/lib/admin/validation.ts
export const ALLOWED_COLLECTIONS = [
  'articles', 'notes', 'records', 'categories', 'voices',
  'landing-pages',  // NEW
] as const

export const ALLOWED_SINGLETONS = ['site-settings'] as const
```

### Schema Registry Updates

```typescript
// src/lib/admin/schema-registry.ts
// Add landing-pages "collection" schema for admin form rendering
collectionSchemas['landing-pages'] = [
  { name: 'title', type: 'text', label: 'Page Title', required: true },
  { name: 'description', type: 'textarea', label: 'Description' },
  { name: 'template', type: 'select', label: 'Template', options: [
    { label: 'SaaS', value: 'saas' },
    { label: 'Agency', value: 'agency' },
    { label: 'Course', value: 'course' },
    { label: 'E-commerce', value: 'ecommerce' },
    { label: 'Portfolio', value: 'portfolio' },
  ]},
  // Sections are managed via dedicated section editor, not generic form fields
]
```

### Dynamic Entity Sidebar Items

Custom entities need dynamic nav items (fetched at runtime, not static in registry).

```tsx
// In admin-sidebar.tsx
// After <FeatureNavItems features={sections.content} collapsed={collapsed} />

{isFeatureEnabled('entities', enabledFeatures) && entityDefs.map(def => (
  <NavItem
    key={`entity-${def.name}`}
    href={`/entities/${def.name}`}
    icon={icons[def.icon] || icons.database}
    label={def.label}
    collapsed={collapsed}
  />
))}
```

The sidebar fetches entity definitions on mount:

```tsx
const [entityDefs, setEntityDefs] = useState<EntityDefinition[]>([])
useEffect(() => {
  if (isFeatureEnabled('entities', enabledFeatures)) {
    fetch('/api/admin/entity-definitions')
      .then(r => r.json())
      .then(res => { if (res.ok) setEntityDefs(res.data?.definitions || []) })
  }
}, [enabledFeatures])
```

## Related Code Files

### Modify
- `src/lib/admin/feature-registry.ts` -- add 3 new feature modules + types
- `src/lib/admin/feature-guard.ts` -- no changes needed (generic, works for any feature ID)
- `src/components/admin/admin-layout.tsx` -- add lazy imports + routes for landing, entities, setup
- `src/components/admin/admin-sidebar.tsx` -- add new icons + dynamic entity nav items
- `src/lib/admin/schema-registry.ts` -- add `landing-pages` collection schema
- `src/lib/admin/validation.ts` -- add `'landing-pages'` to ALLOWED_COLLECTIONS
- `src/content/site-settings.yaml` -- optionally add new feature defaults
- All admin API endpoints for landing/entities -- add `checkFeatureEnabled()` calls

### Create
- None (this phase wires existing code together)

## Implementation Steps

1. Add 3 new feature modules to `FEATURE_MODULES` in `feature-registry.ts`:
   - `landing`, `entities`, `setup-wizard`
2. Add new icons (`layout`, `sparkles`) to `admin-sidebar.tsx` icons object
3. Add lazy imports to `admin-layout.tsx`:
   ```tsx
   const LazyLandingList = lazy(() => import('./landing/landing-pages-list'))
   const LazyLandingEditor = lazy(() => import('./landing/landing-page-editor'))
   const LazyEntityDefs = lazy(() => import('./entities/entity-definitions-page'))
   const LazyEntityList = lazy(() => import('./entities/entity-list-page'))
   const LazyEntityEditor = lazy(() => import('./entities/entity-editor-page'))
   const LazySetupWizard = lazy(() => import('./landing/landing-setup-wizard'))
   ```
4. Add gated routes to admin-layout Switch block
5. Add dynamic entity nav items to admin-sidebar
6. Update `ALLOWED_COLLECTIONS` in `validation.ts`
7. Add `landing-pages` schema to `schema-registry.ts`
8. Add `checkFeatureEnabled('landing')` guard to all landing admin API endpoints
9. Add `checkFeatureEnabled('entities')` guard to all entity admin API endpoints
10. Add `checkFeatureEnabled('setup-wizard')` guard to setup admin API endpoint
11. Test feature toggles:
    - Disable `landing` in settings -> sidebar hides Landing Pages, API returns 403
    - Disable `entities` -> sidebar hides entity items, API returns 403
    - Disable `setup-wizard` -> sidebar hides AI Setup, API returns 403
    - Enable all -> everything accessible
12. Verify existing features unaffected (articles, notes, records, media, etc.)

## Todo List
- [ ] Add `landing` module to feature-registry
- [ ] Add `entities` module to feature-registry
- [ ] Add `setup-wizard` module to feature-registry
- [ ] Add `layout` and `sparkles` icons to sidebar
- [ ] Add lazy imports to admin-layout
- [ ] Add gated routes to admin-layout
- [ ] Add dynamic entity nav items to sidebar
- [ ] Update ALLOWED_COLLECTIONS in validation.ts
- [ ] Add landing-pages schema to schema-registry
- [ ] Add feature guards to all new admin API endpoints
- [ ] Add feature guards to GoClaw landing/entity endpoints
- [ ] Test toggle on/off for each new feature
- [ ] Verify existing features still work

## Success Criteria
- All 3 new features appear in admin Settings toggle panel
- Toggling off hides nav items + blocks API routes (403)
- Toggling on shows nav items + enables API routes
- Dynamic entity nav items load from definitions
- Existing 7 features unaffected
- `astro build` passes
- No TypeScript errors

## Risk Assessment
- **Risk:** Too many sidebar items clutters nav -> **Mitigation:** group under section headers; collapse entity items under "Entities" parent
- **Risk:** Feature guard cache (5s TTL) causes stale toggle state -> **Mitigation:** acceptable for API; admin UI refreshes settings on save
- **Risk:** admin-layout grows too large with new routes -> **Mitigation:** file is already 164 lines; adding ~30 more is within 200-line budget. If exceeded, extract route blocks into separate file.

## Security Considerations
- Feature guards enforce toggle state server-side (not just UI hiding)
- Admin JWT required for all admin endpoints
- GoClaw Bearer token required for all GoClaw endpoints
- Entity name validation prevents arbitrary file access

## GoClaw Integration Points
- GoClaw landing endpoints already check `goclaw` feature toggle
- No additional GoClaw-specific registration needed
- Hub can query `GET /api/goclaw/health` to discover available features
- Consider adding feature list to health endpoint response for Hub discovery
