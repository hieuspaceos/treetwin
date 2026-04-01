/**
 * AI landing page cloner — main entry point.
 * Utilities split into focused modules:
 *   clone-prompts.ts          — all prompt strings
 *   clone-site-analyzer.ts    — site compatibility analysis
 *   clone-design-extractor.ts — design + section style extraction
 *   clone-post-processor.ts   — post-processing, quality assessment, preset matching
 *   clone-pipeline-v3.ts      — v3 layout-first pipeline
 *   clone-ai-utils.ts         — Gemini API, HTML cleaning, normalization
 */
import { logCloneSections } from './clone-section-logger'
import {
  geminiCall, safeJsonParse, validateDesign, normalizeSections, addUsage,
  cleanBasic, cleanKeepStyles, cleanForStructure, directFetch, firecrawlFetch,
  type CloneResult,
} from './clone-ai-utils'
import {
  DIRECT_CLONE_PROMPT, RETRY_MISSING_PROMPT, IMPROVE_SECTION_PROMPT,
} from './clone-prompts'
import { extractDesign, extractSectionStyles } from './clone-design-extractor'
import { matchOrCreatePreset } from './clone-preset-matcher'
import { applySmartStyleDefaults, assessSectionQuality, postProcessCloneResult } from './clone-post-processor'
import { cloneWithV3Pipeline } from './clone-pipeline-v3'

// Re-export public types and analyzeSiteCompatibility for callers
export type { CloneResult } from './clone-ai-utils'
export type { SiteAnalysis } from './clone-site-analyzer'
export { analyzeSiteCompatibility } from './clone-site-analyzer'

// ---------------------------------------------------------------------------
// Internal clone pipelines
// ---------------------------------------------------------------------------

/** Tier 1: direct clone — single Gemini call with full HTML */
async function directClone(apiKey: string, html: string, intent: string, url: string): Promise<CloneResult> {
  const intentCtx = intent ? `\n\nUser intent: ${intent}` : ''
  const { text, promptTokens, outputTokens } = await geminiCall(
    apiKey,
    DIRECT_CLONE_PROMPT,
    `Analyze this HTML:${intentCtx}\n\nURL: ${url}\n\n${html}`,
    32768
  )

  const parsed = safeJsonParse(text) as CloneResult | null
  if (!parsed?.sections?.length) throw new Error('Failed to parse clone response')
  for (const s of parsed.sections) { if (!s.data) s.data = {} }
  normalizeSections(parsed.sections)

  const totalTokens = promptTokens + outputTokens
  parsed.usage = {
    promptTokens, outputTokens, totalTokens,
    estimatedCostUsd: (promptTokens * 0.00000015) + (outputTokens * 0.0000006),
  }
  validateDesign(parsed)
  return parsed
}

/** Retry: targeted fill for specific missing headings — additive only */
async function retryMissingSections(
  apiKey: string,
  content: string,
  missingHeadings: string[],
  existingSections: CloneResult['sections']
): Promise<{ sections: CloneResult['sections']; promptTokens: number; outputTokens: number }> {
  const headingList = missingHeadings.map((h, i) => `${i + 1}. "${h}"`).join('\n')
  const userPrompt = `Missing section headings to find:\n${headingList}\n\nPage content:\n${content}`
  const { text, promptTokens, outputTokens } = await geminiCall(apiKey, RETRY_MISSING_PROMPT, userPrompt, 8192)
  const parsed = safeJsonParse(text) as { sections?: CloneResult['sections'] } | null
  if (!parsed?.sections?.length) return { sections: [], promptTokens, outputTokens }

  const maxOrder = Math.max(...existingSections.filter(s => s.type !== 'footer').map(s => s.order), 0)
  parsed.sections.forEach((s, i) => {
    if (!s.data) s.data = {}
    if (s.order == null || s.order <= 0) s.order = maxOrder + 1 + i
    s.enabled = true
  })
  normalizeSections(parsed.sections)
  return { sections: parsed.sections, promptTokens, outputTokens }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Clone a landing page from a URL.
 * @param url - Target URL or data:text/html, URL for paste-code mode
 * @param intent - Optional user intent hint to guide AI extraction
 * @param options - Pipeline selection: 'v2' | 'v3' | 'auto' (default: 'auto')
 */
export async function cloneLandingPage(
  url: string,
  intent?: string,
  options: { pipeline?: 'v2' | 'v3' | 'auto' } = {}
): Promise<CloneResult> {
  const apiKey = import.meta.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const pipeline = options.pipeline ?? 'auto'
  const isDataUrl = url.startsWith('data:text/html,')
  const firecrawlKey = import.meta.env.FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY

  // Step 1: Get best HTML available
  let rawHtml: string
  let originalHtml: string   // Keep direct-fetch HTML for post-processing (has CSS/styles)
  let localMarkdown = ''     // Per-request markdown — NOT global (prevents parallel clone contamination)

  if (isDataUrl) {
    rawHtml = decodeURIComponent(url.slice('data:text/html,'.length))
    originalHtml = rawHtml
  } else {
    let fcHtml = ''
    if (firecrawlKey) {
      try {
        const fcResult = await firecrawlFetch(url, firecrawlKey)
        fcHtml = fcResult.html
        localMarkdown = fcResult.markdown
        console.log(`[Clone] Firecrawl: ${fcHtml.length} chars, ${localMarkdown.length} md chars`)
      } catch (e) {
        console.log(`[Clone] Firecrawl failed: ${e instanceof Error ? e.message : 'unknown'}`)
      }
    } else {
      console.log('[Clone] No FIRECRAWL_API_KEY — using direct fetch only')
    }
    const directHtml = await directFetch(url)
    originalHtml = directHtml  // Always keep for post-processing (Firecrawl strips CSS)
    const fcWords = cleanBasic(fcHtml).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(w => w.length > 2).length
    const directWords = cleanBasic(directHtml).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(w => w.length > 2).length
    console.log(`[Clone] Firecrawl: ${fcWords} words, Direct: ${directWords} words → using ${fcWords > directWords ? 'Firecrawl' : 'Direct'}`)
    rawHtml = fcWords > directWords ? fcHtml : directHtml
  }

  const html = cleanBasic(rawHtml)
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(w => w.length > 2).length
  if (words < 20) {
    throw new Error(`Page has too little content (${words} words). Use "📋 Paste Code" mode.`)
  }

  // Step 2: Choose best input format — prioritize HTML with structure over markdown
  const htmlWithStyles = cleanKeepStyles(rawHtml)
  const structureHtml = cleanForStructure(rawHtml)
  const lastMd = localMarkdown
  let cloneInput: string
  let inputFormat: string
  if (htmlWithStyles.length <= 80_000) {
    cloneInput = htmlWithStyles
    inputFormat = 'html+styles'
  } else if (html.length <= 60_000) {
    cloneInput = html
    inputFormat = 'html-clean'
  } else if (structureHtml.length <= 120_000) {
    // Prefer structure HTML over markdown — preserves semantic tags + class names for layout detection
    cloneInput = structureHtml
    inputFormat = 'html-structure'
  } else {
    // Truncate structure HTML — still better than markdown for layout fidelity
    cloneInput = structureHtml.slice(0, 120_000)
    inputFormat = 'html-structure-trimmed'
  }

  console.log(`[Clone] Input: ${cloneInput.length} chars (format: ${inputFormat})`)

  // Step 3: Run clone pipeline
  let r: CloneResult

  if (pipeline === 'v3') {
    // V3 always uses layout-first approach
    r = await cloneWithV3Pipeline(apiKey, cloneInput, intent || '', url)
  } else if (pipeline === 'auto') {
    // Auto: try v3 first, fall back to v2 on failure
    try {
      r = await cloneWithV3Pipeline(apiKey, cloneInput, intent || '', url)
    } catch {
      r = await directClone(apiKey, cloneInput, intent || '', url)
    }
  } else {
    // v2: existing directClone flow
    r = await directClone(apiKey, cloneInput, intent || '', url)
  }

  // Phase 3: Separate design extraction from HTML/CSS (more accurate than clone's design)
  if (!isDataUrl) {
    try {
      const designResult = await extractDesign(apiKey, rawHtml)
      if (designResult.design) {
        const existing = r.design || {}
        r.design = {
          colors: { ...existing.colors, ...designResult.design.colors },
          fonts: { ...existing.fonts, ...designResult.design.fonts },
          borderRadius: designResult.design.borderRadius || existing.borderRadius,
        }
        validateDesign(r)
      }
      addUsage(r, designResult.promptTokens, designResult.outputTokens)
    } catch {}  // non-critical

    // Match extracted colors to existing preset or generate harmonious palette
    const presetMatch = matchOrCreatePreset(r.design || {})
    r.design = {
      ...r.design,
      colors: presetMatch.colors,
      fonts: presetMatch.fonts,
      borderRadius: presetMatch.borderRadius,
      preset: presetMatch.presetId || undefined,
    } as any

    // Per-section style extraction — separate call with raw HTML + CSS
    try {
      const styleResult = await extractSectionStyles(apiKey, rawHtml, r.sections)
      for (const styleDef of styleResult.styles) {
        const section = r.sections[styleDef.index]
        if (!section) continue
        const { index: _, ...styleOverrides } = styleDef
        section.style = { ...(section.style || {}), ...styleOverrides } as any
      }
      addUsage(r, styleResult.promptTokens, styleResult.outputTokens)
    } catch {}  // non-critical

    // Apply smart style defaults for sections without AI-detected styles
    applySmartStyleDefaults(r.sections, r.design)
  }

  // Detect missing sections — compare page H2s vs cloned headings
  const headingSource = lastMd || html
  const pageHeadings = [...headingSource.matchAll(/^##\s+(.+)/gm)].map(m => m[1].trim())
    .concat([...headingSource.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi)].map(m => m[1].trim()))
    .filter(h => h.length > 3 && h.length < 100)

  const clonedHeadings = r.sections.map(s => {
    const d = (s.data || {}) as Record<string, unknown>
    return String(d.headline || d.heading || d.text || d.brandName || '').toLowerCase()
  }).filter(Boolean)

  const getWords = (s: string) => s.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const missingSections = pageHeadings.filter(h => {
    const hWords = getWords(h)
    if (hWords.length === 0) return false
    return !clonedHeadings.some(ch => {
      const cWords = getWords(ch)
      const overlap = hWords.filter(w => cWords.some(cw => cw.includes(w) || w.includes(cw))).length
      return overlap >= 2 || overlap >= hWords.length * 0.5
    }) && !r.sections.some(s => {
      const typeKeywords: Record<string, string[]> = {
        testimonials: ['client', 'avis', 'témoignage', 'parlent', 'review'],
        team: ['équipe', 'conseiller', 'team', 'advisor'],
        video: ['vidéo', 'video', 'collection'],
        'how-it-works': ['étape', 'step', 'comment', 'process'],
        gallery: ['voyage', 'idée', 'programme', 'collection'],
        faq: ['question', 'faq'],
      }
      const kw = typeKeywords[s.type]
      return kw && kw.some(k => h.toLowerCase().includes(k))
    })
  })

  // Auto-retry missing sections (additive only, max 1 retry)
  if (missingSections.length > 0 && missingSections.length <= 8) {
    try {
      const retryContent = lastMd.length > 500 ? lastMd : cloneInput
      const retry = await retryMissingSections(apiKey, retryContent, missingSections, r.sections)
      if (retry.sections.length > 0) {
        const footerIdx = r.sections.findIndex(s => s.type === 'footer')
        if (footerIdx >= 0) r.sections.splice(footerIdx, 0, ...retry.sections)
        else r.sections.push(...retry.sections)
        r.retried = true
      }
      addUsage(r, retry.promptTokens, retry.outputTokens)
      // Re-detect missing after retry
      const retriedHeadings = retry.sections.map(s => {
        const d = (s.data || {}) as Record<string, unknown>
        return String(d.headline || d.heading || d.text || '').toLowerCase()
      }).filter(Boolean)
      const stillMissing = missingSections.filter(h => {
        const hWords = getWords(h)
        return !retriedHeadings.some(rh => {
          const rWords = getWords(rh)
          const overlap = hWords.filter(w => rWords.some(rw => rw.includes(w) || w.includes(rw))).length
          return overlap >= 1
        })
      })
      r.missingSections = stillMissing.length > 0 ? stillMissing : undefined
    } catch {
      r.missingSections = missingSections
    }
  } else if (missingSections.length > 0) {
    r.missingSections = missingSections
  }

  // Per-section quality assessment
  r.sectionQuality = r.sections.map((s, i) => assessSectionQuality(s, i))

  // Post-processing auto-fixes (lessons from clone optimization)
  postProcessCloneResult(r, originalHtml, url)

  try { logCloneSections(url, r.sections, words, pageHeadings) } catch {}
  return r
}

// ---------------------------------------------------------------------------
// Improve existing sections
// ---------------------------------------------------------------------------

/** Improve specific sections of an existing landing page using AI */
export async function improveSections(
  slug: string,
  sectionIndices: number[],
  pageUrl?: string
): Promise<{ improved: number; sections: CloneResult['sections']; usage: CloneResult['usage'] }> {
  const apiKey = import.meta.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const { readLandingConfig, writeLandingConfig } = await import('@/lib/landing/landing-config-reader')
  const config = readLandingConfig(slug)
  if (!config) throw new Error(`Landing page "${slug}" not found`)

  // Assess quality of requested sections
  const toImprove: Array<{
    index: number
    section: { type: string; order: number; data: Record<string, unknown>; style?: Record<string, unknown> }
    quality: { score: string; issue?: string }
  }> = []
  for (const i of sectionIndices) {
    const s = config.sections?.[i]
    if (!s) continue
    const q = assessSectionQuality({ type: s.type, data: s.data as unknown as Record<string, unknown> }, i)
    if (q.score !== 'good') {
      toImprove.push({
        index: i,
        section: { type: s.type, order: s.order, data: s.data as unknown as Record<string, unknown>, style: s.style as unknown as Record<string, unknown> },
        quality: q,
      })
    }
  }

  if (toImprove.length === 0) {
    return { improved: 0, sections: [], usage: { promptTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0 } }
  }

  // Get page content for context — fetch from URL when available
  let pageContent = ''
  if (pageUrl) {
    try {
      const html = await directFetch(pageUrl)
      pageContent = cleanBasic(html)
    } catch {
      pageContent = ''
    }
  }

  const sectionDescs = toImprove.map(({ index, section, quality }) =>
    `Section #${index} (type: ${section.type}, order: ${section.order}):\n  Issue: ${quality.issue}\n  Current data: ${JSON.stringify(section.data || {}).slice(0, 500)}`
  ).join('\n\n')

  const userPrompt = `Sections to improve:\n${sectionDescs}\n\nPage content for reference:\n${pageContent.slice(0, 30000)}`
  const { text, promptTokens, outputTokens } = await geminiCall(apiKey, IMPROVE_SECTION_PROMPT, userPrompt, 8192)
  const parsed = safeJsonParse(text) as { sections?: CloneResult['sections'] } | null

  if (!parsed?.sections?.length) {
    return {
      improved: 0, sections: [],
      usage: { promptTokens, outputTokens, totalTokens: promptTokens + outputTokens, estimatedCostUsd: (promptTokens * 0.00000015) + (outputTokens * 0.0000006) },
    }
  }

  // Merge improved sections back into config
  let improvedCount = 0
  for (const improved of parsed.sections) {
    const match = toImprove.find(t => t.section.type === improved.type && t.section.order === improved.order)
      || toImprove.find(t => t.section.type === improved.type)

    if (match && config.sections) {
      const existing = config.sections[match.index] as unknown as Record<string, unknown>
      existing.data = { ...(existing.data as Record<string, unknown> || {}), ...(improved.data || {}) }
      if (improved.style) existing.style = { ...(existing.style as Record<string, unknown> || {}), ...improved.style }
      improvedCount++
    }
  }

  if (improvedCount > 0) writeLandingConfig(slug, config)

  const totalTokens = promptTokens + outputTokens
  return {
    improved: improvedCount,
    sections: parsed.sections,
    usage: { promptTokens, outputTokens, totalTokens, estimatedCostUsd: (promptTokens * 0.00000015) + (outputTokens * 0.0000006) },
  }
}
