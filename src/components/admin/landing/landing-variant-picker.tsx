/**
 * Visual variant picker for landing page section forms.
 * Replaces plain <select> dropdowns with clickable cards showing ASCII previews.
 * Horizontally scrollable row; selected card highlighted in blue.
 */
import { VARIANT_LABELS } from './landing-label-maps'
import { VARIANT_PREVIEWS } from './landing-variant-previews'

interface Props {
  sectionType: string
  value: string
  onChange: (value: string) => void
}

export function VariantPicker({ sectionType, value, onChange }: Props) {
  const labels = VARIANT_LABELS[sectionType] || {}
  const previews = VARIANT_PREVIEWS[sectionType] || {}
  const variants = Object.keys(labels)

  if (variants.length === 0) return null

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>
        Style
      </label>
      <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', scrollbarWidth: 'thin', paddingBottom: '2px' }}>
        {variants.map((v) => {
          const isSelected = (value || variants[0]) === v
          const preview = previews[v]
          const label = labels[v] || v
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              title={label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.2rem',
                padding: '0.4rem 0.5rem',
                minWidth: '60px',
                flexShrink: 0,
                border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                borderRadius: '6px',
                background: isSelected ? '#eff6ff' : 'white',
                cursor: 'pointer',
                transition: 'all 0.1s',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#93c5fd'
                  e.currentTarget.style.background = '#f8fbff'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#e2e8f0'
                  e.currentTarget.style.background = 'white'
                }
              }}
            >
              {preview ? (
                <pre style={{
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '0.55rem',
                  lineHeight: 1.3,
                  color: isSelected ? '#1d4ed8' : '#64748b',
                  whiteSpace: 'pre',
                  textAlign: 'center',
                  userSelect: 'none',
                }}>{preview}</pre>
              ) : (
                <span style={{ fontSize: '0.75rem', color: isSelected ? '#1d4ed8' : '#64748b' }}>▤</span>
              )}
              <span style={{
                fontSize: '0.6rem',
                color: isSelected ? '#1d4ed8' : '#64748b',
                fontWeight: isSelected ? 600 : 400,
                textAlign: 'center',
                lineHeight: 1.2,
                maxWidth: '64px',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as const,
              }}>{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
