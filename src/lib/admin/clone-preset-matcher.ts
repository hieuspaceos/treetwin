/**
 * Match Gemini-extracted colors to existing presets or generate a harmonious
 * custom preset from the 2 dominant colors (primary + secondary).
 *
 * Logic:
 * 1. Compare extracted primary+secondary against all presets using color distance
 * 2. If close match found (distance < threshold) → use that preset
 * 3. Otherwise → derive a full 7-color palette from the 2 extracted colors
 */
import { LANDING_DESIGN_PRESETS, type DesignPreset } from '../landing/landing-design-presets'

/** Parse hex (#abc or #aabbcc) to [r, g, b] */
function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '')
  if (c.length === 3) {
    return [parseInt(c[0] + c[0], 16), parseInt(c[1] + c[1], 16), parseInt(c[2] + c[2], 16)]
  }
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]
}

/** Euclidean distance between 2 RGB colors (0-441) */
function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

/** Get perceived luminance (0-1) */
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/** Lighten a hex color by mixing with white */
function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  return `#${[mix(r), mix(g), mix(b)].map(c => c.toString(16).padStart(2, '0')).join('')}`
}

/** Darken a hex color by mixing with black */
function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  const mix = (c: number) => Math.round(c * (1 - amount))
  return `#${[mix(r), mix(g), mix(b)].map(c => c.toString(16).padStart(2, '0')).join('')}`
}

/** Score how well a preset matches the extracted colors (lower = better) */
function presetScore(preset: DesignPreset, primary: string, secondary: string): number {
  const pDist = colorDistance(preset.design.colors.primary || '#000', primary)
  const sDist = colorDistance(preset.design.colors.secondary || '#000', secondary)
  // Primary weighs more (60/40)
  return pDist * 0.6 + sDist * 0.4
}

/** Max distance to consider a "close match" — ~15% of max possible (441) */
const MATCH_THRESHOLD = 65

export interface PresetMatchResult {
  /** Matched existing preset ID, or null if custom generated */
  presetId: string | null
  /** Full design colors to apply */
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    textMuted: string
  }
  /** Fonts from matched preset or sensible defaults */
  fonts: { heading: string; body: string }
  /** Border radius from matched preset or extracted */
  borderRadius: string
}

/**
 * Match extracted colors to best preset or generate custom palette.
 * @param extracted - Gemini-extracted design (colors, fonts, borderRadius)
 */
export function matchOrCreatePreset(extracted: {
  colors?: Record<string, string>
  fonts?: { heading?: string; body?: string }
  borderRadius?: string
}): PresetMatchResult {
  const primary = extracted.colors?.primary || '#3b82f6'
  const secondary = extracted.colors?.secondary || '#6366f1'

  // Score all presets
  const scored = LANDING_DESIGN_PRESETS.map(p => ({
    preset: p,
    score: presetScore(p, primary, secondary),
  })).sort((a, b) => a.score - b.score)

  const best = scored[0]

  // If close match → use existing preset (preset colors are always complete)
  if (best.score < MATCH_THRESHOLD) {
    const pc = best.preset.design.colors
    const pf = best.preset.design.fonts
    return {
      presetId: best.preset.id,
      colors: {
        primary: pc.primary!, secondary: pc.secondary!, accent: pc.accent!,
        background: pc.background!, surface: pc.surface!, text: pc.text!, textMuted: pc.textMuted!,
      },
      fonts: { heading: pf.heading!, body: pf.body! },
      borderRadius: best.preset.design.borderRadius,
    }
  }

  // No close match → generate harmonious palette from primary + secondary
  const isDarkBg = extracted.colors?.background
    ? luminance(extracted.colors.background) < 0.4
    : false

  const colors = {
    primary,
    secondary,
    // Accent: use extracted if available, otherwise complementary bright tone
    accent: extracted.colors?.accent || lighten(secondary, 0.3),
    // Background: use extracted or derive from dark/light context
    background: isDarkBg
      ? (extracted.colors?.background || '#0f172a')
      : (extracted.colors?.background || '#ffffff'),
    // Surface: slightly offset from background
    surface: isDarkBg
      ? lighten(extracted.colors?.background || '#0f172a', 0.08)
      : lighten(primary, 0.92),
    // Text: ensure readable contrast
    text: isDarkBg
      ? (extracted.colors?.text || '#f1f5f9')
      : (extracted.colors?.text || darken(primary, 0.7)),
    // Text muted: softer version
    textMuted: isDarkBg
      ? (extracted.colors?.textMuted || '#94a3b8')
      : (extracted.colors?.textMuted || '#64748b'),
  }

  // Fonts: keep extracted if valid, otherwise use safe defaults
  const fonts = {
    heading: extracted.fonts?.heading || 'Plus Jakarta Sans',
    body: extracted.fonts?.body || 'Inter',
  }

  return {
    presetId: null,
    colors,
    fonts,
    borderRadius: extracted.borderRadius || '12px',
  }
}
