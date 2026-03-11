/**
 * Delete confirmation dialog — simple modal overlay
 */

interface Props {
  title: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteDialog({ title, onConfirm, onCancel }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onCancel}
    >
      <div
        className="glass-panel"
        style={{ padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
          Delete entry?
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Are you sure you want to delete <strong>"{title}"</strong>? This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="admin-btn admin-btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="admin-btn admin-btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}
