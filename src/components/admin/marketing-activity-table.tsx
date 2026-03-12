/**
 * Recent distribution activity table for marketing dashboard
 * Shows log of recent content distribution entries with date, slug, type, status
 */
import type { DistributionEntry } from './marketing-types'

interface ActivityTableProps {
  entries: DistributionEntry[]
}

export function MarketingActivityTable({ entries }: ActivityTableProps) {
  if (entries.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: '12px', textAlign: 'center', color: '#94a3b8' }}>
        No distribution activity yet. Run <code>/distribute</code> to get started.
      </div>
    )
  }

  return (
    <div className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Slug</th>
              <th>Type</th>
              <th>Status</th>
              <th>Words</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr key={`${entry.slug}-${i}`}>
                <td>{entry.date}</td>
                <td style={{ fontWeight: 500 }}>{entry.slug}</td>
                <td>{entry.type}</td>
                <td>
                  <span className={entry.status === 'posted' ? 'admin-badge-success' : 'admin-badge-warning'}>
                    {entry.status}
                  </span>
                </td>
                <td>{entry.wordCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
