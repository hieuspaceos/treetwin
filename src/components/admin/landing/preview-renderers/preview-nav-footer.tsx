/**
 * Nav and footer section preview renderers with variant support.
 * Nav variants: default, centered, transparent.
 * Footer variants: simple, columns, minimal.
 */
import type { LandingSection, NavData, FooterData } from '@/lib/landing/landing-types'
import { sectionLabels } from './preview-types'

export function PreviewNav({ data, sections, pageTitle }: { data: NavData; sections: LandingSection[]; pageTitle?: string }) {
  const skipTypes = new Set(['hero', 'nav', 'footer', 'cta'])
  const links = data.links?.length ? data.links : sections
    .filter(s => s.enabled !== false && !skipTypes.has(s.type))
    .sort((a, b) => a.order - b.order)
    .map(s => ({ label: sectionLabels[s.type] || s.type, href: `#preview-${s.type}` }))
  const brand = data.brandName || pageTitle || 'Home'
  const v = data.variant || 'default'
  const socialLinks = data.socialLinks || []

  if (v === 'centered') return (
    <div className="landing-nav" style={{ position: 'sticky', top: 0, zIndex: 10, padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
        {links.slice(0, Math.ceil(links.length / 2)).map((l, i) => <span key={i} style={{ fontSize: '0.875rem', color: 'var(--lp-text-muted)' }}>{l.label}</span>)}
      </div>
      <strong style={{ fontSize: '1rem', color: 'var(--lp-text)', padding: '0 1rem' }}>{brand}</strong>
      <div style={{ display: 'flex', gap: '1rem', flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
        {links.slice(Math.ceil(links.length / 2)).map((l, i) => <span key={i} style={{ fontSize: '0.875rem', color: 'var(--lp-text-muted)' }}>{l.label}</span>)}
        {socialLinks.map((sl, i) => <span key={i} title={sl.label || sl.icon} style={{ fontSize: '1rem' }}>{sl.icon}</span>)}
      </div>
    </div>
  )
  if (v === 'transparent') return (
    <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'transparent', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <strong style={{ fontSize: '1rem', color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{brand}</strong>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {links.map((l, i) => <span key={i} style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)' }}>{l.label}</span>)}
        {socialLinks.map((sl, i) => <span key={i} title={sl.label || sl.icon} style={{ fontSize: '1rem', opacity: 0.85 }}>{sl.icon}</span>)}
      </div>
    </div>
  )
  // default
  return (
    <div className="landing-nav" style={{ position: 'sticky', top: 0, zIndex: 10, padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <strong style={{ fontSize: '1rem', color: 'var(--lp-text)' }}>{brand}</strong>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {links.map((l, i) => <span key={i} style={{ fontSize: '0.875rem', color: 'var(--lp-text-muted)' }}>{l.label}</span>)}
        {socialLinks.map((sl, i) => <span key={i} title={sl.label || sl.icon} style={{ fontSize: '1rem' }}>{sl.icon}</span>)}
      </div>
    </div>
  )
}

export function PreviewFooter({ data, pageTitle }: { data: FooterData; pageTitle?: string }) {
  const copyright = data.text || `\u00A9 ${new Date().getFullYear()} ${pageTitle || ''}`
  const v = data.variant || 'simple'
  const socialLinks = data.socialLinks || []

  if (v === 'columns') return (
    <div className="landing-footer" style={{ padding: '2rem' }}>
      {data.columns && data.columns.length > 0 && (
        <div className="lp-footer-grid" style={{ '--lp-footer-cols': String(data.columns.length) } as React.CSSProperties}>
          {data.columns.map((col, i) => (
            <div key={i}>
              <p style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{col.heading}</p>
              {col.links?.map((l, j) => <p key={j} style={{ color: 'var(--lp-text-muted)', marginBottom: '0.35rem', fontSize: '0.875rem' }}>{l.label}</p>)}
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid color-mix(in srgb, var(--lp-text) 8%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <p style={{ color: 'var(--lp-text-muted)', fontSize: '0.875rem' }}>{copyright}</p>
        {socialLinks.map((sl, i) => <span key={i} title={sl.label || sl.icon} style={{ fontSize: '1.1rem' }}>{sl.icon}</span>)}
      </div>
    </div>
  )
  if (v === 'minimal') return (
    <div className="landing-footer" style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
      {socialLinks.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          {socialLinks.map((sl, i) => <span key={i} title={sl.label || sl.icon} style={{ fontSize: '1.1rem' }}>{sl.icon}</span>)}
        </div>
      )}
      {copyright}
    </div>
  )
  // simple (default)
  return (
    <div className="landing-footer" style={{ textAlign: 'center', padding: '1.5rem', fontSize: '0.875rem' }}>
      {data.links && data.links.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '0.75rem' }}>
          {data.links.map((l, i) => <span key={i} style={{ color: 'var(--lp-text-muted)' }}>{l.label}</span>)}
        </div>
      )}
      {socialLinks.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          {socialLinks.map((sl, i) => <span key={i} title={sl.label || sl.icon} style={{ fontSize: '1.2rem' }}>{sl.icon}</span>)}
        </div>
      )}
      {copyright}
    </div>
  )
}
