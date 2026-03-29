# AI Clone v2.8.0 — Quick Reference

**Released:** 2026-03-29
**Part of:** v3.1.0 (AI Clone Auto-Improve & Post-Processing)

---

## The Pipeline

```
User pastes URL
    ↓
[Stage 1] Clone — Gemini analyzes HTML → extracts sections
    ↓
[Stage 2] Design Extract — Separate Gemini call for colors/fonts from CSS
    ↓
[Stage 3] Missing Retry — Auto-retry targeting H2 headings not matched
    ↓
[Stage 4] Post-Processing — 11-stage auto-fix pipeline
    ↓
[Stage 5] Output — Landing config ready to use
```

---

## 11 Auto-Fixes (Post-Processing)

| # | Fix | Issue | Solution |
|----|-----|-------|----------|
| 1 | Hero BG | CSS pollution in style | Extract JPG URL, remove style.backgroundImage |
| 2 | Subheadline | Raw form syntax, HTML fragments | Strip non-semantic text |
| 3 | Font Map | Non-Google fonts (Arial, Verdana) | Map to Google Fonts (Roboto, Lato) |
| 4 | TopBar Icon | Font Awesome classes (fa-phone) | Convert to emoji (📞) |
| 5 | Social Icon | Icon names (twitter, linkedin) | Convert to emoji (𝕏, in) |
| 6 | Scoped CSS | No visual fidelity after clone | Inject section-level CSS for polish |
| 7 | Nav Logo | Logo buried in HTML | Auto-find image URL, populate field |
| 8 | Testimonial | Dark bg → poor readability | Switch card mode to light bg |
| 9 | Colors | Missing/incorrect primary/accent | Extract from nav/CTAs, fix contrast |
| 10 | Contrast | Inverted (dark bg + white text) | Auto-correct based on background |
| 11 | Broken Values | Malformed hex/rgb colors | Clean/validate or fallback |

---

## Layout System v2

### Structure

```
.landing-section-wrapper (100vw full-width)
  ├─ background color/image (full viewport)
  └─ .landing-section (max-width 72rem, centered)
      └─ content (padding here)
      └─ scoped CSS (data-section matched)
```

### Key Principles

✅ **Full-width by default** — Sections stretch edge-to-edge
✅ **Centered content** — Inner sections max-width 72rem with auto margins
✅ **No hardcoded colors** — Always use `--lp-*` CSS variables
✅ **Scoped CSS** — Per-section styling via `data-section` attribute
✅ **Data attributes** — All wrappers have `data-section={sectionId}`

### CSS Variables

```css
--lp-primary        /* Brand color */
--lp-secondary      /* Secondary accent */
--lp-accent         /* CTA button color */
--lp-text           /* Main text */
--lp-text-muted     /* Captions/hints */
--lp-background     /* Section background */
--lp-border         /* Divider color */
```

---

## Component Enhancements

| Component | Enhancement | Use Case |
|-----------|-------------|----------|
| **Features** | 5-column grid + image overlays | Modern feature showcase |
| **Pricing** | Horizontal scroll (5+ cards) | Travel/plan listings |
| **Nav** | Logo image + topbar (phone/email/flags) | Professional header |
| **Video** | 2x2 grid mode (4 videos) | Multi-video showcase |
| **Rich-Text** | Heading + subheading support | Flexible content blocks |
| **How-it-works** | Numbered circles (accent color) | Step-by-step guides |
| **Footer** | Icon images + responsive columns | Professional footer |
| **Testimonials** | Light/dark card modes | Readable testimonials |

---

## Scoped CSS Example

```json
{
  "type": "features",
  "scopedCss": [
    { "selector": ".feature-card", "css": "background: rgba(var(--lp-accent-rgb), 0.1);" },
    { "selector": ".feature-icon", "css": "color: var(--lp-accent);" },
    { "selector": "h3", "css": "font-family: 'Dancing Script', cursive;" }
  ]
}
```

Renders as:
```html
<style>
  [data-section="section-features"] .feature-card { ... }
  [data-section="section-features"] .feature-icon { ... }
  [data-section="section-features"] h3 { ... }
</style>
```

---

## Post-Processor Audit Log

After clone, review fixes applied:

```json
{
  "postProcessing": {
    "totalSections": 12,
    "fixesApplied": 18,
    "stages": [
      { "stage": 1, "name": "Hero Background", "success": true, "sectionsAffected": 1 },
      { "stage": 2, "name": "Subheadline Cleaning", "success": true, "sectionsAffected": 3 },
      ...
    ]
  }
}
```

In admin UI:
- ✅ Stage passed
- ⚠️ Stage partially applied
- ❌ Stage failed (graceful)

---

## Result

**50%+ fewer manual edits** needed after clone.

Landing pages render immediately with:
- ✅ Clean data (no CSS pollution)
- ✅ Google Fonts only
- ✅ Consistent colors (no hardcoding)
- ✅ Readable text (proper contrast)
- ✅ Visual polish (scoped CSS)
- ✅ Responsive layout (full-width + centered)

---

## Component Size Limits

Keep landing page components **under 200 LOC**:

| Component | Max LOC | Split if |
|-----------|---------|----------|
| Features | 150 | Multi-variant (grid, list, alternating) |
| Pricing | 120 | Complex logic or styling |
| Hero | 100 | Large variant count |
| Nav | 100 | Deep nesting or multiple sections |
| Footer | 120 | Many column layouts |

---

## Files to Know

**Post-Processing Pipeline:**
- `src/lib/admin/clone-ai-utils.ts` — Shared clone utilities
- `src/lib/admin/landing-clone-post-processor.ts` — 11-stage post-processor
- `src/lib/admin/landing-clone-ai.ts` — Orchestrates full clone flow

**Components:**
- `src/components/landing/landing-section-renderer.astro` — Main section renderer
- `src/components/landing/{section-type}.astro` — Individual section components

**Documentation:**
- `docs/architecture/ai-clone-post-processing.md` — Detailed pipeline guide
- `docs/architecture/landing-design.md` — Layout system + design variables
- `docs/code-standards.md` — Landing page component standards

---

## Performance

- **Post-processor runtime:** ~50ms for typical landing (12-15 sections)
- **All stages non-blocking:** No async operations
- **Graceful degradation:** If a fix fails, clone continues

---

## For Developers

### Clone a Website

```typescript
const result = await runFullClonePipeline({
  url: "https://example.com",
  geminiApiKey: process.env.GEMINI_API_KEY,
})
// result includes: sections, design, quality scores, fixes applied
```

### Style a Landing Section

```astro
<!-- Always use CSS variables -->
<button style={`background: var(--lp-accent); color: white;`}>
  Click me
</button>

<!-- Never hardcode -->
<!-- ❌ <button style="background: #f59e0b;">Click</button> -->
```

### Add Component

1. Keep under 200 LOC
2. Use `data-section` for scoped CSS
3. Use CSS variables for colors
4. Test on mobile/desktop

---

## Common Questions

**Q: Can I still clone old websites?**
A: Yes. Post-processor is backward compatible. All new fixes are non-destructive.

**Q: Do I need to update existing landing pages?**
A: No. Add empty `style: {}` and `scopedCss: []` fields if needed, but not required.

**Q: Why the 11 auto-fixes?**
A: They target the most common clone issues (CSS pollution, font mapping, color accuracy, contrast, etc.). Together they enable "immediately usable" landing pages.

**Q: What if a post-processor fails?**
A: Logged as warning, clone continues. Non-critical fixes don't block export.

**Q: How do I debug a cloned landing?**
A: Check the `postProcessing` audit log in clone result. Look for failed stages and section quality scores.

---

**Last updated:** 2026-03-29
**Version:** v2.8.0 (part of v3.1.0)
**Documentation:** [Full Post-Processing Guide](./architecture/ai-clone-post-processing.md)
