# AI Clone — Site Compatibility Analysis

Comprehensive classification of website types and their compatibility with AI clone technology.

## How It Works

1. **Fetch HTML from URL** (server-side, no browser)
2. **Strip scripts, styles, SVGs, comments** (clean HTML extraction)
3. **Send cleaned HTML + user intent** to Gemini 2.5 Flash
4. **Gemini extracts:** sections, design tokens (colors, fonts), content
5. **User reviews & applies** detected sections

---

## Core Principles

### Rendering Methods

**Server-Side Rendering (SSR):** Pages generated on server per request. Content fully visible in raw HTML. Best for personalized content, auth flows, real-time data.

**Server-Side Generation (SSG):** Pages pre-built at deploy time to static HTML/CSS/JS. Best for blogs, marketing sites, documentation.

**Client-Side Rendering (CSR):** Minimal HTML shell + large JS bundle. Content generated in browser. Raw HTML mostly empty.

**Hybrid (SSR + Islands):** Most pages SSR'd, interactive components use JS islands (Astro, Remix approach). Best balance of performance + interactivity.

---

## Tier Classification

### Tier 1 — Excellent Compatibility (85-100% success)

**Core Characteristics:**
- SSR/SSG framework (Next.js, Astro, Nuxt, Remix, Hugo, Jekyll, Eleventy)
- Semantic HTML tags: `<section>`, `<nav>`, `<footer>`, `<header>`, `<h1-h6>`, `<article>`
- Cleaned HTML: 5K-50K chars (optimal signal-to-noise)
- Content density: 100-800 words (sweet spot)
- External CSS (minimal inline styles)
- Clear heading hierarchy (h1→h2→h3 progression)
- Clean, predictable DOM structure
- Images with direct `src` URLs

**What Gemini sees:** Fully rendered, semantic HTML. Content extracted directly without JS execution. Clear section boundaries = easy classification.

**Success rate details:**
- Landing pages: 95%+
- Marketing sites: 92%+
- Documentation: 90%+
- SaaS product pages: 88%+

**Examples:**
- **Next.js (SSR mode):** Fully rendered page HTML on every request
- **Astro:** Pre-built static HTML with zero unnecessary JS
- **Hugo/Jekyll:** Pre-compiled static HTML files, semantic structure
- **Remix:** Server-first HTML streaming with clear structure
- **Eleventy:** Flexible templating → clean output HTML

**Platform-specific notes:**
- **Next.js SSR:** 92% success — when configured correctly, pages have full semantic structure
- **Astro:** 95% success — zero-JS-by-default architecture = clean HTML
- **Hugo:** 94% success — compiled static HTML, minimal bloat
- **Remix:** 90% success — server-first, but streaming may truncate some content

**Why it works:** Gemini receives structured, fully-rendered HTML. All content is present without JS execution. Semantic tags = clear landmark identification. No ambiguity about sections or layout intent.

---

### Tier 2 — Good Compatibility (60-85% success)

**Core Characteristics:**
- Server-rendered but heavier HTML (50K-150K cleaned)
- Mix of semantic + generic `<div>` tags
- Lots of inline styles or Tailwind classes
- Many images/galleries/media embeds
- Content: 1000-2500 words
- Structured but not minimal DOM
- Some JavaScript for interactivity (not rendering)

**What Gemini sees:** More noise, clearer intent. Content is in HTML, but Gemini must parse through more markup noise to find semantic meaning.

**Success rate details by problem type:**
- Too many inline styles: -15% (parsing confusion)
- Heavy class names (Tailwind): -10% (visual detection harder)
- Multiple similar sections: -20% (merging/confusion)
- Large image galleries: -15% (size limits)
- 2000+ words: -25% (truncation risk)

**Examples:**

| Platform | Rendering | Compatibility | Notes |
|----------|-----------|---------------|-------|
| **WordPress (Classic + SSR)** | PHP server-rendered | 72% | Block-based, semantic when configured, but often mixed divs |
| **WordPress (Gutenberg blocks)** | Mix of SSR + dynamic | 68% | Block Editor can output clean HTML, but theme-dependent |
| **Shopify (Online Store 2.0)** | Server-rendered + JS | 70% | Liquid templating produces semantic structure, but heavy cart/app JS |
| **Wix** | SSR + client hydration | 65% | Heavy inline styles, wrapper divs, but full content in HTML |
| **Squarespace** | SSR with heavy styles | 68% | Clean semantic output, lots of inline CSS |
| **Ghost CMS** | Node.js SSR | 75% | Clean, focused publishing platform, minimal bloat |
| **Strapi** | Headless CMS (JSON API) | 70% | Depends on frontend framework |
| **Webflow** | Client-side builder SSR | 76% | Generates semantic HTML, but builder bloat |
| **Drupal (7/9 SSR)** | PHP SSR | 69% | Highly configurable, but often over-architected |

**Common issues:**
- Content detection succeeds but sections may merge (too similar structure)
- Color/font extraction works but CSS is harder to parse (inline)
- JSON output may be truncated if content > 1.5K words
- Some rich-text sections contain raw HTML (nested complexity)
- JavaScript adds `data-*` attributes that clutter analysis

**Optimization workarounds:**
- Use "Paste Code" mode — copy only main content, strip header/footer/sidebar
- Remove inline styles before pasting (Ctrl+Shift+V as plain text in most editors)
- Split large pages into sections before analysis
- Focus analysis on single page sections (avoid full site HTML)

---

### Tier 3 — Challenging Compatibility (30-60% success)

**Core Characteristics:**
- Heavy SSR but with major client-side rendering
- Cleaned HTML: 100K-300K chars (very large)
- Inline styles dominate, minimal semantic HTML
- Heavy framework overhead (`data-*` attributes, React/Vue markers)
- Complex image loading (lazy-load, srcset, multiple formats)
- 2500+ words of content
- Multiple interactive sections (tabs, accordions, carousels)

**What Gemini sees:** Signal drowned in noise. Content present but obfuscated by class names, data attributes, and styling markup. Gemini still extracts sections but with lower confidence.

**Success rate details:**
- Complex ecommerce: 45%
- Heavy interactive sites: 35%
- Site builders with lots of apps: 40%
- CMS with heavy plugins: 42%

**Examples:**

| Platform | Rendering | Compatibility | Notes |
|----------|-----------|---------------|-------|
| **WordPress (Plugin-heavy)** | SSR + heavy plugins | 52% | Tons of inline scripts, analytics, ads, widgets bloat |
| **WooCommerce** | SSR + JS cart/product | 48% | Heavy product schema, variations, dynamic pricing |
| **Magento** | SSR + complex JS | 45% | Enterprise platform, verbose HTML structure |
| **BigCommerce** | SSR + app ecosystem | 50% | Lots of third-party app scripts in HTML |
| **Joomla** | SSR + modular | 55% | Over-architected default output, but functional |
| **Craft CMS** | Flexible SSR | 58% | Can be clean, but often customized → bloated |
| **Framer** | Client-hybrid | 52% | Mixes static + dynamic, lots of bundle metadata |
| **Carrd** | SSR + embedded widgets | 58% | Minimal but relies on external embeds |

**Common issues:**
- JSON truncation (Gemini max 32K tokens)
- Section detection works but layout inference fails
- Colors extracted wrong (too many inline style variations)
- Content includes ads/tracking scripts that break parsing
- Lazy-loaded images not visible (only placeholders)
- Interactive elements lose context (what are tabs? Why are they grouped?)

**Optimization workarounds:**
1. **Chunked analysis:** Split HTML by `<section>` tags, analyze each separately
2. **Code extraction mode:** Use browser DevTools to get rendered-only content (strip scripts)
3. **Manual content map:** Provide Gemini a text outline of sections before sending HTML
4. **Remove bloat:** Strip inline styles, ads, tracking before sending to API
5. **Focus on above-fold:** Only send upper ~20K chars (visible content)

---

### Tier 4 — Low Compatibility (< 30% success)

**Core Characteristics:**
- Client-Side Rendering (CSR) framework (React SPA, Angular, Vue SPA without SSR)
- Raw HTML is mostly empty: `<div id="root"></div>` + script tags
- Cleaned HTML: < 500 chars (or mostly script tags)
- Content words in raw HTML: < 30
- Bot protection (Cloudflare, hCaptcha, reCAPTCHA)
- No semantic HTML (everything is divs)
- Framework metadata (`data-react`, `ng-*`, etc.)

**What Gemini sees:** Almost nothing. Empty div. No content to analyze. Only option is "Paste Code" mode (human provides rendered DOM).

**Success rate:** 10-25% (only succeeds if user manually extracts DOM)

**Why it fails:**
1. **No content in raw HTML.** Gemini analyzes server response, which is JS-only placeholder.
2. **JS execution required.** Content only exists after browser runs JavaScript. HTTP fetch can't execute JS.
3. **Bot protection blocks fetch.** Cloudflare/hCaptcha intercepts before returning HTML.
4. **Framework overhead.** React/Angular bundle = 100-300KB. Taking months to load before content renders.

**Examples:**

| Platform | Rendering | Compatibility | Notes |
|----------|-----------|---------------|-------|
| **React SPA (Create React App)** | CSR | 8% | Empty div, full JS bundle needed |
| **Angular (no SSR)** | CSR | 5% | Same issue, large bundle |
| **Vue SPA (no SSR)** | CSR | 12% | Slightly better DX but same rendering |
| **Ember** | CSR | 10% | Large framework bundle, CSR |
| **Single-page apps** | CSR | 15% | Dashboard, admin tools, web apps |
| **Next.js (explicitly CSR)** | CSR | 18% | Can be configured SSR, but bad setup = CSR |
| **Nuxt (explicitly CSR)** | CSR | 20% | Same, depends on config |
| **Mobile-only apps** | CSR/Native | 2% | Not web; no HTTP HTML at all |
| **Cloudflare-protected sites** | Unknown (blocked) | 0% | Challenge page returned instead of content |
| **reCAPTCHA/hCaptcha protected** | Unknown (blocked) | 2-5% | Human verification required first |
| **GraphQL-only frontends** | CSR | 8% | No HTML content, API-first |
| **Framer (SPA mode)** | CSR | 15% | Can be SSR or CSR depending on config |

**Technical breakdown — why AI fetch fails:**

```html
<!-- Raw HTML returned by server (what AI clone sees) -->
<!DOCTYPE html>
<html>
  <head>
    <script src="/app.js"></script> <!-- 100KB+ bundle -->
  </head>
  <body>
    <div id="root"></div> <!-- Empty. Content only after JS runs. -->
  </body>
</html>

<!-- What browser sees after JS executes (what user sees) -->
<div id="root">
  <header><!-- rendered by React --></header>
  <main><!-- rendered by React --></main>
  <!-- ... all content from JS bundle -->
</div>
```

**When CSR works:**
- Zero percent of the time with simple HTTP fetch
- 100% of the time with browser automation (Puppeteer, Playwright)
- 50-70% of the time if user manually extracts DOM and pastes code

---

## By Platform/Type

### SSG/SSR Frameworks — Tier 1 (90%+)

**Next.js (SSR configured)**
- Model: Hybrid, server-first by default in App Router
- HTML at fetch: Full content rendered
- Optimization: Use SSR for content pages, ISR for blogs
- Compatibility: 92%
- Notes: PPR (Partial Pre-rendering) in Next 16 = even better

**Astro**
- Model: Pure SSG, zero JS by default
- HTML at fetch: Complete, minimal, semantic
- Optimization: Built-in optimization
- Compatibility: 95%
- Notes: Best-in-class for AI clone; ship zero JS if possible

**Nuxt 3 (SSR configured)**
- Model: SSR by default with composition API
- HTML at fetch: Full content
- Optimization: Auto file-based routing
- Compatibility: 90%
- Notes: Better DX than Astro for complex apps

**Remix**
- Model: Server-first, streaming HTML
- HTML at fetch: Complete, semantic
- Optimization: Built-in streaming, smaller payloads
- Compatibility: 90%
- Notes: Best for interactive sites; still full content in first HTML

**Hugo**
- Model: Static site generator (Go-based)
- HTML at fetch: Pre-compiled static HTML
- Build time: < 1 second for large sites
- Compatibility: 94%
- Notes: Best for blogs, docs, no databases needed

**Jekyll**
- Model: Static site generator (Ruby-based)
- HTML at fetch: Pre-compiled static HTML
- Ecosystem: 17+ years of themes/plugins
- Compatibility: 92%
- Notes: GitHub Pages native, good for personal sites

**Eleventy (11ty)**
- Model: Flexible SSG, supports many languages
- HTML at fetch: Static output
- Optimization: Zero JS by default
- Compatibility: 93%
- Notes: More control than Hugo/Jekyll over output

---

### CMS Platforms — Tier 1-2 (75-85%)

**Ghost CMS**
- Rendering: Node.js SSR
- Focus: Blogging, publishing, membership
- Complexity: Simple, focused output
- Compatibility: 75%
- Why: Publishing-focused = clean HTML

**Strapi (Headless)**
- Rendering: API-based, depends on frontend
- API response: JSON (not HTML)
- For HTML: Pair with Astro/Next.js for Tier 1
- Standalone compatibility: 40% (must build frontend)
- Notes: Best used with SSR/SSG frontend

**Prismic (Headless)**
- Rendering: JSON API (not HTML)
- Usage: Pair with Next.js/Nuxt/Astro
- Standalone: 35% (similar to Strapi)
- Notes: Headless = you control rendering

**Contentful (Headless)**
- Rendering: JSON API (not HTML)
- Enterprise CMS option
- Standalone: 30%
- Notes: Enterprise support but same headless model

---

### Website Builders — Tier 2 (65-80%)

**Webflow**
- Rendering: Client-built sites output semantic HTML
- Builder approach: Visual editor → clean code
- HTML quality: High (hand-coded quality)
- Compatibility: 76%
- Why lower: Builder metadata in HTML, dynamic interactions

**Wix**
- Rendering: SSR with hydration
- HTML quality: Improved over time, still some bloat
- Inline styles: Heavy
- Compatibility: 65%
- Why lower: Heavy wrapper divs, inline styles dominate

**Squarespace**
- Rendering: SSR with design system
- HTML quality: Semantic, template-based
- Bloat: Moderate (design system classes)
- Compatibility: 68%
- Notes: Cleaner than Wix, heavier than Webflow

**Carrd**
- Rendering: Client-side generator → SSR output
- Page type: Single-page only
- HTML size: Minimal (5-20KB)
- Compatibility: 58%
- Why lower: Relies on embedded widgets (iframes, external embeds)

**Framer**
- Rendering: Hybrid (can be SSR or CSR depending on config)
- If SSR: 70% compatibility
- If CSR: 15% compatibility
- Default: CSR for interactive previews
- Notes: Check site's actual rendering method

---

### E-commerce Platforms — Tier 2 (50-75%)

**Shopify (Online Store 2.0)**
- Rendering: SSR via Liquid templating + Section API
- HTML structure: Modular, semantic
- Compatibility: 70%
- Why lower: Heavy cart/product JS, analytics, apps
- Optimization: Strip product schema, remove cart scripts before analysis

**WooCommerce (WordPress plugin)**
- Rendering: PHP SSR (via WordPress)
- Complexity: Product variations, dynamic pricing
- Compatibility: 48%
- Why lower: WP bloat + WooCommerce overhead

**Magento**
- Rendering: PHP SSR
- Enterprise: Complex, highly configurable
- HTML size: Large (verbose schema)
- Compatibility: 45%
- Why lower: Enterprise complexity = bloated output

**BigCommerce**
- Rendering: SSR with app ecosystem
- Apps: Many third-party apps = script bloat
- Compatibility: 50%
- Why lower: App scripts, tracking, analytics crowd HTML

---

### CMS Platforms (Traditional) — Tier 2-3 (55-70%)

**WordPress (Classic Editor + SSR)**
- Rendering: PHP SSR
- Plugin impact: Heavy (most sites have 5-10 plugins)
- Default: Works well, custom = variable
- Standalone compatibility: 72%
- With plugins: 45-60%
- Why varies: Plugin bloat (ads, analytics, forms, etc.)

**WordPress (Gutenberg/Block Editor)**
- Rendering: Dynamic blocks = SSR rendering
- Benefits: Cleaner default output than classic
- Block design: Can be semantic if well-designed
- Compatibility: 68%
- Notes: Better than classic, depends on theme

**Drupal**
- Rendering: PHP SSR, highly configurable
- Complexity: Enterprise-grade
- Output: Can be clean or bloated (depends on config)
- Compatibility: 69%
- Notes: Over-architected for small sites

**Joomla**
- Rendering: PHP SSR
- Modularity: Component-based
- Default bloat: Moderate
- Compatibility: 55%
- Notes: Less popular than WordPress; steeper learning curve

**Craft CMS**
- Rendering: PHP SSR with Twig templating
- Flexibility: Very flexible, depends on developer
- Can be optimized: Yes, manual control
- Compatibility: 58%
- Notes: Small/medium sites use; minimal default bloat

---

### SPA/CSR Frameworks — Tier 4 (10-25%)

**React (Create React App, no SSR)**
- Rendering: Client-side only
- Bundle size: 100-300KB+ JavaScript
- HTML fetch: Empty div + script tag
- Compatibility: 8%
- Solution: Use Next.js (SSR) instead

**Angular (no SSR)**
- Rendering: Client-side only
- Framework size: Large
- HTML fetch: Minimal
- Compatibility: 5%
- Solution: Use Angular Universal (SSR) instead

**Vue SPA (no SSR)**
- Rendering: Client-side only
- Bundle size: 30-100KB JavaScript
- Compatibility: 12%
- Solution: Use Nuxt (SSR) instead

**Ember**
- Rendering: Client-side only
- Framework size: Large
- Compatibility: 10%
- Solution: Server-rendering addon available

---

## Bot Protection & Access Blocking — Automatic Tier 4

**Cloudflare Protection**
- Effect: Blocks HTTP requests that don't pass bot score
- Bot score algorithm: ML-based, uses IP reputation + behavior
- Success blocking: ~15% of traffic flagged by heuristics engine
- ML engine: Detects 30% of Bot Management customers' traffic as bots
- AI clone impact: **0% success** — returns challenge page instead of HTML
- Workaround: None viable (would need Puppeteer + Cloudflare bypass)

**reCAPTCHA v2/v3**
- Effect: Blocks automated requests, requires human verification
- Bot detection: 69% or lower against sophisticated attacks
- Can be bypassed: 99.8% accuracy by AI bots (concerning)
- AI clone impact: **0% success** — returns verification page
- False positive: 50% of "verified" traffic is actually bots
- Workaround: None viable

**hCaptcha**
- Effect: Similar to reCAPTCHA but privacy-focused
- Bot detection: 69% or lower (same as reCAPTCHA)
- False negative rate: < 0.1% for legitimate users
- AI clone impact: **0% success** — same blocking as reCAPTCHA
- Workaround: None viable

**AWS CloudFront**
- Protection: Can include WAF (Web Application Firewall)
- Impact: Depends on WAF rules; may allow fetch or block
- Typical: More permissive than Cloudflare
- Compatibility: 60-80% depending on rules

---

## Quick Reference Table

| Signal | Tier 1 ✓ | Tier 2 ⚠ | Tier 3 ✗ | Tier 4 ✗✗ |
|--------|----------|----------|----------|-----------|
| **Framework** | Astro, Next.js SSR, Hugo, Jekyll, Remix | WordPress, Shopify, Wix, Webflow | WooCommerce, Heavy plugins, Framer-CSR | React SPA, Angular, Vue SPA, SPAs |
| **Rendering** | SSR/SSG | SSR + heavy JS | SSR + heavy client | CSR only |
| **Raw HTML** | 5K-50K | 50K-150K | 100K-300K | < 500 chars |
| **Words in raw** | 100-800 | 1000-2500 | 2500+ | < 30 |
| **`<section>` tags** | 3+ | 1-3 | 0-1 | 0 |
| **`<h1>`/`<h2>`** | Clear hierarchy | Some hierarchy | Buried in divs | None |
| **Semantic HTML** | Yes, extensive | Partial | Minimal | No |
| **External CSS** | Yes | Mostly external | Inline heavy | N/A |
| **Script tags** | 1-2 | 5-10 | 20-50+ | 10-20 |
| **`<img>` src** | Direct URLs | Direct URLs | Lazy/srcset | Lazy/unknown |
| **Success rate** | 90%+ | 60-85% | 30-60% | <30% |
| **Best workaround** | Use as-is | Paste content section | Chunked + manual | Browser automation |

---

## Content Type Breakdown

### Landing Pages

**Best performing:**
- Single-page, SSR/SSG built
- Hero + CTA sections
- Simple layout (3-5 sections)
- Success rate: **92%+**

**Worst performing:**
- JavaScript-heavy animations
- Video backgrounds with lazy loading
- Lots of form fields
- Success rate: **35-45%**

### Blogs

**Characteristics:**
- Article content (semantic `<article>` tags)
- Clear post metadata (date, author, category)
- Comment sections (can be JS-rendered)
- Success rate: **85-95%** (content-focused)

**Optimization:**
- Strip comments section (often CSR)
- Focus on post content area
- Ignore sidebar widgets

### E-commerce Product Pages

**Characteristics:**
- Product details (name, price, description)
- Media galleries (often lazy-loaded)
- Variations (size, color — often JS-driven)
- Reviews/ratings (often JS-rendered)
- Cart/add-to-cart (always JS)
- Success rate: **40-60%** (lots of JS)

**Optimization:**
- Focus on product description (not variations)
- Skip media galleries and reviews
- Strip cart/checkout sections

### Portfolio/Case Study Sites

**Characteristics:**
- Image-heavy (projects, shots, testimonials)
- Interactive elements (lightboxes, carousels, filters)
- May use Framer or similar builders
- Success rate: **55-75%**

**Optimization:**
- Focus on text descriptions (not images)
- Skip interactive galleries

### SaaS Product Pages

**Characteristics:**
- Sales/marketing focus (benefits, pricing)
- Lots of feature lists and comparisons
- Signup forms (often JS-validated)
- Interactive demos (JavaScript)
- Success rate: **85-92%** (content-heavy)

**Optimization:**
- Use as-is (usually well-structured)
- Can safely ignore signup forms

### Restaurant/Local Business

**Characteristics:**
- Location, hours, menu, contact (mostly text)
- Google Maps embed (not cloneable)
- Reservation forms (JS)
- Photos (menu, atmosphere)
- Success rate: **70-80%** (text-heavy)

**Optimization:**
- Focus on business info (not maps/forms)
- Include menu if available as text

### Real Estate Listings

**Characteristics:**
- Property details (highly structured)
- Photo galleries (lazy-loaded, sliders)
- Virtual tours (heavy JS or external)
- Forms (inquiry, contact)
- Success rate: **50-70%**

**Optimization:**
- Use property description text
- Skip galleries and tours

---

## HTML Size Analysis

### Why Size Matters

Gemini's token limit is 1M input + 32K output. Worst case: If cleaned HTML is > 200K chars, truncation happens, sections are missed.

**Optimal sizes (after cleaning):**
- **Excellent:** < 30K chars (always succeeds)
- **Good:** 30K-80K chars (usually succeeds)
- **Okay:** 80K-150K chars (often succeeds, some truncation)
- **Risky:** 150K-300K chars (truncation likely, partial success)
- **Bad:** > 300K chars (expect failures)

### How to Check Size

```bash
# Fetch and check raw HTML size
curl -s https://example.com | wc -c

# After removing <script>, <style>, HTML comments (rough estimate)
# Subtract ~40-60% from raw size for cleaned size
```

---

## Detection Score (Pre-Clone)

Create a quick score before sending to Gemini:

```
Score = (semantics × 30) + (size × 20) + (words × 20) + (protection × 20) + (csr × 10)

Semantics (30 pts):
- 0 pts: No semantic tags (divs only)
- 10 pts: Some semantic tags (1-2 sections)
- 20 pts: Good semantic tags (3+ sections, nav, footer)
- 30 pts: Excellent semantic tags (article, aside, etc.)

Size (20 pts):
- 0 pts: > 300K cleaned
- 5 pts: 150K-300K cleaned
- 15 pts: 50K-150K cleaned
- 20 pts: < 50K cleaned

Words (20 pts):
- 0 pts: < 30 or > 3000 words
- 10 pts: 30-200 or 2500-3000 words
- 15 pts: 200-1000 or 1500-2500 words
- 20 pts: 1000-1500 words

Protection (20 pts):
- 0 pts: Cloudflare/reCAPTCHA/hCaptcha
- 15 pts: AWS CloudFront (may allow)
- 20 pts: No protection detected

CSR (10 pts, negative):
- -10 pts: React/Angular/Vue SPA detected
- -5 pts: Heavy client-side hydration
- 0 pts: SSR/SSG

Total score guide:
- 80+: Tier 1 (try it)
- 60-79: Tier 2 (likely works, may need cleanup)
- 40-59: Tier 3 (risky, try chunked analysis)
- < 40: Tier 4 (use browser automation or paste code)
```

---

## AI Clone Pipeline (v2.8.0)

**Three-stage pipeline with post-processing:**

1. **Clone Stage:** Gemini analyzes HTML → extracts sections + content
2. **Design Extract:** Separate Gemini call for colors/fonts from CSS
3. **Missing Retry:** Auto-retry targeting H2 headings not matched in main clone
4. **Post-Processing:** 11-stage auto-fix pipeline (fonts, icons, colors, scoped CSS, etc.)
5. **Output:** Landing config ready to use, minimal manual refinement needed

**Auto-Fixes Applied:**
- Hero background image extraction
- Subheadline raw syntax cleanup
- Font mapping (Arial → Roboto, etc.)
- Icon normalization (Font Awesome → emoji)
- Social icon conversion
- Scoped CSS injection
- Nav logo auto-find
- Testimonial card background fix
- Design color accuracy + contrast
- High-contrast text correction
- Broken color value cleanup

See [AI Clone Post-Processing](./architecture/ai-clone-post-processing.md) for detailed documentation.

---

## Gemini API Details

- **Model:** Gemini 2.5 Flash
- **Max input:** 1M tokens (~5M chars)
- **Max output:** 32,768 tokens (~130K chars)
- **Response format:** `application/json` (structured output)
- **Temperature:** 0.05 (highly deterministic, improved in v2.8)
- **Cost:** ~$0.001-0.005 per clone (+ design extraction call)
- **Timeout:** 60 seconds
- **Pipeline stages:** 3 Gemini calls (clone + design + retry)

---

## Troubleshooting

### If clone fails or misses sections:

1. **Check HTML size:** If cleaned > 150K, try chunking
2. **Verify semantic tags:** If none, paste to "Code" mode instead
3. **Check protection:** If Cloudflare/reCAPTCHA, must use browser mode
4. **Look for CSR:** If < 50 words in raw HTML, it's CSR
5. **Strip bloat:** Remove inline styles, data attributes, script tags manually
6. **Paste content only:** Copy just the main content div (not header/footer/sidebar)

### Partial success (some sections detected, others missed):

- Site likely Tier 2-3 (heavy content or styling)
- Use chunked analysis: Split HTML by `<section>` tags
- Analyze each section separately
- Merge results after Gemini processes each

### Complete failure (0 sections detected):

- Site is CSR (React SPA) → use browser paste mode
- Site is protected (Cloudflare) → use browser paste mode
- HTML is corrupted (malformed) → try different URL
- Try extracting rendered DOM via browser DevTools

---

## Improvements in v2.8.0 (2026-03-29)

**Auto-Fix Post-Processing** — 11 intelligent post-processors run after Gemini clone to auto-fix common issues:

1. **Hero background image extraction** — Removes CSS pollution, keeps image
2. **Subheadline cleaning** — Strips raw form syntax and HTML fragments
3. **Font normalization** — Maps system fonts to Google Fonts (Arial → Roboto)
4. **Icon conversion** — Font Awesome → emoji for consistency
5. **SocialLinks normalization** — Icon names → emoji or images
6. **Scoped CSS injection** — Per-section styling for visual fidelity
7. **Nav logo auto-find** — Scans HTML for logo images, auto-populates field
8. **Testimonial readability** — Dark cards → light mode for contrast
9. **Design color accuracy** — Extracts primary/accent, fixes textMuted contrast
10. **High-contrast correction** — Fixes inverted text/background contrast
11. **Color cleanup** — Validates hex/rgb values, fallback to theme defaults

**Result:** 50%+ fewer manual edits needed after clone. Landing pages render immediately without visual errors.

See [AI Clone Post-Processing](./architecture/ai-clone-post-processing.md) for implementation details.

---

## Future Improvements (Backlog)

- **Chunked analysis:** Split HTML > 100K by sections, merge results
- **Screenshot-based:** Gemini Vision for visual layout detection (complement HTML)
- **Jina Reader integration:** JavaScript content extraction for CSR sites
- **Headless browser:** Puppeteer/Playwright backend for full CSR support
- **Pre-clone score:** Show compatibility percentage before sending to Gemini
- **Smart caching:** Remember site frameworks (Next.js/Astro) → pre-set expectations
- **Error recovery:** Auto-retry failed clones with chunked approach
- **Custom prompt tuning:** Different prompts for different site types
- **Custom post-processors:** Landing-specific auto-fix rules
