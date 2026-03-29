/**
 * Shared utilities for AI clone pipeline — Gemini API, HTML cleaning,
 * JSON parsing, section normalization, design validation.
 */
import { jsonrepair } from 'jsonrepair'
import sanitizeHtml from 'sanitize-html'

export interface CloneResult {
  title: string
  description?: string
  design?: {
    colors?: Record<string, string>
    fonts?: { heading?: string; body?: string }
    borderRadius?: string
  }
  sections: Array<{ type: string; order: number; enabled: boolean; data: Record<string, unknown>; style?: Record<string, unknown> }>
  usage?: { promptTokens: number; outputTokens: number; totalTokens: number; estimatedCostUsd: number }
  structure?: Array<{ type: string; variant: string; confidence: number; itemCount: number; note: string }>
  missingSections?: string[]
  sectionQuality?: Array<{ index: number; score: 'good' | 'partial' | 'poor'; issue?: string }>
  retried?: boolean
}

export const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

/** Section types available in the builder */
export const SECTION_TYPES = ['nav','hero','features','pricing','testimonials','faq','cta','stats','how-it-works','team','logo-wall','footer','video','image','image-text','gallery','map','rich-text','divider','countdown','contact-form','banner','comparison','ai-search','social-proof','layout']

/** Last fetched markdown — used for structure analysis (more compact than HTML) */
let _lastMarkdown = ''
export function getLastMarkdown(): string { return _lastMarkdown }
export function setLastMarkdown(md: string) { _lastMarkdown = md }

/** Fetch HTML via direct HTTP */
export async function directFetch(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.text()).slice(0, 100_000)
}

/** Fetch via Firecrawl API — returns HTML, stores Markdown as side-effect */
export async function firecrawlFetch(url: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    signal: AbortSignal.timeout(30000),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ url, formats: ['html', 'markdown'], onlyMainContent: false, waitFor: 3000 }),
  })
  if (!res.ok) throw new Error(`Firecrawl error: ${res.status}`)
  const data = await res.json()
  _lastMarkdown = (data?.data?.markdown || '').slice(0, 50_000)
  return (data?.data?.html || '').slice(0, 100_000)
}

/** Clean HTML — basic (scripts/SVGs, strips styles) */
export function cleanBasic(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/\s{2,}/g, ' ').trim()
}

/** Clean HTML — keeps <style> blocks so Gemini can see CSS colors/backgrounds */
export function cleanKeepStyles(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/\s{2,}/g, ' ').trim()
}

/** Clean HTML — aggressive (strip attrs, keep semantic structure) */
export function cleanForStructure(html: string): string {
  return sanitizeHtml(cleanBasic(html), {
    allowedTags: ['html','head','body','title','meta','h1','h2','h3','h4','h5','h6','p','a','img','ul','ol','li','nav','footer','header','section','article','figure','figcaption','blockquote','video','source','button','form','input','textarea','table','tr','td','th','thead','tbody','div','span'],
    allowedAttributes: { a: ['href'], img: ['src','alt'], video: ['src'], source: ['src'], meta: ['name','content'], input: ['type','placeholder'], '*': [] },
    allowedSchemes: ['http','https','data'],
  }).replace(/\s{2,}/g, ' ').trim()
}

/** Call Gemini API */
export async function geminiCall(apiKey: string, systemPrompt: string, userPrompt: string, maxTokens = 16384): Promise<{ text: string; promptTokens: number; outputTokens: number }> {
  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.05, maxOutputTokens: maxTokens, responseMimeType: 'application/json' },
    }),
  })
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const u = data?.usageMetadata
  return { text, promptTokens: u?.promptTokenCount || 0, outputTokens: u?.candidatesTokenCount || 0 }
}

/** Parse JSON with jsonrepair fallback */
export function safeJsonParse(text: string): unknown {
  try { return JSON.parse(text) } catch {}
  try { return JSON.parse(jsonrepair(text)) } catch {}
  return null
}

/** Check if a hex color is very light (would be invisible on white bg) */
function isVeryLight(hex: string): boolean {
  const c = hex.replace('#', '')
  const n = c.length === 3 ? c.split('').map(ch => parseInt(ch + ch, 16)) : [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]
  const lum = (0.299 * n[0] + 0.587 * n[1] + 0.114 * n[2]) / 255
  return lum > 0.85
}

/** Validate design object — strip invalid values, fix color sanity */
export function validateDesign(result: CloneResult) {
  if (!result.design) return
  if (typeof result.design.colors === 'string') result.design.colors = undefined as any
  if (typeof result.design.fonts === 'string') result.design.fonts = undefined as any
  if (typeof result.design.borderRadius !== 'string' && result.design.borderRadius != null) result.design.borderRadius = String(result.design.borderRadius)

  // Sanity: text color must not be white/very light (common Gemini mistake — picks nav text)
  const colors = result.design.colors
  if (colors?.text && isVeryLight(colors.text)) {
    colors.text = '#1e2022' // safe dark fallback
  }
  if (colors?.textMuted && isVeryLight(colors.textMuted)) {
    colors.textMuted = '#64748b'
  }
  // Sanity: background should be light, not dark
  if (colors?.background && !isVeryLight(colors.background) && colors.background !== '#f8f8f8') {
    // If background is dark, it's likely a section bg — swap to white
    colors.background = '#ffffff'
  }
}

/** Normalize section data fields — fix Gemini inconsistencies */
export function normalizeSections(sections: CloneResult['sections']) {
  for (const s of sections) {
    if (!s.data) { s.data = {}; continue }
    const d = s.data as Record<string, unknown>

    // Fix field name mappings
    if (d.title && !d.heading && !d.headline) {
      if (s.type === 'hero' || s.type === 'cta') d.headline = d.title
      else d.heading = d.title
      delete d.title
    }
    // Nav: items → links, name → brandName
    if (s.type === 'nav') {
      if (d.items && !d.links) { d.links = d.items; delete d.items }
      if (d.name && !d.brandName) { d.brandName = d.name; delete d.name }
      if (Array.isArray(d.links)) {
        d.links = (d.links as any[]).filter(l => l.label || l.text).map(l => ({
          label: l.label || l.text || '', href: l.href || l.url || '#'
        })).slice(0, 10)
      }
    }
    // Footer: name → text
    if (s.type === 'footer' && d.name && !d.text) { d.text = d.name; delete d.name }
    // Testimonials: reviews → items
    if (s.type === 'testimonials' && d.reviews && !d.items) { d.items = d.reviews; delete d.reviews }
    // Features/stats/faq: ensure items array
    if (['features','stats','faq','how-it-works'].includes(s.type) && !Array.isArray(d.items)) d.items = []
    // Team: ensure members array
    if (s.type === 'team' && !Array.isArray(d.members)) {
      if (Array.isArray(d.items)) { d.members = d.items; delete d.items }
      else d.members = []
    }
    // Gallery: ensure images array
    if (s.type === 'gallery' && !Array.isArray(d.images)) {
      if (Array.isArray(d.items)) { d.images = d.items; delete d.items }
      else d.images = []
    }
    // CTA: ensure cta is array
    if ((s.type === 'hero' || s.type === 'cta') && d.cta && !Array.isArray(d.cta)) {
      d.cta = [d.cta]
    }
    // Fix order
    if (s.type === 'nav') s.order = -1
    else if (s.type === 'footer') s.order = 999
  }
  // Remove duplicate navs (keep first)
  const navIdx = sections.findIndex(s => s.type === 'nav')
  for (let i = sections.length - 1; i > navIdx; i--) {
    if (sections[i].type === 'nav') sections.splice(i, 1)
  }

  // Sanitize per-section style overrides (prevent XSS via CSS injection)
  for (const s of sections) {
    if (!s.style || typeof s.style !== 'object') { delete (s as any).style; continue }
    const st = s.style as Record<string, unknown>
    // Only allow safe string values — strip anything with javascript:, expression(), url(data:)
    const dangerousPattern = /javascript:|expression\s*\(|url\s*\(\s*data:/i
    for (const key of Object.keys(st)) {
      const v = st[key]
      if (typeof v === 'string' && dangerousPattern.test(v)) delete st[key]
    }
    // backgroundImage: only allow http/https URLs
    if (st.backgroundImage && typeof st.backgroundImage === 'string' && !st.backgroundImage.startsWith('http')) {
      delete st.backgroundImage
    }
  }
}

/** Accumulate usage tokens into a CloneResult */
export function addUsage(r: CloneResult, promptTokens: number, outputTokens: number) {
  if (!r.usage) return
  r.usage.promptTokens += promptTokens
  r.usage.outputTokens += outputTokens
  r.usage.totalTokens = r.usage.promptTokens + r.usage.outputTokens
  r.usage.estimatedCostUsd = (r.usage.promptTokens * 0.00000015) + (r.usage.outputTokens * 0.0000006)
}
