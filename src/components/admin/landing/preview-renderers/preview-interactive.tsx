/**
 * Interactive section preview renderers: countdown timer, contact form, popup placeholder, and map embed.
 */
import type { CountdownData, ContactFormData, MapData } from '@/lib/landing/landing-types'

export function PreviewCountdown({ data }: { data: CountdownData }) {
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

export function PreviewContactForm({ data }: { data: ContactFormData }) {
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

export function PreviewPopup() {
  return (
    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--lp-text-muted)', background: 'var(--lp-surface)', borderRadius: '8px', border: '1px dashed var(--lp-text-muted, #94a3b8)' }}>
      {'\uD83E\uDE9F'} Popup — appears as overlay on published page
    </div>
  )
}

export function PreviewMap({ data }: { data: MapData }) {
  return (
    <div style={{ padding: '1rem', background: 'var(--lp-text-muted, #94a3b8)', borderRadius: '10px', textAlign: 'center', minHeight: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '1.5rem' }}>{'\uD83D\uDCCD'}</span>
      <p style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted)', marginTop: '4px' }}>{data.address || data.embedUrl || 'Map'}</p>
    </div>
  )
}
