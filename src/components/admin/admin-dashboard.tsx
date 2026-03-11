/**
 * Admin dashboard — overview page with content stats and recent entries
 */
import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { api, type EntryMeta } from '@/lib/admin/api-client'

interface Stats {
  articles: { total: number; published: number }
  notes: { total: number; published: number }
  records: { total: number; published: number }
}

const defaultStats: Stats = {
  articles: { total: 0, published: 0 },
  notes: { total: 0, published: 0 },
  records: { total: 0, published: 0 },
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>(defaultStats)
  const [recent, setRecent] = useState<(EntryMeta & { collection: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const [articlesRes, notesRes, recordsRes] = await Promise.all([
        api.collections.list('articles'),
        api.collections.list('notes'),
        api.collections.list('records'),
      ])

      const a = articlesRes.data?.entries || []
      const n = notesRes.data?.entries || []
      const r = recordsRes.data?.entries || []

      setStats({
        articles: { total: a.length, published: a.filter((e) => e.status === 'published').length },
        notes: { total: n.length, published: n.filter((e) => e.status === 'published').length },
        records: { total: r.length, published: r.filter((e) => e.status === 'published').length },
      })

      // Merge and sort by publishedAt desc, take 5
      const all = [
        ...a.map((e) => ({ ...e, collection: 'articles' })),
        ...n.map((e) => ({ ...e, collection: 'notes' })),
        ...r.map((e) => ({ ...e, collection: 'records' })),
      ]
        .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
        .slice(0, 5)

      setRecent(all)
      setLoading(false)
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card admin-stat-card" style={{ opacity: 0.5 }}>
            <div className="stat-label">Loading...</div>
            <div className="stat-value">--</div>
          </div>
        ))}
      </div>
    )
  }

  const totalPublished = stats.articles.published + stats.notes.published + stats.records.published
  const totalAll = stats.articles.total + stats.notes.total + stats.records.total

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '2rem' }}>
        <StatCard label="Articles" value={stats.articles.total} sub={`${stats.articles.published} published`} />
        <StatCard label="Notes" value={stats.notes.total} sub={`${stats.notes.published} published`} />
        <StatCard label="Records" value={stats.records.total} sub={`${stats.records.published} published`} />
        <StatCard label="Total Published" value={totalPublished} sub={`of ${totalAll} entries`} />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <Link href="/articles/new" className="admin-btn admin-btn-primary">+ New Article</Link>
        <Link href="/notes/new" className="admin-btn admin-btn-ghost">+ New Note</Link>
        <Link href="/records/new" className="admin-btn admin-btn-ghost">+ New Record</Link>
      </div>

      {/* Recent entries */}
      <div className="glass-panel" style={{ borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--t-glass-border)' }}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Recent Entries
          </h3>
        </div>

        {recent.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            No entries yet. Create your first content above.
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((entry) => (
                <tr key={`${entry.collection}-${entry.slug}`} style={{ cursor: 'pointer' }}>
                  <td>
                    <Link
                      href={`/${entry.collection}/${entry.slug}`}
                      style={{ color: '#1e293b', fontWeight: 500, textDecoration: 'none' }}
                    >
                      {entry.title}
                    </Link>
                  </td>
                  <td style={{ color: '#64748b', textTransform: 'capitalize' }}>{entry.collection}</td>
                  <td>
                    <span className={`admin-badge admin-badge-${entry.status}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td style={{ color: '#94a3b8' }}>{entry.publishedAt || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="glass-card admin-stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  )
}
