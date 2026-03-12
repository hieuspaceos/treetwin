/**
 * Admin analytics page — GA4 setup status + quick links
 * Shows measurement ID if configured, setup instructions otherwise
 */

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(12px)',
  borderRadius: '16px',
  border: '1px solid rgba(148,163,184,0.15)',
  padding: '1.5rem',
  marginBottom: '1.5rem',
}

const linkBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.6rem 1.2rem',
  borderRadius: '8px',
  background: '#1e293b',
  color: 'white',
  fontSize: '0.875rem',
  fontWeight: 600,
  textDecoration: 'none',
  border: 'none',
  cursor: 'pointer',
}

const codeStyle: React.CSSProperties = {
  display: 'inline-block',
  background: 'rgba(148,163,184,0.15)',
  borderRadius: '6px',
  padding: '0.2rem 0.5rem',
  fontFamily: 'monospace',
  fontSize: '0.85rem',
  color: '#1e293b',
}

// Read measurement ID from meta tag injected by Astro at build time
function getMeasurementId(): string {
  if (typeof document === 'undefined') return ''
  return (document.querySelector('meta[name="ga-measurement-id"]') as HTMLMetaElement)?.content ?? ''
}

export function AdminAnalyticsPage() {
  const measurementId = getMeasurementId()
  const isConfigured = !!measurementId

  return (
    <div>
      <div style={cardStyle}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>
          Google Analytics 4
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
          {isConfigured ? 'Tracking is active on your site.' : 'Not configured — set GA_MEASUREMENT_ID to enable.'}
        </p>
      </div>

      {isConfigured ? (
        <>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.75rem' }}>
              Configuration
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
              Measurement ID: <span style={codeStyle}>{measurementId}</span>
            </p>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
              GA4 tracking script is injected on every page. Data flows to your GA4 property automatically.
            </p>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem' }}>
              Quick Links
            </h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a
                href="https://analytics.google.com"
                target="_blank"
                rel="noopener noreferrer"
                style={linkBtnStyle}
              >
                Open GA4 Dashboard ↗
              </a>
              <a
                href={`https://analytics.google.com/analytics/web/#/p?measurementId=${measurementId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...linkBtnStyle, background: 'rgba(148,163,184,0.15)', color: '#475569' }}
              >
                Real-time Report ↗
              </a>
            </div>
          </div>
        </>
      ) : (
        <div style={cardStyle}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem' }}>
            Setup Instructions
          </h3>
          <ol style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.8, paddingLeft: '1.2rem', margin: '0 0 1.25rem' }}>
            <li>Go to <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>analytics.google.com</a> and create a GA4 property</li>
            <li>Copy your Measurement ID (format: <span style={codeStyle}>G-XXXXXXXXXX</span>)</li>
            <li>Add to your <span style={codeStyle}>.env.local</span>: <span style={codeStyle}>GA_MEASUREMENT_ID=G-XXXXXXXXXX</span></li>
            <li>Redeploy — tracking script will be injected automatically</li>
          </ol>
          <a
            href="https://support.google.com/analytics/answer/9539598"
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...linkBtnStyle, background: 'rgba(148,163,184,0.15)', color: '#475569' }}
          >
            GA4 Setup Guide ↗
          </a>
        </div>
      )}
    </div>
  )
}
