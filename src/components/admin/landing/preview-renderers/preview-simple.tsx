/**
 * Simple section preview renderers: cta, banner, divider, rich-text, logo-wall,
 * social-proof, comparison, ai-search, and product-showcase.
 * These sections have minimal or no variant logic.
 */
import type { CtaData, BannerData, DividerData, RichTextData, LogoWallData, SocialProofData, ComparisonData, AiSearchData } from '@/lib/landing/landing-types'
import { parseMd } from './preview-types'

export function PreviewCta({ data }: { data: CtaData }) {
  const v = data.variant || 'default'
  const ctaList = Array.isArray(data.cta) ? data.cta : data.cta ? [data.cta] : []
  const ctaFirst = ctaList[0]

  function ctaBtnClass(i: number, variant?: string): string {
    if (variant === 'secondary') return 'landing-btn-secondary'
    if (variant === 'outline') return 'landing-btn-outline'
    return i === 0 ? 'landing-btn-primary' : 'landing-btn-secondary'
  }

  const ctaButtons = ctaList.length > 0 && (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
      {ctaList.map((item, i) => (
        <span key={i} className={ctaBtnClass(i, item.variant)}>{item.text}</span>
      ))}
    </div>
  )

  if (v === 'split') return (
    <div className="landing-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <h2>{data.headline}</h2>
        {data.subheadline && <p style={{ color: 'var(--lp-text-muted)', marginTop: '0.5rem' }}>{data.subheadline}</p>}
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flexShrink: 0 }}>
        {ctaList.map((item, i) => (
          <span key={i} className={ctaBtnClass(i, item.variant)}>{item.text}</span>
        ))}
      </div>
    </div>
  )
  if (v === 'banner') return (
    <div className="landing-section lp-cta-gradient" style={{ textAlign: 'center', padding: '5rem 2rem', borderRadius: 'var(--lp-radius)' }}>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{data.headline}</h2>
        {data.subheadline && <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '1rem', lineHeight: 1.7 }}>{data.subheadline}</p>}
        {ctaList.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginTop: '2rem' }}>
            {ctaList.map((item, i) => (
              i === 0
                ? <span key={i} style={{ display: 'inline-block', background: '#fff', color: 'var(--lp-primary)', padding: '0.85rem 2.2rem', borderRadius: 'var(--lp-radius)', fontWeight: 700, textDecoration: 'none' }}>{item.text}</span>
                : <span key={i} style={{ display: 'inline-block', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', padding: '0.85rem 2.2rem', borderRadius: 'var(--lp-radius)', fontWeight: 500 }}>{item.text}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
  if (v === 'minimal') return (
    <div className="landing-section" style={{ textAlign: 'center', background: 'transparent', padding: '2rem' }}>
      <p style={{ fontSize: '1.125rem' }}>
        <span style={{ color: 'var(--lp-text-muted)' }}>{data.headline}</span>{' '}
        {ctaFirst && <span style={{ color: 'var(--lp-primary)', fontWeight: 600, textDecoration: 'underline' }}>{ctaFirst.text}</span>}
      </p>
    </div>
  )
  if (v === 'with-image') return (
    <div className="landing-section" style={{ textAlign: 'center', position: 'relative', backgroundImage: data.backgroundImage ? `url(${data.backgroundImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', overflow: 'hidden', borderRadius: 'var(--lp-radius)' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 style={{ color: '#fff' }}>{data.headline}</h2>
        {data.subheadline && <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '0.75rem' }}>{data.subheadline}</p>}
        {ctaButtons}
      </div>
    </div>
  )
  // default
  return (
    <div className="landing-section" style={{ textAlign: 'center' }}>
      <h2>{data.headline}</h2>
      {data.subheadline && <p style={{ color: 'var(--lp-text-muted)', marginTop: '0.75rem', maxWidth: '480px', margin: '0.75rem auto 0' }}>{data.subheadline}</p>}
      {ctaButtons}
    </div>
  )
}

export function PreviewBanner({ data }: { data: BannerData }) {
  const v = data.variant || 'info'
  const styles: Record<string, { bg: string; text: string; btn?: string }> = {
    info: { bg: '#eff6ff', text: '#1d4ed8', btn: '#2563eb' },
    warning: { bg: '#fffbeb', text: '#92400e', btn: '#d97706' },
    success: { bg: '#f0fdf4', text: '#166534', btn: '#16a34a' },
    promo: { bg: 'linear-gradient(135deg, var(--lp-primary), var(--lp-secondary, var(--lp-primary)))', text: '#fff', btn: 'rgba(255,255,255,0.2)' },
    announcement: { bg: '#1e293b', text: '#f1f5f9', btn: 'var(--lp-primary)' },
    countdown: { bg: '#fef2f2', text: '#991b1b', btn: '#dc2626' },
    minimal: { bg: 'var(--lp-surface, #f8fafc)', text: 'var(--lp-text-muted)' },
  }
  const c = styles[v] || styles.info
  return (
    <div style={{ background: c.bg, color: c.text, padding: v === 'promo' ? '1rem 1.5rem' : '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
      {data.icon && <span style={{ fontSize: '1.1rem' }}>{data.icon}</span>}
      <span style={{ fontWeight: v === 'promo' || v === 'countdown' ? 700 : 600 }}>{data.text}</span>
      {data.subtext && <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{data.subtext}</span>}
      {data.cta && <span style={{ fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px', background: c.btn, color: v === 'promo' ? '#fff' : '#fff', fontSize: '0.7rem' }}>{data.cta.text}</span>}
    </div>
  )
}

export function PreviewDivider({ data }: { data: DividerData }) {
  const h = data.height || 40
  if (data.style === 'space') return <div style={{ height: h }} />
  if (data.style === 'dots') return <div style={{ height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '0.3em', color: '#cbd5e1', fontSize: '1rem' }}>{'\u00B7 \u00B7 \u00B7 \u00B7 \u00B7'}</div>
  return <div style={{ height: h, display: 'flex', alignItems: 'center', padding: '0 2rem' }}><hr style={{ width: '100%', border: 'none', borderTop: '1px solid var(--lp-text-muted, #94a3b8)' }} /></div>
}

export function PreviewRichText({ data }: { data: RichTextData }) {
  if (!data) return <div style={{ padding: '1rem', color: 'var(--lp-text-muted)', fontSize: '0.8rem' }}>[Rich Text — no data]</div>
  const content = String(data.content || '')
  if (!content) return <div style={{ padding: '1rem', color: 'var(--lp-text-muted)', fontSize: '0.8rem' }}>[Rich Text — empty]</div>
  const isHtml = content.trimStart().startsWith('<')
  const html = isHtml ? content : parseMd(content)
  const safe = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  return (
    <div style={{ padding: '1rem', fontSize: '0.8rem', lineHeight: 1.6, color: 'var(--lp-text)' }}
      dangerouslySetInnerHTML={{ __html: safe }} />
  )
}

export function PreviewLogoWall({ data }: { data: LogoWallData }) {
  return (
    <div className="landing-section">
      {data.heading && <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>{data.heading}</h2>}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem', alignItems: 'center' }}>
        {data.logos?.map((logo, i) => (
          <div key={i} style={{ padding: '0.5rem 1.25rem', background: 'var(--lp-surface)', borderRadius: 'var(--lp-radius)', border: '1px solid color-mix(in srgb, var(--lp-text) 8%, transparent)', fontSize: '0.875rem', color: 'var(--lp-text-muted)' }}>
            {logo.image ? <img src={logo.image} alt={logo.name} style={{ height: '28px', objectFit: 'contain' }} /> : logo.name}
          </div>
        ))}
      </div>
    </div>
  )
}

export function PreviewSocialProof({ data }: { data: SocialProofData }) {
  const v = data.variant || 'inline'
  return (
    <div style={{
      textAlign: 'center', padding: v === 'banner' ? '0.75rem 1rem' : '0.5rem 1rem',
      color: 'var(--lp-text-muted)', fontSize: '0.8rem',
      ...(v === 'banner' ? { background: 'rgba(59,130,246,0.06)', borderRadius: 'var(--lp-radius, 10px)' } : {})
    }}>
      {data.icon && <span style={{ marginRight: '0.35rem' }}>{data.icon}</span>}
      {data.text || 'Social proof text'}
    </div>
  )
}

export function PreviewComparison({ data }: { data: ComparisonData }) {
  const cols = data.columns || []
  const rows = data.rows || []
  return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid var(--lp-text-muted)', color: 'var(--lp-text)' }}></th>
              {cols.map((c, i) => <th key={i} style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid var(--lp-text-muted)', color: 'var(--lp-text)' }}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={r.highlight ? { background: 'rgba(59,130,246,0.06)' } : {}}>
                <td style={{ padding: '0.4rem 0.5rem', color: 'var(--lp-text)', fontWeight: 500 }}>{r.label}</td>
                {r.values.map((val, j) => <td key={j} style={{ padding: '0.4rem 0.5rem', textAlign: 'center', color: 'var(--lp-text-muted)' }}>{val}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function PreviewAiSearch({ data }: { data: AiSearchData }) {
  return (
    <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ background: 'var(--lp-surface, #f8fafc)', borderRadius: 'var(--lp-radius, 12px)', padding: '1rem', border: '1px solid var(--lp-text-muted)' }}>
          <p style={{ color: 'var(--lp-text-muted)', fontSize: '0.8rem' }}>{data.placeholder || 'Search...'}</p>
        </div>
        {data.hints && data.hints.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '0.75rem' }}>
            {data.hints.map((h, i) => (
              <span key={i} style={{ padding: '0.25rem 0.75rem', background: 'var(--lp-surface, #f8fafc)', borderRadius: '999px', fontSize: '0.7rem', color: 'var(--lp-text-muted)' }}>{h.icon} {h.label}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
