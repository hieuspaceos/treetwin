/**
 * AI landing page cloner — chunked analysis for large sites.
 * Splits HTML into chunks, calls Gemini per chunk, merges sections.
 * Supports: URL fetch, pasted code, file upload.
 */

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

/** Max chars per chunk sent to Gemini */
const CHUNK_SIZE = 20_000
/** Max total HTML to process */
const MAX_HTML = 100_000

/** Section schema for Gemini prompt (kept concise to save tokens) */
const SECTION_SCHEMA = `Section types: nav, hero, features, pricing, testimonials, faq, cta, stats, how-it-works, team, logo-wall, footer, video, image, image-text, gallery, map, rich-text, divider, countdown, contact-form, banner, comparison, ai-search, social-proof, layout.

Key rules:
- hero.cta and cta.cta are ALWAYS arrays: [{text, url, variant}]
- icons: use EMOJI only, never "[SVG]" or raw SVG
- pricing: count actual plan CARDS only, not CTA buttons
- testimonials: use "carousel" if they scroll horizontally
- rich-text: max 300 chars, summarize, no raw HTML
- All text fields: clean text only, no HTML tags, max 200 chars
- Image URLs: keep absolute URLs as-is, decode /_next/image URLs
- Keep JSON compact`

/** Prompt for analyzing a chunk of HTML */
function buildChunkPrompt(chunkHtml: string, chunkIndex: number, totalChunks: number, intent: string, url: string, isDesignChunk: boolean): string {
  const designInstr = isDesignChunk
    ? `\nAlso extract design: { colors: {primary,secondary,accent,background,surface,text,textMuted}, fonts: {heading,body}, borderRadius }`
    : '\nDo NOT include "design" key — only return sections.'

  return `You are a web designer. Analyze this HTML chunk (${chunkIndex + 1}/${totalChunks}) and extract landing page sections.

${SECTION_SCHEMA}
${designInstr}

User intent: ${intent || 'Clone this landing page'}
URL: ${url}

Return ONLY valid JSON:
${isDesignChunk ? '{ "title": "...", "description": "...", "design": {...}, "sections": [...] }' : '{ "sections": [...] }'}

HTML chunk ${chunkIndex + 1}/${totalChunks}:
${chunkHtml}`
}

export interface CloneResult {
  title: string
  description?: string
  design?: {
    colors?: Record<string, string>
    fonts?: { heading?: string; body?: string }
    borderRadius?: string
  }
  sections: Array<{
    type: string
    order: number
    enabled: boolean
    data: Record<string, unknown>
  }>
  usage?: { promptTokens: number; outputTokens: number; totalTokens: number; estimatedCostUsd: number }
  /** Number of chunks processed */
  chunks?: number
}

/** Fetch HTML from URL with timeout */
async function fetchPageHtml(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()
    return html.slice(0, MAX_HTML)
  } finally {
    clearTimeout(timeout)
  }
}

/** Strip scripts, styles, non-visible content */
function cleanHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/class="[^"]*"/gi, '') // strip class attrs to save tokens
    .replace(/data-[a-z-]+="[^"]*"/gi, '') // strip data attrs
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Split HTML into semantic chunks — tries to break at section/div boundaries */
function splitIntoChunks(html: string): string[] {
  if (html.length <= CHUNK_SIZE) return [html]

  const chunks: string[] = []
  let remaining = html

  while (remaining.length > 0) {
    if (remaining.length <= CHUNK_SIZE) {
      chunks.push(remaining)
      break
    }
    // Find a good break point near CHUNK_SIZE (closing tags)
    let breakAt = CHUNK_SIZE
    const searchArea = remaining.slice(CHUNK_SIZE - 500, CHUNK_SIZE + 500)
    const sectionBreak = searchArea.lastIndexOf('</section>')
    const divBreak = searchArea.lastIndexOf('</div>')
    if (sectionBreak > 0) breakAt = CHUNK_SIZE - 500 + sectionBreak + 10
    else if (divBreak > 0) breakAt = CHUNK_SIZE - 500 + divBreak + 6

    chunks.push(remaining.slice(0, breakAt))
    remaining = remaining.slice(breakAt)
  }

  return chunks
}

/** Call Gemini for a single chunk */
async function analyzeChunk(apiKey: string, chunkHtml: string, chunkIndex: number, totalChunks: number, intent: string, url: string): Promise<{ sections: CloneResult['sections']; design?: CloneResult['design']; title?: string; description?: string; promptTokens: number; outputTokens: number }> {
  const isFirst = chunkIndex === 0
  const prompt = buildChunkPrompt(chunkHtml, chunkIndex, totalChunks, intent, url, isFirst)

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: 'You are a web design expert. Return ONLY valid JSON. Keep text short.' }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.15, maxOutputTokens: 16384, responseMimeType: 'application/json' },
    }),
  })

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) return { sections: [], promptTokens: 0, outputTokens: 0 }

  const usage = data?.usageMetadata
  const promptTokens = usage?.promptTokenCount || 0
  const outputTokens = usage?.candidatesTokenCount || 0

  try {
    const parsed = JSON.parse(repairJson(text))
    return {
      sections: parsed.sections || [],
      design: isFirst ? parsed.design : undefined,
      title: isFirst ? parsed.title : undefined,
      description: isFirst ? parsed.description : undefined,
      promptTokens, outputTokens,
    }
  } catch {
    return { sections: [], promptTokens, outputTokens }
  }
}

/** Merge sections from multiple chunks — deduplicate by type+content */
function mergeSections(allSections: CloneResult['sections'][]): CloneResult['sections'] {
  const merged: CloneResult['sections'] = []
  const seen = new Set<string>()

  for (const chunk of allSections) {
    for (const section of chunk) {
      // Create fingerprint for dedup: type + first 50 chars of headline/heading/text
      const data = section.data as Record<string, unknown>
      const contentHint = String(data.headline || data.heading || data.text || data.brandName || '').slice(0, 50)
      const fingerprint = `${section.type}:${contentHint}`

      // Allow multiple of same type if content differs (e.g. multiple CTA sections)
      // But skip exact duplicates
      if (seen.has(fingerprint)) continue
      seen.add(fingerprint)
      merged.push(section)
    }
  }

  // Re-order: nav first, footer last, rest by original order
  return merged.sort((a, b) => {
    if (a.type === 'nav') return -1
    if (b.type === 'nav') return 1
    if (a.type === 'footer') return 1
    if (b.type === 'footer') return -1
    return a.order - b.order
  })
}

/** Repair malformed/truncated JSON */
function repairJson(text: string): string {
  let json = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()
  try { JSON.parse(json); return json } catch {}

  // Fix unescaped newlines in strings
  json = json.replace(/(?<=": ")((?:[^"\\]|\\.)*)(?=")/g, (m) =>
    m.replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r')
  )
  try { JSON.parse(json); return json } catch {}

  // Progressive truncation repair
  for (let cut = 0; cut < 2000; cut += 20) {
    let attempt = json.slice(0, json.length - cut)
    attempt = attempt.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, '').replace(/,\s*$/, '')

    let braces = 0, brackets = 0, inStr = false, esc = false
    for (const ch of attempt) {
      if (esc) { esc = false; continue }
      if (ch === '\\') { esc = true; continue }
      if (ch === '"') { inStr = !inStr; continue }
      if (inStr) continue
      if (ch === '{') braces++; else if (ch === '}') braces--
      if (ch === '[') brackets++; else if (ch === ']') brackets--
    }
    if (inStr) attempt += '"'
    while (brackets > 0) { attempt += ']'; brackets-- }
    while (braces > 0) { attempt += '}'; braces-- }

    try { JSON.parse(attempt); return attempt } catch {}
  }
  return json
}

/** Main entry — chunked analysis */
export async function cloneLandingPage(url: string, intent?: string): Promise<CloneResult> {
  const apiKey = import.meta.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  // Fetch and clean HTML
  const rawHtml = url.startsWith('data:text/html,')
    ? decodeURIComponent(url.slice('data:text/html,'.length))
    : await fetchPageHtml(url)
  const html = cleanHtml(rawHtml)

  if (html.length < 500) {
    throw new Error('Page has too little visible content — this site likely renders via JavaScript. Try "📋 Paste Code" mode: open in Chrome → Inspect → select <body> → Copy outerHTML → paste into Code tab.')
  }

  // Split into chunks
  const chunks = splitIntoChunks(html)

  // Analyze all chunks (sequentially to avoid rate limits)
  let totalPrompt = 0, totalOutput = 0
  const allSections: CloneResult['sections'][] = []
  let design: CloneResult['design'] | undefined
  let title = '', description = ''

  for (let i = 0; i < chunks.length; i++) {
    const result = await analyzeChunk(apiKey, chunks[i], i, chunks.length, intent || '', url)
    allSections.push(result.sections)
    totalPrompt += result.promptTokens
    totalOutput += result.outputTokens
    if (result.design) design = result.design
    if (result.title) title = result.title
    if (result.description) description = result.description
  }

  // Merge and deduplicate sections
  const sections = mergeSections(allSections)

  if (sections.length === 0) {
    throw new Error('AI could not extract any sections from this page. Try "📋 Paste Code" mode with the rendered HTML.')
  }

  const totalTokens = totalPrompt + totalOutput
  const estimatedCostUsd = (totalPrompt * 0.00000015) + (totalOutput * 0.0000006)

  return {
    title, description, design, sections,
    usage: { promptTokens: totalPrompt, outputTokens: totalOutput, totalTokens, estimatedCostUsd },
    chunks: chunks.length,
  }
}
