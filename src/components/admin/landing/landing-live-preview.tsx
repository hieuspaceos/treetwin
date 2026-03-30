/**
 * Live preview renderer for landing page editor.
 * Renders sections from React state directly — no server round-trip needed.
 * Mirrors the Astro section components but as simple React divs.
 * Uses actual CSS classes from landing.css for visual accuracy.
 */
import { useEffect } from 'react'
import '@/styles/landing.css'
import type { LandingSection, LandingDesign, HeroData, FeaturesData, PricingData, TestimonialsData, FaqData, CtaData, StatsData, HowItWorksData, TeamData, LogoWallData, NavData, FooterData, VideoData, ImageData, ImageTextData, GalleryData, MapData, RichTextData, DividerData, CountdownData, ContactFormData, BannerData, LayoutData, SocialProofData, ComparisonData, AiSearchData } from '@/lib/landing/landing-types'
import { designToCssVars, designFontsUrl, resolveDesign } from '@/lib/landing/landing-design-presets'

interface Props {
  sections: LandingSection[]
  pageTitle?: string
  design?: LandingDesign
  /** Index of section being edited — preview scrolls to and highlights it */
  selectedSectionIdx?: number | null
  /** Called when user clicks a section in preview — passes original section index */
  onSectionClick?: (sectionIdx: number) => void
}

/** Section type to readable label for nav auto-links */
const sectionLabels: Record<string, string> = {
  features: 'Features', pricing: 'Pricing', testimonials: 'Testimonials',
  faq: 'FAQ', stats: 'Stats', 'how-it-works': 'How It Works', team: 'Team', 'logo-wall': 'Partners',
}

function PreviewNav({ data, sections, pageTitle }: { data: NavData; sections: LandingSection[]; pageTitle?: string }) {
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

function PreviewHero({ data }: { data: HeroData }) {
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

function PreviewFeatures({ data }: { data: FeaturesData }) {
  const v = data.variant || 'grid'
  const cols = data.columns || 3
  const gridClass = `landing-grid-${cols}`

  const SectionHeading = () => (
    <>
      {data.heading && <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>{data.heading}</h2>}
      {data.subheading && <p style={{ textAlign: 'center', color: 'var(--lp-text-muted)', marginBottom: '2rem', maxWidth: '640px', margin: '0 auto 2rem' }}>{data.subheading}</p>}
    </>
  )

  if (v === 'list') return (
    <div className="landing-section">
      <SectionHeading />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '48rem', margin: '0 auto' }}>
        {data.items?.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', padding: '1.25rem', background: 'color-mix(in srgb, var(--lp-primary) 5%, var(--lp-surface))', borderRadius: 'var(--lp-radius)' }}>
            {item.icon && <div className="lp-icon-bg">{item.icon}</div>}
            {!item.icon && <div className="lp-icon-bg">✓</div>}
            <div>
              <h3 style={{ marginBottom: '0.25rem' }}>{item.title}</h3>
              <p style={{ color: 'var(--lp-text-muted)', fontSize: '0.875rem' }}>{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
  if (v === 'alternating') return (
    <div className="landing-section">
      <SectionHeading />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {data.items?.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '2rem', flexDirection: i % 2 === 1 ? 'row-reverse' : 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', padding: '2rem', background: 'color-mix(in srgb, var(--lp-primary) 8%, var(--lp-surface))', borderRadius: 'var(--lp-radius)' }}>
              {item.icon || '✦'}
            </div>
            <div style={{ flex: 2, minWidth: '220px' }}>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: 700 }}>{item.title}</h3>
              <p style={{ color: 'var(--lp-text-muted)', lineHeight: 1.7 }}>{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
  // grid (default)
  return (
    <div className="landing-section">
      <SectionHeading />
      <div className={gridClass}>
        {data.items?.map((item, i) => (
          <div key={i} className="lp-card-hover" style={{ background: 'color-mix(in srgb, var(--lp-primary) 5%, var(--lp-surface))', borderRadius: 'var(--lp-radius)', border: '1px solid color-mix(in srgb, var(--lp-primary) 8%, transparent)', padding: '1.5rem' }}>
            {item.icon && <div className="lp-icon-bg" style={{ marginBottom: '0.75rem' }}>{item.icon}</div>}
            <h3 style={{ marginBottom: '0.5rem' }}>{item.title}</h3>
            <p style={{ color: 'var(--lp-text-muted)', fontSize: '0.875rem', lineHeight: 1.7 }}>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewPricing({ data }: { data: PricingData }) {
  const v = data.variant || 'cards'
  const plans = data.plans || []
  const gridClass = plans.length <= 2 ? 'landing-grid-2' : 'landing-grid-3'
  const gridConstraint = plans.length <= 2 ? { maxWidth: '600px', margin: '0 auto' } : {}

  const SectionHeading = () => (
    <>
      {data.heading && <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>{data.heading}</h2>}
      {(data as PricingData & { subheading?: string }).subheading && <p style={{ textAlign: 'center', color: 'var(--lp-text-muted)', marginBottom: '2rem', maxWidth: '640px', margin: '0 auto 2rem' }}>{(data as PricingData & { subheading?: string }).subheading}</p>}
    </>
  )

  if (v === 'simple') return (
    <div className="landing-section">
      <SectionHeading />
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {plans.map((plan, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', padding: '1rem 1.5rem', background: 'var(--lp-surface)', borderRadius: 'var(--lp-radius)', flex: 1, minWidth: '200px', maxWidth: '360px', border: plan.highlighted ? '2px solid var(--lp-primary)' : '1px solid color-mix(in srgb, var(--lp-text) 10%, transparent)' }}>
            <div>
              <p style={{ fontWeight: 600 }}>{plan.name}</p>
              <p style={{ color: 'var(--lp-text-muted)', fontSize: '0.875rem' }}>{plan.price}{plan.period ? ` / ${plan.period}` : ''}</p>
            </div>
            <span className={plan.highlighted ? 'landing-btn-primary' : 'landing-btn-secondary'} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>{plan.cta?.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
  if (v === 'highlight-center') return (
    <div className="landing-section">
      <SectionHeading />
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
        {plans.map((plan, i) => {
          const isCenter = i === Math.floor((plans.length) / 2) || plan.highlighted
          return (
            <div key={i} className={isCenter ? 'landing-pricing-highlight' : ''} style={{ background: 'var(--lp-surface)', borderRadius: 'var(--lp-radius)', padding: isCenter ? '2rem' : '1.5rem', flex: 1, minWidth: '180px', maxWidth: isCenter ? '300px' : '240px', display: 'flex', flexDirection: 'column', border: isCenter ? undefined : '1px solid color-mix(in srgb, var(--lp-text) 10%, transparent)', transform: isCenter ? 'scale(1.05)' : 'none', zIndex: isCenter ? 1 : 0, position: 'relative' }}>
              {isCenter && <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--lp-primary)', marginBottom: '0.5rem' }}>{plan.badge || 'Most Popular'}</span>}
              <h3 style={{ fontWeight: 600, fontSize: isCenter ? '1.25rem' : '1rem' }}>{plan.name}</h3>
              <p style={{ fontSize: isCenter ? '2.5rem' : '1.75rem', fontWeight: 700, lineHeight: 1, margin: '0.5rem 0' }}>{plan.price}<span style={{ fontSize: '0.875rem', color: 'var(--lp-text-muted)', fontWeight: 400 }}>{plan.period && ` / ${plan.period}`}</span></p>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', fontSize: '0.875rem' }}>
                {plan.features?.map((f, j) => <li key={j} style={{ padding: '0.2rem 0', color: 'var(--lp-text-muted)' }}><span style={{ color: 'var(--lp-primary)' }}>✓</span> {f}</li>)}
              </ul>
              <span className={isCenter ? 'landing-btn-primary' : 'landing-btn-secondary'} style={{ marginTop: '1.5rem', textAlign: 'center', display: 'block' }}>{plan.cta?.text}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
  // cards (default)
  return (
    <div className="landing-section">
      <SectionHeading />
      <div className={gridClass} style={gridConstraint}>
        {plans.map((plan, i) => (
          <div key={i} className={plan.highlighted ? 'landing-pricing-highlight' : ''} style={{ background: 'var(--lp-surface)', borderRadius: '12px', padding: '1.5rem', border: plan.highlighted ? undefined : '1px solid color-mix(in srgb, var(--lp-text) 10%, transparent)', display: 'flex', flexDirection: 'column' }}>
            {plan.badge && <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--lp-primary)', padding: '0.15rem 0.5rem', background: 'color-mix(in srgb, var(--lp-primary) 12%, transparent)', borderRadius: '999px', marginBottom: '0.5rem', display: 'inline-block', alignSelf: 'flex-start' }}>{plan.badge}</span>}
            <h3 style={{ fontWeight: 600 }}>{plan.name}</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{plan.price}<span style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted)' }}>{plan.period && ` / ${plan.period}`}</span></p>
            <ul style={{ fontSize: '0.875rem', color: 'var(--lp-text-muted)', listStyle: 'none', padding: 0, flex: 1 }}>
              {plan.features?.map((f, j) => <li key={j} style={{ padding: '0.2rem 0' }}><span style={{ color: 'var(--lp-primary)' }}>✓</span> {f}</li>)}
            </ul>
            {plan.cta?.text && <span className={plan.highlighted ? 'landing-btn-primary' : 'landing-btn-secondary'} style={{ marginTop: '1.5rem', textAlign: 'center', display: 'block' }}>{plan.cta.text}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewTestimonials({ data }: { data: TestimonialsData }) {
  const v = data.variant || 'cards'
  const items = data.items || []

  if (v === 'single') return (
    <div className="landing-section" style={{ textAlign: 'center' }}>
      {data.heading && <h2 className="lp-section-heading" style={{ marginBottom: '2rem' }}>{data.heading}</h2>}
      {items[0] && (
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2.5rem', background: 'color-mix(in srgb, var(--lp-primary) 4%, var(--lp-surface))', borderRadius: 'var(--lp-radius)', position: 'relative' }}>
          <div className="lp-quote-mark" style={{ position: 'absolute', top: '0.5rem', left: '1.5rem' }}>❝</div>
          <div className="lp-stars" style={{ marginBottom: '0.75rem' }}>★★★★★</div>
          <p style={{ fontStyle: 'italic', fontSize: '1.125rem', lineHeight: 1.7, color: 'var(--lp-text)', marginBottom: '1.5rem' }}>"{items[0].quote}"</p>
          <p style={{ fontWeight: 600 }}>{items[0].name}</p>
          {(items[0].role || items[0].company) && <p style={{ fontSize: '0.875rem', color: 'var(--lp-text-muted)' }}>{[items[0].role, items[0].company].filter(Boolean).join(' · ')}</p>}
        </div>
      )}
    </div>
  )
  if (v === 'minimal') return (
    <div className="landing-section">
      {data.heading && <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>{data.heading}</h2>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '640px', margin: '0 auto' }}>
        {items.map((t, i) => (
          <div key={i} style={{ padding: '1.25rem 1.5rem', borderLeft: '3px solid var(--lp-primary)' }}>
            <p style={{ fontStyle: 'italic', lineHeight: 1.7, marginBottom: '0.5rem' }}>"{t.quote}"</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>— {t.name}{t.role ? `, ${t.role}` : ''}</p>
          </div>
        ))}
      </div>
    </div>
  )
  if (v === 'carousel') return (
    <div className="landing-section">
      {data.heading && <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>{data.heading}</h2>}
      <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {items.map((t, i) => (
          <div key={i} className="lp-card-hover glass-card" style={{ flexShrink: 0, width: '320px', maxWidth: '80vw', overflow: 'hidden', borderRadius: 'var(--lp-radius)' }}>
            {t.image && <img src={t.image} alt={t.name} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />}
            <div style={{ padding: '1rem' }}>
              <p style={{ fontSize: '0.875rem', fontStyle: 'italic', color: 'var(--lp-text-muted)', marginBottom: '0.5rem' }}>"{t.quote}"</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{t.name}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
        {Array.from({ length: Math.min(5, items.length) }, (_, i) => (
          <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? 'var(--lp-primary)' : 'color-mix(in srgb, var(--lp-text) 20%, transparent)', display: 'inline-block' }} />
        ))}
      </div>
    </div>
  )
  // cards (default)
  return (
    <div className="landing-section lp-fade-up">
      {data.heading && <h2 className="lp-section-heading" style={{ textAlign: 'center', marginBottom: '2rem' }}>{data.heading}</h2>}
      <div className={items.length <= 2 ? 'landing-grid-2' : 'landing-grid-3'}>
        {items.map((t, i) => (
          <div key={i} className="lp-card-hover" style={{ padding: '1.75rem', background: 'color-mix(in srgb, var(--lp-primary) 4%, var(--lp-surface))', borderRadius: 'var(--lp-radius)', border: '1px solid color-mix(in srgb, var(--lp-primary) 8%, transparent)' }}>
            <div className="lp-stars" style={{ marginBottom: '0.75rem' }}>★★★★★</div>
            {t.image && <img src={t.image} alt={t.name} style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem', objectFit: 'cover', maxHeight: '200px' }} />}
            <p style={{ fontStyle: 'italic', lineHeight: 1.7, color: 'var(--lp-text-muted)', marginBottom: '1.25rem' }}>"{t.quote}"</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid color-mix(in srgb, var(--lp-text) 8%, transparent)', paddingTop: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'color-mix(in srgb, var(--lp-primary) 15%, var(--lp-surface))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--lp-primary)', flexShrink: 0 }}>
                {t.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.name}</p>
                {(t.role || t.company) && <p style={{ fontSize: '0.75rem', color: 'var(--lp-text-muted)' }}>{[t.role, t.company].filter(Boolean).join(' · ')}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewFaq({ data }: { data: FaqData }) {
  const v = data.variant || 'accordion'
  if (v === 'two-column') return (
    <div className="landing-section">
      {data.heading && <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>{data.heading}</h2>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '48rem', margin: '0 auto' }}>
        {data.items?.map((faq, i) => (
          <div key={i} style={{ display: 'flex', gap: '0', border: '1px solid color-mix(in srgb, var(--lp-text) 10%, transparent)', borderRadius: 'var(--lp-radius)', overflow: 'hidden' }}>
            <div style={{ flex: 1, padding: '0.75rem 1rem', background: 'var(--lp-surface)', borderRight: '1px solid color-mix(in srgb, var(--lp-text) 10%, transparent)' }}>
              <p style={{ fontWeight: 600 }}>{faq.question}</p>
            </div>
            <div style={{ flex: 2, padding: '0.75rem 1rem' }}>
              <p style={{ color: 'var(--lp-text-muted)', fontSize: '0.875rem' }}>{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
  if (v === 'simple') return (
    <div className="landing-section">
      {data.heading && <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>{data.heading}</h2>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '48rem', margin: '0 auto' }}>
        {data.items?.map((faq, i) => (
          <div key={i}>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{faq.question}</p>
            <p style={{ color: 'var(--lp-text-muted)', fontSize: '0.875rem' }}>{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  )
  // accordion (default)
  return (
    <div className="landing-section">
      {data.heading && <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>{data.heading}</h2>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '48rem', margin: '0 auto' }}>
        {data.items?.map((faq, i) => (
          <div key={i} style={{ background: 'var(--lp-surface)', borderRadius: 'var(--lp-radius)', padding: '1rem 1.25rem', border: '1px solid color-mix(in srgb, var(--lp-text) 8%, transparent)' }}>
            <p style={{ fontWeight: 600 }}>▸ {faq.question}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewHowItWorks({ data }: { data: HowItWorksData }) {
  const v = data.variant || 'numbered'
  const items = data.items || []
  const gridClass = items.length <= 2 ? 'landing-grid-2' : items.length >= 4 ? 'landing-grid-4' : 'landing-grid-3'

  if (v === 'timeline') return (
    <div className="landing-section" style={{ paddingLeft: '3rem', position: 'relative' }}>
      {data.heading && <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>{data.heading}</h2>}
      <div style={{ position: 'absolute', left: '2.5rem', top: '5rem', bottom: '2rem', width: '2px', background: 'var(--lp-primary)', opacity: 0.25 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {items.map((step, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '-1.5rem', top: '0.25rem', width: '0.875rem', height: '0.875rem', borderRadius: '50%', background: 'var(--lp-primary)' }} />
            <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{step.title}</h3>
            <p style={{ color: 'var(--lp-text-muted)', fontSize: '0.875rem' }}>{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
  if (v === 'cards') return (
    <div className="landing-section">
      {data.heading && <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>{data.heading}</h2>}
      <div className={gridClass}>
        {items.map((step, i) => (
          <div key={i} className="lp-card-hover" style={{ background: 'var(--lp-surface)', borderRadius: 'var(--lp-radius)', padding: '1.5rem', border: '1px solid color-mix(in srgb, var(--lp-text) 8%, transparent)' }}>
            <div className="lp-icon-bg" style={{ marginBottom: '1rem' }}>{step.icon || `${i + 1}`}</div>
            <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{step.title}</h3>
            {step.description && <p style={{ color: 'var(--lp-text-muted)', fontSize: '0.875rem' }}>{step.description}</p>}
          </div>
        ))}
      </div>
    </div>
  )
  // numbered (default)
  return (
    <div className="landing-section">
      {data.heading && <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>{data.heading}</h2>}
      <div className={gridClass}>
        {items.map((step, i) => (
          <div key={i} style={{ background: 'var(--lp-surface)', borderRadius: 'var(--lp-radius)', padding: '1.5rem', textAlign: 'center', border: '1px solid color-mix(in srgb, var(--lp-text) 8%, transparent)' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'color-mix(in srgb, var(--lp-primary) 12%, transparent)', color: 'var(--lp-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>{step.number ?? i + 1}</div>
            <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{step.title}</h3>
            {step.description && <p style={{ color: 'var(--lp-text-muted)', fontSize: '0.875rem' }}>{step.description}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewTeam({ data }: { data: TeamData }) {
  const v = data.variant || 'grid'
  const members = data.members || []
  const gridClass = members.length <= 2 ? 'landing-grid-2' : members.length >= 4 ? 'landing-grid-4' : 'landing-grid-3'

  if (v === 'list') return (
    <div className="landing-section">
      {data.heading && <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>{data.heading}</h2>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '40rem', margin: '0 auto' }}>
        {members.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--lp-surface)', borderRadius: 'var(--lp-radius)', padding: '1rem 1.25rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'color-mix(in srgb, var(--lp-primary) 15%, var(--lp-surface))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--lp-primary)', flexShrink: 0 }}>{m.name?.charAt(0)}</div>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{m.name}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--lp-text-muted)' }}>{m.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
  if (v === 'compact') return (
    <div className="landing-section">
      {data.heading && <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>{data.heading}</h2>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
        {members.map((m, i) => (
          <div key={i} style={{ background: 'var(--lp-surface)', borderRadius: 'var(--lp-radius)', padding: '0.5rem 1rem', textAlign: 'center', border: '1px solid color-mix(in srgb, var(--lp-text) 8%, transparent)' }}>
            <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{m.name}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--lp-text-muted)' }}>{m.role}</p>
          </div>
        ))}
      </div>
    </div>
  )
  // grid (default)
  return (
    <div className="landing-section">
      {data.heading && <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>{data.heading}</h2>}
      <div className={gridClass}>
        {members.map((m, i) => (
          <div key={i} className="lp-card-hover" style={{ background: 'var(--lp-surface)', borderRadius: 'var(--lp-radius)', padding: '1.5rem', textAlign: 'center', border: '1px solid color-mix(in srgb, var(--lp-text) 8%, transparent)' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'color-mix(in srgb, var(--lp-primary) 12%, var(--lp-surface))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color: 'var(--lp-primary)', margin: '0 auto 0.75rem' }}>{m.name?.charAt(0)}</div>
            <p style={{ fontWeight: 600 }}>{m.name}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--lp-text-muted)' }}>{m.role}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewCta({ data }: { data: CtaData }) {
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

function PreviewStats({ data }: { data: StatsData }) {
  const v = data.variant || 'row'
  const items = data.items || []
  const gridClass = items.length <= 3 ? 'landing-grid-3' : 'landing-grid-4'
  const gridConstraint = items.length <= 2 ? { maxWidth: '540px', margin: '0 auto' } : {}

  if (v === 'cards') return (
    <div className="landing-section lp-fade-up">
      {data.heading && <h2 className="lp-section-heading" style={{ textAlign: 'center', marginBottom: '2rem' }}>{data.heading}</h2>}
      <div className={gridClass} style={gridConstraint}>
        {items.map((s, i) => (
          <div key={i} className="lp-card-hover" style={{ padding: '2rem 1.5rem', textAlign: 'center', background: 'var(--lp-surface)', borderRadius: 'var(--lp-radius)', border: '1px solid color-mix(in srgb, var(--lp-primary) 12%, transparent)', borderTop: '3px solid var(--lp-primary)' }}>
            <p className="landing-stat-value">{s.prefix}{s.value}{s.suffix}</p>
            <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--lp-text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
  if (v === 'large') return (
    <div className="landing-section lp-fade-up" style={{ textAlign: 'center' }}>
      {data.heading && <h2 className="lp-section-heading" style={{ marginBottom: '2rem' }}>{data.heading}</h2>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', maxWidth: '480px', margin: '0 auto' }}>
        {items.map((s, i) => (
          <div key={i}>
            <p style={{ fontSize: '4.5rem', fontWeight: 700, color: 'var(--lp-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>{s.prefix}{s.value}{s.suffix}</p>
            <p style={{ marginTop: '0.5rem', color: 'var(--lp-text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
  // row (default)
  return (
    <div className="landing-section lp-fade-up">
      {data.heading && <h2 className="lp-section-heading" style={{ textAlign: 'center', marginBottom: '2rem' }}>{data.heading}</h2>}
      <div className={gridClass} style={gridConstraint}>
        {items.map((s, i) => (
          <div key={i} style={{ padding: '1.5rem', textAlign: 'center', borderRadius: 'var(--lp-radius)', background: 'color-mix(in srgb, var(--lp-primary) 4%, var(--lp-surface))' }}>
            <p className="landing-stat-value">{s.prefix}{s.value}{s.suffix}</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--lp-text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewFooter({ data, pageTitle }: { data: FooterData; pageTitle?: string }) {
  const copyright = data.text || `© ${new Date().getFullYear()} ${pageTitle || ''}`
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

function PreviewVideo({ data }: { data: VideoData }) {
  return (
    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem' }}>▶</div>
      <p style={{ fontSize: '0.8rem', color: '#475569', wordBreak: 'break-all' }}>{data.url}</p>
      {data.caption && <p style={{ fontSize: '0.75rem', color: 'var(--lp-text-muted)' }}>{data.caption}</p>}
    </div>
  )
}

function PreviewImage({ data }: { data: ImageData }) {
  return (
    <div style={{ padding: '0.5rem', textAlign: 'center' }}>
      <div style={{ background: 'var(--lp-text-muted, #94a3b8)', borderRadius: '8px', padding: '2rem', fontSize: '0.75rem', color: 'var(--lp-text-muted)' }}>
        [Image] {data.alt || data.src}
      </div>
      {data.caption && <p style={{ fontSize: '0.75rem', color: 'var(--lp-text-muted)', marginTop: '4px' }}>{data.caption}</p>}
    </div>
  )
}

function PreviewImageText({ data }: { data: ImageTextData }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '1rem', flexDirection: data.imagePosition === 'right' ? 'row-reverse' : 'row' }}>
      <div style={{ flex: 1, background: 'var(--lp-text-muted, #94a3b8)', borderRadius: '8px', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--lp-text-muted)' }}>Image</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
        {data.heading && <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--lp-text)' }}>{data.heading}</p>}
        <p style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted)' }}>{data.text}</p>
        {data.cta && <span style={{ fontSize: '0.75rem', color: 'var(--lp-accent, #16a34a)', fontWeight: 600 }}>{data.cta.text} →</span>}
      </div>
    </div>
  )
}

function PreviewGallery({ data }: { data: GalleryData }) {
  const v = data.variant || 'grid'
  const cols = data.columns || 4
  const images = data.images || []
  const imgEl = (img: { src: string; alt?: string; caption?: string }, i: number) => (
    <div key={i} className="lp-card-hover" style={{ overflow: 'hidden', borderRadius: 'var(--lp-radius, 8px)' }}>
      {img.src ? <img src={img.src} alt={img.alt || ''} style={{ width: '100%', aspectRatio: v === 'masonry' ? undefined : '4/3', objectFit: 'cover', display: 'block' }} /> :
        <div style={{ background: '#e2e8f0', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#94a3b8' }}>No image</div>}
      {img.caption && <p style={{ padding: '0.4rem', textAlign: 'center', fontSize: '0.7rem', color: 'var(--lp-text-muted)' }}>{img.caption}</p>}
    </div>
  )
  return (
    <div className="landing-section">
      {data.heading && (
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2>{data.heading}</h2>
          {data.subheading && <p style={{ color: 'var(--lp-text-muted)', marginTop: '0.5rem' }}>{data.subheading}</p>}
        </div>
      )}
      {v === 'grid' && <div className={`landing-grid-${Math.min(cols, 5)}`} style={{ gap: '0.75rem' }}>{images.map((img, i) => imgEl(img, i))}</div>}
      {v === 'masonry' && <div className="lp-gallery-masonry">{images.map((img, i) => imgEl(img, i))}</div>}
      {v === 'carousel' && <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto' }}>{images.map((img, i) => <div key={i} style={{ flexShrink: 0, width: '200px', height: '150px', borderRadius: '8px', overflow: 'hidden' }}>{img.src ? <img src={img.src} alt={img.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ background: '#e2e8f0', height: '100%' }} />}</div>)}</div>}
      {v === 'filmstrip' && <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto' }}>{images.map((img, i) => <div key={i} style={{ flexShrink: 0, width: '180px', height: '130px', borderRadius: '8px', overflow: 'hidden' }}>{img.src ? <img src={img.src} alt={img.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ background: '#e2e8f0', height: '100%' }} />}</div>)}</div>}
      {v === 'lightbox' && <div className={`landing-grid-${Math.min(cols, 5)}`} style={{ gap: '0.75rem' }}>{images.map((img, i) => <div key={i} style={{ position: 'relative' }}>{imgEl(img, i)}<div style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: '4px', padding: '1px 5px', fontSize: '0.6rem' }}>🔍</div></div>)}</div>}
      {images.length === 0 && <p style={{ textAlign: 'center', color: 'var(--lp-text-muted)', fontSize: '0.8rem' }}>No images added</p>}
    </div>
  )
}

function PreviewMap({ data }: { data: MapData }) {
  return (
    <div style={{ padding: '1rem', background: 'var(--lp-text-muted, #94a3b8)', borderRadius: '10px', textAlign: 'center', minHeight: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '1.5rem' }}>📍</span>
      <p style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted)', marginTop: '4px' }}>{data.address || data.embedUrl || 'Map'}</p>
    </div>
  )
}

/** Minimal Markdown→HTML for preview (mirrors landing-rich-text.astro parser) */
function parseMd(md: string): string {
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

function PreviewRichText({ data }: { data: RichTextData }) {
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

function PreviewDivider({ data }: { data: DividerData }) {
  const h = data.height || 40
  if (data.style === 'space') return <div style={{ height: h }} />
  if (data.style === 'dots') return <div style={{ height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '0.3em', color: '#cbd5e1', fontSize: '1rem' }}>· · · · ·</div>
  return <div style={{ height: h, display: 'flex', alignItems: 'center', padding: '0 2rem' }}><hr style={{ width: '100%', border: 'none', borderTop: '1px solid var(--lp-text-muted, #94a3b8)' }} /></div>
}

function PreviewCountdown({ data }: { data: CountdownData }) {
  // Calculate static diff from targetDate for display (not ticking — just snapshot)
  const units: { label: string; value: number }[] = (() => {
    if (!data.targetDate) return [{ label: 'Days', value: 0 }, { label: 'Hours', value: 0 }, { label: 'Mins', value: 0 }, { label: 'Secs', value: 0 }]
    const diff = Math.max(0, new Date(data.targetDate).getTime() - Date.now())
    const secs = Math.floor(diff / 1000)
    return [
      { label: 'Days', value: Math.floor(secs / 86400) },
      { label: 'Hours', value: Math.floor((secs % 86400) / 3600) },
      { label: 'Mins', value: Math.floor((secs % 3600) / 60) },
      { label: 'Secs', value: secs % 60 },
    ]
  })()
  return (
    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
      {data.heading && <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--lp-text)', marginBottom: '0.75rem' }}>{data.heading}</p>}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
        {units.map((u) => (
          <div key={u.label} style={{ textAlign: 'center', background: 'var(--lp-surface, #f8fafc)', borderRadius: 'var(--lp-radius, 10px)', padding: '0.5rem 0.75rem', minWidth: '3rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--lp-accent, var(--lp-primary, #16a34a))', lineHeight: 1 }}>{String(u.value).padStart(2, '0')}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--lp-text-muted)', marginTop: '0.2rem' }}>{u.label}</div>
          </div>
        ))}
      </div>
      {data.targetDate && <p style={{ fontSize: '0.7rem', color: 'var(--lp-text-muted)', marginTop: '0.5rem' }}>{new Date(data.targetDate).toLocaleDateString()}</p>}
    </div>
  )
}

function PreviewContactForm({ data }: { data: ContactFormData }) {
  const fields = data.fields || []
  return (
    <div style={{ padding: '1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '0.75rem' }}>{data.heading}</h2>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '300px', margin: '0 auto' }}>
        {fields.map((f, i) => (
          <div key={i} style={{ background: 'var(--lp-surface, #f8fafc)', borderRadius: '6px', padding: '0.5rem', fontSize: '0.75rem', color: 'var(--lp-text-muted)' }}>{f.label} ({f.type})</div>
        ))}
        {fields.length === 0 && <div style={{ background: 'var(--lp-surface, #f8fafc)', borderRadius: 'var(--lp-radius, 6px)', padding: '0.5rem', fontSize: '0.75rem', color: 'var(--lp-text-muted)' }}>No fields configured</div>}
        <div style={{ background: 'var(--lp-primary)', borderRadius: 'var(--lp-radius, 6px)', padding: '0.4rem 1rem', fontSize: '0.75rem', color: 'white', textAlign: 'center', alignSelf: 'flex-start' }}>{data.submitText || 'Send Message'}</div>
      </div>
    </div>
  )
}

function PreviewBanner({ data }: { data: BannerData }) {
  const colors: Record<string, { bg: string; text: string }> = {
    info: { bg: '#eff6ff', text: '#1d4ed8' },
    warning: { bg: '#fffbeb', text: '#92400e' },
    success: { bg: '#f0fdf4', text: '#166534' },
  }
  const c = colors[data.variant || 'info']
  return (
    <div style={{ background: c.bg, color: c.text, padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '0.8rem', borderRadius: 'var(--lp-radius, 6px)' }}>
      <span>{data.text}</span>
      {data.cta && <span style={{ fontWeight: 700, textDecoration: 'underline' }}>{data.cta.text}</span>}
    </div>
  )
}

function PreviewSocialProof({ data }: { data: SocialProofData }) {
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

function PreviewLogoWall({ data }: { data: LogoWallData }) {
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

function PreviewComparison({ data }: { data: ComparisonData }) {
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
                {r.values.map((v, j) => <td key={j} style={{ padding: '0.4rem 0.5rem', textAlign: 'center', color: 'var(--lp-text-muted)' }}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PreviewAiSearch({ data }: { data: AiSearchData }) {
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

/** Layout preview — renders columns with nested section previews, respects variant */
function PreviewLayout({ data }: { data: LayoutData }) {
  const columns = data.columns || [1, 1]
  const gap = data.gap || '1rem'
  const children = data.children || []
  const v = data.variant || 'grid'

  // Compute grid-template-columns based on variant (matches landing-layout.astro CSS)
  const variantGridMap: Record<string, string> = {
    'grid': columns.map(c => `${c}fr`).join(' '),
    'sidebar-left': '280px 1fr',
    'sidebar-right': '1fr 280px',
    'asymmetric': '3fr 2fr',
    'thirds': 'repeat(3, 1fr)',
    'hero-split': '55fr 45fr',
    'stacked': '1fr',
    'masonry': columns.map(c => `${c}fr`).join(' '),
  }
  const gridTemplate = variantGridMap[v] || columns.map(c => `${c}fr`).join(' ')
  const isMasonry = v === 'masonry'

  return (
    <div className={`lp-layout${isMasonry ? ' lp-layout--masonry' : ''}`}
      style={{ display: isMasonry ? 'block' : 'grid', gridTemplateColumns: isMasonry ? undefined : gridTemplate, gap, alignItems: v === 'hero-split' ? 'center' : undefined, columns: isMasonry ? columns.length : undefined }}>
      {columns.map((_, colIdx) => {
        const col = children.find(c => c.column === colIdx)
        const sections = (col?.sections || []).filter(s => s.enabled !== false).sort((a, b) => a.order - b.order)
        return (
          <div key={colIdx} style={{ minHeight: '60px', background: 'rgba(241,245,249,0.5)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem' }}>
            {sections.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--lp-text-muted)', fontSize: '0.65rem', padding: '0.5rem' }}>Column {colIdx + 1} (empty)</div>
            )}
            {sections.map((s, i) => (
              <div key={i} style={{ borderRadius: '6px', overflow: 'hidden', fontSize: '0.85em' }}>
                {renderSection(s, [], undefined)}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

/** Build inline style matching Astro section-renderer's buildSectionStyle() */
function sectionInlineStyle(section: LandingSection): React.CSSProperties {
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
function isDarkSection(section: LandingSection): boolean {
  const tc = ((section.style || {}) as Record<string, unknown>).textColor
  if (!tc) return false
  const c = String(tc).trim().toLowerCase()
  return c === '#fff' || c === '#ffffff' || c === 'white'
}

/** Render preview from section data, keyed by type */
function renderSection(section: LandingSection, allSections: LandingSection[], pageTitle?: string) {
  const d = (section.data || {}) as Record<string, unknown>
  if (!section.data) return <div style={{ padding: '0.5rem', color: 'var(--lp-text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>[{section.type} — no data]</div>
  switch (section.type) {
    case 'hero': return <PreviewHero data={d as unknown as HeroData} />
    case 'features': return <PreviewFeatures data={d as unknown as FeaturesData} />
    case 'pricing': return <PreviewPricing data={d as unknown as PricingData} />
    case 'cta': return <PreviewCta data={d as unknown as CtaData} />
    case 'stats': return <PreviewStats data={d as unknown as StatsData} />
    case 'testimonials': return <PreviewTestimonials data={d as unknown as TestimonialsData} />
    case 'faq': return <PreviewFaq data={d as unknown as FaqData} />
    case 'how-it-works': return <PreviewHowItWorks data={d as unknown as HowItWorksData} />
    case 'team': return <PreviewTeam data={d as unknown as TeamData} />
    case 'video': return <PreviewVideo data={d as unknown as VideoData} />
    case 'image': return <PreviewImage data={d as unknown as ImageData} />
    case 'image-text': return <PreviewImageText data={d as unknown as ImageTextData} />
    case 'gallery': return <PreviewGallery data={d as unknown as GalleryData} />
    case 'map': return <PreviewMap data={d as unknown as MapData} />
    case 'rich-text': return <PreviewRichText data={d as unknown as RichTextData} />
    case 'divider': return <PreviewDivider data={d as unknown as DividerData} />
    case 'countdown': return <PreviewCountdown data={d as unknown as CountdownData} />
    case 'contact-form': return <PreviewContactForm data={d as unknown as ContactFormData} />
    case 'banner': return <PreviewBanner data={d as unknown as BannerData} />
    case 'social-proof': return <PreviewSocialProof data={d as unknown as SocialProofData} />
    case 'logo-wall': return <PreviewLogoWall data={d as unknown as LogoWallData} />
    case 'comparison': return <PreviewComparison data={d as unknown as ComparisonData} />
    case 'ai-search': return <PreviewAiSearch data={d as unknown as AiSearchData} />
    case 'layout': return <PreviewLayout data={d as unknown as LayoutData} />
    default: return <div style={{ padding: '1rem', color: 'var(--lp-text-muted)', textAlign: 'center' }}>[{section.type}]</div>
  }
}

export function LandingLivePreview({ sections, pageTitle, design, selectedSectionIdx, onSectionClick }: Props) {
  const enabled = sections.filter(s => s.enabled !== false)
  const navSection = enabled.find(s => s.type === 'nav')
  const footerSection = enabled.find(s => s.type === 'footer')
  const body = enabled.filter(s => s.type !== 'nav' && s.type !== 'footer').sort((a, b) => a.order - b.order)

  // Map original section index → body index for highlight matching
  const sectionOriginalIndices = body.map(s => sections.indexOf(s))

  // Parse design CSS vars into a React style object
  const designVarsStr = designToCssVars(design)
  const designStyle: Record<string, string> = {}
  designVarsStr.split(';').forEach(pair => {
    const [k, ...v] = pair.split(':')
    if (k && v.length) designStyle[k] = v.join(':')
  })

  // Load Google Fonts dynamically when design fonts change
  const fontsUrl = designFontsUrl(design)
  useEffect(() => {
    if (!fontsUrl) return
    const id = 'lp-preview-fonts'
    let link = document.getElementById(id) as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    link.href = fontsUrl
  }, [fontsUrl])

  // Scroll to selected section in preview when it changes
  useEffect(() => {
    if (selectedSectionIdx == null) return
    // Check if selected section is nav or footer
    const sel = sections[selectedSectionIdx]
    if (!sel) return
    let targetId = ''
    if (sel.type === 'nav') targetId = 'lp-preview-nav'
    else if (sel.type === 'footer') targetId = 'lp-preview-footer'
    else targetId = `section-${sel.type}-prev-${selectedSectionIdx}`
    const el = document.getElementById(targetId)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [selectedSectionIdx])

  // Is this section currently selected?
  const isSelected = (originalIdx: number) => selectedSectionIdx != null && originalIdx === selectedSectionIdx

  const highlightStyle = {
    outline: '2px solid var(--lp-primary, #3b82f6)',
    outlineOffset: '2px',
    borderRadius: '8px',
    transition: 'outline 0.2s ease',
  }

  return (
    <div className="landing-page-root" style={{
      ...designStyle,
      background: 'var(--lp-bg, #f8fafc)',
      color: 'var(--lp-text, #0f172a)',
      fontFamily: 'var(--lp-font-body, system-ui), system-ui, sans-serif',
      overflow: 'hidden', height: '100%', overflowY: 'auto',
    }}>
      <style>{`
        .landing-page-root h1,.landing-page-root h2,.landing-page-root h3{font-family:var(--lp-font-heading,system-ui),system-ui,sans-serif}
        .landing-page-root .lp-fade-up{opacity:1!important;transform:none!important}
      `}</style>
      {navSection && (
        <div id="lp-preview-nav" onClick={() => onSectionClick?.(sections.indexOf(navSection))} style={{ cursor: 'pointer', ...(isSelected(sections.indexOf(navSection)) ? highlightStyle : {}) }}>
          <PreviewNav data={navSection.data as NavData} sections={enabled} pageTitle={pageTitle} />
        </div>
      )}
      <div className="landing-sections">
        {body.map((section, i) => {
          const origIdx = sectionOriginalIndices[i]
          const s = (section.style || {}) as Record<string, unknown>
          const hasBgImage = !!s.backgroundImage
          const dark = isDarkSection(section)
          const classes = ['lp-full-width', 'lp-fade-up', hasBgImage ? 'lp-section-bg' : '', dark ? 'lp-dark-section' : ''].filter(Boolean).join(' ')
          return (
            <div key={`${section.type}-${i}`} id={`section-${section.type}-prev-${origIdx}`}
              data-section={`section-${section.type}`}
              className={classes}
              onClick={() => onSectionClick?.(origIdx)}
              style={{ cursor: 'pointer', ...sectionInlineStyle(section), ...(isSelected(origIdx) ? highlightStyle : {}) }}>
              {/* Background image layer — matches Astro lp-section-bg-img */}
              {hasBgImage && (
                <div className="lp-section-bg-img" style={{ backgroundImage: `url(${s.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              )}
              {hasBgImage && s.backgroundOverlay && (
                <div className="lp-section-bg-overlay" style={{ background: String(s.backgroundOverlay) }} />
              )}
              <div className={hasBgImage ? 'lp-section-content' : ''}>
                {renderSection(section, enabled, pageTitle)}
              </div>
            </div>
          )
        })}
      </div>
      {footerSection && (
        <div id="lp-preview-footer"
          data-section="section-footer"
          className={`lp-full-width ${isDarkSection(footerSection) ? 'lp-dark-section' : ''}`}
          onClick={() => onSectionClick?.(sections.indexOf(footerSection))}
          style={{ cursor: 'pointer', ...sectionInlineStyle(footerSection), ...(isSelected(sections.indexOf(footerSection)) ? highlightStyle : {}) }}>
          <PreviewFooter data={footerSection.data as FooterData} pageTitle={pageTitle} />
        </div>
      )}
    </div>
  )
}
