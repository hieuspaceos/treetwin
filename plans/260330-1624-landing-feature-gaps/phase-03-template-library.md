# Phase 3 — Template Library UI

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 2h
- **Description:** Surface existing template YAML collection via "Use Template" button in landing pages list + modal with template previews. On select, create new page pre-filled from template.

## Context
- 5 templates already exist: `src/content/templates/{saas,agency,course,ecommerce,portfolio}.yaml`
- API already available: `api.templates.list()` → list, `api.templates.read(name)` → full YAML
- Template YAML shape: `{ name, description, targetAudience, sections[] }`
- `landing-pages-list.tsx` (214 lines) — has "AI Wizard" + "+ New Page" buttons in header

## Architecture

New component `landing-template-picker.tsx` (~120 lines):
- Modal overlay with template cards
- Each card: name, description, targetAudience, section count
- Click → navigates to `/landing/new` with template data pre-loaded

Integration points:
- `landing-pages-list.tsx` — add "Templates" button, render modal
- `landing-page-editor.tsx` — accept `templateSlug` query param, load template on mount

## Related Code Files
- **Create:** `src/components/admin/landing/landing-template-picker.tsx` — modal component
- **Modify:** `src/components/admin/landing/landing-pages-list.tsx` — add "Templates" button + modal state
- **Modify:** `src/components/admin/landing/landing-page-editor.tsx` — load template sections when `?template=` param present

## Implementation Steps

### Step 1: Template Picker Modal (`landing-template-picker.tsx`)

```tsx
interface TemplateMeta {
  name: string
  description: string
  targetAudience: string
  sectionCount: number
}

interface Props {
  onSelect: (templateName: string) => void
  onClose: () => void
}
```

1. On mount, call `api.templates.list()` to get template metadata
2. Render modal overlay (same pattern as `LandingCloneModal`)
3. Grid of cards — one per template. Show: name (bold), description, targetAudience badge, section count
4. Click card → `onSelect(template.name)`

### Step 2: Wire into Landing Pages List

1. Add state `const [templateOpen, setTemplateOpen] = useState(false)`
2. Add "Templates" button in header between "AI Wizard" and "+ New Page":
   ```tsx
   <button className="admin-btn" onClick={() => setTemplateOpen(true)}>
     Templates
   </button>
   ```
3. Render `{templateOpen && <LandingTemplatePicker onClose={() => setTemplateOpen(false)} onSelect={(name) => navigate(`/landing/new?template=${encodeURIComponent(name)}`)} />}`

### Step 3: Load Template in Editor

1. In `landing-page-editor.tsx`, extract `template` query param from URL:
   ```ts
   const searchParams = new URLSearchParams(window.location.search)
   const templateSlug = searchParams.get('template')
   ```

2. Add `useEffect` for template loading (alongside existing slug-based loading):
   ```ts
   useEffect(() => {
     if (!templateSlug || slug) return  // only for new pages
     api.templates.read(templateSlug).then((res) => {
       if (res.ok && res.data) {
         const tpl = res.data as any
         setConfig(c => ({
           ...c,
           title: tpl.name || '',
           template: templateSlug,
           sections: tpl.sections || [],
         }))
       }
     })
   }, [templateSlug])
   ```

### Step 4: Empty State Enhancement

In `landing-pages-list.tsx`, update the empty state panel to show template cards inline (not just "Create your first page"):
- Show 2-3 template suggestions with one-click start
- Keep "+ New Page" as fallback for blank page

## Todo
- [ ] Create `landing-template-picker.tsx` modal component
- [ ] Add "Templates" button to pages list header
- [ ] Render template picker modal on click
- [ ] Read `?template=` query param in editor
- [ ] Load template data into new page config
- [ ] Enhance empty state with template suggestions
- [ ] Test: select template → verify sections pre-filled → save → page created

## Success Criteria
- "Templates" button visible in landing pages list
- Modal shows all 5 templates with name, description, section count
- Selecting template navigates to new page editor with sections pre-filled
- Template name stored in config as `template` field
- Saving works normally after template load

## Risk Assessment
- **Low risk.** API endpoints exist. Pure UI addition.
- The `api.templates.read()` returns full YAML — sections may not have `enabled` field set. Ensure default `enabled: true` when loading.
