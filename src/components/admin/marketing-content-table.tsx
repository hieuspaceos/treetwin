/**
 * Content inventory table for marketing dashboard — shows articles/notes
 * with distribution status, platforms, and generate action button
 */
import type { ContentItem } from './marketing-types'

const STATUS_LABEL: Record<string, string> = {
  posted: 'Posted',
  drafted: 'Drafted',
  not_distributed: 'Not distributed',
}

const STATUS_CLASS: Record<string, string> = {
  posted: 'admin-badge-success',
  drafted: 'admin-badge-warning',
  not_distributed: 'admin-badge-neutral',
}

interface ContentTableProps {
  items: ContentItem[]
  total: number
  onGenerate: (item: ContentItem) => void
}

export function MarketingContentTable({ items, total, onGenerate }: ContentTableProps) {
  if (items.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: '12px', textAlign: 'center', color: '#94a3b8' }}>
        No content found. Create articles or notes first.
      </div>
    )
  }

  return (
    <div className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Platforms</th>
              <th>Status</th>
              <th>Published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.slug}>
                <td style={{ fontWeight: 500 }}>{item.title}</td>
                <td>
                  <span className="admin-badge-neutral">
                    {item.collection === 'articles' ? 'Article' : 'Note'}
                  </span>
                </td>
                <td>
                  {item.distributedPlatforms.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {item.distributedPlatforms.map((p) => (
                        <span key={p} className="admin-badge-info">{p}</span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: '#cbd5e1' }}>-</span>
                  )}
                </td>
                <td>
                  <span className={STATUS_CLASS[item.distributionStatus]}>
                    {STATUS_LABEL[item.distributionStatus]}
                  </span>
                </td>
                <td style={{ color: '#64748b' }}>
                  {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : '-'}
                </td>
                <td>
                  <button
                    className="admin-btn admin-btn-ghost"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={() => onGenerate(item)}
                  >
                    Generate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
