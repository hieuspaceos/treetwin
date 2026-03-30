/**
 * Landing pages list — grid of cards with create button
 */
import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { api } from '@/lib/admin/api-client'
import { LandingTemplatePicker } from './landing-template-picker'

interface PageMeta {
  slug: string
  title: string
  template?: string
  sectionCount: number
}

interface BacklogItem { type: string; quality: string; issue: string; count: number; urls: string[] }

export function LandingPagesList() {
  const [, navigate] = useLocation()
  const [pages, setPages] = useState<PageMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [backlog, setBacklog] = useState<{ totalClones: number; needsReview: boolean; sections: BacklogItem[] } | null>(null)
  const [improving, setImproving] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)

  useEffect(() => {
    api.landing.list().then((res) => {
      setPages((res.data as any)?.entries || [])
      setLoading(false)
    })
    fetch('/api/admin/landing/clone-stats').then(r => r.json()).then(d => setBacklog(d)).catch(() => {})
  }, [])

  /** Trigger AI improvement for a single landing page's poor/partial sections */
  async function handleImprove(slug: string) {
    if (improving) return
    setImproving(slug)
    try {
      const res = await fetch('/api/admin/landing/improve-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
      const data = await res.json()
      if (data.ok) {
        const count = data.data?.improved || 0
        alert(count > 0 ? `Improved ${count} section(s) for "${slug}"` : `All sections already good quality`)
        // Refresh page list to update section counts
        api.landing.list().then((r) => setPages((r.data as any)?.entries || []))
      } else {
        alert(`Improve failed: ${data.error}`)
      }
    } catch (e) {
      alert(`Improve failed: ${(e as Error).message}`)
    } finally {
      setImproving(null)
    }
  }

  async function handleDelete(slug: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return
    const res = await api.landing.delete(slug)
    if (res.ok) {
      setPages((prev) => prev.filter((p) => p.slug !== slug))
      setSelected((prev) => { const n = new Set(prev); n.delete(slug); return n })
    }
  }

  function toggleSelect(slug: string) {
    setSelected((prev) => {
      const n = new Set(prev)
      n.has(slug) ? n.delete(slug) : n.add(slug)
      return n
    })
  }

  function toggleSelectAll() {
    setSelected((prev) => prev.size === pages.length ? new Set() : new Set(pages.map(p => p.slug)))
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} landing page(s)?`)) return
    setDeleting(true)
    const slugs = [...selected]
    const results = await Promise.allSettled(slugs.map(slug => api.landing.delete(slug)))
    const deleted = slugs.filter((_, i) => results[i].status === 'fulfilled' && (results[i] as PromiseFulfilledResult<any>).value.ok)
    setPages((prev) => prev.filter((p) => !deleted.includes(p.slug)))
    setSelected(new Set())
    setDeleting(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Landing Pages</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="admin-btn" onClick={() => navigate('/landing/wizard')}>
            AI Wizard
          </button>
          <button className="admin-btn" onClick={() => setTemplateOpen(true)}>
            Templates
          </button>
          <button className="admin-btn admin-btn-primary" onClick={() => navigate('/landing/new')}>
            + New Page
          </button>
        </div>
      </div>

      {loading && <p style={{ color: '#94a3b8' }}>Loading...</p>}

      {!loading && pages.length === 0 && (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: '14px' }}>
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>No landing pages yet.</p>
          <button className="admin-btn admin-btn-primary" onClick={() => navigate('/landing/new')}>
            Create your first page
          </button>
        </div>
      )}

      {/* Bulk action bar — visible when pages exist */}
      {!loading && pages.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: selected.size > 0 ? '#eff6ff' : '#f8fafc', borderRadius: '10px', transition: 'background 0.15s' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem', color: '#475569', userSelect: 'none' }}>
            <input type="checkbox" checked={pages.length > 0 && selected.size === pages.length} onChange={toggleSelectAll}
              style={{ accentColor: '#3b82f6', width: '15px', height: '15px', cursor: 'pointer' }} />
            Select all
          </label>
          {selected.size > 0 && (
            <>
              <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>{selected.size} selected</span>
              <button className="admin-btn" onClick={handleBulkDelete} disabled={deleting}
                style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#fff', background: '#ef4444', border: 'none', padding: '0.35rem 0.85rem', borderRadius: '8px', cursor: deleting ? 'wait' : 'pointer' }}>
                {deleting ? 'Deleting...' : `Delete ${selected.size}`}
              </button>
            </>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {pages.map((page) => (
          <div key={page.slug} className="glass-card" style={{ padding: '1.25rem', borderRadius: '12px', outline: selected.has(page.slug) ? '2px solid #3b82f6' : 'none', outlineOffset: '-2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
              <input type="checkbox" checked={selected.has(page.slug)} onChange={() => toggleSelect(page.slug)}
                style={{ accentColor: '#3b82f6', width: '15px', height: '15px', cursor: 'pointer', flexShrink: 0, marginTop: '2px' }} />
              <h3 style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem', flex: 1 }}>{page.title}</h3>
              <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '99px' }}>
                {page.sectionCount} sections
              </span>
            </div>
            {page.template && (
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                Template: {page.template}
              </p>
            )}
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1rem', fontFamily: 'monospace' }}>
              /{page.slug}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="admin-btn admin-btn-primary" style={{ flex: 1, fontSize: '0.8rem' }}
                onClick={() => navigate(`/landing/${page.slug}`)}>
                Edit
              </button>
              <button className="admin-btn" style={{ fontSize: '0.8rem' }}
                disabled={improving === page.slug}
                onClick={() => handleImprove(page.slug)}>
                {improving === page.slug ? 'Improving...' : 'AI Improve'}
              </button>
              <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer"
                className="admin-btn" style={{ fontSize: '0.8rem' }}>
                Preview
              </a>
              <button className="admin-btn" style={{ fontSize: '0.8rem', color: '#ef4444' }}
                onClick={() => handleDelete(page.slug, page.title)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Template picker modal */}
      {templateOpen && (
        <LandingTemplatePicker
          onClose={() => setTemplateOpen(false)}
          onSelect={(name) => { setTemplateOpen(false); navigate(`/landing/new?template=${encodeURIComponent(name)}`) }}
        />
      )}

      {/* Section Backlog — AI clone quality tracker */}
      {backlog && backlog.sections && backlog.sections.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>
              Section Improvement Backlog
              {backlog.needsReview && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: '99px' }}>Review needed</span>}
            </h2>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{backlog.totalClones} clones</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {backlog.sections.slice(0, 15).map((item, i) => {
              const color = item.quality === 'missing' ? '#dc2626' : item.quality === 'poor' ? '#f59e0b' : '#3b82f6'
              const icon = item.quality === 'missing' ? '❌' : item.quality === 'poor' ? '⚠️' : '🔧'
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.75rem', background: '#f8fafc', borderRadius: '8px', borderLeft: `3px solid ${color}` }}>
                  <span style={{ fontSize: '0.75rem' }}>{icon}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color, width: '80px', flexShrink: 0 }}>{item.type}</span>
                  <span style={{ fontSize: '0.72rem', color: '#475569', flex: 1 }}>{item.issue.slice(0, 70)}</span>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>×{item.count}</span>
                </div>
              )
            })}
          </div>
          {backlog.needsReview && (
            <button onClick={async () => { await fetch('/api/admin/landing/clone-stats', { method: 'POST' }); setBacklog(b => b ? { ...b, needsReview: false } : null) }}
              style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>
              Mark as reviewed ✓
            </button>
          )}
        </div>
      )}
    </div>
  )
}
