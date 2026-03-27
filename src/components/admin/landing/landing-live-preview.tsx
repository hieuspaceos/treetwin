/**
 * Live preview renderer for landing page editor.
 * Renders sections from React state directly — no server round-trip needed.
 * Mirrors the Astro section components but as simple React divs.
 */
import { useEffect } from 'react'
import type { LandingSection, LandingDesign, HeroData, FeaturesData, PricingData, TestimonialsData, FaqData, CtaData, StatsData, HowItWorksData, TeamData, LogoWallData, NavData, FooterData, VideoData, ImageData, ImageTextData, GalleryData, MapData, RichTextData, DividerData, CountdownData, ContactFormData, BannerData, LayoutData, SocialProofData } from '@/lib/landing/landing-types'
import { designToCssVars, designFontsUrl, resolveDesign } from '@/lib/landing/landing-design-presets'

interface Props {
  sections: LandingSection[]
  pageTitle?: string
  design?: LandingDesign
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

  if (v === 'centered') return (
    <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--lp-bg, #f8fafc)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--lp-text-muted, #94a3b8)', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
        {links.slice(0, Math.ceil(links.length / 2)).map((l, i) => <span key={i} style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted)' }}>{l.label}</span>)}
      </div>
      <strong style={{ fontSize: '1rem', color: 'var(--lp-text)', padding: '0 1rem' }}>{brand}</strong>
      <div style={{ display: 'flex', gap: '0.5rem', flex: 1, justifyContent: 'flex-end' }}>
        {links.slice(Math.ceil(links.length / 2)).map((l, i) => <span key={i} style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted)' }}>{l.label}</span>)}
      </div>
    </div>
  )
  if (v === 'transparent') return (
    <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'transparent', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <strong style={{ fontSize: '1rem', color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{brand}</strong>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {links.map((l, i) => <span key={i} style={{ fontSize: '0.8rem', color: 'var(--lp-bg, #f8fafc)' }}>{l.label}</span>)}
      </div>
    </div>
  )
  // default
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--lp-bg, #f8fafc)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--lp-text-muted, #94a3b8)', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <strong style={{ fontSize: '1rem', color: 'var(--lp-text)' }}>{brand}</strong>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {links.map((l, i) => <span key={i} style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted)' }}>{l.label}</span>)}
      </div>
    </div>
  )
}

function PreviewHero({ data }: { data: HeroData }) {
  const v = data.variant || 'centered'
  // Normalize cta: single object or array — show all buttons
  const ctaList = Array.isArray(data.cta) ? data.cta : data.cta ? [data.cta] : []
  const ctaButtons = ctaList.length > 0 && (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', justifyContent: v === 'split' ? 'flex-start' : 'center' }}>
      {ctaList.map((item, i) => (
        <span key={i} style={{
          display: 'inline-block', padding: '0.4rem 1.25rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
          ...(item.variant === 'outline' ? { border: '2px solid var(--lp-primary)', color: 'var(--lp-primary)', background: 'transparent' }
            : item.variant === 'secondary' || i > 0 ? { background: 'rgba(0,0,0,0.08)', color: 'var(--lp-text)' }
            : { background: 'var(--lp-primary)', color: 'white' })
        }}>{item.text}</span>
      ))}
    </div>
  )

  if (v === 'split') {
    const embedUrl = data.embed || ''
    const isVideo = /\.(mp4|webm)(\?|$)/i.test(embedUrl)
    return (
      <div style={{ display: 'flex', gap: '1.5rem', padding: '2rem 1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '0.5rem' }}>{data.headline}</h1>
          {data.subheadline && <p style={{ color: 'var(--lp-text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{data.subheadline}</p>}
          {ctaButtons}
        </div>
        <div style={{ flex: 1, minWidth: '120px', borderRadius: '10px', overflow: 'hidden', aspectRatio: '16/9' }}>
          {isVideo
            ? <video src={embedUrl} autoPlay muted loop playsInline poster={data.backgroundImage || undefined} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
            : data.backgroundImage
              ? <img src={data.backgroundImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
              : <div style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--lp-text-muted)', fontSize: '0.7rem', borderRadius: '10px' }}>Media</div>}
        </div>
      </div>
    )
  }
  if (v === 'video-bg') return (
    <div style={{ textAlign: 'center', padding: '3rem 2rem', borderRadius: '14px', position: 'relative', overflow: 'hidden', background: data.backgroundImage ? `url(${data.backgroundImage}) center/cover` : '#1e293b' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>{data.headline}</h1>
        {data.subheadline && <p style={{ color: 'var(--lp-surface, #f8fafc)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{data.subheadline}</p>}
        {ctaButtons}
      </div>
    </div>
  )
  if (v === 'minimal') return (
    <div style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '0.5rem' }}>{data.headline}</h1>
      {data.subheadline && <p style={{ color: 'var(--lp-text-muted)', fontSize: '1rem' }}>{data.subheadline}</p>}
      {ctaButtons}
    </div>
  )
  // centered (default)
  return (
    <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--lp-surface, #f8fafc)', borderRadius: '16px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '0.5rem' }}>{data.headline}</h1>
      {data.subheadline && <p style={{ color: 'var(--lp-text-muted)', fontSize: '1rem', marginBottom: '0.5rem' }}>{data.subheadline}</p>}
      {ctaButtons}
    </div>
  )
}

function PreviewFeatures({ data }: { data: FeaturesData }) {
  const v = data.variant || 'grid'

  if (v === 'list') return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {data.items?.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'var(--lp-surface, #f8fafc)', borderRadius: '10px', padding: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{item.icon || '✓'}</span>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--lp-text)' }}>{item.title}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--lp-text-muted)' }}>{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
  if (v === 'alternating') return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data.items?.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '1rem', flexDirection: i % 2 === 1 ? 'row-reverse' : 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 3rem', height: '3rem', background: 'var(--lp-surface, #f8fafc)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>{item.icon || '✦'}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--lp-text)' }}>{item.title}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--lp-text-muted)' }}>{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
  // grid (default)
  return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.columns || 3}, 1fr)`, gap: '1rem' }}>
        {data.items?.map((item, i) => (
          <div key={i} style={{ background: 'var(--lp-surface, #f8fafc)', borderRadius: '12px', padding: '1rem' }}>
            {item.icon && <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>}
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--lp-text)', margin: '0.5rem 0 0.25rem' }}>{item.title}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted)' }}>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewPricing({ data }: { data: PricingData }) {
  const v = data.variant || 'cards'
  const plans = data.plans || []
  const gridCols = plans.length <= 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'
  const gridConstraint = plans.length <= 2 ? { maxWidth: '600px', margin: '0 auto' } : {}

  if (v === 'simple') return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {data.plans?.map((plan, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', background: 'var(--lp-surface, #f8fafc)', borderRadius: '10px', padding: '0.75rem 1rem', border: plan.highlighted ? '1.5px solid var(--lp-primary)' : '1px solid var(--lp-text-muted, #94a3b8)' }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--lp-text)' }}>{plan.name}</span>
            <span style={{ fontWeight: 700, color: 'var(--lp-text)' }}>{plan.price}</span>
            <span style={{ fontSize: '0.75rem', background: plan.highlighted ? 'var(--lp-primary)' : 'var(--lp-text-muted, #94a3b8)', color: plan.highlighted ? '#fff' : '#475569', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>{plan.cta?.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
  if (v === 'highlight-center') return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
        {data.plans?.map((plan, i) => {
          const isCenter = i === Math.floor((data.plans?.length || 0) / 2) || plan.highlighted
          return (
            <div key={i} style={{ background: 'var(--lp-surface, #f8fafc)', borderRadius: '12px', padding: isCenter ? '1.5rem' : '1rem', minWidth: isCenter ? '160px' : '130px', border: isCenter ? '2px solid var(--lp-primary)' : '1px solid var(--lp-text-muted, #94a3b8)', transform: isCenter ? 'scale(1.05)' : 'none' }}>
              <h3 style={{ fontWeight: 600, fontSize: isCenter ? '1rem' : '0.85rem', color: 'var(--lp-text)' }}>{plan.name}</h3>
              <p style={{ fontSize: isCenter ? '1.5rem' : '1.1rem', fontWeight: 700, color: 'var(--lp-text)' }}>{plan.price}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
  // cards (default)
  return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '1rem', ...gridConstraint }}>
        {plans.map((plan, i) => (
          <div key={i} style={{ background: 'var(--lp-surface, #f8fafc)', borderRadius: '12px', padding: '1.5rem', border: plan.highlighted ? '2px solid var(--lp-primary)' : '1px solid var(--lp-text-muted, #94a3b8)', display: 'flex', flexDirection: 'column' }}>
            {plan.badge && <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--lp-primary)', padding: '0.15rem 0.5rem', background: 'rgba(59,130,246,0.12)', borderRadius: '999px', marginBottom: '0.5rem', display: 'inline-block', alignSelf: 'flex-start' }}>{plan.badge}</span>}
            <h3 style={{ fontWeight: 600, color: 'var(--lp-text)' }}>{plan.name}</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--lp-text)' }}>{plan.price}<span style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted)' }}>{plan.period}</span></p>
            <ul style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted)', listStyle: 'none', padding: 0 }}>
              {plan.features?.map((f, j) => <li key={j} style={{ padding: '0.15rem 0' }}>✓ {f}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewTestimonials({ data }: { data: TestimonialsData }) {
  const v = data.variant || 'cards'
  if (v === 'single') return (
    <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
      {data.heading && <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      {data.items?.[0] && (
        <div style={{ background: 'var(--lp-surface, #f8fafc)', borderRadius: '12px', padding: '1.5rem', maxWidth: '420px', margin: '0 auto' }}>
          <p style={{ fontStyle: 'italic', fontSize: '0.95rem', color: 'var(--lp-text)', marginBottom: '1rem' }}>"{data.items[0].quote}"</p>
          <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{data.items[0].name}</p>
        </div>
      )}
    </div>
  )
  if (v === 'minimal') return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      {data.items?.map((t, i) => (
        <div key={i} style={{ borderLeft: '3px solid var(--lp-primary)', padding: '0.5rem 0.75rem', marginBottom: '0.75rem' }}>
          <p style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--lp-text)' }}>"{t.quote}"</p>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--lp-text-muted)', marginTop: '0.25rem' }}>— {t.name}</p>
        </div>
      ))}
    </div>
  )
  if (v === 'carousel') return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {data.items?.map((t, i) => (
          <div key={i} style={{ flexShrink: 0, width: '220px', background: 'var(--lp-surface, #f8fafc)', borderRadius: '10px', overflow: 'hidden' }}>
            {t.image && <img src={t.image} alt={t.name} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />}
            <div style={{ padding: '0.5rem' }}>
              <p style={{ fontSize: '0.7rem', fontStyle: 'italic', color: 'var(--lp-text-muted)', marginBottom: '0.25rem' }}>"{t.quote}"</p>
              <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--lp-text)' }}>{t.name}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem', marginTop: '0.75rem' }}>
        {Array.from({ length: Math.min(5, data.items?.length || 0) }, (_, i) => (
          <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === 0 ? 'var(--lp-primary)' : 'rgba(0,0,0,0.15)', display: 'inline-block' }} />
        ))}
      </div>
    </div>
  )
  // cards (default)
  return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
        {data.items?.map((t, i) => (
          <div key={i} style={{ background: 'var(--lp-surface, #f8fafc)', borderRadius: '10px', overflow: 'hidden' }}>
            {t.image && <img src={t.image} alt={t.name} style={{ width: '100%', height: '80px', objectFit: 'cover' }} />}
            <div style={{ padding: '0.75rem' }}>
              <p style={{ fontStyle: 'italic', fontSize: '0.78rem', color: 'var(--lp-text-muted)', marginBottom: '0.5rem' }}>"{t.quote}"</p>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--lp-text)' }}>{t.name}</p>
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
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      {data.items?.map((faq, i) => (
        <div key={i} style={{ display: 'flex', gap: '0', marginBottom: '0.25rem', border: '1px solid var(--lp-text-muted, #94a3b8)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ flex: 1, padding: '0.6rem 0.75rem', background: 'var(--lp-surface, #f8fafc)', borderRight: '1px solid var(--lp-text-muted, #94a3b8)' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--lp-text)' }}>{faq.question}</p>
          </div>
          <div style={{ flex: 2, padding: '0.6rem 0.75rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--lp-text-muted)' }}>{faq.answer}</p>
          </div>
        </div>
      ))}
    </div>
  )
  if (v === 'simple') return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      {data.items?.map((faq, i) => (
        <div key={i} style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--lp-text)', marginBottom: '0.25rem' }}>{faq.question}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted)' }}>{faq.answer}</p>
        </div>
      ))}
    </div>
  )
  // accordion (default)
  return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      {data.items?.map((faq, i) => (
        <div key={i} style={{ background: 'var(--lp-surface, #f8fafc)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '0.4rem' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--lp-text)' }}>▸ {faq.question}</p>
        </div>
      ))}
    </div>
  )
}

function PreviewHowItWorks({ data }: { data: HowItWorksData }) {
  const v = data.variant || 'numbered'
  if (v === 'timeline') return (
    <div style={{ padding: '2rem 1rem 2rem 2.5rem', position: 'relative' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      <div style={{ position: 'absolute', left: '1.25rem', top: '4rem', bottom: '1rem', width: '2px', background: 'var(--lp-primary)', opacity: 0.25 }} />
      {data.items?.map((step, i) => (
        <div key={i} style={{ position: 'relative', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>
          <div style={{ position: 'absolute', left: '-1.3rem', top: '0.25rem', width: '0.75rem', height: '0.75rem', borderRadius: '50%', background: 'var(--lp-primary)' }} />
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--lp-text)' }}>{step.title}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--lp-text-muted)' }}>{step.description}</p>
        </div>
      ))}
    </div>
  )
  if (v === 'cards') return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        {data.items?.map((step, i) => (
          <div key={i} style={{ background: 'var(--lp-surface, #f8fafc)', borderRadius: '10px', padding: '0.75rem', border: '1px solid var(--lp-text-muted)' }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>{step.icon || `${i + 1}️⃣`}</div>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--lp-text)' }}>{step.title}</p>
          </div>
        ))}
      </div>
    </div>
  )
  // numbered (default)
  return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        {data.items?.map((step, i) => (
          <div key={i} style={{ background: 'var(--lp-surface, #f8fafc)', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'rgba(22,163,74,0.12)', color: 'var(--lp-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem', fontSize: '0.85rem' }}>{step.number ?? i + 1}</div>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--lp-text)' }}>{step.title}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewTeam({ data }: { data: TeamData }) {
  const v = data.variant || 'grid'
  if (v === 'list') return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      {data.members?.map((m, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--lp-surface, #f8fafc)', borderRadius: '10px', padding: '0.6rem 0.75rem', marginBottom: '0.4rem' }}>
          <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'var(--lp-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'var(--lp-primary)', flexShrink: 0 }}>{m.name?.charAt(0)}</div>
          <div>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--lp-text)' }}>{m.name}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--lp-text-muted)' }}>{m.role}</p>
          </div>
        </div>
      ))}
    </div>
  )
  if (v === 'compact') return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
        {data.members?.map((m, i) => (
          <div key={i} style={{ background: 'var(--lp-surface, #f8fafc)', borderRadius: '8px', padding: '0.4rem 0.75rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--lp-text)' }}>{m.name}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--lp-text-muted)' }}>{m.role}</p>
          </div>
        ))}
      </div>
    </div>
  )
  // grid (default)
  return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        {data.members?.map((m, i) => (
          <div key={i} style={{ background: 'var(--lp-surface, #f8fafc)', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'rgba(22,163,74,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', color: 'var(--lp-primary)', margin: '0 auto 0.5rem' }}>{m.name?.charAt(0)}</div>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--lp-text)' }}>{m.name}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--lp-text-muted)' }}>{m.role}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewCta({ data }: { data: CtaData }) {
  const v = data.variant || 'default'
  // Normalize cta: single object or array — show all buttons
  const ctaList = Array.isArray(data.cta) ? data.cta : data.cta ? [data.cta] : []
  const ctaFirst = ctaList[0]
  const ctaButtons = ctaList.length > 0 && (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
      {ctaList.map((item, i) => (
        <span key={i} style={{
          display: 'inline-block', padding: '0.5rem 1.5rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600,
          ...(item.variant === 'outline' ? { border: '2px solid var(--lp-primary)', color: 'var(--lp-primary)', background: 'transparent' }
            : item.variant === 'secondary' || i > 0 ? { background: 'rgba(0,0,0,0.08)', color: 'var(--lp-text)' }
            : { background: 'var(--lp-primary)', color: '#fff' })
        }}>{item.text}</span>
      ))}
    </div>
  )

  if (v === 'split') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', padding: '2rem', background: 'var(--lp-surface)', borderRadius: '14px', flexWrap: 'wrap' }}>
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--lp-text)' }}>{data.headline}</h2>
        {data.subheadline && <p style={{ color: 'var(--lp-text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{data.subheadline}</p>}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {ctaList.map((item, i) => (
          <span key={i} style={{
            display: 'inline-block', padding: '0.5rem 1.5rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600,
            ...(i > 0 ? { background: 'rgba(0,0,0,0.08)', color: 'var(--lp-text)' } : { background: 'var(--lp-primary)', color: '#fff' })
          }}>{item.text}</span>
        ))}
      </div>
    </div>
  )
  if (v === 'banner') return (
    <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'linear-gradient(135deg, var(--lp-primary), var(--lp-secondary))', borderRadius: '14px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>{data.headline}</h2>
      {data.subheadline && <p style={{ color: 'var(--lp-bg, #f8fafc)', marginBottom: '0.5rem' }}>{data.subheadline}</p>}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
        {ctaList.map((item, i) => (
          <span key={i} style={{ display: 'inline-block', background: i === 0 ? '#fff' : 'rgba(255,255,255,0.2)', color: i === 0 ? 'var(--lp-primary)' : '#fff', padding: '0.5rem 1.5rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}>{item.text}</span>
        ))}
      </div>
    </div>
  )
  if (v === 'minimal') return (
    <div style={{ textAlign: 'center', padding: '1.5rem' }}>
      <p style={{ fontSize: '0.95rem' }}>
        <span style={{ color: 'var(--lp-text-muted)' }}>{data.headline}</span>{' '}
        <span style={{ color: 'var(--lp-primary)', fontWeight: 600, textDecoration: 'underline' }}>{ctaFirst?.text}</span>
      </p>
    </div>
  )
  if (v === 'with-image') return (
    <div style={{ textAlign: 'center', padding: '3rem 2rem', borderRadius: '14px', position: 'relative', overflow: 'hidden', background: data.backgroundImage ? `url(${data.backgroundImage}) center/cover` : 'var(--lp-surface)' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>{data.headline}</h2>
        {data.subheadline && <p style={{ color: 'var(--lp-surface, #f8fafc)', marginBottom: '0.5rem' }}>{data.subheadline}</p>}
        {ctaButtons}
      </div>
    </div>
  )
  // default
  return (
    <div style={{ textAlign: 'center', padding: '2.5rem 2rem', background: 'var(--lp-surface)', borderRadius: '14px' }}>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '0.5rem' }}>{data.headline}</h2>
      {data.subheadline && <p style={{ color: 'var(--lp-text-muted)', marginBottom: '0.5rem' }}>{data.subheadline}</p>}
      {ctaButtons}
    </div>
  )
}

function PreviewStats({ data }: { data: StatsData }) {
  const v = data.variant || 'row'
  const items = data.items || []
  const gridCols = items.length <= 3 ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)'
  const gridConstraint = items.length <= 2 ? { maxWidth: '400px', margin: '0 auto' } : {}
  if (v === 'cards') return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '0.75rem', ...gridConstraint }}>
        {items.map((s, i) => (
          <div key={i} style={{ background: 'var(--lp-surface, #f8fafc)', borderRadius: '10px', padding: '0.75rem', textAlign: 'center', border: '1px solid var(--lp-text-muted)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--lp-primary)' }}>{s.prefix}{s.value}{s.suffix}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--lp-text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
  if (v === 'large') return (
    <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
      {data.heading && <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '1rem' }}>{data.heading}</h2>}
      {data.items?.map((s, i) => (
        <div key={i} style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--lp-primary)', lineHeight: 1 }}>{s.prefix}{s.value}{s.suffix}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--lp-text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
  // row (default)
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', padding: '2rem', flexWrap: 'wrap' }}>
      {data.items?.map((s, i) => (
        <div key={i} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--lp-accent, #16a34a)' }}>{s.prefix}{s.value}{s.suffix}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted)' }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

function PreviewFooter({ data, pageTitle }: { data: FooterData; pageTitle?: string }) {
  const copyright = data.text || `© ${new Date().getFullYear()} ${pageTitle || ''}`
  const v = data.variant || 'simple'

  if (v === 'columns') return (
    <div style={{ borderTop: '1px solid var(--lp-text-muted, #94a3b8)', padding: '1.5rem', fontSize: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {/* Link columns */}
        {data.columns && data.columns.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.columns.length}, 1fr)`, gap: '0.75rem', flex: 1, minWidth: 0 }}>
            {data.columns.map((col, i) => (
              <div key={i}>
                <p style={{ fontWeight: 700, color: 'var(--lp-text)', marginBottom: '0.4rem' }}>{col.heading}</p>
                {col.links?.map((l, j) => <p key={j} style={{ color: 'var(--lp-text-muted)', marginBottom: '0.2rem' }}>{l.label}</p>)}
              </div>
            ))}
          </div>
        )}
      </div>
      <p style={{ color: 'var(--lp-text-muted)', borderTop: '1px solid var(--lp-text-muted, #94a3b8)', paddingTop: '0.75rem', textAlign: 'center' }}>{copyright}</p>
    </div>
  )
  if (v === 'minimal') return (
    <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--lp-text-muted)', fontSize: '0.7rem' }}>{copyright}</div>
  )
  // simple (default)
  return (
    <div style={{ textAlign: 'center', padding: '1.5rem', borderTop: '1px solid var(--lp-text-muted, #94a3b8)', color: 'var(--lp-text-muted)', fontSize: '0.8rem' }}>
      {data.links && data.links.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          {data.links.map((l, i) => <span key={i} style={{ color: 'var(--lp-text-muted)' }}>{l.label}</span>)}
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
  return (
    <div style={{ padding: '1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '0.75rem' }}>{data.heading}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        {(data.images || []).map((_, i) => (
          <div key={i} style={{ background: 'var(--lp-text-muted, #94a3b8)', borderRadius: '6px', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--lp-text-muted)' }}>img</div>
        ))}
        {(data.images || []).length === 0 && [0,1,2].map(i => (
          <div key={i} style={{ background: 'var(--lp-text-muted, #94a3b8)', borderRadius: '6px', aspectRatio: '1' }} />
        ))}
      </div>
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

function PreviewRichText({ data }: { data: RichTextData }) {
  // Strip tags for safe preview text
  const text = data.content.replace(/<[^>]+>/g, ' ').trim().slice(0, 200)
  return (
    <div style={{ padding: '1rem' }}>
      <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>{text}{text.length >= 200 ? '…' : ''}</p>
    </div>
  )
}

function PreviewDivider({ data }: { data: DividerData }) {
  const h = data.height || 40
  if (data.style === 'space') return <div style={{ height: h }} />
  if (data.style === 'dots') return <div style={{ height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '0.3em', color: '#cbd5e1', fontSize: '1rem' }}>· · · · ·</div>
  return <div style={{ height: h, display: 'flex', alignItems: 'center', padding: '0 2rem' }}><hr style={{ width: '100%', border: 'none', borderTop: '1px solid var(--lp-text-muted, #94a3b8)' }} /></div>
}

function PreviewCountdown({ data }: { data: CountdownData }) {
  return (
    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
      {data.heading && <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--lp-text)', marginBottom: '0.75rem' }}>{data.heading}</p>}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        {['DD','HH','MM','SS'].map((u) => (
          <div key={u} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--lp-accent, #16a34a)' }}>{u}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--lp-text-muted)' }}>{u === 'DD' ? 'Days' : u === 'HH' ? 'Hours' : u === 'MM' ? 'Mins' : 'Secs'}</div>
          </div>
        ))}
      </div>
      {data.targetDate && <p style={{ fontSize: '0.7rem', color: 'var(--lp-text-muted)', marginTop: '0.5rem' }}>{data.targetDate}</p>}
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
        {fields.length === 0 && <div style={{ background: 'var(--lp-surface, #f8fafc)', borderRadius: '6px', padding: '0.5rem', fontSize: '0.75rem', color: 'var(--lp-text-muted)' }}>No fields configured</div>}
        <div style={{ background: 'var(--lp-primary)', borderRadius: '6px', padding: '0.4rem 1rem', fontSize: '0.75rem', color: 'white', textAlign: 'center', alignSelf: 'flex-start' }}>{data.submitText || 'Send Message'}</div>
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
    <div style={{ background: c.bg, color: c.text, padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '0.8rem', borderRadius: '6px' }}>
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
      ...(v === 'banner' ? { background: 'rgba(59,130,246,0.06)', borderRadius: '10px' } : {})
    }}>
      {data.icon && <span style={{ marginRight: '0.35rem' }}>{data.icon}</span>}
      {data.text || 'Social proof text'}
    </div>
  )
}

/** Layout preview — renders columns with nested section previews recursively */
function PreviewLayout({ data }: { data: LayoutData }) {
  const columns = data.columns || [1, 1]
  const gap = data.gap || '1rem'
  const children = data.children || []
  const gridTemplate = columns.map(c => `${c}fr`).join(' ')
  return (
    <div style={{ display: 'grid', gridTemplateColumns: gridTemplate, gap, padding: '0.5rem', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
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

/** Render preview from section data, keyed by type */
function renderSection(section: LandingSection, allSections: LandingSection[], pageTitle?: string) {
  const d = section.data as Record<string, unknown>
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
    case 'layout': return <PreviewLayout data={d as unknown as LayoutData} />
    default: return <div style={{ padding: '1rem', color: 'var(--lp-text-muted)', textAlign: 'center' }}>[{section.type}]</div>
  }
}

export function LandingLivePreview({ sections, pageTitle, design }: Props) {
  const enabled = sections.filter(s => s.enabled !== false)
  const navSection = enabled.find(s => s.type === 'nav')
  const footerSection = enabled.find(s => s.type === 'footer')
  const body = enabled.filter(s => s.type !== 'nav' && s.type !== 'footer').sort((a, b) => a.order - b.order)

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

  return (
    <div className="landing-page-root" style={{
      ...designStyle,
      background: 'var(--lp-bg, #f8fafc)',
      color: 'var(--lp-text, #0f172a)',
      fontFamily: 'var(--lp-font-body, system-ui), system-ui, sans-serif',
      borderRadius: '8px', overflow: 'hidden', height: '100%', overflowY: 'auto', fontSize: '0.85em',
    }}>
      {/* Inject preview CSS: heading fonts + card surface color that contrasts with bg */}
      <style>{`
        .landing-page-root h1,.landing-page-root h2,.landing-page-root h3{font-family:var(--lp-font-heading,system-ui),system-ui,sans-serif}
        .landing-page-root .lp-prev-card{background:color-mix(in srgb, var(--lp-text) 8%, var(--lp-surface));border:1px solid color-mix(in srgb, var(--lp-text) 10%, transparent);border-radius:var(--lp-radius, 12px)}
      `}</style>
      {navSection && <PreviewNav data={navSection.data as NavData} sections={enabled} pageTitle={pageTitle} />}
      <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {body.map((section, i) => (
          <div key={`${section.type}-${i}`} id={`preview-${section.type}`}>
            {renderSection(section, enabled, pageTitle)}
          </div>
        ))}
      </div>
      {footerSection && <PreviewFooter data={footerSection.data as FooterData} pageTitle={pageTitle} />}
    </div>
  )
}
