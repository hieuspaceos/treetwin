/**
 * Post-processing for AI clone results — smart style defaults,
 * quality assessment, auto-fix common AI mistakes, and preset matching.
 */
import type { CloneResult } from './clone-ai-utils'
import { LANDING_DESIGN_PRESETS } from '@/lib/landing/landing-design-presets'

// ---------------------------------------------------------------------------
// Preset matching
// ---------------------------------------------------------------------------

/** Parse a hex color string to [r, g, b] — returns null if invalid */
function hexToRgb(hex: string | undefined): [number, number, number] | null {
  if (!hex) return null
  const clean = hex.replace('#', '')
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16)
    const g = parseInt(clean[1] + clean[1], 16)
    const b = parseInt(clean[2] + clean[2], 16)
    return [r, g, b]
  }
  if (clean.length === 6) {
    return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)]
  }
  return null
}

/**
 * Approximate perceptual color distance (simplified Delta E).
 * Uses Euclidean distance in RGB — sufficient for preset matching.
 */
function colorDistance(hex1: string | undefined, hex2: string | undefined): number {
  const a = hexToRgb(hex1)
  const b = hexToRgb(hex2)
  if (!a || !b) return Infinity
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) +
    Math.pow(a[1] - b[1], 2) +
    Math.pow(a[2] - b[2], 2)
  )
}

/** Delta E threshold — below this value, colors are considered a match */
const PRESET_MATCH_THRESHOLD = 40

/**
 * Find nearest design preset by comparing primary color.
 * Returns preset ID if Delta E < threshold, else undefined.
 */
export function matchNearestPreset(design: CloneResult['design'] | undefined): string | undefined {
  const primary = design?.colors?.primary
  if (!primary || !primary.startsWith('#')) return undefined

  let bestId: string | undefined
  let bestDist = Infinity

  for (const preset of LANDING_DESIGN_PRESETS) {
    const dist = colorDistance(primary, preset.design.colors.primary)
    if (dist < bestDist) {
      bestDist = dist
      bestId = preset.id
    }
  }

  return bestDist < PRESET_MATCH_THRESHOLD ? bestId : undefined
}

// ---------------------------------------------------------------------------
// Smart style defaults
// ---------------------------------------------------------------------------

/**
 * Apply smart style defaults when AI extraction misses section backgrounds.
 * Uses common design patterns: hero=dark+fullWidth, CTA=gradient, etc.
 * Only applies to sections without style.background already set.
 */
export function applySmartStyleDefaults(
  sections: CloneResult['sections'],
  design?: CloneResult['design']
) {
  const primary = design?.colors?.primary || '#2d4a3e'
  const accent = design?.colors?.accent || '#d4a853'

  /** Darken a hex color by mixing with black */
  const darken = (hex: string, amount = 0.3) => {
    const c = hex.replace('#', '')
    const r = Math.round(parseInt(c.slice(0, 2), 16) * (1 - amount))
    const g = Math.round(parseInt(c.slice(2, 4), 16) * (1 - amount))
    const b = Math.round(parseInt(c.slice(4, 6), 16) * (1 - amount))
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
  }
  const darkPrimary = darken(primary, 0.4)

  // Body sections (non-nav/footer) — used for alternating rhythm
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

    // CTA: gradient only for standalone CTAs with real headlines
    if (s.type === 'cta') {
      const data = s.data as Record<string, unknown>
      const variant = data.variant as string | undefined
      const headline = String(data.headline || '')
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

// ---------------------------------------------------------------------------
// Section quality assessment
// ---------------------------------------------------------------------------

/** Assess quality of a single cloned section */
export function assessSectionQuality(
  s: { type: string; data: Record<string, unknown> },
  index: number
): { index: number; score: 'good' | 'partial' | 'poor'; issue?: string } {
  const d = s.data || {}
  const values = Object.values(d).filter(v => v != null && v !== '' && v !== undefined)
  if (values.length === 0) return { index, score: 'poor', issue: 'No content extracted' }

  const hasHeading = !!(d.headline || d.heading || d.brandName || d.text || d.content)
  if (!hasHeading && !['divider','social-proof','nav','footer','image','video','map','layout'].includes(s.type))
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

// ---------------------------------------------------------------------------
// isBgDark helper
// ---------------------------------------------------------------------------

/** Determine if a CSS background value is dark (returns null if uncertain) */
export function isBgDark(bg: string): boolean | null {
  if (!bg) return null
  const lower = bg.toLowerCase()
  // Solid hex
  const hexMatch = lower.match(/^#([0-9a-f]{6})$/)
  if (hexMatch) {
    const hex = hexMatch[1]
    const avg = (parseInt(hex.slice(0, 2), 16) + parseInt(hex.slice(2, 4), 16) + parseInt(hex.slice(4, 6), 16)) / 3
    return avg < 128
  }
  // Near-transparent gradients are LIGHT (e.g. rgba(x,y,z,0.05))
  if (lower.includes('linear-gradient') && /rgba?\([^)]*,\s*0\.0[0-5]\)/.test(lower)) return false
  // Dark-ish gradients
  if (lower.includes('linear-gradient') && /rgba?\(\s*\d{1,2}\s*,\s*\d{1,2}\s*,\s*\d{1,2}[^)]*0\.[3-9]/.test(lower)) return true
  // Short hex
  if (/^#[0-3]/.test(lower)) return true
  if (/^#[c-f]/.test(lower)) return false
  return null
}

// ---------------------------------------------------------------------------
// Main post-processor
// ---------------------------------------------------------------------------

/** Auto-fix common AI clone issues based on learned patterns */
export function postProcessCloneResult(r: CloneResult, rawHtml: string, _url?: string) {
  const hero = r.sections.find(s => s.type === 'hero')
  const nav = r.sections.find(s => s.type === 'nav')

  // Fix 1: Hero backgroundImage — find real CSS background-image if AI missed it or picked wrong one
  const heroImgLooksWrong = hero && hero.data.backgroundImage &&
    (String(hero.data.backgroundImage).endsWith('.png') || String(hero.data.backgroundImage).includes('logo'))
  if (hero && (!hero.data.backgroundImage || heroImgLooksWrong)) {
    const bgUrls = [...rawHtml.matchAll(/background[^;]*url\(["']?([^"')]+)["']?\)/g)]
      .map(m => m[1])
      .filter(u => u.startsWith('http') && !u.includes('logo') && !u.includes('icon') && !u.includes('flag') && !u.includes('dropdown'))
    const jpgUrls = bgUrls.filter(u => /\.(jpg|jpeg|webp)/i.test(u))
    const sliderUrl = jpgUrls.find(u => u.toLowerCase().includes('slider'))
    const heroUrl = sliderUrl || jpgUrls.find(u => ['hero', 'banner', 'cover'].some(k => u.toLowerCase().includes(k)))
    const imgUrls = [...rawHtml.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/g)]
      .map(m => m[1])
      .filter(u => u.startsWith('http') && /\.(jpg|jpeg|webp)/i.test(u) && !u.includes('logo') && !u.includes('icon') && !u.includes('flag') && !u.includes('avatar') && !u.includes('dropdown'))
    const sliderImg = imgUrls.find(u => ['slider', 'hero', 'banner', 'header-'].some(k => u.toLowerCase().includes(k)))
    const bestUrl = heroUrl || sliderImg || jpgUrls[0] || bgUrls.find(u => /\.(png)/i.test(u) && !u.includes('logo'))
    if (bestUrl) hero.data.backgroundImage = bestUrl
  }

  // Fix 2: Hero subheadline — clean if it contains raw form data
  if (hero) {
    const sub = String(hero.data.subheadline || '')
    const hasFormData = sub.length > 200 || /20\d{2}/.test(sub) || (sub.match(/—/g) || []).length > 2
    if (hasFormData) hero.data.subheadline = ''
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
        const clean = font.replace(/,\s*(sans-serif|serif|monospace|cursive)$/i, '').replace(/['"]/g, '').trim()
        const mapped = fontMap[clean]
        r.design.fonts[key] = mapped || clean
      }
    }
  }

  // Fix 4: Hero style — remove style.backgroundImage (hero component handles its own bg)
  if (hero?.style) {
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

  // Fix 5a: Remove topBar — account/login/dashboard links from source site are not useful
  if (nav?.data.topBar) {
    delete nav.data.topBar
  }

  // Fix 5: Clean socialLinks icons — replace FA classes/names with emoji
  const iconEmojiMap: Record<string, string> = {
    'whatsapp': '📱', 'phone': '📞', 'envelope': '✉️', 'email': '✉️', 'mail': '✉️',
    'facebook': '📘', 'instagram': '📷', 'twitter': '🐦', 'x-twitter': '𝕏', 'youtube': '▶️',
    'linkedin': '💼', 'map-marker': '📍', 'globe': '🌐', 'clock': '🕐', 'tiktok': '🎵',
    'pinterest': '📌', 'telegram': '✈️', 'reddit': '🔴', 'github': '💻', 'discord': '💬',
  }
  function cleanIcon(icon: string): string {
    if (!icon || icon.startsWith('http')) return icon
    const cleaned = icon.replace(/fa[bsr]?\s+fa-/g, '').replace(/fa-/g, '').trim().toLowerCase()
    return iconEmojiMap[cleaned] || icon
  }
  if (nav?.data.topBar && Array.isArray(nav.data.topBar)) {
    for (const item of nav.data.topBar as Array<{ icon?: string; text?: string; image?: string }>) {
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

  // Fix 7: Nav logo — find site logo if AI missed it
  if (nav && !nav.data.logo) {
    const logoUrls = [...rawHtml.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/g)]
      .map(m => ({ src: m[1], ctx: m[0].toLowerCase() }))
      .filter(m => (m.ctx.includes('logo') || m.ctx.includes('brand')) && m.src.startsWith('http'))
    if (logoUrls.length > 0) nav.data.logo = logoUrls[0].src
  }

  // Fix 8: Validate design colors — ensure they match actual site colors
  if (r.design?.colors) {
    const c = r.design.colors
    // Fix textMuted too light on white bg
    if (c.textMuted && c.background) {
      const bgLight = !c.background || c.background === '#ffffff' || c.background === '#fff'
      const mutedMatch = c.textMuted.match(/^#([0-9a-f]{6})$/i)
      if (bgLight && mutedMatch) {
        const avg = (parseInt(mutedMatch[1].slice(0, 2), 16) + parseInt(mutedMatch[1].slice(2, 4), 16) + parseInt(mutedMatch[1].slice(4, 6), 16)) / 3
        if (avg > 180) c.textMuted = '#64748b'
      }
    }
    // Fix primary from nav background color
    const navBg = nav?.style?.background
    if (navBg && typeof navBg === 'string' && /^#[0-9a-f]{6}$/i.test(navBg)) {
      c.primary = navBg
    }
    // Fix accent from CTA button colors in HTML
    const btnColors = [...rawHtml.matchAll(/(?:background|background-color):\s*(#[0-9a-f]{6})/gi)]
      .map(m => m[1].toLowerCase())
      .filter(h => !['#ffffff', '#000000', '#f8f8f8', '#f0f0f0', '#333333', '#111111'].includes(h))
    const accentCandidates = btnColors.filter(h => {
      const r2 = parseInt(h.slice(1, 3), 16), g2 = parseInt(h.slice(3, 5), 16)
      return r2 > 150 && g2 < 150
    })
    if (accentCandidates.length > 0 && c.accent === c.primary) {
      c.accent = accentCandidates[0]
    }
  }

  // Fix 8c: Clean broken color values (e.g. "#" without hex digits)
  for (const s of r.sections) {
    if (!s.style) continue
    for (const key of ['textColor', 'textMutedColor', 'accentColor', 'background'] as const) {
      const val = s.style[key]
      if (typeof val === 'string' && val.startsWith('#') && val.length < 4) {
        delete s.style[key]
      }
    }
  }

  // Fix 8d: Ensure text contrast — dark bg → white text, light bg → dark text
  for (const s of r.sections) {
    if (!s.style?.background) continue
    const dark = isBgDark(String(s.style.background))
    if (dark === true && !s.style.textColor) {
      s.style.textColor = '#ffffff'
      if (!s.style.textMutedColor) s.style.textMutedColor = 'rgba(255,255,255,0.75)'
    } else if (dark === false && s.style.textColor === '#ffffff' && !String(s.style.background).includes('gradient')) {
      delete s.style.textColor
      delete s.style.textMutedColor
    }
  }

  // Fix 10: Testimonials with dark bg + cards → switch to light bg for readability
  const testimonials = r.sections.find(s => s.type === 'testimonials')
  if (testimonials?.style) {
    const bg = String(testimonials.style.background || '').toLowerCase()
    const isDark = bg.startsWith('#1') || bg.startsWith('#2') || bg.startsWith('#0') || (bg.includes('rgb(') && parseInt(bg.split(',')[0].replace(/\D/g, '')) < 80)
    if (isDark) {
      testimonials.style.background = '#faf6f1'
      delete testimonials.style.textColor
      delete testimonials.style.textMutedColor
    }
  }

  // Fix 11: Ensure footer exists — add minimal footer if AI missed it
  const hasFooter = r.sections.some(s => s.type === 'footer')
  if (!hasFooter) {
    const brandName = nav?.data?.brandName || r.title || ''
    r.sections.push({
      type: 'footer',
      order: 999,
      enabled: true,
      data: {
        text: `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`,
        variant: 'simple',
        links: [],
      },
      style: { fullWidth: true },
    })
  }

  // Fix 12: Ensure CTA exists before footer — add if missing
  const hasCta = r.sections.some(s => s.type === 'cta')
  if (!hasCta && r.sections.length >= 4) {
    const footerIdx = r.sections.findIndex(s => s.type === 'footer')
    const maxBodyOrder = Math.max(...r.sections.filter(s => s.type !== 'footer').map(s => s.order), 0)
    const ctaSection = {
      type: 'cta',
      order: maxBodyOrder + 1,
      enabled: true,
      data: {
        headline: r.title ? `Get Started with ${r.title.split(' - ')[0]}` : 'Get Started Today',
        subheadline: r.description || '',
        variant: 'default',
        cta: [{ text: 'Get Started', url: '#' }],
      },
      style: { fullWidth: true },
    }
    if (footerIdx >= 0) r.sections.splice(footerIdx, 0, ctaSection)
    else r.sections.push(ctaSection)
  }

  // Phase 4: Preset matching — if extracted primary color matches a preset, set design.preset
  if (r.design) {
    const matchedPreset = matchNearestPreset(r.design)
    if (matchedPreset) {
      (r.design as any).preset = matchedPreset
    }
  }
}
