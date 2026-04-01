/**
 * Layout section preview renderers: stats, how-it-works, team, and faq.
 * These are structural/informational sections with multiple variant support.
 */
import type { StatsData, HowItWorksData, TeamData, FaqData } from '@/lib/landing/landing-types'

export function PreviewStats({ data }: { data: StatsData }) {
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

export function PreviewHowItWorks({ data }: { data: HowItWorksData }) {
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

export function PreviewTeam({ data }: { data: TeamData }) {
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

export function PreviewFaq({ data }: { data: FaqData }) {
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
            <p style={{ fontWeight: 600 }}>{'\u25B8'} {faq.question}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
