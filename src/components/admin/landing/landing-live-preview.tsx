/**
 * Live preview renderer for landing page editor.
 * Renders sections from React state directly — no server round-trip needed.
 * Mirrors the Astro section components but as simple React divs.
 */
import { useEffect } from 'react'
import type { LandingSection, LandingDesign, HeroData, FeaturesData, PricingData, TestimonialsData, FaqData, CtaData, StatsData, HowItWorksData, TeamData, LogoWallData, NavData, FooterData, VideoData, ImageData, ImageTextData, GalleryData, MapData, RichTextData, DividerData, CountdownData, ContactFormData, BannerData, LayoutData } from '@/lib/landing/landing-types'
import { designToCssVars, designFontsUrl } from '@/lib/landing/landing-design-presets'

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

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #e2e8f0', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <strong style={{ fontSize: '1rem', color: 'var(--lp-text, #1e293b)' }}>{data.brandName || pageTitle || 'Home'}</strong>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {links.map((l, i) => <span key={i} style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted, #64748b)' }}>{l.label}</span>)}
      </div>
    </div>
  )
}

function PreviewHero({ data }: { data: HeroData }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'rgba(255,255,255,0.5)', borderRadius: '16px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--lp-text, #1e293b)', marginBottom: '0.5rem' }}>{data.headline}</h1>
      {data.subheadline && <p style={{ color: 'var(--lp-text-muted, #64748b)', fontSize: '1rem', marginBottom: '1.5rem' }}>{data.subheadline}</p>}
      {data.cta && <span style={{ display: 'inline-block', background: 'var(--lp-primary, #16a34a)', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600 }}>{data.cta.text}</span>}
    </div>
  )
}

function PreviewFeatures({ data }: { data: FeaturesData }) {
  return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'var(--lp-text, #1e293b)', marginBottom: '1rem' }}>{data.heading}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.columns || 3}, 1fr)`, gap: '1rem' }}>
        {data.items?.map((item, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '1rem' }}>
            {item.icon && <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>}
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--lp-text, #1e293b)', margin: '0.5rem 0 0.25rem' }}>{item.title}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted, #64748b)' }}>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewPricing({ data }: { data: PricingData }) {
  return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'var(--lp-text, #1e293b)', marginBottom: '1rem' }}>{data.heading}</h2>}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {data.plans?.map((plan, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '1.5rem', minWidth: '180px', border: plan.highlighted ? '2px solid #16a34a' : '1px solid #e2e8f0' }}>
            <h3 style={{ fontWeight: 600, color: 'var(--lp-text, #1e293b)' }}>{plan.name}</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--lp-text, #1e293b)' }}>{plan.price}<span style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted, #94a3b8)' }}>{plan.period}</span></p>
            <ul style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted, #64748b)', listStyle: 'none', padding: 0 }}>
              {plan.features?.map((f, j) => <li key={j} style={{ padding: '0.15rem 0' }}>✓ {f}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewText({ heading, items }: { heading?: string; items?: Array<Record<string, unknown>> }) {
  /** Extract display text from any item shape */
  function itemText(item: Record<string, unknown>): string {
    return (item.question || item.quote || item.title || item.description || item.value || '') as string
  }
  function itemSub(item: Record<string, unknown>): string {
    if (item.answer) return item.answer as string
    if (item.role && item.name) return `${item.role}`
    if (item.company) return `${item.role || ''}, ${item.company}`
    if (item.label) return item.label as string
    return ''
  }
  function itemName(item: Record<string, unknown>): string {
    return (item.name || '') as string
  }
  return (
    <div style={{ padding: '2rem 1rem' }}>
      {heading && <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'var(--lp-text, #1e293b)', marginBottom: '1rem' }}>{heading}</h2>}
      {items?.map((item, i) => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '0.5rem' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--lp-text, #1e293b)' }}>{itemText(item) || itemName(item)}</p>
          {itemSub(item) && <p style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted, #64748b)' }}>{itemSub(item)}</p>}
          {itemName(item) && itemText(item) && <p style={{ fontSize: '0.75rem', color: 'var(--lp-text-muted, #94a3b8)' }}>— {itemName(item)}</p>}
        </div>
      ))}
    </div>
  )
}

function PreviewCta({ data }: { data: CtaData }) {
  const v = data.variant || 'default'
  const btn = <span style={{ display: 'inline-block', background: 'var(--lp-primary)', color: '#fff', padding: '0.5rem 1.5rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600 }}>{data.cta?.text}</span>

  if (v === 'split') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', padding: '2rem', background: 'var(--lp-surface)', borderRadius: '14px', flexWrap: 'wrap' }}>
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--lp-text)' }}>{data.headline}</h2>
        {data.subheadline && <p style={{ color: 'var(--lp-text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{data.subheadline}</p>}
      </div>
      {btn}
    </div>
  )
  if (v === 'banner') return (
    <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'linear-gradient(135deg, var(--lp-primary), var(--lp-secondary))', borderRadius: '14px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>{data.headline}</h2>
      {data.subheadline && <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '1rem' }}>{data.subheadline}</p>}
      <span style={{ display: 'inline-block', background: '#fff', color: 'var(--lp-primary)', padding: '0.5rem 1.5rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}>{data.cta?.text}</span>
    </div>
  )
  if (v === 'minimal') return (
    <div style={{ textAlign: 'center', padding: '1.5rem' }}>
      <p style={{ fontSize: '0.95rem' }}>
        <span style={{ color: 'var(--lp-text-muted)' }}>{data.headline}</span>{' '}
        <span style={{ color: 'var(--lp-primary)', fontWeight: 600, textDecoration: 'underline' }}>{data.cta?.text}</span>
      </p>
    </div>
  )
  if (v === 'with-image') return (
    <div style={{ textAlign: 'center', padding: '3rem 2rem', borderRadius: '14px', position: 'relative', overflow: 'hidden', background: data.backgroundImage ? `url(${data.backgroundImage}) center/cover` : 'var(--lp-surface)' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>{data.headline}</h2>
        {data.subheadline && <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1rem' }}>{data.subheadline}</p>}
        {btn}
      </div>
    </div>
  )
  // default
  return (
    <div style={{ textAlign: 'center', padding: '2.5rem 2rem', background: 'var(--lp-surface)', borderRadius: '14px' }}>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--lp-text)', marginBottom: '0.5rem' }}>{data.headline}</h2>
      {data.subheadline && <p style={{ color: 'var(--lp-text-muted)', marginBottom: '1rem' }}>{data.subheadline}</p>}
      {btn}
    </div>
  )
}

function PreviewStats({ data }: { data: StatsData }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', padding: '2rem', flexWrap: 'wrap' }}>
      {data.items?.map((s, i) => (
        <div key={i} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--lp-accent, #16a34a)' }}>{s.prefix}{s.value}{s.suffix}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted, #64748b)' }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

function PreviewFooter({ data, pageTitle }: { data: FooterData; pageTitle?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '1.5rem', borderTop: '1px solid #e2e8f0', color: 'var(--lp-text-muted, #94a3b8)', fontSize: '0.8rem' }}>
      {data.text || `© ${new Date().getFullYear()} ${pageTitle || ''}`}
    </div>
  )
}

function PreviewVideo({ data }: { data: VideoData }) {
  return (
    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem' }}>▶</div>
      <p style={{ fontSize: '0.8rem', color: '#475569', wordBreak: 'break-all' }}>{data.url}</p>
      {data.caption && <p style={{ fontSize: '0.75rem', color: 'var(--lp-text-muted, #94a3b8)' }}>{data.caption}</p>}
    </div>
  )
}

function PreviewImage({ data }: { data: ImageData }) {
  return (
    <div style={{ padding: '0.5rem', textAlign: 'center' }}>
      <div style={{ background: '#e2e8f0', borderRadius: '8px', padding: '2rem', fontSize: '0.75rem', color: 'var(--lp-text-muted, #94a3b8)' }}>
        [Image] {data.alt || data.src}
      </div>
      {data.caption && <p style={{ fontSize: '0.75rem', color: 'var(--lp-text-muted, #94a3b8)', marginTop: '4px' }}>{data.caption}</p>}
    </div>
  )
}

function PreviewImageText({ data }: { data: ImageTextData }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '1rem', flexDirection: data.imagePosition === 'right' ? 'row-reverse' : 'row' }}>
      <div style={{ flex: 1, background: '#e2e8f0', borderRadius: '8px', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--lp-text-muted, #94a3b8)' }}>Image</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
        {data.heading && <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--lp-text, #1e293b)' }}>{data.heading}</p>}
        <p style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted, #64748b)' }}>{data.text}</p>
        {data.cta && <span style={{ fontSize: '0.75rem', color: 'var(--lp-accent, #16a34a)', fontWeight: 600 }}>{data.cta.text} →</span>}
      </div>
    </div>
  )
}

function PreviewGallery({ data }: { data: GalleryData }) {
  return (
    <div style={{ padding: '1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 700, color: 'var(--lp-text, #1e293b)', marginBottom: '0.75rem' }}>{data.heading}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        {(data.images || []).map((_, i) => (
          <div key={i} style={{ background: '#e2e8f0', borderRadius: '6px', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--lp-text-muted, #94a3b8)' }}>img</div>
        ))}
        {(data.images || []).length === 0 && [0,1,2].map(i => (
          <div key={i} style={{ background: '#e2e8f0', borderRadius: '6px', aspectRatio: '1' }} />
        ))}
      </div>
    </div>
  )
}

function PreviewMap({ data }: { data: MapData }) {
  return (
    <div style={{ padding: '1rem', background: '#e2e8f0', borderRadius: '10px', textAlign: 'center', minHeight: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '1.5rem' }}>📍</span>
      <p style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted, #64748b)', marginTop: '4px' }}>{data.address || data.embedUrl || 'Map'}</p>
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
  return <div style={{ height: h, display: 'flex', alignItems: 'center', padding: '0 2rem' }}><hr style={{ width: '100%', border: 'none', borderTop: '1px solid #e2e8f0' }} /></div>
}

function PreviewCountdown({ data }: { data: CountdownData }) {
  return (
    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
      {data.heading && <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--lp-text, #1e293b)', marginBottom: '0.75rem' }}>{data.heading}</p>}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        {['DD','HH','MM','SS'].map((u) => (
          <div key={u} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--lp-accent, #16a34a)' }}>{u}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--lp-text-muted, #94a3b8)' }}>{u === 'DD' ? 'Days' : u === 'HH' ? 'Hours' : u === 'MM' ? 'Mins' : 'Secs'}</div>
          </div>
        ))}
      </div>
      {data.targetDate && <p style={{ fontSize: '0.7rem', color: 'var(--lp-text-muted, #94a3b8)', marginTop: '0.5rem' }}>{data.targetDate}</p>}
    </div>
  )
}

function PreviewContactForm({ data }: { data: ContactFormData }) {
  const fields = data.fields || []
  return (
    <div style={{ padding: '1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 700, color: 'var(--lp-text, #1e293b)', marginBottom: '0.75rem' }}>{data.heading}</h2>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '300px', margin: '0 auto' }}>
        {fields.map((f, i) => (
          <div key={i} style={{ background: '#f1f5f9', borderRadius: '6px', padding: '0.5rem', fontSize: '0.75rem', color: 'var(--lp-text-muted, #64748b)' }}>{f.label} ({f.type})</div>
        ))}
        {fields.length === 0 && <div style={{ background: '#f1f5f9', borderRadius: '6px', padding: '0.5rem', fontSize: '0.75rem', color: 'var(--lp-text-muted, #94a3b8)' }}>No fields configured</div>}
        <div style={{ background: 'var(--lp-primary, #16a34a)', borderRadius: '6px', padding: '0.4rem 1rem', fontSize: '0.75rem', color: 'white', textAlign: 'center', alignSelf: 'flex-start' }}>{data.submitText || 'Send Message'}</div>
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
              <div style={{ textAlign: 'center', color: 'var(--lp-text-muted, #94a3b8)', fontSize: '0.65rem', padding: '0.5rem' }}>Column {colIdx + 1} (empty)</div>
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
    case 'testimonials': return <PreviewText heading={(d as any).heading} items={(d as any).items} />
    case 'faq': return <PreviewText heading={(d as any).heading} items={(d as any).items} />
    case 'how-it-works': return <PreviewText heading={(d as any).heading} items={(d as any).items} />
    case 'team': return <PreviewText heading={(d as any).heading} items={(d as any).members} />
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
    case 'layout': return <PreviewLayout data={d as unknown as LayoutData} />
    default: return <div style={{ padding: '1rem', color: 'var(--lp-text-muted, #94a3b8)', textAlign: 'center' }}>[{section.type}]</div>
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
      {/* Inject heading font rule so all h1/h2/h3 in preview use --lp-font-heading */}
      <style>{`.landing-page-root h1,.landing-page-root h2,.landing-page-root h3{font-family:var(--lp-font-heading,system-ui),system-ui,sans-serif}`}</style>
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
