/**
 * AI landing page cloner — 2-step structure-first approach.
 * Step 1: Analyze structure (small output, never truncates)
 * Step 2: Fill content per section (parallel calls, each small)
 *
 * Tier 1 sites (< 50K clean HTML) use legacy direct clone (proven stable).
 * Tier 2-4 sites use 2-step approach for reliability.
 */
import { jsonrepair } from 'jsonrepair'
import sanitizeHtml from 'sanitize-html'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

/** Section types available in the builder */
const SECTION_TYPES = ['nav','hero','features','pricing','testimonials','faq','cta','stats','how-it-works','team','logo-wall','footer','video','image','image-text','gallery','map','rich-text','divider','countdown','contact-form','banner','comparison','ai-search','social-proof','layout']

/** Legacy prompt for Tier 1 direct clone (proven working for SaaS sites) */
const DIRECT_CLONE_PROMPT = `You are an expert web designer. Analyze this HTML and decompose into landing page sections.

Section types: ${SECTION_TYPES.join(', ')}.

Rules:
- hero.cta and cta.cta are ALWAYS arrays: [{text, url, variant}]
- Icons: use emoji, never "[SVG]" or raw SVG
- Pricing: count actual plan CARDS only
- Testimonials: use "carousel" if they scroll horizontally
- Rich-text: max 300 chars, summarize
- Text fields: clean text, no HTML tags, max 200 chars
- Image URLs: keep absolute, decode /_next/image URLs
- Keep content in ORIGINAL language
- Do NOT duplicate content across sections

Return ONLY valid JSON:
{
  "title": "...", "description": "...",
  "design": { "colors": { "primary":"#hex","secondary":"#hex","accent":"#hex","background":"#hex","surface":"#hex","text":"#hex","textMuted":"#hex" }, "fonts": { "heading":"...", "body":"..." }, "borderRadius": "12px" },
  "sections": [{ "type":"...", "order":0, "enabled":true, "data":{...} }, ...]
}`

/** Structure analysis prompt (Step 1 — small output) */
const STRUCTURE_PROMPT = `You are a web design expert. Analyze this HTML and identify the STRUCTURE of the landing page. Do NOT extract content — only identify sections.

Available section types: ${SECTION_TYPES.join(', ')}

For each visible section on the page, return:
- type: best matching section type, or "unknown" if no match
- variant: layout variant (e.g. "centered", "split", "grid", "cards", "carousel")
- confidence: 0-100 how sure you are this mapping is correct
- itemCount: number of items (for lists, grids, testimonials, pricing plans)
- note: any issues or details (e.g. "has video embed", "carousel with 8 items")

Also extract design: colors (from CSS/inline styles), fonts, borderRadius.

Return ONLY valid compact JSON:
{ "title":"...", "description":"...", "design":{...}, "structure":[{ "order":0, "type":"hero", "variant":"split", "confidence":90, "itemCount":0, "note":"" }, ...] }`

/** Content fill prompt (Step 2 — per section) */
function buildFillPrompt(sectionType: string, variant: string, itemCount: number): string {
  return `Extract content for ONE section from the HTML below.
Section type: ${sectionType}
Variant: ${variant}
Expected items: ${itemCount || 'unknown'}

Rules: cta=ALWAYS array [{text,url}]. Icons=emoji. Text=max 200 chars, no HTML. Images=absolute URLs.
Return ONLY the data object for this section (not wrapped in {sections:[...]}), e.g.: { "heading":"...", "items":[...] }`
}

export interface CloneResult {
  title: string
  description?: string
  design?: {
    colors?: Record<string, string>
    fonts?: { heading?: string; body?: string }
    borderRadius?: string
  }
  sections: Array<{ type: string; order: number; enabled: boolean; data: Record<string, unknown> }>
  usage?: { promptTokens: number; outputTokens: number; totalTokens: number; estimatedCostUsd: number }
  /** Structure analysis with per-section confidence */
  structure?: Array<{ type: string; variant: string; confidence: number; itemCount: number; note: string }>
}

/** Framework detection patterns for tier scoring */
const DETECTORS: Array<{ name: string; patterns: string[]; boost: number }> = [
  { name: 'Astro', patterns: ['astro-island', 'astro-slot'], boost: 20 },
  { name: 'Hugo', patterns: ['gohugo.io', 'hugo-'], boost: 18 },
  { name: 'Next.js', patterns: ['/_next/', '__NEXT_DATA__'], boost: 15 },
  { name: 'Nuxt', patterns: ['__nuxt', '/_nuxt/'], boost: 15 },
  { name: 'SvelteKit', patterns: ['__sveltekit'], boost: 15 },
  { name: 'Remix', patterns: ['__remixContext'], boost: 15 },
  { name: 'Gatsby', patterns: ['gatsby-', '___gatsby'], boost: 12 },
  { name: 'Jekyll', patterns: ['jekyll'], boost: 15 },
  { name: 'WordPress', patterns: ['wp-content', 'wp-includes'], boost: 5 },
  { name: 'Shopify', patterns: ['cdn.shopify.com'], boost: 5 },
  { name: 'Webflow', patterns: ['webflow.com', 'w-webflow'], boost: 8 },
  { name: 'Wix', patterns: ['wix.com', 'wixsite.com'], boost: 3 },
  { name: 'Squarespace', patterns: ['squarespace'], boost: 5 },
  { name: 'Ghost', patterns: ['ghost.org', 'ghost-portal'], boost: 10 },
  { name: 'React SPA', patterns: ['<div id="root"></div>'], boost: -15 },
  { name: 'Angular', patterns: ['ng-version', '<app-root'], boost: -20 },
  { name: 'Cloudflare', patterns: ['cf-challenge', 'jschl_answer'], boost: -30 },
]

export interface SiteAnalysis {
  tier: 1 | 2 | 3 | 4
  score: number
  label: string
  framework: string
  details: string[]
  canClone: boolean
}

/** Pre-analyze site compatibility (no AI call) */
export async function analyzeSiteCompatibility(url: string): Promise<SiteAnalysis> {
  const html = await fetchPageHtml(url)
  return analyzeHtml(html)
}

function analyzeHtml(html: string): SiteAnalysis {
  const details: string[] = []
  let score = 50
  let framework = 'Unknown'
  for (const d of DETECTORS) {
    if (d.patterns.some(p => html.includes(p))) { framework = d.name; score += d.boost; break }
  }
  details.push(`Framework: ${framework}`)

  const cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '')
  const words = cleaned.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(w => w.length > 2)
  if (words.length < 30) { score -= 40; details.push(`⚠️ ${words.length} words (SPA)`) }
  else if (words.length <= 800) { score += 15; details.push(`✓ ${words.length} words`) }
  else if (words.length <= 2000) { score += 5; details.push(`${words.length} words (heavy)`) }
  else { score -= 15; details.push(`⚠️ ${words.length} words (very heavy)`) }

  const semantic = (html.match(/<(section|nav|footer|header|h[1-6])/gi) || []).length
  if (semantic >= 5) { score += 15; details.push(`✓ ${semantic} semantic tags`) }
  else if (semantic >= 2) { score += 5; details.push(`${semantic} semantic tags`) }
  else { score -= 10; details.push(`⚠️ No semantic tags`) }

  const cleanSize = cleaned.length
  if (cleanSize <= 50000) { score += 10; details.push(`✓ ${(cleanSize/1000).toFixed(0)}K chars`) }
  else if (cleanSize <= 150000) { details.push(`${(cleanSize/1000).toFixed(0)}K chars`) }
  else { score -= 10; details.push(`⚠️ ${(cleanSize/1000).toFixed(0)}K chars`) }

  score = Math.max(0, Math.min(100, score))
  const tier = score >= 70 ? 1 : score >= 50 ? 2 : score >= 30 ? 3 : 4 as 1|2|3|4
  const labels = { 1: 'Excellent', 2: 'Good', 3: 'Challenging', 4: 'Low — try Paste Code' }
  return { tier, score, label: labels[tier], framework, details, canClone: score >= 20 }
}

/** Fetch HTML from URL */
async function fetchPageHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.text()).slice(0, 100_000)
}

/** Clean HTML — basic (scripts/styles) */
function cleanBasic(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/\s{2,}/g, ' ').trim()
}

/** Clean HTML — aggressive (strip attrs, keep semantic structure) */
function cleanForStructure(html: string): string {
  return sanitizeHtml(cleanBasic(html), {
    allowedTags: ['html','head','body','title','meta','h1','h2','h3','h4','h5','h6','p','a','img','ul','ol','li','nav','footer','header','section','article','figure','figcaption','blockquote','video','source','button','form','input','textarea','table','tr','td','th','thead','tbody','div','span'],
    allowedAttributes: { a: ['href'], img: ['src','alt'], video: ['src'], source: ['src'], meta: ['name','content'], input: ['type','placeholder'], '*': [] },
    allowedSchemes: ['http','https','data'],
  }).replace(/\s{2,}/g, ' ').trim()
}

/** Call Gemini API */
async function geminiCall(apiKey: string, systemPrompt: string, userPrompt: string, maxTokens = 16384): Promise<{ text: string; promptTokens: number; outputTokens: number }> {
  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.15, maxOutputTokens: maxTokens, responseMimeType: 'application/json' },
    }),
  })
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const u = data?.usageMetadata
  return { text, promptTokens: u?.promptTokenCount || 0, outputTokens: u?.candidatesTokenCount || 0 }
}

/** Parse JSON with jsonrepair */
function safeJsonParse(text: string): unknown {
  try { return JSON.parse(text) } catch {}
  try { return JSON.parse(jsonrepair(text)) } catch {}
  return null
}

/** ===== TIER 1: Direct clone (proven stable for SaaS) ===== */
async function directClone(apiKey: string, html: string, intent: string, url: string): Promise<CloneResult> {
  const intentCtx = intent ? `\n\nUser intent: ${intent}` : ''
  const { text, promptTokens, outputTokens } = await geminiCall(apiKey, DIRECT_CLONE_PROMPT, `Analyze this HTML:${intentCtx}\n\nURL: ${url}\n\n${html}`, 32768)

  const parsed = safeJsonParse(text) as CloneResult | null
  if (!parsed?.sections?.length) throw new Error('Failed to parse clone response')
  for (const s of parsed.sections) { if (!s.data) s.data = {} }

  const totalTokens = promptTokens + outputTokens
  parsed.usage = { promptTokens, outputTokens, totalTokens, estimatedCostUsd: (promptTokens * 0.00000015) + (outputTokens * 0.0000006) }
  return parsed
}

/** ===== TIER 2+: 2-step structure-first clone ===== */
async function structureFirstClone(apiKey: string, html: string, intent: string, url: string): Promise<CloneResult> {
  let totalPrompt = 0, totalOutput = 0

  // Step 1: Analyze structure
  const structureHtml = cleanForStructure(html).slice(0, 60_000)
  const intentCtx = intent ? `\nUser intent: ${intent}` : ''
  const step1 = await geminiCall(apiKey, 'You are a web design expert. Return ONLY valid compact JSON.', `${STRUCTURE_PROMPT}${intentCtx}\n\nURL: ${url}\n\n${structureHtml}`, 4096)
  totalPrompt += step1.promptTokens
  totalOutput += step1.outputTokens

  const analysis = safeJsonParse(step1.text) as { title?: string; description?: string; design?: CloneResult['design']; structure?: Array<{ order: number; type: string; variant: string; confidence: number; itemCount: number; note: string }> } | null
  if (!analysis?.structure?.length) throw new Error('Structure analysis returned no sections')

  // Step 2: Fill content per section (parallel)
  const validSections = analysis.structure.filter(s => SECTION_TYPES.includes(s.type))
  const fillPromises = validSections.map(async (s) => {
    const prompt = buildFillPrompt(s.type, s.variant, s.itemCount)
    const { text, promptTokens, outputTokens } = await geminiCall(apiKey, 'Extract content for ONE section. Return ONLY the data JSON object.', `${prompt}\n\nHTML:\n${structureHtml.slice(0, 30_000)}`, 4096)
    totalPrompt += promptTokens
    totalOutput += outputTokens
    const data = safeJsonParse(text) as Record<string, unknown> | null
    return { type: s.type, order: s.order, enabled: true, data: data || {}, confidence: s.confidence }
  })

  const sections = await Promise.all(fillPromises)

  const totalTokens = totalPrompt + totalOutput
  return {
    title: analysis.title || '',
    description: analysis.description,
    design: analysis.design,
    sections: sections.sort((a, b) => a.order - b.order),
    structure: analysis.structure,
    usage: { promptTokens: totalPrompt, outputTokens: totalOutput, totalTokens, estimatedCostUsd: (totalPrompt * 0.00000015) + (totalOutput * 0.0000006) },
  }
}

/** ===== MAIN ENTRY ===== */
export async function cloneLandingPage(url: string, intent?: string): Promise<CloneResult> {
  const apiKey = import.meta.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  // Get raw HTML
  const rawHtml = url.startsWith('data:text/html,')
    ? decodeURIComponent(url.slice('data:text/html,'.length))
    : await fetchPageHtml(url)

  const html = cleanBasic(rawHtml)
  const analysis = analyzeHtml(rawHtml)

  // Tier 4: too little content
  if (analysis.score < 20) {
    throw new Error(`Page has too little visible content (score: ${analysis.score}). Use "📋 Paste Code" mode: open in Chrome → Inspect → select <body> → Copy outerHTML → paste.`)
  }

  // Tier 1: Direct clone (proven stable, don't change what works)
  if (analysis.tier === 1 && html.length <= 50_000) {
    return await directClone(apiKey, html, intent || '', url)
  }

  // Tier 2-3: Structure-first 2-step clone
  return await structureFirstClone(apiKey, rawHtml, intent || '', url)
}
