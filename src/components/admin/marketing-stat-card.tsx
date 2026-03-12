/**
 * Stat card component for marketing dashboard — displays a single metric
 * with label, value, and subtitle in a glass-panel card
 */

export function StatCard({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.25rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>{sub}</div>
    </div>
  )
}
