/**
 * Testimonials section preview renderer with cards, single, minimal, and carousel variants.
 */
import type { TestimonialsData } from '@/lib/landing/landing-types'

export function PreviewTestimonials({ data }: { data: TestimonialsData }) {
  const v = data.variant || 'cards'
  const items = data.items || []

  if (v === 'single') return (
    <div className="landing-section" style={{ textAlign: 'center' }}>
      {data.heading && <h2 className="lp-section-heading" style={{ marginBottom: '2rem' }}>{data.heading}</h2>}
      {items[0] && (
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2.5rem', background: 'color-mix(in srgb, var(--lp-primary) 4%, var(--lp-surface))', borderRadius: 'var(--lp-radius)', position: 'relative' }}>
          <div className="lp-quote-mark" style={{ position: 'absolute', top: '0.5rem', left: '1.5rem' }}>{'\u275D'}</div>
          <div className="lp-stars" style={{ marginBottom: '0.75rem' }}>{'\u2605\u2605\u2605\u2605\u2605'}</div>
          <p style={{ fontStyle: 'italic', fontSize: '1.125rem', lineHeight: 1.7, color: 'var(--lp-text)', marginBottom: '1.5rem' }}>"{items[0].quote}"</p>
          <p style={{ fontWeight: 600 }}>{items[0].name}</p>
          {(items[0].role || items[0].company) && <p style={{ fontSize: '0.875rem', color: 'var(--lp-text-muted)' }}>{[items[0].role, items[0].company].filter(Boolean).join(' \u00B7 ')}</p>}
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
            <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{'\u2014'} {t.name}{t.role ? `, ${t.role}` : ''}</p>
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
            <div className="lp-stars" style={{ marginBottom: '0.75rem' }}>{'\u2605\u2605\u2605\u2605\u2605'}</div>
            {t.image && <img src={t.image} alt={t.name} style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem', objectFit: 'cover', maxHeight: '200px' }} />}
            <p style={{ fontStyle: 'italic', lineHeight: 1.7, color: 'var(--lp-text-muted)', marginBottom: '1.25rem' }}>"{t.quote}"</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid color-mix(in srgb, var(--lp-text) 8%, transparent)', paddingTop: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'color-mix(in srgb, var(--lp-primary) 15%, var(--lp-surface))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--lp-primary)', flexShrink: 0 }}>
                {t.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.name}</p>
                {(t.role || t.company) && <p style={{ fontSize: '0.75rem', color: 'var(--lp-text-muted)' }}>{[t.role, t.company].filter(Boolean).join(' \u00B7 ')}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
