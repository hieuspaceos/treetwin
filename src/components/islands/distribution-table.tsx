// Interactive distribution table — sortable/filterable content inventory
// React island mounted with client:load in the distribution dashboard

import { useState, useMemo } from 'react'

interface ContentItem {
  title: string
  slug: string
  collection: 'articles' | 'notes'
  publishedAt: string | null
  distributedPlatforms: string[]
  distributionStatus: 'not_distributed' | 'drafted' | 'posted'
  distributionDate: string | null
}

type SortKey = 'title' | 'collection' | 'publishedAt' | 'distributionStatus' | 'platforms'
type SortDir = 'asc' | 'desc'

const STATUS_LABELS: Record<string, string> = {
  posted: 'Posted',
  drafted: 'Drafted',
  not_distributed: 'Not distributed',
}

const STATUS_COLORS: Record<string, string> = {
  posted: 'bg-green-100 text-green-700',
  drafted: 'bg-yellow-100 text-yellow-700',
  not_distributed: 'bg-slate-100 text-slate-500',
}

export function DistributionTable({ items }: { items: ContentItem[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('publishedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter !== 'all' && item.collection !== typeFilter) return false
      if (statusFilter !== 'all' && item.distributionStatus !== statusFilter) return false
      return true
    })
  }, [items, typeFilter, statusFilter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'collection':
          cmp = a.collection.localeCompare(b.collection)
          break
        case 'publishedAt':
          cmp = (a.publishedAt ?? '').localeCompare(b.publishedAt ?? '')
          break
        case 'distributionStatus':
          cmp = a.distributionStatus.localeCompare(b.distributionStatus)
          break
        case 'platforms':
          cmp = a.distributedPlatforms.length - b.distributedPlatforms.length
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return ' \u2195'
    return sortDir === 'asc' ? ' \u2191' : ' \u2193'
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/60 px-6 py-10 text-center text-slate-400">
        No content found. Create articles or notes in /keystatic first.
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
        >
          <option value="all">All types</option>
          <option value="articles">Articles</option>
          <option value="notes">Notes</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
        >
          <option value="all">All statuses</option>
          <option value="posted">Posted</option>
          <option value="drafted">Drafted</option>
          <option value="not_distributed">Not distributed</option>
        </select>
        <span className="ml-auto self-center text-xs text-slate-400">
          {sorted.length} of {items.length} items
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/60">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('title')}>
                Title{sortIcon('title')}
              </th>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('collection')}>
                Type{sortIcon('collection')}
              </th>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('platforms')}>
                Platforms{sortIcon('platforms')}
              </th>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('distributionStatus')}>
                Status{sortIcon('distributionStatus')}
              </th>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('publishedAt')}>
                Published{sortIcon('publishedAt')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((item) => (
              <tr key={item.slug} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-800">{item.title}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {item.collection === 'articles' ? 'Article' : 'Note'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {item.distributedPlatforms.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {item.distributedPlatforms.map((p) => (
                        <span key={p} className="rounded-md bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[item.distributionStatus]}`}>
                    {STATUS_LABELS[item.distributionStatus]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
