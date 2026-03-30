# Phase 1 — Section Duplicate

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 30min
- **Description:** Add "Duplicate" button to section card header. Deep-clones section data and inserts copy immediately below the original.

## Context
- `landing-section-card.tsx` (163 lines) — card header has: drag handle, expand chevron, label, enabled toggle, up/down buttons, layout move dropdown, remove button
- `landing-page-editor.tsx` (535 lines) — manages `config.sections[]`, already has `addSection()`, `removeSection()`, `moveSection()`

## Requirements
1. New `onDuplicate` callback prop on `LandingSectionCard`
2. Button placed between move-down (↓) and the layout dropdown (→ Col)
3. Deep clone via `structuredClone(section)` — avoids shared references in nested arrays (items[], children[])
4. Cloned section inserted at `index + 1` in the sections array
5. Auto-select (expand) the new cloned section after insertion

## Related Code Files
- **Modify:** `src/components/admin/landing/landing-section-card.tsx` — add duplicate button + `onDuplicate` prop
- **Modify:** `src/components/admin/landing/landing-page-editor.tsx` — add `duplicateSection()` handler, pass to card

## Implementation Steps

1. **`landing-section-card.tsx`** — Add `onDuplicate` to Props interface:
   ```ts
   onDuplicate: () => void
   ```

2. Add duplicate button after the ↓ move button (line ~114), before layout select:
   ```tsx
   <button
     type="button"
     onClick={(e) => { e.stopPropagation(); onDuplicate() }}
     style={{ padding: '2px 6px', fontSize: '0.7rem', background: '#f0f9ff', color: '#3b82f6', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
     title="Duplicate section"
   >⧉</button>
   ```

3. **`landing-page-editor.tsx`** — Add `duplicateSection` function:
   ```ts
   function duplicateSection(index: number) {
     setConfig((c) => {
       const clone = structuredClone(c.sections[index])
       const sections = [...c.sections]
       sections.splice(index + 1, 0, clone)
       return { ...c, sections }
     })
     setSelectedSectionIdx(index + 1)
   }
   ```

4. Pass `onDuplicate={() => duplicateSection(i)}` to each `<LandingSectionCard>` in the map.

## Todo
- [ ] Add `onDuplicate` prop to `LandingSectionCard`
- [ ] Add duplicate button in card header
- [ ] Add `duplicateSection()` in editor
- [ ] Pass callback to card components
- [ ] Test: duplicate a section with nested items (features, pricing) — verify independent editing

## Success Criteria
- Clicking duplicate creates an identical section below
- Editing the clone does not affect the original (deep clone verified)
- Cloned section auto-expands for immediate editing

## Risk Assessment
- **Low risk.** Pure UI addition, no API changes, no persistence format changes.
