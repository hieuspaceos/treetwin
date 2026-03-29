/**
 * AI landing page cloner — structure-first approach with auto-retry,
 * design extraction, quality assessment, and layout section support.
 *
 * Tier 1 sites (< 60K) use direct clone. Tier 2+ use 2-step approach.
 * Utilities (Gemini API, HTML cleaning, normalization) in clone-ai-utils.ts.
 */
import { logCloneSections } from './clone-section-logger'
import {
  SECTION_TYPES, geminiCall, safeJsonParse, validateDesign, normalizeSections, addUsage,
  cleanBasic, cleanKeepStyles, cleanForStructure, directFetch, firecrawlFetch, getLastMarkdown, setLastMarkdown,
  type CloneResult,
} from './clone-ai-utils'
export type { CloneResult } from './clone-ai-utils'

/** Full detailed prompt for Tier 1 direct clone — EXACT copy from stable commit 830569d */
const DIRECT_CLONE_PROMPT = `You are an expert web designer. Analyze the HTML of a landing page and decompose it into structured sections matching our landing page builder schema.

Available section types, their variants, and fields:

STRUCTURE:
- nav: variants=[default, centered, transparent]. Fields: brandName, links[{label,href}], variant
- footer: variants=[simple, columns, minimal]. Fields: text, links[{label,href}], columns[{heading,links[{label,href}]}], variant

HERO (exactly ONE per page):
- hero: variants=[centered, split, video-bg, minimal]. Fields: headline, subheadline, variant, backgroundImage, embed (video/iframe URL). cta: ARRAY of buttons [{text, url, variant("primary"|"secondary"|"outline")}]. IMPORTANT: cta is always an ARRAY.

CONTENT:
- features: variants=[grid, list, alternating]. Fields: heading, subheading, items[{icon,title,description}], columns(2|3|4)
- stats: variants=[row, cards, large]. Fields: heading, subheading, items[{value,label,prefix,suffix}]
- how-it-works: variants=[numbered, timeline, cards]. Fields: heading, subheading, items[{number,title,description,icon}]
- team: variants=[grid, list, compact]. Fields: heading, subheading, members[{name,role,photo,bio}]
- faq: variants=[accordion, two-column, simple]. Fields: heading, items[{question,answer}]
- rich-text: Fields: content (markdown string, max 300 chars)

CONVERSION:
- pricing: variants=[cards, simple, highlight-center]. Fields: heading, subheading, plans[{name, price, period, description, features[], cta{text,url}, highlighted, badge}]. Count actual plan CARDS only.
- testimonials: variants=[cards, single, minimal, carousel]. Fields: heading, items[{quote, name, role, company, avatar, image}]. Use "carousel" if they scroll horizontally.
- cta: variants=[default, split, banner, minimal, with-image]. Fields: headline, subheadline, backgroundImage. cta: ARRAY of buttons [{text, url, variant}].
- social-proof: variants=[inline, banner]. Fields: text, icon, link
- logo-wall: Fields: heading, logos[{name,url,image}]
- banner: Fields: text, cta{text,url}, variant(info|warning|success)
- contact-form: Fields: heading, fields[{label,type}], submitText, submitUrl
- comparison: Fields: heading, subheading, columns[{label}], rows[{label,values[],highlight}]

MEDIA:
- video: Fields: url, caption, autoplay
- image: Fields: src, alt, caption, fullWidth
- image-text: Fields: image{src,alt}, heading, text, imagePosition(left|right), cta{text,url}
- gallery: Fields: heading, images[{src,alt,caption}]

LAYOUT (multi-column):
- layout: For side-by-side content blocks (e.g. stats next to testimonials, image next to form, multi-card grids).
  Fields: columns (array of column widths, e.g. [1,1] for equal 2-col, [2,1] for 2:1 ratio), children (array of {column: 0|1, sections: [{type,data}]}).
  Example: { "columns":[1,1], "children":[{"column":0, "sections":[{"type":"stats","data":{...}}]}, {"column":1, "sections":[{"type":"testimonials","data":{...}}]}] }
  Use layout when: original page shows 2+ content blocks side-by-side in the same row. Do NOT use layout for simple single-column sections stacked vertically.

Rules:
- Map each visual section to the BEST matching section type
- When original page has multi-column sections (e.g. 2 content blocks side-by-side), use layout section with nested sections in columns
- Extract ALL text content, image URLs as absolute URLs
- CRITICAL: ONLY use image URLs that ACTUALLY EXIST in the HTML source. NEVER invent or fabricate image URLs. If no image URL found for a section, omit the image field entirely — do NOT make up a URL.
- Order sections top-to-bottom (nav=-1, footer=999, others 0,1,2...)
- Extract colors from CSS/inline styles — find dominant brand color
- Keep content in ORIGINAL language
- SVG icons → replace with matching emoji. NEVER output "[SVG]"
- Decode /_next/image URLs to actual file paths
- Do NOT duplicate content across sections

Per-section styling:
For EACH section, extract its visual style from the original page as a "style" object:
- "fullWidth": true if the section spans full viewport width with no side margins (hero, CTA banners, dark testimonial strips, trust bars). false or omit for contained sections.
- "background": the section's actual background — color hex (e.g. "#1a2e28") or CSS gradient (e.g. "linear-gradient(135deg, #2d4a3e, #1a2e28)"). Omit if default/white/transparent.
- "backgroundImage": URL of section's background image (absolute URL). Only for sections with a visible bg image.
- "backgroundOverlay": gradient overlay used on top of backgroundImage (e.g. "linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.3))"). Only if section has a bg image with text overlay.
- "padding": section padding if notably different from default 3rem (e.g. "5rem 2rem", "1.5rem 2rem"). Omit if standard.
- "textColor": text color if the section has dark background and uses light text (e.g. "#ffffff"). Omit for default dark text.
- "textMutedColor": muted/secondary text color for the section (e.g. "rgba(255,255,255,0.6)" for dark sections).
- "accentColor": accent color for numbers, icons, stars, badges in this section.
IMPORTANT: Most landing pages alternate dark/light section backgrounds for visual rhythm. You MUST extract style for:
- Hero sections (always fullWidth, usually has backgroundImage + overlay)
- CTA/banner sections (usually fullWidth with gradient or dark background)
- Testimonial sections (often dark background for contrast)
- Stats/trust strips (often brand-color background with white text)
- Footer (always fullWidth)
- Any section with a visibly different background color from the page default
Only omit style for sections that truly use the page's default white/light background with no distinctive styling.

Return ONLY valid JSON:
{
  "title": "Page title", "description": "Meta description",
  "design": { "colors": { "primary":"#hex","secondary":"#hex","accent":"#hex","background":"#hex","surface":"#hex","text":"#hex","textMuted":"#hex" }, "fonts": { "heading":"Font", "body":"Font" }, "borderRadius": "12px" },
  "sections": [{ "type":"nav", "order":-1, "enabled":true, "data":{...}, "style":{"fullWidth":true,"background":"#1a2e28","textColor":"#fff"} }, ...]
}`

/** Structure analysis prompt (Step 1 — small output) */
const STRUCTURE_PROMPT = `You are a web design expert. Analyze this HTML and identify the STRUCTURE of the landing page. Do NOT extract content — only identify sections.

Available section types: ${SECTION_TYPES.join(', ')}

For each visible section on the page, return:
- type: best matching section type, or "unknown" if no match. Use "layout" when 2+ content blocks appear side-by-side in the same row.
- variant: layout variant (e.g. "centered", "split", "grid", "cards", "carousel")
- confidence: 0-100 how sure you are this mapping is correct
- itemCount: number of items (for lists, grids, testimonials, pricing plans)
- note: any issues or details (e.g. "has video embed", "carousel with 8 items", "2-column layout")

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

/** Fetch HTML — Firecrawl first (best quality), direct fetch as fallback */
async function fetchPageHtml(url: string): Promise<string> {
  const firecrawlKey = import.meta.env.FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY
  if (firecrawlKey) {
    try {
      const fcHtml = await firecrawlFetch(url, firecrawlKey)
      if (fcHtml.length > 500) return fcHtml
    } catch {}
  }
  return await directFetch(url)
}

/** Design extraction prompt — uses HTML+CSS for accurate color/font extraction */
const DESIGN_EXTRACT_PROMPT = `Extract the visual design system from this HTML page by analyzing inline styles, CSS classes, and style blocks.

Return ONLY valid JSON:
{
  "colors": { "primary":"#hex", "secondary":"#hex", "accent":"#hex", "background":"#hex", "surface":"#hex", "text":"#hex", "textMuted":"#hex" },
  "fonts": { "heading":"Font Name", "body":"Font Name" },
  "borderRadius": "8px"
}

Rules:
- PRIMARY = the most prominent brand color used on buttons, links, nav backgrounds, CTA sections. Look at background-color on buttons and nav, color on links/headings. Count frequency — the most-used non-white/non-black color is likely primary.
- SECONDARY = second most common brand color. Often used for hover states or section backgrounds.
- ACCENT = eye-catching highlight color (often yellow, orange, or bright). Used sparingly for badges, highlights, icons.
- BACKGROUND = page body background (usually #fff or light gray)
- SURFACE = card/section background (usually white or very light)
- TEXT = main body text color (usually dark gray/black, e.g. #1e2022, #333)
- TEXT MUTED = secondary text, captions (lighter gray)
- IMPORTANT: Do NOT guess. Only return colors that ACTUALLY appear in the HTML inline styles or style blocks. Count occurrences — frequency matters.
- For fonts: check @import, link[href*=fonts], font-family in style attributes. Return the actual font name, not generic "Sans-serif".
- borderRadius: find the most common border-radius on cards/buttons
- If a value cannot be confidently found, omit the key`

/** Separate Gemini call to extract design from HTML/CSS (more accurate than Markdown) */
async function extractDesign(apiKey: string, html: string): Promise<{ design: CloneResult['design']; promptTokens: number; outputTokens: number }> {
  // Keep style tags for design extraction — only strip scripts/SVGs
  const designHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .slice(0, 30_000)
  const { text, promptTokens, outputTokens } = await geminiCall(apiKey, DESIGN_EXTRACT_PROMPT, designHtml, 2048)
  const parsed = safeJsonParse(text) as CloneResult['design'] | null
  return { design: parsed || undefined, promptTokens, outputTokens }
}

/** Section styles prompt — uses HTML with CSS to determine per-section visual styling */
const SECTION_STYLES_PROMPT = `You are a web design expert. I have already extracted these sections from a landing page. Now I need you to analyze the VISUAL STYLING of each section from the HTML/CSS.

For each section listed below, determine:
- "fullWidth": true if the section spans the full viewport width (no side margins, edge-to-edge)
- "background": the ACTUAL background color/gradient of this section from CSS (NOT #ffffff unless it truly is white). Check CSS classes, inline styles, and style blocks. Dark nav bars are often #1a2e28 or #2d4a3e. CTA sections often use brand colors. Testimonial sections are often dark.
- "backgroundOverlay": if the section has a background image with text overlay, what gradient is used (e.g. "linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.3))")
- "textColor": text color for this section. "#ffffff" for dark background sections, omit for light sections.
- "textMutedColor": secondary text color for this section.
- "padding": only if notably different from standard "3rem 2rem"

CRITICAL: Do NOT default everything to #ffffff. Analyze the CSS classes used on each section element and trace them to their background-color/background definitions in the style blocks. Many landing pages alternate dark and light sections for visual rhythm.

Return ONLY valid JSON: { "styles": [{ "index": 0, "fullWidth": true, "background": "#2d4a3e", "textColor": "#ffffff" }, ...] }
Only include entries for sections that have non-default styling. Omit sections with plain white/light default backgrounds.`

/** Separate Gemini call to extract per-section visual styles from HTML/CSS */
async function extractSectionStyles(
  apiKey: string, html: string, sections: Array<{ type: string; order: number; data: Record<string, unknown> }>
): Promise<{ styles: Array<{ index: number } & Record<string, unknown>>; promptTokens: number; outputTokens: number }> {
  const designHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .slice(0, 40_000)
  const sectionList = sections.map((s, i) => {
    const heading = String((s.data as any)?.headline || (s.data as any)?.heading || (s.data as any)?.brandName || (s.data as any)?.text || '')
    return `${i}. ${s.type}${heading ? `: "${heading.slice(0, 50)}"` : ''}`
  }).join('\n')
  const userPrompt = `Sections to analyze:\n${sectionList}\n\nHTML with CSS:\n${designHtml}`
  const { text, promptTokens, outputTokens } = await geminiCall(apiKey, SECTION_STYLES_PROMPT, userPrompt, 4096)
  const parsed = safeJsonParse(text) as { styles?: Array<{ index: number } & Record<string, unknown>> } | null
  return { styles: parsed?.styles || [], promptTokens, outputTokens }
}

/** ===== TIER 1: Direct clone (proven stable for SaaS) ===== */
async function directClone(apiKey: string, html: string, intent: string, url: string): Promise<CloneResult> {
  const intentCtx = intent ? `\n\nUser intent: ${intent}` : ''
  const { text, promptTokens, outputTokens } = await geminiCall(apiKey, DIRECT_CLONE_PROMPT, `Analyze this HTML:${intentCtx}\n\nURL: ${url}\n\n${html}`, 32768)

  const parsed = safeJsonParse(text) as CloneResult | null
  if (!parsed?.sections?.length) throw new Error('Failed to parse clone response')
  for (const s of parsed.sections) { if (!s.data) s.data = {} }
  normalizeSections(parsed.sections)

  const totalTokens = promptTokens + outputTokens
  parsed.usage = { promptTokens, outputTokens, totalTokens, estimatedCostUsd: (promptTokens * 0.00000015) + (outputTokens * 0.0000006) }
  validateDesign(parsed)
  return parsed
}

/** ===== TIER 2+: 2-step structure-first clone ===== */
async function structureFirstClone(apiKey: string, html: string, intent: string, url: string): Promise<CloneResult> {
  let totalPrompt = 0, totalOutput = 0
  const lastMd = getLastMarkdown()

  // Step 1: Analyze structure — prefer Markdown (compact, fits full page) over HTML
  const structureContent = lastMd.length > 500 ? lastMd : cleanForStructure(html).slice(0, 60_000)
  const contentType = lastMd.length > 500 ? 'Markdown' : 'HTML'
  const intentCtx = intent ? `\nUser intent: ${intent}` : ''
  const step1 = await geminiCall(apiKey, 'You are a web design expert. Return ONLY valid compact JSON.', `${STRUCTURE_PROMPT}${intentCtx}\n\nURL: ${url}\n\nPage content (${contentType}):\n${structureContent}`, 8192)
  totalPrompt += step1.promptTokens
  totalOutput += step1.outputTokens

  const analysis = safeJsonParse(step1.text) as { title?: string; description?: string; design?: CloneResult['design']; structure?: Array<{ order: number; type: string; variant: string; confidence: number; itemCount: number; note: string }> } | null
  if (!analysis?.structure?.length) throw new Error('Structure analysis returned no sections')

  // Step 2: Fill content per section (parallel) — use Markdown if available (compact, full page)
  const fillContent = lastMd.length > 500 ? lastMd : cleanForStructure(html).slice(0, 50_000)
  const fillType = lastMd.length > 500 ? 'Markdown' : 'HTML'
  const validSections = analysis.structure.filter(s => SECTION_TYPES.includes(s.type))
  const fillPromises = validSections.map(async (s) => {
    const prompt = buildFillPrompt(s.type, s.variant, s.itemCount)
    const { text, promptTokens, outputTokens } = await geminiCall(apiKey, 'Extract content for ONE section. Return ONLY the data JSON object.', `${prompt}\n\n${fillType}:\n${fillContent}`, 4096)
    totalPrompt += promptTokens
    totalOutput += outputTokens
    const data = safeJsonParse(text) as Record<string, unknown> | null
    return { type: s.type, order: s.order, enabled: true, data: data || {}, confidence: s.confidence }
  })

  const sections = await Promise.all(fillPromises)

  const totalTokens = totalPrompt + totalOutput
  const result: CloneResult = {
    title: analysis.title || '',
    description: analysis.description,
    design: analysis.design,
    sections: sections.sort((a, b) => a.order - b.order),
    structure: analysis.structure,
    usage: { promptTokens: totalPrompt, outputTokens: totalOutput, totalTokens, estimatedCostUsd: (totalPrompt * 0.00000015) + (totalOutput * 0.0000006) },
  }
  validateDesign(result)
  return result
}

/** Retry prompt — targeted fill for specific missing headings */
const RETRY_MISSING_PROMPT = `You are a web design expert. The page has sections that were missed in a first pass.
For EACH heading below, extract the content from the page and map it to the best matching section type.

Available section types: ${SECTION_TYPES.join(', ')}

Rules:
- Map each heading to the BEST matching section type
- Extract ALL text content for that section
- Icons → emoji, text max 200 chars, images as absolute URLs
- cta is ALWAYS an array [{text, url}]
- For side-by-side content blocks, use "layout" type with columns and children
- Return sections in order they appear on the page

Return ONLY valid JSON: { "sections": [{ "type":"...", "order":N, "enabled":true, "data":{...} }] }`

/** Auto-retry: call Gemini only for missing sections, merge into result (additive only) */
async function retryMissingSections(
  apiKey: string, content: string, missingHeadings: string[], existingSections: CloneResult['sections']
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

/** ===== MAIN ENTRY — single path: best HTML → directClone ===== */
export async function cloneLandingPage(url: string, intent?: string): Promise<CloneResult> {
  const apiKey = import.meta.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const isDataUrl = url.startsWith('data:text/html,')
  const firecrawlKey = import.meta.env.FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY

  // Step 1: Get best HTML available
  let rawHtml: string
  if (isDataUrl) {
    rawHtml = decodeURIComponent(url.slice('data:text/html,'.length))
  } else {
    let fcHtml = ''
    if (firecrawlKey) {
      try { fcHtml = await firecrawlFetch(url, firecrawlKey) } catch {}
    }
    const directHtml = await directFetch(url)
    const fcWords = cleanBasic(fcHtml).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(w => w.length > 2).length
    const directWords = cleanBasic(directHtml).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(w => w.length > 2).length
    rawHtml = fcWords > directWords ? fcHtml : directHtml
  }

  const html = cleanBasic(rawHtml)
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(w => w.length > 2).length

  if (words < 20) {
    throw new Error(`Page has too little content (${words} words). Use "📋 Paste Code" mode.`)
  }

  // Step 2: Choose best input format — keep <style> blocks so Gemini sees CSS colors
  const htmlWithStyles = cleanKeepStyles(rawHtml)
  const lastMd = getLastMarkdown()
  let cloneInput: string
  if (htmlWithStyles.length <= 80_000) {
    cloneInput = htmlWithStyles
  } else if (html.length <= 60_000) {
    cloneInput = html
  } else if (lastMd.length > 500) {
    cloneInput = lastMd.slice(0, 50_000)
  } else {
    cloneInput = cleanForStructure(rawHtml).slice(0, 80_000)
  }

  const r = await directClone(apiKey, cloneInput, intent || '', url)

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
    } catch {} // Design extraction failure is non-critical

    // Per-section style extraction — separate call with raw HTML + CSS
    try {
      const styleResult = await extractSectionStyles(apiKey, rawHtml, r.sections)
      for (const styleDef of styleResult.styles) {
        const section = r.sections[styleDef.index]
        if (!section) continue
        const { index: _, ...styleOverrides } = styleDef
        // Merge: per-section style extraction takes priority over clone-prompt styles
        section.style = { ...(section.style || {}), ...styleOverrides } as any
      }
      addUsage(r, styleResult.promptTokens, styleResult.outputTokens)
    } catch {} // Section style extraction failure is non-critical
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

  // Phase 1: Auto-retry missing sections (additive only, max 1 retry)
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

  // Phase 2: Per-section quality assessment
  r.sectionQuality = r.sections.map((s, i) => assessSectionQuality(s, i))

  try { logCloneSections(url, r.sections, words, pageHeadings) } catch {}
  return r
}

/** Assess quality of a single cloned section */
function assessSectionQuality(
  s: { type: string; data: Record<string, unknown> }, index: number
): { index: number; score: 'good' | 'partial' | 'poor'; issue?: string } {
  const d = s.data || {}
  const values = Object.values(d).filter(v => v != null && v !== '' && v !== undefined)
  if (values.length === 0) return { index, score: 'poor', issue: 'No content extracted' }

  const hasHeading = !!(d.headline || d.heading || d.brandName || d.text || d.content)
  if (!hasHeading && !['divider','social-proof','nav','footer','image','video','map'].includes(s.type))
    return { index, score: 'partial', issue: 'Missing heading' }

  const itemKey = s.type === 'team' ? 'members' : s.type === 'gallery' ? 'images' : 'items'
  if (['features','stats','faq','how-it-works','testimonials','pricing','team','gallery'].includes(s.type)) {
    const items = d[itemKey]
    if (!Array.isArray(items) || items.length === 0) return { index, score: 'poor', issue: 'Empty items list' }
    if (items.length === 1 && s.type !== 'pricing') return { index, score: 'partial', issue: 'Only 1 item — likely incomplete' }
  }

  if ((s.type === 'hero' || s.type === 'image-text') && !d.backgroundImage && !d.image && !d.embed)
    return { index, score: 'partial', issue: 'No image or media' }

  return { index, score: 'good' }
}
