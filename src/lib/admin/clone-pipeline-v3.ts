/**
 * V3 layout-first clone pipeline — 3-step approach:
 * 1. Extract layout skeleton (structure + grid layout analysis)
 * 2. Fill skeleton with content (skeleton-aware fill)
 * 3. Convert skeleton to flat sections array (v2 format)
 *
 * Advantage over v2: captures multi-column layouts and nested sections
 * before content extraction, reducing hallucination on complex pages.
 */
import {
  geminiCall, safeJsonParse, normalizeSections, validateDesign,
  type CloneResult,
} from './clone-ai-utils'
import { LAYOUT_SKELETON_PROMPT, SKELETON_FILL_PROMPT } from './clone-prompts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SkeletonRow {
  type: 'section' | 'layout'
  sectionType?: string
  variant?: string
  /** Column weight ratios for layout rows, e.g. [1,1] or [2,1] */
  columns?: number[]
  layoutVariant?: string
  children?: Array<{ column: number; rows: SkeletonRow[] }>
  confidence?: number
  note?: string
  /** Filled during step 2 */
  data?: Record<string, unknown>
  style?: Record<string, unknown>
  /** Per-section CSS override derived from original design */
  customCss?: string
  order?: number
  enabled?: boolean
}

export interface LayoutSkeleton {
  title: string
  description?: string
  design?: CloneResult['design']
  rows: SkeletonRow[]
}

// ---------------------------------------------------------------------------
// Step 1: Extract layout skeleton
// ---------------------------------------------------------------------------

/**
 * Step 1 of v3 pipeline — analyze page structure before content extraction.
 * Returns a skeleton describing rows and multi-column layouts.
 */
export async function extractLayoutSkeleton(
  apiKey: string,
  html: string
): Promise<{ skeleton: LayoutSkeleton; promptTokens: number; outputTokens: number }> {
  const { text, promptTokens, outputTokens } = await geminiCall(
    apiKey,
    'You are a web layout expert. Return ONLY valid compact JSON.',
    `${LAYOUT_SKELETON_PROMPT}\n\nPage HTML:\n${html}`,
    8192
  )
  const parsed = safeJsonParse(text) as LayoutSkeleton | null
  if (!parsed?.rows?.length) throw new Error('V3: skeleton extraction returned no rows')
  return {
    skeleton: {
      title: parsed.title || '',
      description: parsed.description,
      design: parsed.design,
      rows: parsed.rows,
    },
    promptTokens,
    outputTokens,
  }
}

// ---------------------------------------------------------------------------
// Step 2: Fill skeleton with content
// ---------------------------------------------------------------------------

/**
 * Step 2 of v3 pipeline — fill skeleton positions with actual page content.
 * Sends skeleton + HTML to Gemini, receives skeleton with data fields populated.
 */
export async function fillSkeletonContent(
  apiKey: string,
  skeleton: LayoutSkeleton,
  html: string
): Promise<{ skeleton: LayoutSkeleton; promptTokens: number; outputTokens: number }> {
  const userPrompt = `Page skeleton to fill:\n${JSON.stringify(skeleton, null, 2)}\n\nPage HTML:\n${html.slice(0, 60_000)}`
  const { text, promptTokens, outputTokens } = await geminiCall(
    apiKey,
    SKELETON_FILL_PROMPT,
    userPrompt,
    16384
  )
  const parsed = safeJsonParse(text) as LayoutSkeleton | null
  if (!parsed?.rows?.length) throw new Error('V3: skeleton fill returned no rows')
  return {
    skeleton: { ...skeleton, ...parsed, rows: parsed.rows },
    promptTokens,
    outputTokens,
  }
}

// ---------------------------------------------------------------------------
// Step 3: Convert skeleton to flat sections (v2 format)
// ---------------------------------------------------------------------------

/** Flatten a skeleton row into CloneResult sections (recursive for layout children) */
function flattenRow(
  row: SkeletonRow,
  order: { value: number }
): CloneResult['sections'] {
  const results: CloneResult['sections'] = []

  if (row.type === 'layout' && row.children?.length) {
    // Layout section: create a layout section with children embedded
    const layoutChildren: Array<{ column: number; sections: CloneResult['sections'][0][] }> = []

    for (const child of row.children) {
      const childSections: CloneResult['sections'][0][] = []
      const childOrder = { value: 0 }
      for (const childRow of child.rows || []) {
        const flat = flattenRow(childRow, childOrder)
        childSections.push(...flat)
        childOrder.value++
      }
      layoutChildren.push({ column: child.column, sections: childSections })
    }

    results.push({
      type: 'layout',
      order: order.value++,
      enabled: true,
      data: {
        columns: row.columns || [1, 1],
        gap: '2rem',
        variant: row.layoutVariant || 'grid',
        mobileReverse: false,
        children: layoutChildren,
        ...(row.data || {}),
      },
      style: row.style || {},
      customCss: row.customCss,
    })
  } else if (row.type === 'section' && row.sectionType) {
    // Leaf section: use extracted data directly
    const sectionOrder = row.sectionType === 'nav' ? -1 : row.sectionType === 'footer' ? 999 : order.value++
    results.push({
      type: row.sectionType,
      order: sectionOrder,
      enabled: row.enabled !== false,
      data: row.data || {},
      style: row.style || {},
      customCss: row.customCss,
    })
  }

  return results
}

/**
 * Step 3 of v3 pipeline — convert filled skeleton to flat v2-compatible sections array.
 * Layout rows become layout sections with nested children.
 */
export function skeletonToSections(skeleton: LayoutSkeleton): CloneResult['sections'] {
  const sections: CloneResult['sections'] = []
  const order = { value: 0 }

  for (const row of skeleton.rows) {
    sections.push(...flattenRow(row, order))
  }

  // Sort: nav=-1, footer=999, rest ascending
  sections.sort((a, b) => a.order - b.order)
  return sections
}

// ---------------------------------------------------------------------------
// Full v3 pipeline
// ---------------------------------------------------------------------------

/**
 * Full v3 layout-first clone pipeline.
 * Runs extract → fill → convert and returns CloneResult in v2 format.
 */
export async function cloneWithV3Pipeline(
  apiKey: string,
  html: string,
  intent: string,
  url: string
): Promise<CloneResult> {
  let totalPrompt = 0
  let totalOutput = 0

  // Step 1: extract skeleton
  console.log('[Clone V3] Step 1: extracting skeleton...')
  const { skeleton, promptTokens: p1, outputTokens: o1 } = await extractLayoutSkeleton(apiKey, html)
  console.log(`[Clone V3] Step 1 done: ${skeleton.rows.length} rows, ${p1}+${o1} tokens`)
  totalPrompt += p1
  totalOutput += o1

  // Step 2: fill content into skeleton
  console.log('[Clone V3] Step 2: filling content...')
  const intentCtx = intent ? `\n\nUser intent: ${intent}` : ''
  const fillHtml = `URL: ${url}${intentCtx}\n\n${html}`
  const { skeleton: filled, promptTokens: p2, outputTokens: o2 } = await fillSkeletonContent(apiKey, skeleton, fillHtml)
  console.log(`[Clone V3] Step 2 done: ${p2}+${o2} tokens`)
  totalPrompt += p2
  totalOutput += o2

  // Step 3: convert to flat sections
  const sections = skeletonToSections(filled)

  // Ensure every section has a data object
  for (const s of sections) { if (!s.data) s.data = {} }

  normalizeSections(sections)

  // Step 3.5: generate customCss for sections that need visual polish
  console.log('[Clone V3] Step 3.5: generating customCss...')
  try {
    const sectionSummary = sections
      .filter(s => !['divider', 'map'].includes(s.type))
      .map((s, i) => `[${i}] type=${s.type}, heading="${(s.data as any).headline || (s.data as any).heading || ''}", bg=${(s.style as any)?.background || 'default'}`)
      .join('\n')
    const cssPrompt = `You are an expert CSS designer. Generate customCss for each section to make this landing page look polished and professional.

CSS variables available (use these, NEVER hardcode hex colors):
--lp-primary, --lp-secondary, --lp-accent, --lp-bg, --lp-surface, --lp-text, --lp-text-muted, --lp-radius, --lp-font-heading, --lp-font-body

Targetable elements inside each section:
.landing-section (container), h1/h2/h3/p/a (text), .lp-card-hover (cards), .lp-icon-bg (icon circles), .landing-btn-primary/.landing-btn-outline (buttons), .landing-stat-value (numbers), .lp-stars (ratings), .lp-avatar (avatars), .landing-grid-2/3/4 (grids), img

Per section type, generate CSS for:
- hero: large typography (h1 clamp(2.5rem,5vw,4rem)), text-shadow on dark bg, bold button styling, generous padding (5rem+)
- features: card border-radius var(--lp-radius), subtle box-shadow, hover translateY(-2px), icon-bg with color-mix
- testimonials: italic quote styling, avatar border, card bg with color-mix, star color var(--lp-accent)
- team: photo border-radius 50%, name font-weight 600, role color var(--lp-text-muted)
- cta: large h2 clamp(1.8rem,4vw,2.5rem), prominent button, section padding 4rem+
- pricing: highlighted plan border with var(--lp-primary), badge styling, feature list spacing
- stats: large stat-value font-size clamp(2rem,4vw,3rem), label spacing
- nav: subtle box-shadow on scroll, link hover color var(--lp-primary)
- footer: muted link colors, column gap, smaller font-size

Use color-mix(in srgb, var(--lp-primary) 15%, transparent) for subtle backgrounds.
Use color-mix(in srgb, var(--lp-primary) 80%, black) for darker variants.
Keep each section's CSS concise (3-8 rules). Every rule must use var(--lp-*).

Sections:\n${sectionSummary}

Return JSON: { "css": [{ "index": 0, "customCss": ".landing-section { box-shadow: 0 1px 3px rgba(0,0,0,0.08); } a:hover { color: var(--lp-primary); }" }, { "index": 1, "customCss": "h1 { font-size: clamp(2.5rem,5vw,4rem); letter-spacing: -0.02em; text-shadow: 0 2px 8px rgba(0,0,0,0.3); } .landing-btn-primary { border-radius: var(--lp-radius); box-shadow: 0 4px 14px rgba(0,0,0,0.15); }" }, ...] }
Generate CSS for ALL sections listed above.`
    const { text: cssText, promptTokens: p3, outputTokens: o3 } = await geminiCall(apiKey, cssPrompt, `Original page URL: ${url}`, 8192)
    const cssResult = safeJsonParse(cssText) as { css?: Array<{ index: number; customCss: string }> } | null
    if (cssResult?.css) {
      for (const entry of cssResult.css) {
        if (sections[entry.index] && entry.customCss) {
          sections[entry.index].customCss = entry.customCss
        }
      }
      console.log(`[Clone V3] Step 3.5 done: ${cssResult.css.length} sections got customCss, ${p3}+${o3} tokens`)
    }
    totalPrompt += p3
    totalOutput += o3
  } catch (e) {
    console.log(`[Clone V3] Step 3.5 skipped: ${e instanceof Error ? e.message : 'unknown'}`)
  }

  const result: CloneResult = {
    title: filled.title || '',
    description: filled.description,
    design: filled.design,
    sections,
    usage: {
      promptTokens: totalPrompt,
      outputTokens: totalOutput,
      totalTokens: totalPrompt + totalOutput,
      estimatedCostUsd: (totalPrompt * 0.00000015) + (totalOutput * 0.0000006),
    },
  }

  validateDesign(result)
  return result
}
