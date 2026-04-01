/**
 * Features section preview renderer with grid, list, and alternating variants.
 */
import type { FeaturesData } from '@/lib/landing/landing-types'

export function PreviewFeatures({ data }: { data: FeaturesData }) {
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
            {!item.icon && <div className="lp-icon-bg">&#x2713;</div>}
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
              {item.icon || '\u2726'}
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
