# Phase 3: Clone Pipeline v3 — Layout-First (16h)

## Context
- Current pipeline: fetch HTML -> structure analysis -> content fill per section -> style extraction -> scoped CSS
- Problem: outputs FLAT section list. A page with sidebar+content, 2-col feature grids, or nested layouts gets flattened.
- v3 goal: extract page SKELETON (layout tree) first, then fill content INTO that skeleton.

## Key Files
- `src/lib/admin/landing-clone-ai.ts` — main pipeline (~550 lines, modularize)
- `src/lib/admin/clone-ai-utils.ts` — shared utilities
- `src/lib/admin/clone-section-logger.ts` — debug logging

## Architecture: 3-Step Pipeline

### Current (v2): 2-step
```
HTML -> [Gemini: structure] -> [Gemini: fill per section] -> flat sections[]
```

### New (v3): 3-step
```
HTML -> [Gemini: layout skeleton] -> [Gemini: content fill into skeleton] -> [post-process] -> nested sections[]
         Step 0 (new)                 Step 1 (enhanced)                       Step 2 (new)
```

### Step 0: Layout Skeleton Extraction (NEW)
Single Gemini call analyzes page for LAYOUT STRUCTURE:
- How many distinct "rows" does the page have?
- Which rows are full-width vs multi-column?
- For multi-column rows: what are the column ratios?
- What's the nesting depth? (max 2 levels)

Output: `LayoutSkeleton` — a tree of rows and columns.

```typescript
interface SkeletonRow {
  /** Full-width single section, or multi-column layout */
  type: 'section' | 'layout'
  /** For type='section': estimated section type */
  sectionType?: SectionType
  /** For type='section': which variant best matches */
  variant?: string
  /** For type='layout': column configuration */
  columns?: number[]
  /** For type='layout': layout variant */
  layoutVariant?: LayoutData['variant']
  /** For type='layout': content in each column */
  children?: Array<{
    column: number
    rows: SkeletonRow[]
  }>
  /** Confidence score */
  confidence?: number
  /** Description for debugging */
  note?: string
}

interface LayoutSkeleton {
  title: string
  description?: string
  rows: SkeletonRow[]
}
```

### Step 1: Content Fill (ENHANCED)
Instead of filling sections independently, fill content INTO the skeleton:
- Each `SkeletonRow` of type `section` gets content extracted
- Layout rows get their children filled recursively
- Variant selection informed by skeleton analysis

### Step 2: Post-Processing (NEW)
- Convert `LayoutSkeleton` -> `LandingSection[]` (the v2 format)
- Layout rows become `type: 'layout'` sections with nested children
- Single-section rows become top-level sections
- Apply design extraction + section styles + scoped CSS (reuse v2 code)

## Prompt Design

### Layout Skeleton Prompt
```
Analyze the LAYOUT STRUCTURE of this web page. Focus on HOW content is arranged, not WHAT the content is.

For each visual "row" on the page (top to bottom), determine:
1. Is it a single full-width section? -> type: "section", sectionType: "hero"|"features"|etc
2. Is it multi-column? -> type: "layout", columns: [ratios], children with nested rows

Rules:
- Nav is always the first row (type: "section", sectionType: "nav")
- Footer is always the last row (type: "section", sectionType: "footer")
- Hero is typically full-width (type: "section")
- "About us" with text + photos side-by-side -> type: "layout", columns: [1,1]
- Sidebar pages -> type: "layout", columns: [1,3] for entire body
- Feature grids are a SINGLE section (not a layout) — the grid is inside the section
- ONLY use layout for genuinely side-by-side DIFFERENT content blocks

Available section types: [list]
Available layout variants: grid, sidebar-left, sidebar-right, asymmetric, thirds, hero-split, stacked, masonry

Return ONLY valid JSON: { "title": "...", "description": "...", "rows": [...] }
```

### Enhanced Content Fill
```
Fill content for section #{index} in the layout skeleton.
Section type: {type}, variant: {variant}
Position in layout: {context — e.g., "left column of 2-col layout"}

Extract content from the HTML that belongs to this specific section position.
```

## Implementation Steps

### Step 1: Modularize Clone Pipeline (4h)
Current `landing-clone-ai.ts` is ~550 lines. Split into:
- `clone-pipeline-v2.ts` — existing directClone + structureFirstClone (kept for fallback)
- `clone-pipeline-v3.ts` — new layout-first pipeline
- `clone-prompts.ts` — all prompt strings (shared between v2 and v3)
- `clone-post-processor.ts` — skeleton-to-sections conversion
- `landing-clone-ai.ts` — public API (chooses v2 vs v3 based on tier/flag)

### Step 2: Layout Skeleton Extraction (4h)
1. Write `LAYOUT_SKELETON_PROMPT`
2. Implement `extractLayoutSkeleton()` — Gemini call, parse `LayoutSkeleton`
3. Validate skeleton: max depth 2, reasonable row count (<30), known section types
4. Fallback: if skeleton extraction fails, fall back to v2 flat pipeline

### Step 3: Skeleton-Aware Content Fill (4h)
1. Traverse skeleton tree, fill each section node
2. Pass layout context to fill prompt (position, column, neighboring sections)
3. Parallel fill for independent sections, sequential for ambiguous ones
4. Variant auto-selection: skeleton's `variant` suggestion, overridable by content analysis

### Step 4: Post-Processor (2h)
1. `skeletonToSections(skeleton: LayoutSkeleton): LandingSection[]`
2. Layout rows -> `type: 'layout'` with nested children
3. Assign order numbers (nav=-1, body=0..N, footer=999)
4. Merge with design extraction + section styles (reuse v2 functions)

### Step 5: Integration + Fallback (2h)
1. `landing-clone-ai.ts` public API: `cloneLandingPage(url, options)`
2. Options include `{ pipeline: 'v2' | 'v3' | 'auto' }`
3. `auto` (default): try v3, if skeleton fails or confidence < 50, fall back to v2
4. Admin UI: add toggle to choose pipeline version
5. Logging: log skeleton + section mapping for debugging

## Gemini API Cost

| Call | Input Tokens | Output Tokens | Cost |
|------|-------------|---------------|------|
| Layout skeleton | ~15K (HTML) | ~2K | ~$0.003 |
| Content fill (per section, ~10 sections) | ~8K each | ~1K each | ~$0.015 |
| Design extraction (reused) | ~10K | ~0.5K | ~$0.002 |
| Section styles (reused) | ~12K | ~1K | ~$0.002 |
| **v3 total** | | | **~$0.022** |
| **v2 total (baseline)** | | | ~$0.018 |

Delta: ~$0.004/clone (+22%). Acceptable.

## Todo

- [ ] Modularize landing-clone-ai.ts into separate files
- [ ] Define LayoutSkeleton types
- [ ] Write layout skeleton extraction prompt
- [ ] Implement extractLayoutSkeleton() with Gemini
- [ ] Implement skeleton-aware content fill
- [ ] Implement skeleton-to-sections post-processor
- [ ] Add v2/v3/auto pipeline selection
- [ ] Add fallback from v3 to v2 on failure
- [ ] Test with claudekit.cc (SaaS layout)
- [ ] Test with aucoeurvietnam.com (travel layout)
- [ ] Update admin clone UI with pipeline toggle

## Success Criteria
- claudekit.cc clone produces layout sections (not flat)
- aucoeurvietnam.com clone captures gallery grid + pricing cards layout
- Fallback to v2 works when skeleton extraction fails
- Pipeline selection available in admin UI
- No regression on existing v2 clone quality

## Risk Assessment
- **Gemini hallucinating layout structure**: Mitigate with strict JSON schema validation + confidence threshold
- **Over-nesting**: Cap layout depth at 2; post-processor flattens deeper nesting
- **Cost increase**: Monitor token usage; skeleton prompt uses structure-cleaned HTML (small)
- **Prompt size**: Layout skeleton prompt should use HTML cleaned for structure (no styles), keep under 20K tokens
