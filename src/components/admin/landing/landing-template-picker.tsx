/**
 * Template picker modal — shows available landing page templates.
 * Fetches from api.templates.list(), displays as card grid.
 * On select, calls onSelect(templateName) to navigate to editor with pre-filled data.
 */
import { useEffect, useState } from 'react'
import { api } from '@/lib/admin/api-client'

interface TemplateMeta {
  name: string
  description?: string
  targetAudience?: string
  sectionCount?: number
}

interface Props {
  onSelect: (templateName: string) => void
  onClose: () => void
}

export function LandingTemplatePicker({ onSelect, onClose }: Props) {
  const [templates, setTemplates] = useState<TemplateMeta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.templates.list().then((res) => {
      if (res.ok && Array.isArray(res.data)) {
        setTemplates(res.data as TemplateMeta[])
      }
      setLoading(false)
    })
  }, [])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '16px', maxWidth: '640px', width: '100%',
          maxHeight: '80vh', overflow: 'auto', padding: '1.5rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Choose a Template</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        {loading && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Loading templates...</p>}

        {!loading && templates.length === 0 && (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No templates found.</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
          {templates.map((tpl) => (
            <div
              key={tpl.name}
              onClick={() => onSelect(tpl.name)}
              style={{
                padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#f0f9ff' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '' }}
            >
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.3rem', textTransform: 'capitalize' }}>
                {tpl.name}
              </h3>
              {tpl.description && (
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.4rem', lineHeight: 1.4 }}>{tpl.description}</p>
              )}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {tpl.targetAudience && (
                  <span style={{ fontSize: '0.65rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '99px' }}>
                    {tpl.targetAudience}
                  </span>
                )}
                {typeof tpl.sectionCount === 'number' && (
                  <span style={{ fontSize: '0.65rem', background: '#eff6ff', color: '#3b82f6', padding: '2px 8px', borderRadius: '99px' }}>
                    {tpl.sectionCount} sections
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
