/**
 * Hero section preview renderer with centered, split, video-bg, and minimal variants.
 */
import type { HeroData } from '@/lib/landing/landing-types'

export function PreviewHero({ data }: { data: HeroData }) {
  const v = data.variant || 'centered'
  const hasBg = !!data.backgroundImage
  // Normalize cta: single object or array — show all buttons
  const ctaList = Array.isArray(data.cta) ? data.cta : data.cta ? [data.cta] : []

  function ctaBtnClass(i: number, variant?: string): string {
    if (variant === 'outline') return 'landing-btn-outline'
    if (variant === 'secondary') return 'landing-btn-secondary'
    return i === 0 ? 'landing-btn-primary' : 'landing-btn-outline'
  }

  const ctaButtons = ctaList.length > 0 && (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem', justifyContent: v === 'split' ? 'flex-start' : 'center' }}>
      {ctaList.map((item, i) => (
        <span key={i} className={ctaBtnClass(i, item.variant)}>{item.text}</span>
      ))}
    </div>
  )

  if (v === 'split') {
    const embedUrl = data.embed || ''
    const isVideo = /\.(mp4|webm)(\?|$)/i.test(embedUrl)
    return (
      <div className="landing-section" style={{ display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', fontWeight: 700, lineHeight: 1.12, letterSpacing: '-0.01em' }}>{data.headline}</h1>
          {data.subheadline && <p style={{ color: 'var(--lp-text-muted)', marginTop: '1rem', lineHeight: 1.75, fontWeight: 300 }}>{data.subheadline}</p>}
          {ctaButtons}
        </div>
        <div style={{ flex: 1, minWidth: '280px', borderRadius: 'var(--lp-radius)', overflow: 'hidden', aspectRatio: '16/9' }}>
          {isVideo
            ? <video src={embedUrl} autoPlay muted loop playsInline poster={data.backgroundImage || undefined} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : data.backgroundImage
              ? <img src={data.backgroundImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: 'color-mix(in srgb, var(--lp-primary) 10%, var(--lp-surface))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--lp-text-muted)', fontSize: '0.875rem', borderRadius: 'var(--lp-radius)' }}>Media placeholder</div>}
        </div>
      </div>
    )
  }
  if (v === 'video-bg') return (
    <div className="landing-section" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden', padding: '6rem 2rem', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: data.backgroundImage ? `url(${data.backgroundImage}) center/cover` : '#1e293b' }}>
      <div className="lp-hero-overlay" />
      <div style={{ position: 'relative', zIndex: 2, maxWidth: '720px' }}>
        <h1 style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)', fontWeight: 700, color: '#fff', lineHeight: 1.08, letterSpacing: '-0.01em' }}>{data.headline}</h1>
        {data.subheadline && <p style={{ color: 'rgba(255,255,255,0.82)', marginTop: '1.25rem', lineHeight: 1.7, fontWeight: 300 }}>{data.subheadline}</p>}
        {ctaButtons}
      </div>
    </div>
  )
  if (v === 'minimal') return (
    <div className="landing-section" style={{ textAlign: 'center', background: 'transparent', padding: '4rem 2rem' }}>
      <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', fontWeight: 700, lineHeight: 1.15 }}>{data.headline}</h1>
      {data.subheadline && <p style={{ color: 'var(--lp-text-muted)', marginTop: '1rem', lineHeight: 1.7, fontWeight: 300 }}>{data.subheadline}</p>}
      {ctaButtons}
    </div>
  )
  // centered (default) — with optional bg image + gradient overlay
  return (
    <div
      className="landing-section"
      style={hasBg
        ? { textAlign: 'center', position: 'relative', overflow: 'hidden', padding: '6rem 2rem', minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }
        : { textAlign: 'center', padding: '5rem 2rem' }}
    >
      {hasBg && <div className="lp-hero-bg" style={{ backgroundImage: `url(${data.backgroundImage})` }} />}
      {hasBg && <div className="lp-hero-overlay" />}
      <div style={hasBg ? { position: 'relative', zIndex: 2, maxWidth: '720px' } : { maxWidth: '720px', margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.5rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.01em', ...(hasBg ? { color: '#fff' } : {}) }}>{data.headline}</h1>
        {data.subheadline && <p style={{ color: hasBg ? 'rgba(255,255,255,0.85)' : 'var(--lp-text-muted)', marginTop: '1.25rem', lineHeight: 1.7, fontWeight: 300 }}>{data.subheadline}</p>}
        {ctaButtons}
      </div>
    </div>
  )
}
