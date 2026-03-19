/**
 * Voice preview modal — pick an article, AI writes 1-2 paragraphs in this voice
 * Minimal token usage: sends only article title + voice metadata (no full content)
 * Lets user experience how the voice sounds on real topics before committing
 */
import { useState, useEffect } from 'react'
import { api, type EntryMeta } from '@/lib/admin/api-client'

interface Props {
  values: Record<string, unknown>
  onClose: () => void
}

export function VoicePreviewModal({ values, onClose }: Props) {
  const [articles, setArticles] = useState<EntryMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<EntryMeta | null>(null)
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const voiceName = String(values.name || 'Untitled Voice')

  // Load article list on mount
  useEffect(() => {
    api.collections.list('articles').then((res) => {
      setArticles(res.data?.entries || [])
      setLoading(false)
    })
  }, [])

  async function generatePreview(article: EntryMeta) {
    setSelected(article)
    setGenerating(true)
    setError(null)
    setPreview(null)

    try {
      const res = await fetch('/api/admin/voice-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice: values,
          articleTitle: article.title,
          articleDescription: article.description,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setPreview(data.preview)
      } else {
        setError(data.error || 'Generation failed')
      }
    } catch {
      setError('Network error')
    }
    setGenerating(false)
  }

  return (
    <div className="media-dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="media-dialog" style={{ maxWidth: 640 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
              Preview: {voiceName}
            </h2>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.2rem 0 0' }}>
              {selected ? 'AI-generated opening using this voice' : 'Choose an article to see how this voice sounds'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="admin-btn admin-btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
            Close
          </button>
        </div>

        {/* Preview result */}
        {preview && selected && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              "{selected.title}" written in {voiceName}
            </div>
            <div style={{
              padding: '1rem', borderRadius: 10,
              background: 'rgba(0,0,0,0.02)', borderLeft: '3px solid var(--t-accent, #6366f1)',
              fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.8, whiteSpace: 'pre-wrap',
            }}>
              {preview}
            </div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '0.35rem', fontStyle: 'italic' }}>
              This is AI-generated preview only — not saved anywhere
            </div>
          </div>
        )}

        {generating && (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
            Generating preview...
          </div>
        )}

        {error && (
          <div style={{ fontSize: '0.7rem', color: '#dc2626', marginBottom: '0.75rem' }}>{error}</div>
        )}

        {/* Article list */}
        <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
          {selected ? 'Try another article' : 'Select an article'}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.8rem' }}>Loading articles...</div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.8rem' }}>
            No articles yet. Create an article first to preview this voice.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '250px', overflowY: 'auto' }}>
            {articles.map((a) => (
              <button
                key={a.slug}
                type="button"
                onClick={() => generatePreview(a)}
                disabled={generating}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 0.75rem', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                  background: selected?.slug === a.slug ? 'rgba(99,102,241,0.08)' : 'rgba(0,0,0,0.02)',
                  transition: 'background 150ms ease',
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#1e293b', flex: 1 }}>{a.title}</span>
                <span className={`admin-badge admin-badge-${a.status}`} style={{ flexShrink: 0 }}>{a.status}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
