/**
 * Shared types and helpers used by preview renderer components.
 * Extracted from landing-live-preview.tsx for modularity.
 */
import type { LandingSection } from '@/lib/landing/landing-types'

/** Section type to readable label for nav auto-links */
export const sectionLabels: Record<string, string> = {
  features: 'Features', pricing: 'Pricing', testimonials: 'Testimonials',
  faq: 'FAQ', stats: 'Stats', 'how-it-works': 'How It Works', team: 'Team', 'logo-wall': 'Partners',
}

/** Build inline style matching Astro section-renderer's buildSectionStyle() */
export function sectionInlineStyle(section: LandingSection): React.CSSProperties {
  const s = (section.style || {}) as Record<string, unknown>
  const style: Record<string, string> = {}
  if (s.background) style['background'] = String(s.background)
  if (s.backgroundImage && s.padding) style['padding'] = String(s.padding)
  if (s.textColor) { style['--lp-text'] = String(s.textColor); style['color'] = String(s.textColor) }
  if (s.textMutedColor) style['--lp-text-muted'] = String(s.textMutedColor)
  if (s.accentColor) style['--lp-accent'] = String(s.accentColor)
  if (s.backgroundImage) { style['position'] = 'relative'; style['overflow'] = 'hidden' }
  return style as unknown as React.CSSProperties
}

/** Check if section has dark background (white text) */
export function isDarkSection(section: LandingSection): boolean {
  const tc = ((section.style || {}) as Record<string, unknown>).textColor
  if (!tc) return false
  const c = String(tc).trim().toLowerCase()
  return c === '#fff' || c === '#ffffff' || c === 'white'
}

/** Minimal Markdown to HTML for preview (mirrors landing-rich-text.astro parser) */
export function parseMd(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/^(?!<)(.+)$/gm, '<p>$1</p>')
    .replace(/<p>(<h[1-6]>)/g, '$1').replace(/(<\/h[1-6]>)<\/p>/g, '$1')
    .replace(/<p>(<li>)/g, '$1').replace(/(<\/li>)<\/p>/g, '$1')
    .replace(/<p>(<hr\/>)<\/p>/g, '$1')
}
