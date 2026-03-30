# Phase 2 — Undo/Redo

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 1h
- **Description:** Array-based history stack (last 20 states) tracking `LandingPageConfig`. Ctrl+Z undo, Ctrl+Shift+Z redo. Visual buttons in editor header.

## Context
- `landing-page-editor.tsx` manages all state via `setConfig()` — every section add/remove/move/edit flows through it
- Current Ctrl+S shortcut already exists (lines 99-108) — extend same keydown handler
- Config object is serializable (plain objects/arrays) — safe for `structuredClone`

## Key Insight
Wrap `setConfig` to push to history on every change. Keep it simple — snapshot full config object, not operational transforms.

## Architecture

```
historyRef = useRef<{ past: Config[], future: Config[] }>({ past: [], future: [] })

updateConfig(newConfig)  →  push current to past, clear future, set new
undo()                   →  pop past → set as current, push current to future
redo()                   →  pop future → set as current, push current to past
```

Max 20 entries in `past`. When past exceeds 20, drop oldest (shift).

## Related Code Files
- **Modify:** `src/components/admin/landing/landing-page-editor.tsx` — history state, keyboard handler, undo/redo buttons

## Implementation Steps

1. Add `useRef` for history stack after existing state declarations:
   ```ts
   const historyRef = useRef<{ past: LandingPageConfig[]; future: LandingPageConfig[] }>({ past: [], future: [] })
   ```

2. Create `updateConfig` wrapper that replaces direct `setConfig` calls for user actions:
   ```ts
   function updateConfig(updater: (c: LandingPageConfig) => LandingPageConfig) {
     setConfig((current) => {
       const next = updater(current)
       // Only push to history if config actually changed
       if (JSON.stringify(next) !== JSON.stringify(current)) {
         historyRef.current.past = [...historyRef.current.past.slice(-19), current]
         historyRef.current.future = []
       }
       return next
     })
   }
   ```

3. Add `undo` and `redo` functions:
   ```ts
   function undo() {
     const { past, future } = historyRef.current
     if (past.length === 0) return
     const prev = past[past.length - 1]
     historyRef.current = { past: past.slice(0, -1), future: [configRef.current, ...future].slice(0, 20) }
     setConfig(prev)
   }

   function redo() {
     const { past, future } = historyRef.current
     if (future.length === 0) return
     const next = future[0]
     historyRef.current = { past: [...past, configRef.current].slice(-20), future: future.slice(1) }
     setConfig(next)
   }
   ```

4. Extend keyboard handler (line ~100) to catch Ctrl+Z / Ctrl+Shift+Z:
   ```ts
   if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
   if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo() }
   // Also support Ctrl+Y for Windows users
   if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo() }
   ```

5. Add undo/redo buttons in the editor header bar (after "← Back", before title):
   ```tsx
   <button className="admin-btn" onClick={undo} disabled={historyRef.current.past.length === 0}
     title="Undo (Ctrl+Z)" style={{ fontSize: '0.8rem', opacity: historyRef.current.past.length === 0 ? 0.4 : 1 }}>↩</button>
   <button className="admin-btn" onClick={redo} disabled={historyRef.current.future.length === 0}
     title="Redo (Ctrl+Shift+Z)" style={{ fontSize: '0.8rem', opacity: historyRef.current.future.length === 0 ? 0.4 : 1 }}>↪</button>
   ```

6. Replace all direct `setConfig(...)` calls in user-action functions with `updateConfig(...)`:
   - `updateSection` — uses `updateConfig`
   - `moveSection` — uses `updateConfig`
   - `removeSection` — uses `updateConfig`
   - `toggleSection` — uses `updateConfig`
   - `addSection` — uses `updateConfig`
   - `moveToLayout` — uses `updateConfig`
   - `handleDragEnd` — uses `updateConfig`
   - Keep `setConfig` for initial load (useEffect) and save response — those shouldn't be undoable

**Note:** `updateConfig` takes an updater function `(c) => newC` to match React's functional setState pattern. The history push happens inside so it captures the "before" state correctly.

## Todo
- [ ] Add history ref
- [ ] Create `updateConfig` wrapper
- [ ] Add `undo()` and `redo()` functions
- [ ] Wire keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y)
- [ ] Add undo/redo buttons to header
- [ ] Replace `setConfig` with `updateConfig` in all user-action functions
- [ ] Test: add section → undo → section removed. Redo → section back.
- [ ] Test: 21+ changes → verify oldest dropped (max 20)

## Success Criteria
- Ctrl+Z undoes last config change, Ctrl+Shift+Z redoes
- Buttons show disabled state when stack is empty
- History resets `future` on new action (standard behavior)
- Max 20 history entries — no memory leak
- Initial load and save response don't pollute history

## Risk Assessment
- **Medium risk.** Replacing all `setConfig` calls is mechanical but needs care. Miss one = that action isn't undoable.
- **Mitigation:** Search for all `setConfig(` calls in the file, categorize as user-action vs system, replace user-action ones.
