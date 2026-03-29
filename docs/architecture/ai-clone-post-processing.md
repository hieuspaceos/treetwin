# AI Clone Post-Processing (v2.8.0)

**Released:** 2026-03-29

Intelligent 11-stage post-processing pipeline that auto-fixes cloned landing pages after Gemini extraction.

## Overview

After Gemini analyzes HTML and extracts sections, the post-processor runs in sequence to:
- Remove data contamination (CSS, raw form syntax)
- Normalize fonts to Google Fonts equivalents
- Convert icon identifiers to emoji
- Extract design values more accurately
- Ensure visual fidelity with scoped CSS
- Validate and clean all color values

**Result:** Cloned landing pages are immediately usable without manual fix-up.

---

## The 11 Auto-Fixes

### 1. Hero Background Extraction

**Problem:** Gemini extracts `style.backgroundImage` from CSS (e.g., `style.backgroundImage: url(slider-1.jpg)`), which pollutes the data model.

**Solution:**
- Scan `style.backgroundImage` for image URLs
- Extract JPG/PNG paths and store in `images.background`
- Remove `style.backgroundImage` (let hero component handle its own background)

**Before:**
```json
{
  "type": "hero",
  "data": {
    "heading": "Welcome",
    "style": {
      "backgroundImage": "url('/cdn/slider-1.jpg')"
    }
  }
}
```

**After:**
```json
{
  "type": "hero",
  "data": {
    "heading": "Welcome",
    "images": {
      "background": "/cdn/slider-1.jpg"
    },
    "style": {}
  }
}
```

### 2. Subheadline Cleaning

**Problem:** Gemini sometimes extracts raw form field syntax, HTML fragments, or unstructured data into subheadlines.

**Example (bad):**
```
"subheading": "Email input {type: text, required} Contact us now"
```

**Solution:**
- Strip form field patterns: `{type: X}`, `[input]`, `<input ...>`
- Remove HTML tags: `<div>`, `<span>`
- Remove raw JSON/YAML markers
- Keep only natural language text

**After:**
```
"subheading": "Contact us now"
```

### 3. Font Mapping (Non-Google → Google)

**Problem:** Cloned sites often use system fonts (Arial, Verdana, Georgia) not available on Google Fonts.

**Solution:** Auto-map to nearest Google Font equivalents:

| Original | Google Font |
|----------|-------------|
| Arial, Helvetica | Roboto |
| Times New Roman, Georgia | Lora |
| Courier, Courier New | Roboto Mono |
| Trebuchet MS | Trebuchet MS (not on Google, fallback: Poppins) |
| Verdana | Lato |
| Comic Sans | Fredoka (closest handwritten) |

**Mapping logic:** Preserve intent (serif → serif, monospace → monospace, etc.).

### 4. TopBar Icon Conversion

**Problem:** Cloned nav sections often extract Font Awesome classes (`.fa-phone`, `.fa-envelope`) which aren't valid in our data model.

**Solution:**
- Detect Font Awesome icon patterns: `fa-{icon-name}`
- Map to emoji equivalents

| FA Class | Emoji | Use Case |
|----------|-------|----------|
| fa-phone | 📞 | Phone number in top bar |
| fa-envelope | ✉️ | Email link |
| fa-map-marker | 📍 | Location/address |
| fa-clock | 🕐 | Hours/timing |
| fa-globe | 🌐 | Website/language |
| fa-flag-* | Flag emoji | Country selector |

**Before:**
```json
{
  "topBar": {
    "items": [
      { "icon": "fa-phone", "text": "+1 234 567 8900" }
    ]
  }
}
```

**After:**
```json
{
  "topBar": {
    "items": [
      { "icon": "📞", "text": "+1 234 567 8900" }
    ]
  }
}
```

### 5. SocialLinks Icon Normalization

**Problem:** Cloned social links often have icon names (`twitter`, `linkedin`, `facebook`) which we display as image URLs or emoji.

**Solution:**
- Map icon names to emoji for consistency
- Fallback: if URL provided, use URL (support both)

| Icon Name | Emoji |
|-----------|-------|
| twitter | 𝕏 |
| linkedin | in |
| facebook | f |
| instagram | ig |
| github | gh |
| youtube | ▶️ |
| email | ✉️ |
| dribbble | d |
| behance | be |
| codepen | pen |
| twitch | twitch |

**After normalization:**
```json
{
  "socialLinks": [
    { "icon": "𝕏", "url": "https://twitter.com/..." },
    { "icon": "in", "url": "https://linkedin.com/..." }
  ]
}
```

### 6. Scoped CSS Injection

**Problem:** Cloned landing pages lack visual polish — generic layouts without section-specific styling.

**Solution:**
- Auto-generate scoped CSS for common patterns
- Inject `scopedCss` array with selector + CSS declarations
- Apply special handling:
  - **Dancing Script font:** If site uses cursive/handwritten style, inject `font-family: 'Dancing Script'` to headings
  - **Accent buttons:** Color all CTAs/buttons with `background: var(--lp-accent)`
  - **Card shadows:** Add subtle shadows to feature/testimonial cards

**Auto-generated example (cursive site):**
```json
{
  "scopedCss": [
    { "selector": "h1, h2, h3", "css": "font-family: 'Dancing Script', cursive;" },
    { "selector": ".cta-button, .btn-primary", "css": "background: var(--lp-accent); color: white;" },
    { "selector": ".card", "css": "box-shadow: 0 2px 8px rgba(0,0,0,0.1);" }
  ]
}
```

**Principle:** No hardcoded colors — always use design variables (`--lp-primary`, `--lp-accent`, etc.).

### 7. Nav Logo Auto-Find

**Problem:** After cloning, `nav.logo.image` is often empty because Gemini doesn't reliably extract logo image URLs from raw HTML.

**Solution:**
- Scan cloned HTML for `<img>` tags in nav/header
- Priority: src attributes with "logo", "brand", "mark"
- Auto-populate `nav.logo.image` with most likely candidate

**Before:**
```json
{
  "nav": {
    "logo": {
      "image": null,
      "text": "CompanyName"
    }
  }
}
```

**After:**
```json
{
  "nav": {
    "logo": {
      "image": "/images/logo.png",
      "text": "CompanyName"
    }
  }
}
```

### 8. Testimonial Card Background Auto-Fix

**Problem:** Cloned testimonial sections often have dark `backgroundColor` on cards, making text unreadable.

**Solution:**
- Detect if card has dark background + light text (poor contrast)
- Switch to `cardMode: "light"` (white/light background + dark text)

**Before:**
```json
{
  "type": "testimonials",
  "data": {
    "items": [
      {
        "quote": "Great product!",
        "author": "John Doe",
        "style": { "backgroundColor": "#1a1a1a", "color": "#ffffff" }
      }
    ]
  }
}
```

**After:**
```json
{
  "type": "testimonials",
  "data": {
    "cardMode": "light",
    "items": [
      {
        "quote": "Great product!",
        "author": "John Doe"
      }
    ]
  }
}
```

### 9. Design Color Extraction & Contrast Fix

**Problem:** Extracted design colors may be incorrect or have poor contrast (e.g., `textMuted` too light on light background).

**Solution:**
- **Primary color:** Extract dominant color from nav, hero headings
- **Accent color:** Extract from CTA buttons, highlighted text
- **TextMuted:** If contrast < 4.5:1 (WCAG AA), darken or fallback to `rgba(0,0,0,0.6)`

**WCAG Contrast Check:**
```
contrast = (L1 + 0.05) / (L2 + 0.05)
where L = relative luminance

Good: >= 4.5:1 (normal text), >= 3:1 (large text)
```

**Before:**
```json
{
  "design": {
    "colors": {
      "primary": "#3b82f6",
      "textMuted": "#e0e0e0"  // Too light on white bg
    }
  }
}
```

**After:**
```json
{
  "design": {
    "colors": {
      "primary": "#3b82f6",
      "textMuted": "#6b7280"  // Fixed contrast
    }
  }
}
```

### 10. High-Contrast Text Auto-Correction

**Problem:** Cloned design may have inverted contrast (e.g., dark background + white text on light backgrounds).

**Solution:**
- Detect: if `backgroundColor` is light AND `color` is white/light
- Auto-remove `color` style (let defaults apply)
- Detect: if `backgroundColor` is dark AND `color` is missing/light
- Ensure `color: white` is set

**Logic:**
```
if isDarkBg(backgroundColor) {
  style.color = 'white' or 'rgba(255,255,255,0.9)'
} else if isLightBg(backgroundColor) {
  delete style.color  // use default dark text
}
```

### 11. Broken Color Value Cleanup

**Problem:** Color values may be malformed (e.g., `"#"` without hex digits, `"rgb()"` with missing values).

**Solution:**
- Detect patterns: `"#"`, `"#1"`, `"rgb()"`, `"rgb(255)"`, etc.
- For hex: validate 3 or 6 digits; fallback to preset if invalid
- For rgb/rgba: validate 3 or 4 comma-separated values
- Fallback: use theme default color

**Examples:**

| Invalid | Fallback |
|---------|----------|
| `"#"` | `"#3b82f6"` (primary) |
| `"#12"` | `"#121212"` (repeat digits) |
| `"rgb()"` | `"rgb(59, 130, 246)"` |
| `"rgb(255)"` | `"rgb(255, 255, 255)"` (white) |

---

## Implementation

### Module: `src/lib/admin/landing-clone-post-processor.ts`

Each fix is a separate function with clear input/output:

```typescript
export interface PostProcessorResult {
  section: LandingSection
  fixes: Array<{ stage: number; name: string; changed: boolean; detail: string }>
}

export async function runPostProcessors(
  sections: LandingSection[],
  clonedHtml: string
): Promise<PostProcessorResult[]> {
  const results: PostProcessorResult[] = []

  for (const section of sections) {
    let processed = { ...section }
    const fixes = []

    // Stage 1: Hero background
    const heroBgFix = fixHeroBackground(processed)
    if (heroBgFix.changed) fixes.push(heroBgFix)

    // Stage 2: Subheadline cleaning
    const subFix = cleanSubheadlines(processed)
    if (subFix.changed) fixes.push(subFix)

    // ... etc for all 11 stages

    results.push({ section: processed, fixes })
  }

  return results
}
```

### Pipeline Order (Critical)

1. Hero Background (must run first — changes structure)
2. Subheadline (affects data before color extraction)
3. Font Mapping
4. TopBar Icon
5. SocialLinks Icon
6. **Design Color Extraction** (must run after font/icon fixes)
7. Nav Logo
8. Testimonial Card
9. High-Contrast Correction
10. Broken Colors (must run last)
11. Scoped CSS Injection (must run after all fixes)

### Error Handling

All post-processors are **non-destructive**:
- If a fix fails, log and skip (don't block clone)
- Original section data unchanged if processor errors
- Fixes array includes `error` field if issue detected

---

## Testing

### Unit Tests

Each fix should have:
1. **Happy path:** Valid input → correct transformation
2. **Edge case:** Malformed/missing data → no crash
3. **Idempotent:** Running 2x = same as 1x

Example:
```typescript
test('fontMapping: Arial → Roboto', () => {
  const section = { data: { headingFont: 'Arial' } }
  const result = fixFontMapping(section)
  expect(result.data.headingFont).toBe('Roboto')
  expect(result.fixes[0].name).toBe('Font Mapping')
})

test('fontMapping: idempotent', () => {
  const section = { data: { headingFont: 'Arial' } }
  const result1 = fixFontMapping(section)
  const result2 = fixFontMapping(result1)
  expect(result1.data.headingFont).toBe(result2.data.headingFont)
})
```

### Integration Tests

Clone real websites and verify:
- No post-processor errors
- All 11 fixes attempted (success or graceful skip)
- Landing page renders without errors
- Visual fidelity maintained

---

## Configuration

### Google Fonts Mapping

Update `fontMappings` object if Google Fonts catalog changes:

```typescript
const fontMappings: Record<string, string> = {
  'Arial': 'Roboto',
  'Times New Roman': 'Lora',
  'Courier New': 'Roboto Mono',
  // ... etc
}
```

### Emoji Mappings

Update icon-to-emoji maps if design guidelines change:

```typescript
const faToEmoji: Record<string, string> = {
  'fa-phone': '📞',
  'fa-envelope': '✉️',
  // ... etc
}

const socialToEmoji: Record<string, string> = {
  'twitter': '𝕏',
  'linkedin': 'in',
  // ... etc
}
```

---

## Monitoring

### Post-Processor Audit Log

Every clone includes fixes summary:

```json
{
  "cloneResult": {
    "sections": [...],
    "postProcessing": {
      "totalSections": 12,
      "fixesApplied": 18,
      "stages": [
        { "stage": 1, "name": "Hero Background", "success": true, "sectionsAffected": 1 },
        { "stage": 2, "name": "Subheadline Cleaning", "success": true, "sectionsAffected": 3 },
        // ... etc
      ]
    }
  }
}
```

Displays in admin UI:
- ✅ Stage passed
- ⚠️ Stage partially applied
- ❌ Stage failed (graceful)

---

## Performance

**Expected runtime:** < 50ms for typical landing (12-15 sections)

- Each fix is O(n) where n = section count
- No async operations (non-blocking)
- Early exit if section data missing (defensive)

---

## Future Improvements

- **Custom processor hooks:** Allow landing-specific post-processors
- **A/B testing:** Track which fixes improve clone quality most
- **ML-based color extraction:** Improve primary/accent detection accuracy
- **Layout validation:** Detect layout issues (conflicting widths, grid overflows) and auto-fix
- **Accessibility audit:** Auto-fix color contrast, missing alt text, semantic HTML issues

---

**Last updated:** 2026-03-29
**Version:** v2.8.0
