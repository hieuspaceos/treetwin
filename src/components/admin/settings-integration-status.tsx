/**
 * Integration status panel — shows configured/not-configured status for env-based features
 * Displayed in admin Settings page. Read-only — env vars managed via Vercel dashboard.
 */
import { useState, useEffect } from 'react'

interface IntegrationItem {
  name: string
  description: string
  envVar: string
  configured: boolean
  value?: string
  docsUrl?: string
}

const checkIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const xIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

export function SettingsIntegrationStatus() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/integrations')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setIntegrations(data.data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', marginTop: '1.5rem' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading integrations...</p>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
        Integrations
      </h2>
      <div className="glass-panel" style={{ padding: '1rem', borderRadius: '14px' }}>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1rem' }}>
          Manage env vars in Vercel Dashboard &gt; Settings &gt; Environment Variables
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {integrations.map((item) => (
            <div
              key={item.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                background: item.configured ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)',
                border: `1px solid ${item.configured ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)'}`,
              }}
            >
              {item.configured ? checkIcon : xIcon}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {item.configured ? (item.value || 'Configured') : `Set ${item.envVar}`}
                  {' '}&middot; {item.description}
                </div>
              </div>
              {item.docsUrl && (
                <a
                  href={item.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.7rem', color: '#6366f1', textDecoration: 'none', whiteSpace: 'nowrap' }}
                >
                  Docs
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
