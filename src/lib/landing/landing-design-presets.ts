/**
 * Landing page design presets — curated color + font combinations.
 * Each preset provides a complete visual identity for a landing page.
 * Users can pick a preset then override individual values.
 */
import type { LandingDesign } from './landing-types'

export interface DesignPreset {
  id: string
  name: string
  /** Short preview description */
  description: string
  design: Required<Pick<LandingDesign, 'colors' | 'fonts' | 'borderRadius'>>
}

export const LANDING_DESIGN_PRESETS: DesignPreset[] = [
  {
    id: 'clean-light',
    name: 'Clean Light',
    description: 'Minimal white with blue accents',
    design: {
      colors: {
        primary: '#3b82f6',
        secondary: '#6366f1',
        accent: '#f59e0b',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        textMuted: '#64748b',
      },
      fonts: { heading: 'Plus Jakarta Sans', body: 'Inter' },
      borderRadius: '12px',
    },
  },
  {
    id: 'modern-dark',
    name: 'Modern Dark',
    description: 'Dark slate with vibrant green',
    design: {
      colors: {
        primary: '#10b981',
        secondary: '#06b6d4',
        accent: '#f59e0b',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f1f5f9',
        textMuted: '#94a3b8',
      },
      fonts: { heading: 'Plus Jakarta Sans', body: 'Inter' },
      borderRadius: '12px',
    },
  },
  {
    id: 'gradient-bold',
    name: 'Gradient Bold',
    description: 'Purple-pink gradient energy',
    design: {
      colors: {
        primary: '#8b5cf6',
        secondary: '#ec4899',
        accent: '#f97316',
        background: '#faf5ff',
        surface: '#f3e8ff',
        text: '#1e1b4b',
        textMuted: '#6b7280',
      },
      fonts: { heading: 'Poppins', body: 'DM Sans' },
      borderRadius: '16px',
    },
  },
  {
    id: 'startup-fresh',
    name: 'Startup Fresh',
    description: 'Teal + coral for SaaS products',
    design: {
      colors: {
        primary: '#0d9488',
        secondary: '#0891b2',
        accent: '#f43f5e',
        background: '#ffffff',
        surface: '#f0fdfa',
        text: '#134e4a',
        textMuted: '#5eead4',
      },
      fonts: { heading: 'Space Grotesk', body: 'Inter' },
      borderRadius: '8px',
    },
  },
  {
    id: 'corporate-trust',
    name: 'Corporate Trust',
    description: 'Navy + gold for enterprise',
    design: {
      colors: {
        primary: '#1e40af',
        secondary: '#1d4ed8',
        accent: '#ca8a04',
        background: '#ffffff',
        surface: '#eff6ff',
        text: '#1e293b',
        textMuted: '#475569',
      },
      fonts: { heading: 'Playfair Display', body: 'Source Sans 3' },
      borderRadius: '6px',
    },
  },
  {
    id: 'warm-sunset',
    name: 'Warm Sunset',
    description: 'Warm orange + earthy tones',
    design: {
      colors: {
        primary: '#ea580c',
        secondary: '#dc2626',
        accent: '#16a34a',
        background: '#fffbeb',
        surface: '#fef3c7',
        text: '#451a03',
        textMuted: '#92400e',
      },
      fonts: { heading: 'Outfit', body: 'Nunito' },
      borderRadius: '14px',
    },
  },
]

/** Resolve a design config by merging preset defaults with custom overrides */
export function resolveDesign(design?: LandingDesign): LandingDesign['colors'] & { fonts: LandingDesign['fonts']; borderRadius: string } {
  const preset = LANDING_DESIGN_PRESETS.find(p => p.id === design?.preset)
  const base = preset?.design ?? LANDING_DESIGN_PRESETS[0].design

  return {
    primary: design?.colors?.primary ?? base.colors.primary,
    secondary: design?.colors?.secondary ?? base.colors.secondary,
    accent: design?.colors?.accent ?? base.colors.accent,
    background: design?.colors?.background ?? base.colors.background,
    surface: design?.colors?.surface ?? base.colors.surface,
    text: design?.colors?.text ?? base.colors.text,
    textMuted: design?.colors?.textMuted ?? base.colors.textMuted,
    fonts: {
      heading: design?.fonts?.heading ?? base.fonts.heading,
      body: design?.fonts?.body ?? base.fonts.body,
    },
    borderRadius: design?.borderRadius ?? base.borderRadius,
  }
}

/** Convert resolved design to CSS variable string for inline style injection */
export function designToCssVars(design?: LandingDesign): string {
  const d = resolveDesign(design)
  return [
    `--lp-primary:${d.primary}`,
    `--lp-secondary:${d.secondary}`,
    `--lp-accent:${d.accent}`,
    `--lp-bg:${d.background}`,
    `--lp-surface:${d.surface}`,
    `--lp-text:${d.text}`,
    `--lp-text-muted:${d.textMuted}`,
    `--lp-font-heading:${d.fonts?.heading ?? 'system-ui'}`,
    `--lp-font-body:${d.fonts?.body ?? 'system-ui'}`,
    `--lp-radius:${d.borderRadius}`,
  ].join(';')
}

/** Generate Google Fonts import URL for the design's font pairing */
export function designFontsUrl(design?: LandingDesign): string | null {
  const d = resolveDesign(design)
  const families: string[] = []
  const systemFonts = ['system-ui', 'sans-serif', 'serif', 'monospace', 'Inter']
  if (d.fonts?.heading && !systemFonts.includes(d.fonts.heading)) {
    families.push(d.fonts.heading.replace(/ /g, '+') + ':wght@400;600;700;800')
  }
  if (d.fonts?.body && !systemFonts.includes(d.fonts.body) && d.fonts.body !== d.fonts?.heading) {
    families.push(d.fonts.body.replace(/ /g, '+') + ':wght@400;500;600')
  }
  if (families.length === 0) return null
  return `https://fonts.googleapis.com/css2?${families.map(f => `family=${f}`).join('&')}&display=swap`
}
