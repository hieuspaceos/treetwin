/**
 * Prompt constants for the AI landing page clone pipeline.
 * All Gemini system/user prompt strings extracted from landing-clone-ai.ts.
 */
import { SECTION_TYPES } from './clone-ai-utils'

/** Full detailed prompt for Tier 1 direct clone — EXACT copy from stable commit 830569d */
export const DIRECT_CLONE_PROMPT = `You are an expert web designer. Analyze the HTML of a landing page and decompose it into structured sections matching our landing page builder schema.

Available section types, their variants, and fields:

STRUCTURE:
- nav: variants=[default, centered, transparent, hamburger, mega]. Fields: brandName, logo (image URL), topBar[{icon,text,href}], links[{label,href}], variant, socialLinks[{icon,url,label}], groups[{label,links[{label,href,description}]}]
  IMPORTANT: Extract logo IMAGE URL. Set variant="centered" if logo centered. Use "hamburger" for minimal mobile-first sites. Use "mega" if nav has dropdown panels with grouped links.
  If site has top info bar (phone, email), extract to topBar array.
- footer: variants=[simple, columns, minimal, mega, centered-social]. Fields: text, links[{label,href}], columns[{heading,links[]}], variant, socialLinks[{icon,url,label}], newsletter{heading,placeholder,buttonText}
  Use "mega" for large footers with newsletter signup. Use "centered-social" for minimal footer with large social icon row.

HERO (exactly ONE per page):
- hero: variants=[centered, split, video-bg, minimal, fullscreen, slider]. Fields: headline, subheadline, variant, backgroundImage, embed (video/iframe URL). cta: ARRAY of buttons [{text, url, variant}]. items[{headline,subheadline,backgroundImage}] for slider variant.
  Use "fullscreen" for 100vh hero with immersive bg. Use "slider" if hero has multiple rotating slides. IMPORTANT: cta is always an ARRAY.

CONTENT:
- features: variants=[grid, list, alternating, masonry, icon-strip, bento]. Fields: heading, subheading, items[{icon,title,description,image,url}], columns(2|3|4|5)
  Use "icon-strip" for horizontal icon bars (5+ small icons with labels, no descriptions — common under hero). Use "bento" for asymmetric grid where first item is larger. Use "masonry" for Pinterest-style varying-height cards.
  IMPORTANT: When items have PHOTOS, set "image" field. For icon bars, use "icon" with image URL. Set columns to match visual grid.
- stats: variants=[row, cards, large, counter]. Fields: heading, subheading, items[{value,label,prefix,suffix}]
  Use "counter" for animated count-up numbers on scroll.
- how-it-works: variants=[numbered, timeline, cards]. Fields: heading, subheading, items[{number,title,description,icon}]
- team: variants=[grid, list, compact]. Fields: heading, subheading, members[{name,role,photo,bio}]
- faq: variants=[accordion, two-column, simple, searchable]. Fields: heading, items[{question,answer}]
  Use "searchable" if FAQ has many items (10+) — adds client-side search input.
- rich-text: Fields: heading, subheading, content (HTML string — can include <p>, <a>, <img>, <div> with inline styles for custom layouts)

CONVERSION:
- pricing: variants=[cards, simple, highlight-center, comparison, toggle]. Fields: heading, subheading, plans[{name, price, period, description, image, features[], cta{text,url}, highlighted, badge}], comparisonRows[{label,values[],highlight}], annualPlans[].
  Use "comparison" for feature comparison tables. Use "toggle" if monthly/annual pricing switch exists. IMPORTANT: Extract cover images for travel/product cards.
- testimonials: variants=[cards, single, minimal, carousel, quote-wall, logo-strip]. Fields: heading, items[{quote,name,role,company,avatar,image}], logos[{name,image,url}].
  Use "quote-wall" for masonry grid of quotes. Use "logo-strip" if trust logos (Google, TripAdvisor) shown with testimonials. Use "carousel" if they scroll horizontally.
- cta: variants=[default, split, banner, minimal, with-image]. Fields: headline, subheadline, backgroundImage, variant. cta: ARRAY of buttons [{text, url, variant}].
  IMPORTANT: Most pages have a CTA section before the footer. Always add one with variant="with-image" if a background image is available.
- social-proof: variants=[inline, banner]. Fields: text, icon, link
- logo-wall: Fields: heading, logos[{name,url,image}]
  IMPORTANT: If testimonials section has trust logos (Google, TripAdvisor, etc.), add a logo-wall section BEFORE the testimonials section.
- banner: Fields: text, cta{text,url}, variant(info|warning|success)
- contact-form: Fields: heading, fields[{label,type}], submitText, submitUrl
- comparison: Fields: heading, subheading, columns[{label}], rows[{label,values[],highlight}]

UTILITY:
- map: Fields: address, embedUrl (Google Maps embed), height (px)
- divider: Fields: style(line|dots|space), height (px)
- countdown: Fields: targetDate (ISO string), heading, expiredText
- popup: variants=[centered, bottom-bar, slide-in-right, slide-in-left, fullscreen, top-bar, notification]. Fields: heading, text, image, cta{text,url}, trigger{type(scroll|time|exit-intent),value}, showOnce, dismissLabel, variant
  Use for newsletter modals, exit-intent offers, announcement bars. Set trigger.type and trigger.value (scroll %, seconds, or exit-intent).
- product-showcase: Fields: featureProducts[{id,name,description,price,image,url,badge}]
  Use for highlighted product cards or featured items grid.

MEDIA:
- video: Fields: url, caption, autoplay, heading, subheading, cta{text,url}, items[{url,caption}]
  IMPORTANT: If page has multiple videos, use "items" array for 2x2 grid. Extract ALL video embed URLs.
- image: Fields: src, alt, caption, fullWidth
- image-text: Fields: image{src,alt}, heading, text, imagePosition(left|right), cta{text,url}
- gallery: Fields: heading, images[{src,alt,caption}]

LAYOUT (multi-column) — USE THIS AGGRESSIVELY:
- layout: For side-by-side content blocks (e.g. text next to gallery, stats next to testimonials, multi-row grids).
  Fields: columns (array of column widths, e.g. [1,1] for equal 2-col, [2,1] for 2:1 ratio), gap (CSS gap value), variant (see variants below), mobileReverse (bool), alignItems (start|center|end|stretch), children (array of {column: 0|1, sections: [{type,order,enabled,data}]}).

  Layout VARIANTS — choose the best fit for the original design:
  - "grid" (default): equal/ratio columns from 'columns' array — use when ratios matter (e.g. [2,1] for 2:1)
  - "sidebar-left": narrow 280px left + wide right — docs, filter+content, bio+content
  - "sidebar-right": wide left + narrow 280px right — content+sidebar, article+TOC
  - "asymmetric": 60/40 split (3fr 2fr) — text-heavy left + media/stats right
  - "thirds": 3 equal columns — feature card rows, 3-step processes
  - "hero-split": 55/45 with vertical center alignment — hero text left + image/video right
  - "stacked": full-width rows (1fr) — vertical stack of full-width items within layout
  - "masonry": CSS columns (not grid) — galleries, testimonial cards, mixed-height items

  Example: { "columns":[1,1], "gap":"2rem", "variant":"hero-split", "mobileReverse":true, "children":[{"column":0, "sections":[{"type":"rich-text","order":0,"enabled":true,"data":{"heading":"About","content":"..."}}]}, {"column":1, "sections":[{"type":"gallery","order":0,"enabled":true,"data":{"images":[...]}}]}] }

  CRITICAL LAYOUT RULES:
  1. Use layout for ANY section where original shows 2+ content blocks side-by-side
  2. "About us" sections with text + photos → layout variant "asymmetric": rich-text left + gallery right
  3. Hero with media right → layout variant "hero-split" with mobileReverse:true (image appears above text on mobile)
  4. 3-column feature rows → layout variant "thirds"
  5. Sidebar navigation or filters → layout variant "sidebar-left" or "sidebar-right"
  6. Gallery of mixed-height cards → layout variant "masonry"
  7. Sections with different column counts per row → layout [1] with nested features of different column counts
  8. Icon bars with 5+ items → use features with columns:5
  9. Text + image pairs that aren't simple image-text → use layout with rich-text + image sections
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

Per-section custom CSS ("customCss" field):
Generate a "customCss" string for EACH section to make it visually polished and match the original design. This CSS is auto-scoped to #section-{type}. The "customCss" complements the "style" field — "style" sets basic bg/text/accent colors, "customCss" handles everything else for visual fidelity.

Targetable inner elements:
- .landing-section — main container
- h1, h2, h3, p, a, span — text elements
- .lp-card-hover — cards
- .lp-icon-bg — icon circles
- .landing-btn-primary, .landing-btn-outline — buttons
- .landing-stat-value — stat numbers
- .lp-stars — star ratings
- .lp-quote-mark — quote marks
- .lp-avatar — avatars
- .landing-grid-2, .landing-grid-3, .landing-grid-4 — grids
- .glass-card — generic cards
- img — images

What to include in customCss:
1. BACKGROUNDS: gradients, patterns, backdrop-filter, background-blend-mode, subtle texture overlays (e.g. radial-gradient for spotlight effects, repeating-linear-gradient for subtle stripes)
2. TYPOGRAPHY: font-size (use clamp for responsive), letter-spacing, line-height, font-weight, text-transform, text-shadow for hero/CTA text on dark bg
3. SPACING: padding, margin, gap adjustments for visual breathing room
4. CARDS & CONTAINERS: border-radius, box-shadow (layered for depth), border, backdrop-filter for glass effects, hover transforms (translateY, scale)
5. BUTTONS: gradient backgrounds, hover transitions, box-shadow, border-radius, padding
6. IMAGES: border-radius, object-fit, box-shadow, aspect-ratio, hover scale
7. DECORATIVE: ::before/::after pseudo-elements for accent lines, dots, geometric shapes
8. TRANSITIONS: smooth hover/focus transitions on interactive elements
9. RESPONSIVE: use clamp() for fluid typography, min() for responsive spacing

Design principles to follow:
- Visual rhythm: alternate section visual weight (dense → spacious → dense)
- Contrast: ensure text readability on all backgrounds
- Consistency: use the same border-radius, shadow intensity, spacing scale across sections
- Hierarchy: hero/CTA sections should feel bold and immersive, content sections clean and readable
- Polish: subtle shadows, smooth transitions, consistent spacing signal quality

Example: "customCss": ".landing-section { background: linear-gradient(180deg, rgba(0,0,0,0.02) 0%, transparent 100%); padding: 5rem 2rem; } h2 { font-size: clamp(2rem, 4vw, 2.8rem); letter-spacing: -0.03em; } .lp-card-hover { border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s; } .lp-card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -4px rgba(0,0,0,0.15); } .landing-btn-primary { border-radius: 10px; box-shadow: 0 4px 14px rgba(0,0,0,0.1); }"
IMPORTANT: Generate customCss for MOST sections — not just a few. Even "simple" sections benefit from subtle background gradients, refined typography, and card polish. Only omit for truly plain dividers or spacers.

Return ONLY valid JSON:
{
  "title": "Page title", "description": "Meta description",
  "design": { "colors": { "primary":"#hex","secondary":"#hex","accent":"#hex","background":"#hex","surface":"#hex","text":"#hex","textMuted":"#hex" }, "fonts": { "heading":"Font", "body":"Font" }, "borderRadius": "12px" },
  "sections": [{ "type":"nav", "order":-1, "enabled":true, "data":{...}, "style":{"fullWidth":true,"background":"#1a2e28","textColor":"#fff"} }, ...]
}`

/** Structure analysis prompt (Step 1 — small output) */
export const STRUCTURE_PROMPT = `You are a web design expert. Analyze this HTML and identify the STRUCTURE of the landing page. Do NOT extract content — only identify sections.

Available section types: ${SECTION_TYPES.join(', ')}

For each visible section on the page, return:
- type: best matching section type, or "unknown" if no match. Use "layout" AGGRESSIVELY when 2+ content blocks appear side-by-side in the same row (text+gallery, text+form, multi-column grids).
- variant: section variant. For layout sections choose from: grid, sidebar-left, sidebar-right, asymmetric, thirds, hero-split, stacked, masonry. For other types use their own variants (e.g. "centered", "split", "cards", "carousel").
- confidence: 0-100 how sure you are this mapping is correct
- itemCount: number of items (for lists, grids, testimonials, pricing plans)
- note: any issues or details (e.g. "has video embed", "carousel with 8 items", "2-column layout")

Also extract design: colors (from CSS/inline styles), fonts, borderRadius.

Return ONLY valid compact JSON:
{ "title":"...", "description":"...", "design":{...}, "structure":[{ "order":0, "type":"hero", "variant":"split", "confidence":90, "itemCount":0, "note":"" }, ...] }`

/** Content fill prompt (Step 2 — per section) */
export function buildFillPrompt(sectionType: string, variant: string, itemCount: number): string {
  return `Extract content for ONE section from the HTML below.
Section type: ${sectionType}
Variant: ${variant}
Expected items: ${itemCount || 'unknown'}

Rules: cta=ALWAYS array [{text,url}]. Icons=emoji. Text=max 200 chars, no HTML. Images=absolute URLs.
Return ONLY the data object for this section (not wrapped in {sections:[...]}), e.g.: { "heading":"...", "items":[...] }`
}

/** Design extraction prompt — uses HTML+CSS for accurate color/font extraction */
export const DESIGN_EXTRACT_PROMPT = `Extract the visual design system from this HTML page by analyzing inline styles, CSS classes, and style blocks.

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

/** Section styles prompt — uses HTML with CSS to determine per-section visual styling */
export const SECTION_STYLES_PROMPT = `You are a web design expert. I have already extracted these sections from a landing page. Now I need you to analyze the VISUAL STYLING of each section from the HTML/CSS.

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

/** Scoped CSS generation prompt — generates custom CSS per section to match original */
export const SCOPED_CSS_PROMPT = `You are an expert CSS designer. I cloned a landing page into structured sections. Now I need you to generate CUSTOM CSS for each section to make it visually match the original page.

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

/** Retry prompt — targeted fill for specific missing headings */
export const RETRY_MISSING_PROMPT = `You are a web design expert. The page has sections that were missed in a first pass.
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

/** Prompt for improving existing sections based on quality issues */
export const IMPROVE_SECTION_PROMPT = `You are a web design expert. You're improving sections of a landing page that have quality issues.

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

/** Layout skeleton extraction prompt for v3 pipeline */
export const LAYOUT_SKELETON_PROMPT = `You are a web layout expert. Analyze this HTML page and extract its STRUCTURAL SKELETON — the arrangement of sections and their layout patterns.

For each section/row on the page, identify:
- type: "section" for standalone sections, "layout" for multi-column arrangements
- sectionType: the content type (hero, nav, features, pricing, etc.) — use ONLY these: ${SECTION_TYPES.join(', ')}
- variant: section variant (e.g. "centered", "split", "cards")
- columns: for layout rows, array of column weight ratios (e.g. [1,1] for equal, [2,1] for 2:1)
- layoutVariant: for layout rows (grid|sidebar-left|sidebar-right|asymmetric|thirds|hero-split|stacked|masonry)
- children: for layout rows, array of {column: 0|1, rows: [...]} describing what's in each column
- confidence: 0-100
- note: any important structural detail

CRITICAL RULES:
- ALWAYS include nav as the FIRST row (type: "section", sectionType: "nav")
- ALWAYS include footer as the LAST row (type: "section", sectionType: "footer")
- ALWAYS include at least one CTA section before footer
- Every page has nav + body sections + footer — never omit any

Return ONLY valid JSON:
{
  "title": "page title",
  "description": "meta description",
  "rows": [
    { "type": "section", "sectionType": "nav", "variant": "default", "confidence": 95 },
    { "type": "section", "sectionType": "hero", "variant": "centered", "confidence": 90 },
    { "type": "layout", "columns": [1,1], "layoutVariant": "asymmetric", "confidence": 85, "children": [
      { "column": 0, "rows": [{ "type": "section", "sectionType": "rich-text", "variant": "default" }] },
      { "column": 1, "rows": [{ "type": "section", "sectionType": "gallery", "variant": "default" }] }
    ]},
    { "type": "section", "sectionType": "footer", "variant": "columns", "confidence": 95 }
  ]
}`

/** Skeleton-aware content fill prompt for v3 pipeline */
export const SKELETON_FILL_PROMPT = `You are a web design expert. Fill content into this pre-analyzed page structure.

The skeleton describes the STRUCTURE of the page. Your job is to extract the ACTUAL CONTENT from the HTML and place it correctly in each section.

Section data schemas (the "data" object shape for each section type):
- nav: { brandName, logo (URL), topBar[{icon,text,href}], links[{label,href}], variant, socialLinks[{icon,url,label}], groups[{label,links[{label,href,description}]}] }
- hero: { headline, subheadline, variant, backgroundImage (URL), embed (video URL), cta[{text,url,variant}], items[{headline,subheadline,backgroundImage}] for slider }
- features: { heading, subheading, items[{icon,title,description,image,url}], columns(2|3|4|5) } — ALWAYS extract items array with ALL feature items
- stats: { heading, subheading, items[{value,label,prefix,suffix}] } — ALWAYS extract items array with ALL stat values
- how-it-works: { heading, subheading, items[{number,title,description,icon}] }
- team: { heading, subheading, members[{name,role,photo,bio}] }
- faq: { heading, items[{question,answer}] }
- rich-text: { heading, subheading, content (HTML string) }
- pricing: { heading, subheading, plans[{name,price,period,description,image,features[],cta{text,url},highlighted,badge}] }
- testimonials: { heading, items[{quote,name,role,company,avatar,image}] } — ALWAYS extract items array with ALL testimonials
- cta: { headline, subheadline, backgroundImage, variant, cta[{text,url,variant}] }
- logo-wall: { heading, logos[{name,url,image}] }
- footer: { text, links[{label,href}], columns[{heading,links[]}], variant, socialLinks[{icon,url,label}] }
- video: { url, caption, heading, subheading, items[{url,caption}] }
- image-text: { image{src,alt}, heading, text, imagePosition(left|right), cta{text,url} }
- gallery: { heading, images[{src,alt,caption}] }
- comparison: { heading, subheading, columns[{label}], rows[{label,values[],highlight}] }
- contact-form: { heading, fields[{label,type}], submitText }
- social-proof: { text, icon, link }
- banner: { text, cta{text,url}, variant(info|warning|success) }
- map: { address, embedUrl, height }
- divider: { style(line|dots|space), height }
- countdown: { targetDate (ISO), heading, expiredText }
- popup: { heading, text, image, cta{text,url}, trigger{type(scroll|time|exit-intent),value}, showOnce, dismissLabel, variant(centered|bottom-bar|slide-in-right|fullscreen|top-bar|notification) }
- product-showcase: { featureProducts[{id,name,description,price,image,url,badge}] }

Rules:
- Keep the same structure — do NOT change types, variants, or layout arrangements
- Extract ALL text content, image URLs as absolute URLs
- CRITICAL: ONLY use image URLs that ACTUALLY EXIST in the HTML source
- CRITICAL: For features, stats, testimonials, faq — ALWAYS populate the items/members array with ALL entries from the page. Never leave items empty.
- cta is ALWAYS an array [{text, url}]
- Icons → emoji, text max 200 chars
- Keep content in ORIGINAL language
- Extract design colors from CSS/inline styles

For each leaf section node (type="section"), add a "data" object matching the schema above.
Also add "style" for sections with non-white backgrounds: { fullWidth, background, textColor, textMutedColor, padding }.
Also add "customCss" string for MOST sections — CSS for visual polish: backgrounds (gradients, patterns, backdrop-filter), typography (font-size with clamp, letter-spacing, text-shadow), card styling (border-radius, layered box-shadow, hover transforms), button polish (gradient bg, shadow, radius), spacing (padding, gap), transitions, and decorative pseudo-elements. Auto-scoped to #section-{type}. Target inner classes: .landing-section, h1-h3, p, .lp-card-hover, .landing-btn-primary, .lp-icon-bg, .landing-stat-value, img. Only omit for plain dividers/spacers.

Return the same JSON structure with "data", optional "style", and optional "customCss" fields added to each section node.`
