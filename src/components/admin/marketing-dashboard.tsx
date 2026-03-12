/**
 * Marketing/Distribution dashboard — integrated into admin SPA
 * Fetches distribution stats + content inventory from /api/admin/distribution
 * Composed from modular sub-components for maintainability
 */
import { useEffect, useState, useMemo, lazy, Suspense } from 'react'
import { api } from '@/lib/admin/api-client'
import type { DistributionData, ContentItem } from './marketing-types'
import { StatCard } from './marketing-stat-card'
import { MarketingContentTable } from './marketing-content-table'
import { MarketingActivityTable } from './marketing-activity-table'

const DistributionPostGenerator = lazy(() =>
  import('./distribution-post-generator').then((m) => ({ default: m.DistributionPostGenerator })),
)

export function MarketingDashboard() {
  const [data, setData] = useState<DistributionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [generatingItem, setGeneratingItem] = useState<ContentItem | null>(null)

  useEffect(() => {
    api.distribution.stats()
      .then((res) => {
        if (res.ok && res.data) {
          setData(res.data as unknown as DistributionData)
        } else {
          setError(res.error || 'Failed to load')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!data) return []
    return data.inventory.filter((item) => {
      if (typeFilter !== 'all' && item.collection !== typeFilter) return false
      if (statusFilter !== 'all' && item.distributionStatus !== statusFilter) return false
      return true
    })
  }, [data, typeFilter, statusFilter])

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', borderRadius: '16px', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading marketing data...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', borderRadius: '16px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>{error || 'No data available'}</p>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Run <code>/distribute slug-name</code> in Claude Code to generate social posts.
        </p>
      </div>
    )
  }

  const { stats, recentEntries } = data
  const platforms = Object.keys(stats.platformCounts)
  const platformSummary = platforms.length > 3
    ? platforms.slice(0, 3).join(', ') + '...'
    : platforms.join(', ') || 'none'
  const sinceLabel = stats.firstDate ? `Since ${stats.firstDate}` : 'No data yet'

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>
        Marketing
      </h1>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total Distributed" value={stats.total} sub={sinceLabel} />
        <StatCard label="Posted" value={stats.posted} sub={`${stats.drafted} drafted`} />
        <StatCard label="Platforms" value={platforms.length} sub={platformSummary} />
        <StatCard label="Frequency" value={stats.avgPerWeek || '-'} sub="posts/week" />
      </div>

      {/* Content inventory filters */}
      <h2 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.75rem' }}>
        Content Inventory
      </h2>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="admin-select">
          <option value="all">All types</option>
          <option value="articles">Articles</option>
          <option value="notes">Notes</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-select">
          <option value="all">All statuses</option>
          <option value="posted">Posted</option>
          <option value="drafted">Drafted</option>
          <option value="not_distributed">Not distributed</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#94a3b8' }}>
          {filtered.length} of {data.inventory.length} items
        </span>
      </div>

      <MarketingContentTable items={filtered} total={data.inventory.length} onGenerate={setGeneratingItem} />

      {/* Recent activity */}
      <h2 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.75rem' }}>
        Recent Activity
      </h2>
      <MarketingActivityTable entries={recentEntries} />

      {/* Quick actions */}
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.75rem' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {['/distribute slug-name', '/distribute --latest', '/distribute --mark-posted --slug slug-name', '/marketing-review'].map((cmd) => (
            <code key={cmd} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)', fontSize: '0.8rem', color: '#64748b' }}>
              {cmd}
            </code>
          ))}
        </div>
      </div>

      {/* Distribution post generator modal */}
      {generatingItem && (
        <Suspense fallback={null}>
          <DistributionPostGenerator
            collection={generatingItem.collection}
            slug={generatingItem.slug}
            title={generatingItem.title}
            onClose={() => setGeneratingItem(null)}
          />
        </Suspense>
      )}
    </div>
  )
}
