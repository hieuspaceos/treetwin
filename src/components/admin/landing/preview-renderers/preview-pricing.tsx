/**
 * Pricing section preview renderer with cards, simple, and highlight-center variants.
 */
import type { PricingData } from '@/lib/landing/landing-types'

export function PreviewPricing({ data }: { data: PricingData }) {
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
                {plan.features?.map((f, j) => <li key={j} style={{ padding: '0.2rem 0', color: 'var(--lp-text-muted)' }}><span style={{ color: 'var(--lp-primary)' }}>&#x2713;</span> {f}</li>)}
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
              {plan.features?.map((f, j) => <li key={j} style={{ padding: '0.2rem 0' }}><span style={{ color: 'var(--lp-primary)' }}>&#x2713;</span> {f}</li>)}
            </ul>
            {plan.cta?.text && <span className={plan.highlighted ? 'landing-btn-primary' : 'landing-btn-secondary'} style={{ marginTop: '1.5rem', textAlign: 'center', display: 'block' }}>{plan.cta.text}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
