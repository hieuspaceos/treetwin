/**
 * AI landing page cloner — fetches a URL, sends HTML to Gemini,
 * returns structured sections + design config matching our builder schema.
 * Requires GEMINI_API_KEY env var.
 */

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

/** Section types and variants available in the landing page builder */
const SECTION_SCHEMA = `
Available section types, their variants, and fields:

STRUCTURE:
- nav: variants=[default, centered, transparent]. Fields: brandName, links[{label,href}], variant
- footer: variants=[simple, columns, minimal]. Fields: text, links[{label,href}], columns[{heading,links[{label,href}]}], variant

HERO (exactly ONE per page):
- hero: variants=[centered, split, video-bg, minimal].
  Fields: headline, subheadline, variant, backgroundImage, embed (video/iframe URL)
  cta: ARRAY of buttons [{text, url, variant("primary"|"secondary"|"outline")}]
  IMPORTANT: cta is always an ARRAY, even for a single button.

CONTENT:
- features: variants=[grid, list, alternating]. Fields: heading, subheading, items[{icon,title,description}], columns(2|3|4)
- stats: variants=[row, cards, large]. Fields: heading, subheading, items[{value,label,prefix,suffix}]
- how-it-works: variants=[numbered, timeline, cards]. Fields: heading, subheading, items[{number,title,description,icon}]
- team: variants=[grid, list, compact]. Fields: heading, subheading, members[{name,role,photo,bio}]
- faq: variants=[accordion, two-column, simple]. Fields: heading, items[{question,answer}]
- rich-text: Fields: content (HTML string)

CONVERSION:
- pricing: variants=[cards, simple, highlight-center].
  Fields: heading, subheading, plans[{name, price, period, description, features[], cta{text,url}, highlighted, badge}]
  IMPORTANT: Only actual pricing plan CARDS go here. Do NOT confuse CTA buttons or bundle upsells with pricing plans.
  Count the actual plan cards on the page — if there are 2 cards, output exactly 2 plans.
  badge: optional label like "Most Popular" or "BEST VALUE" shown on the card.
- testimonials: variants=[cards, single, minimal, carousel].
  Fields: heading, subheading, items[{quote, name, role, company, avatar, image}]
  avatar = small profile picture URL. image = screenshot of the original testimonial post.
  Use "carousel" variant if testimonials scroll horizontally.
- cta: variants=[default, split, banner, minimal, with-image].
  Fields: headline, subheadline, backgroundImage
  cta: ARRAY of buttons [{text, url, variant("primary"|"secondary"|"outline")}]
  IMPORTANT: cta is always an ARRAY.
- social-proof: variants=[inline, banner]. Fields: text, icon, link
  Short trust line like "Join 500+ happy customers" shown between sections.
- logo-wall: Fields: heading, logos[{name,url,image}]
- banner: Fields: text, cta{text,url}, variant(info|warning|success)
- countdown: Fields: targetDate, heading, expiredText
- contact-form: Fields: heading, fields[{label,type}], submitText, submitUrl
- comparison: Fields: heading, subheading, columns[{label}], rows[{label,values[],highlight}]

MEDIA:
- video: Fields: url, caption, autoplay
- image: Fields: src, alt, caption, fullWidth
- image-text: Fields: image{src,alt}, heading, text, imagePosition(left|right), cta{text,url}
- gallery: Fields: heading, images[{src,alt,caption}]
- map: Fields: address, embedUrl, height
- divider: Fields: style(line|dots|space), height
- layout: Fields: columns(number[]), gap, children[{column,sections[]}]
`

const SYSTEM_PROMPT = `You are an expert web designer. Analyze the HTML of a landing page and decompose it into structured sections matching our landing page builder schema.

${SECTION_SCHEMA}

For the design config, extract:
- colors: primary (brand color), secondary, accent, background, surface (card bg), text, textMuted
- fonts: heading font family, body font family
- borderRadius: e.g. "12px", "8px", "16px"

Rules:
- Map each visual section of the page to the BEST matching section type
- Choose the variant that best matches the visual layout
- Extract ALL text content (headlines, descriptions, button text, etc.)
- Extract image URLs as-is (absolute URLs)
- For nav: extract brand name and navigation links
- For footer: extract copyright text and links
- Order sections top-to-bottom (nav=-1, footer=999, others 0,1,2...)
- If a section doesn't match any type, use rich-text with the HTML content
- Extract colors from the page's CSS/inline styles — find the dominant brand color
- Keep content in the ORIGINAL language of the page

IMAGE URL HANDLING:
- Extract image URLs as direct paths. If you see Next.js optimized URLs like "/_next/image?url=%2F..." decode them to the actual file path (e.g. "/_next/image?url=%2Fassets%2Fphoto.jpg&w=3840&q=75" → "/assets/photo.jpg")
- Always prefer the original image URL, not the processed/optimized version

ICON HANDLING:
- SVG icons CANNOT be extracted. When you see SVG elements in HTML, replace them with a matching EMOJI character instead.
- For icon fields, ALWAYS use emoji (e.g. ✨ 🚀 🔒 ⚡ 💡 🛡️ ✅ 📦 🎯 💰 ☁️ 📧 🔧 📊 🏆 ❤️). NEVER output "[SVG]" or raw SVG markup.
- For rich-text sections with inline SVG icons, replace each SVG with the closest emoji.

CRITICAL — avoid these common mistakes:
- hero.cta and cta.cta are ALWAYS arrays: [{text, url, variant}], never a single object
- PRICING: Count the actual pricing CARDS on the page. Do NOT create extra plans from CTA buttons, bundle links, or upsell text that appear elsewhere (hero, footer, CTA sections). If the page shows 2 pricing cards, output exactly 2 plans.
- TESTIMONIALS: If testimonials scroll/slide horizontally, use variant "carousel". The "image" field is for screenshots of the original post, NOT avatar/profile pictures.
- SOCIAL PROOF: Short trust lines like "Join 500+ happy customers" between sections should be "social-proof" type, NOT part of other sections.
- Do NOT duplicate content across sections. Each piece of content belongs to exactly one section.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "title": "Page title",
  "description": "Meta description or first paragraph summary",
  "design": {
    "colors": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "surface": "#hex", "text": "#hex", "textMuted": "#hex" },
    "fonts": { "heading": "Font Name", "body": "Font Name" },
    "borderRadius": "12px"
  },
  "sections": [
    { "type": "nav", "order": -1, "enabled": true, "data": { "brandName": "...", "links": [...], "variant": "default" } },
    { "type": "hero", "order": 0, "enabled": true, "data": { "headline": "...", "variant": "centered", ... } },
    ...
  ]
}`

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
  /** Token usage + estimated cost from Gemini API */
  usage?: { promptTokens: number; outputTokens: number; totalTokens: number; estimatedCostUsd: number }
}

/** Rewrite external image URLs in cloned sections to use /api/proxy-image */
function proxyExternalImages(result: CloneResult) {
  const rewrite = (val: unknown): unknown => {
    if (typeof val === 'string' && /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg|avif)/i.test(val)) {
      return `/api/proxy-image?url=${encodeURIComponent(val)}`
    }
    if (Array.isArray(val)) return val.map(rewrite)
    if (val && typeof val === 'object') {
      const obj = val as Record<string, unknown>
      for (const k of Object.keys(obj)) obj[k] = rewrite(obj[k])
    }
    return val
  }
  for (const section of result.sections) {
    section.data = rewrite(section.data) as Record<string, unknown>
  }
}

/** Fetch HTML from URL with timeout and size limit */
async function fetchPageHtml(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TreeID-Bot/1.0)' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()
    // Limit to ~100K chars to stay within Gemini context
    return html.slice(0, 100_000)
  } finally {
    clearTimeout(timeout)
  }
}

/** Attempt to repair malformed/truncated JSON from AI response */
function repairJson(text: string): string {
  // Strip markdown code fences
  let json = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()

  // Try as-is first
  try { JSON.parse(json); return json } catch {}

  // Fix common issues: unescaped newlines/tabs inside strings
  json = json.replace(/(?<=": ")((?:[^"\\]|\\.)*)(?=")/g, (match) =>
    match.replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r')
  )

  // Try again after string escaping
  try { JSON.parse(json); return json } catch {}

  // Truncation repair: find last valid structure point and close
  // Try progressively shorter substrings
  for (let cutback = 0; cutback < 500; cutback += 10) {
    let attempt = json.slice(0, json.length - cutback)
    // Remove partial key-value at the end
    attempt = attempt.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, '')
    attempt = attempt.replace(/,\s*$/, '')

    // Count and close unclosed brackets/braces
    let braces = 0, brackets = 0, inStr = false, esc = false
    for (const ch of attempt) {
      if (esc) { esc = false; continue }
      if (ch === '\\') { esc = true; continue }
      if (ch === '"') { inStr = !inStr; continue }
      if (inStr) continue
      if (ch === '{') braces++; else if (ch === '}') braces--
      if (ch === '[') brackets++; else if (ch === ']') brackets--
    }
    // Close unclosed string if inside one
    if (inStr) attempt += '"'

    while (brackets > 0) { attempt += ']'; brackets-- }
    while (braces > 0) { attempt += '}'; braces-- }

    try { JSON.parse(attempt); return attempt } catch {}
  }

  return json
}

/** Strip scripts, styles, and non-visible content to reduce token usage */
function cleanHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '[SVG]')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Send HTML to Gemini and get structured landing page config */
export async function cloneLandingPage(url: string, intent?: string): Promise<CloneResult> {
  const apiKey = import.meta.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  // Fetch HTML from URL or decode pasted code (data: URL)
  const rawHtml = url.startsWith('data:text/html,')
    ? decodeURIComponent(url.slice('data:text/html,'.length))
    : await fetchPageHtml(url)
  const html = cleanHtml(rawHtml)

  if (html.length < 100) {
    throw new Error('Page content too short — this site is likely a JavaScript SPA (React/Angular/Vue) that renders client-side. Try using "Paste Code" mode instead: open the page in your browser → right-click → View Page Source → copy all → paste into the code tab.')
  }

  const intentContext = intent
    ? `\n\nUser's intent: ${intent}\nUse this context to better understand what sections are important and how to categorize content.`
    : ''

  // Call Gemini
  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text: `Analyze this landing page HTML and decompose into sections:${intentContext}\n\nURL: ${url}\n\n${html}` }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 16384,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error: ${res.status} — ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from Gemini')

  // Extract token usage for cost display
  const usageMeta = data?.usageMetadata
  const promptTokens = usageMeta?.promptTokenCount || 0
  const outputTokens = usageMeta?.candidatesTokenCount || 0
  const totalTokens = promptTokens + outputTokens
  // Gemini 2.5 Flash pricing: $0.15/1M input, $0.60/1M output (as of 2025)
  const estimatedCostUsd = (promptTokens * 0.00000015) + (outputTokens * 0.0000006)

  // Parse JSON response — repair truncated JSON if needed
  try {
    const result = JSON.parse(repairJson(text)) as CloneResult
    if (!result.sections || !Array.isArray(result.sections)) {
      throw new Error('Invalid response: missing sections array')
    }
    result.usage = { promptTokens, outputTokens, totalTokens, estimatedCostUsd }
    return result
  } catch (e) {
    throw new Error(`Failed to parse AI response: ${(e as Error).message}`)
  }
}
