/**
 * Live preview renderer for landing page editor.
 * Renders sections from React state directly — no server round-trip needed.
 * Mirrors the Astro section components but as simple React divs.
 */
import type { LandingSection, HeroData, FeaturesData, PricingData, TestimonialsData, FaqData, CtaData, StatsData, HowItWorksData, TeamData, LogoWallData, NavData, FooterData } from '@/lib/landing/landing-types'

interface Props {
  sections: LandingSection[]
  pageTitle?: string
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
      <strong style={{ fontSize: '1rem', color: '#1e293b' }}>{data.brandName || pageTitle || 'Home'}</strong>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {links.map((l, i) => <span key={i} style={{ fontSize: '0.8rem', color: '#64748b' }}>{l.label}</span>)}
      </div>
    </div>
  )
}

function PreviewHero({ data }: { data: HeroData }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'rgba(255,255,255,0.5)', borderRadius: '16px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>{data.headline}</h1>
      {data.subheadline && <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '1.5rem' }}>{data.subheadline}</p>}
      {data.cta && <span style={{ display: 'inline-block', background: '#16a34a', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600 }}>{data.cta.text}</span>}
    </div>
  )
}

function PreviewFeatures({ data }: { data: FeaturesData }) {
  return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>{data.heading}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.columns || 3}, 1fr)`, gap: '1rem' }}>
        {data.items?.map((item, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '1rem' }}>
            {item.icon && <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>}
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', margin: '0.5rem 0 0.25rem' }}>{item.title}</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewPricing({ data }: { data: PricingData }) {
  return (
    <div style={{ padding: '2rem 1rem' }}>
      {data.heading && <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>{data.heading}</h2>}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {data.plans?.map((plan, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '1.5rem', minWidth: '180px', border: plan.highlighted ? '2px solid #16a34a' : '1px solid #e2e8f0' }}>
            <h3 style={{ fontWeight: 600, color: '#1e293b' }}>{plan.name}</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{plan.price}<span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{plan.period}</span></p>
            <ul style={{ fontSize: '0.8rem', color: '#64748b', listStyle: 'none', padding: 0 }}>
              {plan.features?.map((f, j) => <li key={j} style={{ padding: '0.15rem 0' }}>✓ {f}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewText({ heading, items }: { heading?: string; items?: Array<{ question?: string; quote?: string; name?: string; [k: string]: unknown }> }) {
  return (
    <div style={{ padding: '2rem 1rem' }}>
      {heading && <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>{heading}</h2>}
      {items?.map((item, i) => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '0.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#1e293b' }}>{item.question || item.quote || item.title || JSON.stringify(item)}</p>
          {item.name && <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>— {item.name as string}</p>}
        </div>
      ))}
    </div>
  )
}

function PreviewCta({ data }: { data: CtaData }) {
  return (
    <div style={{ textAlign: 'center', padding: '2.5rem 2rem', background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(59,130,246,0.1))', borderRadius: '14px' }}>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>{data.headline}</h2>
      {data.subheadline && <p style={{ color: '#64748b', marginBottom: '1rem' }}>{data.subheadline}</p>}
      {data.cta && <span style={{ display: 'inline-block', background: '#16a34a', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600 }}>{data.cta.text}</span>}
    </div>
  )
}

function PreviewStats({ data }: { data: StatsData }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', padding: '2rem', flexWrap: 'wrap' }}>
      {data.items?.map((s, i) => (
        <div key={i} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#16a34a' }}>{s.prefix}{s.value}{s.suffix}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

function PreviewFooter({ data, pageTitle }: { data: FooterData; pageTitle?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '1.5rem', borderTop: '1px solid #e2e8f0', color: '#94a3b8', fontSize: '0.8rem' }}>
      {data.text || `© ${new Date().getFullYear()} ${pageTitle || ''}`}
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
    default: return <div style={{ padding: '1rem', color: '#94a3b8', textAlign: 'center' }}>[{section.type}]</div>
  }
}

export function LandingLivePreview({ sections, pageTitle }: Props) {
  const enabled = sections.filter(s => s.enabled !== false)
  const navSection = enabled.find(s => s.type === 'nav')
  const footerSection = enabled.find(s => s.type === 'footer')
  const body = enabled.filter(s => s.type !== 'nav' && s.type !== 'footer').sort((a, b) => a.order - b.order)

  return (
    <div style={{ background: '#f8fafc', borderRadius: '8px', overflow: 'hidden', height: '100%', overflowY: 'auto', fontSize: '0.85em' }}>
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
