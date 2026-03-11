/**
 * Content list view — table with search, filter, sort for a collection
 */
import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { api, type EntryMeta } from '@/lib/admin/api-client'
import { useToast } from './admin-toast'
import { DeleteDialog } from './delete-dialog'

interface Props {
  collection: string
}

export function ContentList({ collection }: Props) {
  const [, navigate] = useLocation()
  const [entries, setEntries] = useState<EntryMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'publishedAt' | 'title'>('publishedAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [deleteTarget, setDeleteTarget] = useState<EntryMeta | null>(null)
  const toast = useToast()

  useEffect(() => {
    setLoading(true)
    api.collections.list(collection).then((res) => {
      setEntries(res.data?.entries || [])
      setLoading(false)
    })
  }, [collection])

  // Client-side filter + sort
  const filtered = entries
    .filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return e.title.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => {
      const key = sortBy
      const av = (a[key] || '') as string
      const bv = (b[key] || '') as string
      const cmp = av.localeCompare(bv)
      return sortDir === 'asc' ? cmp : -cmp
    })

  async function handleDelete() {
    if (!deleteTarget) return
    const res = await api.collections.delete(collection, deleteTarget.slug)
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.slug !== deleteTarget.slug))
      toast.success(`Deleted "${deleteTarget.title}"`)
    } else {
      toast.error(res.error || 'Delete failed')
    }
    setDeleteTarget(null)
  }

  function toggleSort(col: 'publishedAt' | 'title') {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(col); setSortDir('desc') }
  }

  const label = collection.charAt(0).toUpperCase() + collection.slice(1)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>{label}</h1>
        <button className="admin-btn admin-btn-primary" onClick={() => navigate(`/${collection}/new`)}>
          + New
        </button>
      </div>

      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="glass-input"
          style={{ flex: 1, minWidth: '200px', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.875rem' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="glass-input"
          style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.875rem' }}
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', borderRadius: '14px', textAlign: 'center', color: '#94a3b8' }}>
          {entries.length === 0 ? `No ${collection} yet. Create your first one!` : 'No results match your search.'}
        </div>
      ) : (
        <div className="glass-panel" style={{ borderRadius: '14px', overflow: 'hidden' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('title')}>
                  Title {sortBy === 'title' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th>Status</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('publishedAt')}>
                  Published {sortBy === 'publishedAt' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ width: '80px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.slug} style={{ cursor: 'pointer' }} onClick={() => navigate(`/${collection}/${entry.slug}`)}>
                  <td style={{ fontWeight: 500, color: '#1e293b' }}>{entry.title}</td>
                  <td>
                    <span className={`admin-badge admin-badge-${entry.status}`}>{entry.status}</span>
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>{entry.publishedAt || '—'}</td>
                  <td>
                    <button
                      className="admin-btn admin-btn-danger"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(entry) }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <DeleteDialog
          title={deleteTarget.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
