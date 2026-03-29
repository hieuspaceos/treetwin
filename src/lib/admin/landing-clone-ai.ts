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
- nav: variants=[default, centered, transparent]. Fields: brandName, logo (image URL of site logo), topBar[{icon,text,href}] (phone/email/social info bar above nav), links[{label,href}], variant, socialLinks[{icon,url,label}]
  IMPORTANT: Extract the site logo IMAGE URL (not text). Look for <img> inside header/nav with "logo" in class/src. Set variant="centered" if logo is centered with links split left/right.
  If site has a top info bar (phone, email, social links), extract to topBar array.
- footer: variants=[simple, columns, minimal]. Fields: text, links[{label,href}], columns[{heading,links[{label,href}]}], variant

HERO (exactly ONE per page):
- hero: variants=[centered, split, video-bg, minimal]. Fields: headline, subheadline, variant, backgroundImage, embed (video/iframe URL). cta: ARRAY of buttons [{text, url, variant("primary"|"secondary"|"outline")}]. IMPORTANT: cta is always an ARRAY.

CONTENT:
- features: variants=[grid, list, alternating]. Fields: heading, subheading, items[{icon,title,description,image,url}], columns(2|3|4|5)
  IMPORTANT: When items have PHOTOS (not icons), set "image" field with the photo URL. For travel/portfolio cards, use image + title + url (makes clickable image overlay cards). Use "icon" only for emoji/small icons. Set columns to match the visual grid (3 for 3-col, 4 for 4-col, 5 for icon bars).
- stats: variants=[row, cards, large]. Fields: heading, subheading, items[{value,label,prefix,suffix}]
- how-it-works: variants=[numbered, timeline, cards]. Fields: heading, subheading, items[{number,title,description,icon}]
- team: variants=[grid, list, compact]. Fields: heading, subheading, members[{name,role,photo,bio}]
- faq: variants=[accordion, two-column, simple]. Fields: heading, items[{question,answer}]
- rich-text: Fields: heading, subheading, content (HTML string — can include <p>, <a>, <img>, <div> with inline styles for custom layouts)

CONVERSION:
- pricing: variants=[cards, simple, highlight-center]. Fields: heading, subheading, plans[{name, price, period, description, image (cover photo URL), features[], cta{text,url}, highlighted, badge}]. Count actual plan CARDS only. IMPORTANT: Extract cover images for travel/product cards.
- testimonials: variants=[cards, single, minimal, carousel]. Fields: heading, items[{quote, name, role, company, avatar, image}]. Use "carousel" if they scroll horizontally.
- cta: variants=[default, split, banner, minimal, with-image]. Fields: headline, subheadline, backgroundImage, variant. cta: ARRAY of buttons [{text, url, variant}].
  IMPORTANT: Most pages have a CTA section before the footer. Always add one with variant="with-image" if a background image is available.
- social-proof: variants=[inline, banner]. Fields: text, icon, link
- logo-wall: Fields: heading, logos[{name,url,image}]
  IMPORTANT: If testimonials section has trust logos (Google, TripAdvisor, etc.), add a logo-wall section BEFORE the testimonials section.
- banner: Fields: text, cta{text,url}, variant(info|warning|success)
- contact-form: Fields: heading, fields[{label,type}], submitText, submitUrl
- comparison: Fields: heading, subheading, columns[{label}], rows[{label,values[],highlight}]

MEDIA:
- video: Fields: url, caption, autoplay, heading, subheading, cta{text,url}, items[{url,caption}]
  IMPORTANT: If page has multiple videos, use "items" array for 2x2 grid. Extract ALL video embed URLs.
- image: Fields: src, alt, caption, fullWidth
- image-text: Fields: image{src,alt}, heading, text, imagePosition(left|right), cta{text,url}
- gallery: Fields: heading, images[{src,alt,caption}]

LAYOUT (multi-column) — USE THIS AGGRESSIVELY:
- layout: For side-by-side content blocks (e.g. text next to gallery, stats next to testimonials, multi-row grids).
  Fields: columns (array of column widths, e.g. [1,1] for equal 2-col, [2,1] for 2:1 ratio), gap (CSS gap value), children (array of {column: 0|1, sections: [{type,order,enabled,data}]}).
  Example: { "columns":[1,1], "gap":"2rem", "children":[{"column":0, "sections":[{"type":"rich-text","order":0,"enabled":true,"data":{"heading":"About","content":"..."}}]}, {"column":1, "sections":[{"type":"gallery","order":0,"enabled":true,"data":{"images":[...]}}]}] }

  CRITICAL LAYOUT RULES:
  1. Use layout for ANY section where original shows 2+ content blocks side-by-side
  2. "About us" sections with text + photos → layout [1,1]: rich-text left + gallery right
  3. Sections with different column counts per row → layout [1] with nested features of different column counts
  4. Icon bars with 5+ items → use features with columns:5
  5. Text + image pairs that aren't simple image-text → use layout with rich-text + image sections
  Do NOT default to image-text for complex layouts — use layout + nested sections instead.

Rules:
- Map each visual section to the BEST matching section type
- PREFER layout sections over image-text for complex multi-column content
- When original page has multi-column sections (e.g. 2 content blocks side-by-side), use layout section with nested sections in columns
- Extract ALL text content, image URLs as absolute URLs
- CRITICAL: ONLY use image URLs that ACTUALLY EXIST in the HTML source. NEVER invent or fabricate image URLs. If no image URL found for a section, omit the image field entirely — do NOT make up a URL.
- For features with photos (travel cards, portfolio items): use "image" field (not "icon"). This renders as image overlay cards with title on photo.
- For icon bars (small icons with labels): use "icon" field with the icon IMAGE URL (not emoji) if an icon image exists in the HTML.
- Find the REAL hero background image — look for CSS background-image URLs in the hero area, NOT small logos/icons. The hero bg should be a large photo.
- Find the site LOGO image URL — look for <img> in the header/nav area with "logo" in the class/alt/src.
- Order sections top-to-bottom (nav=-1, footer=999, others 0,1,2...)
- Extract colors from CSS/inline styles — find dominant brand color
- Keep content in ORIGINAL language
- SVG icons → use the icon's image URL if available, otherwise matching emoji. NEVER output "[SVG]"
- Decode /_next/image URLs to actual file paths
- Do NOT duplicate content across sections
- ALWAYS add a CTA section (order=last-1) before footer with backgroundImage if available
- If page has trust logos (Google, TripAdvisor, etc.) near testimonials, add a logo-wall section before testimonials

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
- type: best matching section type, or "unknown" if no match. Use "layout" AGGRESSIVELY when 2+ content blocks appear side-by-side in the same row (text+gallery, text+form, multi-column grids).
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

/** Scoped CSS generation prompt — generates custom CSS per section to match original */
const SCOPED_CSS_PROMPT = `You are an expert CSS designer. I cloned a landing page into structured sections. Now I need you to generate CUSTOM CSS for each section to make it visually match the original page.

Each section in my system renders inside a wrapper with attribute data-section="section-{type}" (e.g. data-section="section-hero", data-section="section-testimonials").

Inside each section, the HTML uses these classes:
- .landing-section — main section container (padding, background)
- .lp-section-heading — section headings (font-family, size)
- .lp-card-hover — cards with hover effects
- .lp-icon-bg — icon circle backgrounds
- .lp-stars — star rating display
- .lp-quote-mark — large quote character
- .lp-avatar — circular avatar images
- .landing-grid-2, .landing-grid-3, .landing-grid-4 — responsive grids
- .landing-btn-primary, .landing-btn-outline — buttons
- .landing-stat-value — large stat numbers
- .glass-card — generic cards

For each section, write CSS that:
1. Targets [data-section="section-{type}"] as the scope
2. Overrides backgrounds, colors, spacing, typography to match the ORIGINAL page design
3. Adds visual polish: gradients, shadows, hover effects, transitions
4. Creates visual rhythm — alternate dark/light sections as in the original
5. Makes hero sections feel immersive (large padding, overlay gradients)
6. Makes CTA sections stand out (gradient backgrounds, large text)
7. Makes testimonial sections atmospheric (dark bg, italic serif quotes)

Rules:
- Use CSS custom properties where possible: var(--lp-primary), var(--lp-text), etc.
- Keep CSS concise — only override what's needed per section
- NO @import, NO url(data:), NO javascript:, NO position:fixed
- Do NOT change layout structure — only visual styling

CRITICAL: Generate one CSS block per section. Each block MUST be scoped to its data-section selector. Do NOT use :root or global selectors. Every CSS rule inside a block is relative to its section selector.

Return ONLY valid JSON with one entry PER section (not just a few — cover ALL sections):
{
  "sectionCss": [
    { "selector": "[data-section=\\"section-hero\\"]", "css": ".landing-section { background: #1a2e28; min-height: 85vh; padding: 6rem 2rem; } h1 { font-size: clamp(2.5rem,6vw,5rem); color: #fff; letter-spacing: -0.02em; } p { color: rgba(255,255,255,0.8); }" },
    { "selector": "[data-section=\\"section-stats\\"]", "css": ".landing-section { background: #2d4a3e; padding: 2rem 2rem; } .landing-stat-value { color: #d4a853; } p { color: rgba(255,255,255,0.7); }" },
    { "selector": "[data-section=\\"section-testimonials\\"]", "css": ".landing-section { background: #1a2e28; padding: 4rem 2rem; } h2 { color: #fff; } .lp-card-hover { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); } p { color: rgba(255,255,255,0.85); } .lp-stars { color: #d4a853; }" },
    { "selector": "[data-section=\\"section-cta\\"]", "css": ".landing-section { background: linear-gradient(135deg, #2d4a3e, #1a2e28); padding: 5rem 2rem; } h2 { color: #fff; font-size: clamp(1.8rem,4vw,3rem); } p { color: rgba(255,255,255,0.7); } .landing-btn-primary { background: #e65f2b; }" },
    { "selector": "[data-section=\\"section-features\\"]", "css": ".lp-card-hover { border: 1px solid rgba(0,0,0,0.08); } .lp-icon-bg { background: rgba(230,95,43,0.1); }" },
    { "selector": "[data-section=\\"section-footer\\"]", "css": ".landing-section { background: #1a2e28; padding: 3rem 2rem; } p, a, h4 { color: rgba(255,255,255,0.7); } h4 { color: #fff; }" }
  ]
}`

/** Generate scoped CSS for each section to match original site's visual quality */
async function generateScopedCss(
  apiKey: string, html: string, sections: Array<{ type: string; data: Record<string, unknown> }>
): Promise<{ cssBlocks: Array<{ selector: string; css: string }>; promptTokens: number; outputTokens: number }> {
  const designHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .slice(0, 40_000)
  const sectionList = sections.map((s, i) => {
    const d = s.data as Record<string, unknown>
    const heading = String(d?.headline || d?.heading || d?.brandName || d?.text || '').slice(0, 50)
    return `- [data-section="section-${s.type}${i > 0 && sections.slice(0, i).some(p => p.type === s.type) ? `-${i + 1}` : ''}"] → ${s.type}${heading ? `: "${heading}"` : ''}`
  }).join('\n')
  const userPrompt = `My sections:\n${sectionList}\n\nOriginal page HTML+CSS:\n${designHtml}`
  const { text, promptTokens, outputTokens } = await geminiCall(apiKey, SCOPED_CSS_PROMPT, userPrompt, 8192)
  const parsed = safeJsonParse(text) as { sectionCss?: Array<{ selector: string; css: string }> } | null

  // Sanitize CSS — strip dangerous patterns
  const dangerous = /javascript:|@import|url\s*\(\s*data:|expression\s*\(|position\s*:\s*fixed/gi
  const blocks = (parsed?.sectionCss || []).filter(b => b.selector && b.css && !dangerous.test(b.css))
  return { cssBlocks: blocks, promptTokens, outputTokens }
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

/** Build scoped CSS blocks from per-section style overrides — reliable, no AI guessing */
function buildScopedCssFromStyles(sections: CloneResult['sections']): Array<{ selector: string; css: string }> {
  const blocks: Array<{ selector: string; css: string }> = []
  const typeCounts = new Map<string, number>()

  for (const s of sections) {
    const count = (typeCounts.get(s.type) || 0) + 1
    typeCounts.set(s.type, count)
    const sectionId = count === 1 ? `section-${s.type}` : `section-${s.type}-${count}`
    const style = s.style as Record<string, unknown> | undefined
    if (!style) continue

    const rules: string[] = []
    const bg = style.background as string | undefined
    const textColor = style.textColor as string | undefined
    const textMuted = style.textMutedColor as string | undefined
    const accent = style.accentColor as string | undefined
    const isDark = textColor && ['#fff', '#ffffff', '#fafafa', 'white'].includes(textColor.toLowerCase())

    // Section background
    if (bg && bg.toLowerCase() !== '#ffffff' && bg.toLowerCase() !== '#fff') {
      rules.push(`.landing-section { background: ${bg}; }`)
    }

    // Dark section — override all text colors
    if (isDark) {
      rules.push(`h1, h2, h3, h4 { color: ${textColor}; }`)
      rules.push(`p, li, span { color: ${textMuted || 'rgba(255,255,255,0.7)'}; }`)
      rules.push(`.lp-card-hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); }`)
      rules.push(`.glass-card { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); color: ${textColor}; }`)
      rules.push(`.lp-icon-bg { background: rgba(255,255,255,0.1); }`)
    }

    // Accent color for stats, stars
    if (accent) {
      rules.push(`.landing-stat-value { color: ${accent}; }`)
      rules.push(`.lp-stars { color: ${accent}; }`)
      rules.push(`.lp-icon-bg { color: ${accent}; }`)
    }

    if (rules.length > 0) {
      blocks.push({ selector: `[data-section="${sectionId}"]`, css: rules.join(' ') })
    }
  }
  return blocks
}

/** Apply smart style defaults when AI extraction misses section backgrounds.
 * Uses common design patterns: hero=dark+fullWidth, CTA=gradient, testimonials=dark, etc.
 * Only applies to sections that don't already have style.background set to non-white. */
function applySmartStyleDefaults(
  sections: CloneResult['sections'],
  design?: CloneResult['design']
) {
  const primary = design?.colors?.primary || '#2d4a3e'
  const secondary = design?.colors?.secondary || '#1a2e28'
  const accent = design?.colors?.accent || '#d4a853'

  // Darken a hex color by mixing with black
  const darken = (hex: string, amount = 0.3) => {
    const c = hex.replace('#', '')
    const r = Math.round(parseInt(c.slice(0, 2), 16) * (1 - amount))
    const g = Math.round(parseInt(c.slice(2, 4), 16) * (1 - amount))
    const b = Math.round(parseInt(c.slice(4, 6), 16) * (1 - amount))
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
  }
  const darkPrimary = darken(primary, 0.4)

  // Track which body sections (non-nav/footer) to consider for rhythm
  const bodySections = sections.filter(s => s.type !== 'nav' && s.type !== 'footer')

  for (const s of sections) {
    const style = (s.style || {}) as Record<string, unknown>
    const bg = (style.background as string || '').toLowerCase()
    const hasCustomBg = bg && bg !== '#ffffff' && bg !== '#fff' && bg !== 'white'

    // Skip if already has non-white background
    if (hasCustomBg) continue

    // Hero: always fullWidth with dark overlay when it has a background image
    if (s.type === 'hero') {
      s.style = {
        ...s.style,
        fullWidth: true,
        background: darkPrimary,
        textColor: '#ffffff',
        textMutedColor: 'rgba(255,255,255,0.8)',
        padding: '6rem 2rem',
      }
      // If hero has backgroundImage, add overlay
      const data = s.data as Record<string, unknown>
      if (data.backgroundImage) {
        s.style.backgroundOverlay = `linear-gradient(160deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 55%, ${primary}33 100%)`
      }
      continue
    }

    // Testimonials: dark background for contrast
    if (s.type === 'testimonials') {
      s.style = {
        ...s.style,
        fullWidth: true,
        background: darkPrimary,
        textColor: '#ffffff',
        textMutedColor: 'rgba(255,255,255,0.7)',
        accentColor: accent,
        padding: '4rem 2rem',
      }
      continue
    }

    // Stats: brand color background
    if (s.type === 'stats') {
      s.style = {
        ...s.style,
        fullWidth: true,
        background: primary,
        textColor: '#ffffff',
        textMutedColor: 'rgba(255,255,255,0.75)',
        accentColor: accent,
        padding: '2.5rem 2rem',
      }
      continue
    }

    // CTA (banner/default variants): gradient background — but not ALL CTAs
    // Only apply to standalone CTAs, not inline "see more" links
    if (s.type === 'cta') {
      const data = s.data as Record<string, unknown>
      const variant = data.variant as string | undefined
      const headline = String(data.headline || '')
      // Only style CTAs with headlines (not tiny "see more" links)
      if (headline.length > 15 || variant === 'banner' || variant === 'with-image') {
        s.style = {
          ...s.style,
          fullWidth: true,
          background: `linear-gradient(135deg, ${primary}, ${darkPrimary})`,
          textColor: '#ffffff',
          textMutedColor: 'rgba(255,255,255,0.75)',
          padding: '4rem 2rem',
        }
      }
      continue
    }

    // Nav: fullWidth always
    if (s.type === 'nav' && !style.fullWidth) {
      s.style = { ...s.style, fullWidth: true }
      continue
    }

    // Footer: dark background
    if (s.type === 'footer') {
      s.style = {
        ...s.style,
        fullWidth: true,
        background: darkPrimary,
        textColor: '#ffffff',
        textMutedColor: 'rgba(255,255,255,0.6)',
      }
      continue
    }

    // Alternating surface color for remaining body sections (every other gets subtle tint)
    const bodyIndex = bodySections.indexOf(s)
    if (bodyIndex >= 0 && bodyIndex % 2 === 1 && !['hero', 'testimonials', 'stats', 'cta'].includes(s.type)) {
      s.style = {
        ...s.style,
        background: `color-mix(in srgb, ${primary} 5%, #ffffff)`,
      }
    }
  }
}

/** ===== MAIN ENTRY — single path: best HTML → directClone ===== */
export async function cloneLandingPage(url: string, intent?: string): Promise<CloneResult> {
  const apiKey = import.meta.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const isDataUrl = url.startsWith('data:text/html,')
  const firecrawlKey = import.meta.env.FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY

  // Step 1: Get best HTML available
  let rawHtml: string
  let originalHtml: string // Always keep the direct-fetch HTML for post-processing (has CSS/styles)
  let localMarkdown = '' // Per-request markdown — NOT global (prevents parallel clone contamination)
  if (isDataUrl) {
    rawHtml = decodeURIComponent(url.slice('data:text/html,'.length))
    originalHtml = rawHtml
  } else {
    let fcHtml = ''
    if (firecrawlKey) {
      try {
        fcHtml = await firecrawlFetch(url, firecrawlKey)
        localMarkdown = getLastMarkdown() // capture immediately after fetch
      } catch {}
    }
    const directHtml = await directFetch(url)
    originalHtml = directHtml // Always keep for post-processing (Firecrawl strips CSS)
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
  const lastMd = localMarkdown
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

    // Apply smart style defaults for sections without AI-detected styles
    applySmartStyleDefaults(r.sections, r.design)

    // Generate scoped CSS from section styles — programmatic, not AI
    const cssBlocks = buildScopedCssFromStyles(r.sections)
    if (cssBlocks.length > 0) {
      r.scopedCss = cssBlocks
    }
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

  // Phase 3: Post-processing auto-fixes (lessons from clone optimization)
  postProcessCloneResult(r, originalHtml, url)

  try { logCloneSections(url, r.sections, words, pageHeadings) } catch {}
  return r
}

/** Auto-fix common AI clone issues based on learned patterns */
function postProcessCloneResult(r: CloneResult, rawHtml: string, url: string) {
  // Fix 1: Hero backgroundImage — find real CSS background-image if AI missed it or picked wrong one
  const hero = r.sections.find(s => s.type === 'hero')
  const nav = r.sections.find(s => s.type === 'nav')
  const heroImgLooksWrong = hero && hero.data.backgroundImage &&
    (String(hero.data.backgroundImage).endsWith('.png') || String(hero.data.backgroundImage).includes('logo'))
  if (hero && (!hero.data.backgroundImage || heroImgLooksWrong)) {
    const bgUrls = [...rawHtml.matchAll(/background[^;]*url\(["']?([^"')]+)["']?\)/g)]
      .map(m => m[1])
      .filter(u => u.startsWith('http') && !u.includes('logo') && !u.includes('icon') && !u.includes('flag') && !u.includes('dropdown'))
    // Prefer JPG/JPEG (photos) over PNG (usually illustrations/logos)
    const jpgUrls = bgUrls.filter(u => /\.(jpg|jpeg|webp)/i.test(u))
    // Prioritize slider images first (most likely the real hero photo), then other hero keywords
    const sliderUrl = jpgUrls.find(u => u.toLowerCase().includes('slider'))
    const heroUrl = sliderUrl || jpgUrls.find(u => ['hero', 'banner', 'cover'].some(k => u.toLowerCase().includes(k)))
    // Also check <img> tags near slider/hero areas as fallback
    const imgUrls = [...rawHtml.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/g)]
      .map(m => m[1])
      .filter(u => u.startsWith('http') && /\.(jpg|jpeg|webp)/i.test(u) && !u.includes('logo') && !u.includes('icon') && !u.includes('flag') && !u.includes('avatar') && !u.includes('dropdown'))
    const sliderImg = imgUrls.find(u => ['slider', 'hero', 'banner', 'header-'].some(k => u.toLowerCase().includes(k)))

    const bestUrl = heroUrl || sliderImg || jpgUrls[0] || bgUrls.find(u => /\.(png)/i.test(u) && !u.includes('logo'))
    if (bestUrl) {
      hero.data.backgroundImage = bestUrl
    }
  }

  // Fix 2: Hero subheadline — clean if it contains raw form data (select options, dates, etc.)
  if (hero) {
    const sub = String(hero.data.subheadline || '')
    const hasFormData = sub.length > 200 || /20\d{2}/.test(sub) || (sub.match(/—/g) || []).length > 2
    if (hasFormData) {
      hero.data.subheadline = ''
    }
  }

  // Fix 3: Design fonts — replace non-Google custom fonts with closest Google Fonts equivalents
  if (r.design?.fonts) {
    const fontMap: Record<string, string> = {
      'Apercu': 'Inter', 'Apercu Light': 'Inter', 'Apercu Medium': 'Inter',
      'DancingScript-Bold-WOFF': 'Dancing Script', 'DancingScript': 'Dancing Script',
      'Proxima Nova': 'Montserrat', 'Avenir': 'Nunito', 'Gotham': 'Poppins',
      'Futura': 'Nunito Sans', 'Helvetica Neue': 'Inter', 'Helvetica': 'Inter',
      'Arial': 'Inter', 'Georgia': 'Playfair Display', 'Garamond': 'EB Garamond',
      'Times New Roman': 'Playfair Display', 'Palatino': 'Lora',
    }
    for (const key of ['heading', 'body'] as const) {
      const font = r.design.fonts[key]
      if (font) {
        // Strip fallbacks like "sans-serif", quotes
        const clean = font.replace(/,\s*(sans-serif|serif|monospace|cursive)$/i, '').replace(/['"]/g, '').trim()
        const mapped = fontMap[clean]
        if (mapped) r.design.fonts[key] = mapped
        else r.design.fonts[key] = clean
      }
    }
  }

  // Fix 4: Ensure hero has proper style — remove style.backgroundImage (hero component handles its own bg)
  if (hero?.style) {
    // Hero component renders data.backgroundImage internally — style.backgroundImage causes duplicate/wrong bg
    delete hero.style.backgroundImage
    if (hero.data.backgroundImage) {
      if (!hero.style.background) hero.style.background = '#1a1a1a'
      if (!hero.style.backgroundOverlay) {
        hero.style.backgroundOverlay = 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.4) 100%)'
      }
      hero.style.fullWidth = true
      hero.style.textColor = '#ffffff'
    }
  }

  // Fix 5: Clean topBar + socialLinks icons — replace FA classes/names with emoji
  const iconEmojiMap: Record<string, string> = {
    'whatsapp': '📱', 'phone': '📞', 'envelope': '✉️', 'email': '✉️', 'mail': '✉️',
    'facebook': '📘', 'instagram': '📷', 'twitter': '🐦', 'x-twitter': '𝕏', 'youtube': '▶️',
    'linkedin': '💼', 'map-marker': '📍', 'globe': '🌐', 'clock': '🕐', 'tiktok': '🎵',
    'pinterest': '📌', 'telegram': '✈️', 'reddit': '🔴', 'github': '💻', 'discord': '💬',
  }
  function cleanIcon(icon: string): string {
    if (!icon || icon.startsWith('http')) return icon // URLs are fine
    // Strip "fab fa-" / "fas fa-" / "far fa-" prefixes
    const cleaned = icon.replace(/fa[bsr]?\s+fa-/g, '').replace(/fa-/g, '').trim().toLowerCase()
    return iconEmojiMap[cleaned] || icon
  }
  if (nav?.data.topBar && Array.isArray(nav.data.topBar)) {
    for (const item of nav.data.topBar as Array<{ icon?: string; text?: string; image?: string }>) {
      // If image field has URL but icon doesn't, move image → icon
      if (item.image && typeof item.image === 'string' && item.image.startsWith('http')) {
        item.icon = item.image
        delete item.image
      }
      if (item.icon) item.icon = cleanIcon(String(item.icon))
      if (item.text) item.text = String(item.text).replace(/fa[bsr]?\s+fa-\w+\s*/g, '').trim()
    }
  }
  if (nav?.data.socialLinks && Array.isArray(nav.data.socialLinks)) {
    for (const sl of nav.data.socialLinks as Array<{ icon?: string; label?: string }>) {
      if (sl.icon) sl.icon = cleanIcon(String(sl.icon))
    }
  }

  // Fix 6: Add global scoped CSS preset (orange buttons, Dancing Script for hero)
  if (!r.scopedCss) r.scopedCss = []
  const hasGlobalCss = r.scopedCss.some((c: { selector: string }) => c.selector === '.landing-page-root')
  if (!hasGlobalCss) {
    r.scopedCss.unshift({
      selector: '.landing-page-root',
      css: `@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
.landing-btn-primary { background: var(--lp-accent, var(--lp-primary)); border-radius: 25px; }`,
    })
    r.scopedCss.splice(1, 0, {
      selector: '[data-section="section-hero"]',
      css: `h1, h2 { font-family: 'Dancing Script', cursive; font-size: clamp(2.5rem, 5vw, 3.5rem); color: #fff; }`,
    })
  }

  // Fix 7: Nav logo — find site logo if AI missed it
  if (nav && !nav.data.logo) {
    const logoUrls = [...rawHtml.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/g)]
      .map(m => ({ src: m[1], ctx: m[0].toLowerCase() }))
      .filter(m => (m.ctx.includes('logo') || m.ctx.includes('brand')) && m.src.startsWith('http'))
    if (logoUrls.length > 0) {
      nav.data.logo = logoUrls[0].src
    }
  }

  // Fix 8: Ensure dark-bg sections have white text (contrast fix)
  for (const s of r.sections) {
    if (!s.style?.background) continue
    const bg = String(s.style.background).toLowerCase()
    // Detect dark backgrounds: hex starting with low values, or rgba with low lightness
    const isDark = /^#[0-3]/.test(bg) || /^#[0-9a-f]{6}$/i.test(bg) && (() => {
      const hex = bg.slice(1)
      const r2 = parseInt(hex.slice(0, 2), 16), g2 = parseInt(hex.slice(2, 4), 16), b2 = parseInt(hex.slice(4, 6), 16)
      return (r2 + g2 + b2) / 3 < 100 // average RGB < 100 = dark
    })() || bg.includes('linear-gradient') && /rgb[a]?\(\s*\d{1,2}\s*,/.test(bg)
    if (isDark && !s.style.textColor) {
      s.style.textColor = '#ffffff'
      if (!s.style.textMutedColor) s.style.textMutedColor = 'rgba(255,255,255,0.75)'
    }
  }

  // Fix 9: Fix scoped CSS — ensure dark-bg selectors include white text
  if (r.scopedCss) {
    for (const css of r.scopedCss as Array<{ selector: string; css: string }>) {
      if (!css.css) continue
      const hasDarkBg = /background:\s*#[0-3][0-9a-f]{5}/i.test(css.css) ||
        /background:\s*#1[0-9a-f]/i.test(css.css) ||
        /background:\s*#2[0-9a-f]/i.test(css.css)
      const hasTextColor = /color:\s*#fff/i.test(css.css) || /color:\s*#ffffff/i.test(css.css) || /color:\s*rgba\(255/i.test(css.css)
      if (hasDarkBg && !hasTextColor) {
        css.css += ` h1, h2, h3, h4, h5 { color: #fff; } p, li, span, a { color: rgba(255,255,255,0.8); }`
      }
    }
  }

  // Fix 10: Testimonials with dark bg + cards variant → switch to light bg
  // Dark bg with card layout causes white-text-on-invisible-card readability issues
  const testimonials = r.sections.find(s => s.type === 'testimonials')
  if (testimonials?.style) {
    const bg = String(testimonials.style.background || '').toLowerCase()
    const isDark = bg.startsWith('#1') || bg.startsWith('#2') || bg.startsWith('#0') || bg.includes('rgb(') && parseInt(bg.split(',')[0].replace(/\D/g, '')) < 80
    if (isDark) {
      testimonials.style.background = '#faf6f1'
      delete testimonials.style.textColor
      delete testimonials.style.textMutedColor
      // Also fix scoped CSS for testimonials
      const scopedTest = r.scopedCss?.find((c: { selector: string }) => c.selector.includes('testimonials'))
      if (scopedTest) {
        scopedTest.css = `.landing-section { background: #faf6f1; } .lp-card-hover { background: #fff; border-color: rgba(0,0,0,0.08); } .lp-stars { color: #e67e22; }`
      }
    }
  }
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

  const itemKey = s.type === 'team' ? 'members' : s.type === 'gallery' ? 'images' : s.type === 'pricing' ? 'plans' : 'items'
  if (['features','stats','faq','how-it-works','testimonials','pricing','team','gallery'].includes(s.type)) {
    const items = d[itemKey]
    if (!Array.isArray(items) || items.length === 0) return { index, score: 'poor', issue: 'Empty items list' }
    if (items.length === 1 && s.type !== 'pricing') return { index, score: 'partial', issue: 'Only 1 item — likely incomplete' }
  }

  if ((s.type === 'hero' || s.type === 'image-text') && !d.backgroundImage && !d.image && !d.embed)
    return { index, score: 'partial', issue: 'No image or media' }

  return { index, score: 'good' }
}

/** Prompt for improving existing sections based on quality issues */
const IMPROVE_SECTION_PROMPT = `You are a web design expert. You're improving sections of a landing page that have quality issues.

Available section types: ${SECTION_TYPES.join(', ')}

For each section below, fix the specific issue described. Rules:
- Keep the SAME section type and order — only improve the data
- Extract missing content from the provided page content
- Icons → emoji, text max 200 chars, images as absolute URLs
- cta is ALWAYS an array [{text, url}]
- If the issue says "missing heading" — find the correct heading text
- If the issue says "empty items" or "only 1 item" — extract all items from the page
- If the issue says "no image" — find the image URL from the page, or omit if truly none
- Preserve existing good data, only fill in what's missing or broken

Return ONLY valid JSON: { "sections": [{ "type":"...", "order":N, "enabled":true, "data":{...}, "style":{...} }] }`

/** Improve specific sections of an existing landing page using AI */
export async function improveSections(
  slug: string,
  sectionIndices: number[],
  pageUrl?: string
): Promise<{ improved: number; sections: CloneResult['sections']; usage: CloneResult['usage'] }> {
  const apiKey = import.meta.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  // Read current landing page config
  const { readLandingConfig, writeLandingConfig } = await import('@/lib/landing/landing-config-reader')
  const config = readLandingConfig(slug)
  if (!config) throw new Error(`Landing page "${slug}" not found`)

  // Assess quality of requested sections
  const toImprove: Array<{ index: number; section: { type: string; order: number; data: Record<string, unknown>; style?: Record<string, unknown> }; quality: { score: string; issue?: string } }> = []
  for (const i of sectionIndices) {
    const s = config.sections?.[i]
    if (!s) continue
    const q = assessSectionQuality({ type: s.type, data: s.data as unknown as Record<string, unknown> }, i)
    if (q.score !== 'good') {
      toImprove.push({ index: i, section: { type: s.type, order: s.order, data: s.data as unknown as Record<string, unknown>, style: s.style as unknown as Record<string, unknown> }, quality: q })
    }
  }

  if (toImprove.length === 0) return { improved: 0, sections: [], usage: { promptTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0 } }

  // Get page content for context — use stored markdown or fetch from URL
  let pageContent = getLastMarkdown()
  if ((!pageContent || pageContent.length < 100) && pageUrl) {
    try {
      const html = await directFetch(pageUrl)
      pageContent = cleanBasic(html)
    } catch {
      pageContent = ''
    }
  }

  // Build improvement request
  const sectionDescs = toImprove.map(({ index, section, quality }) =>
    `Section #${index} (type: ${section.type}, order: ${section.order}):\n  Issue: ${quality.issue}\n  Current data: ${JSON.stringify(section.data || {}).slice(0, 500)}`
  ).join('\n\n')

  const userPrompt = `Sections to improve:\n${sectionDescs}\n\nPage content for reference:\n${pageContent.slice(0, 30000)}`

  const { text, promptTokens, outputTokens } = await geminiCall(apiKey, IMPROVE_SECTION_PROMPT, userPrompt, 8192)
  const parsed = safeJsonParse(text) as { sections?: CloneResult['sections'] } | null

  if (!parsed?.sections?.length) {
    return { improved: 0, sections: [], usage: { promptTokens, outputTokens, totalTokens: promptTokens + outputTokens, estimatedCostUsd: (promptTokens * 0.00000015) + (outputTokens * 0.0000006) } }
  }

  // Merge improved sections back into config
  let improvedCount = 0
  for (const improved of parsed.sections) {
    const match = toImprove.find(t =>
      t.section.type === improved.type && t.section.order === improved.order
    ) || toImprove.find(t => t.section.type === improved.type)

    if (match && config.sections) {
      // Preserve style, merge improved data
      const existing = config.sections[match.index] as unknown as Record<string, unknown>
      existing.data = { ...(existing.data as Record<string, unknown> || {}), ...(improved.data || {}) }
      if (improved.style) existing.style = { ...(existing.style as Record<string, unknown> || {}), ...improved.style }
      improvedCount++
    }
  }

  // Save updated config
  if (improvedCount > 0) {
    writeLandingConfig(slug, config)
  }

  const totalTokens = promptTokens + outputTokens
  return {
    improved: improvedCount,
    sections: parsed.sections,
    usage: { promptTokens, outputTokens, totalTokens, estimatedCostUsd: (promptTokens * 0.00000015) + (outputTokens * 0.0000006) },
  }
}
