/**
 * Admin subscribers page — list, delete, and broadcast to email subscribers
 * Fetches from /api/admin/subscribers and /api/admin/broadcast
 */
import { useState, useEffect } from 'react'
import type { Subscriber } from '@/lib/email/subscriber-io'

interface SubscribersData {
  subscribers: Subscriber[]
  count: number
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(12px)',
  borderRadius: '16px',
  border: '1px solid rgba(148,163,184,0.15)',
  padding: '1.5rem',
  marginBottom: '1.5rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid rgba(148,163,184,0.3)',
  background: 'rgba(255,255,255,0.6)',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
}

const btnStyle = (variant: 'primary' | 'danger' | 'ghost'): React.CSSProperties => ({
  padding: '0.4rem 0.9rem',
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  background: variant === 'primary' ? '#1e293b' : variant === 'danger' ? '#ef4444' : 'rgba(148,163,184,0.15)',
  color: variant === 'ghost' ? '#475569' : 'white',
})

export function AdminSubscribersPage() {
  const [data, setData] = useState<SubscribersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Broadcast state
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('')
  const [sending, setSending] = useState(false)
  const [broadcastMsg, setBroadcastMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/subscribers')
      const json = await res.json()
      if (json.ok) setData(json.data)
      else setError(json.error || 'Failed to load')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(email: string) {
    if (!confirm(`Remove ${email}?`)) return
    setDeleting(email)
    try {
      const res = await fetch('/api/admin/subscribers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (json.ok) {
        setData((prev) => prev ? {
          subscribers: prev.subscribers.filter((s) => s.email !== email),
          count: prev.count - 1,
        } : prev)
      }
    } catch { /* ignore */ }
    setDeleting(null)
  }

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setBroadcastMsg(null)
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html }),
      })
      const json = await res.json()
      if (json.ok) {
        setBroadcastMsg({ ok: true, text: `Sent to ${json.sent} subscriber(s)` })
        setSubject('')
        setHtml('')
      } else {
        setBroadcastMsg({ ok: false, text: json.error || 'Broadcast failed' })
      }
    } catch {
      setBroadcastMsg({ ok: false, text: 'Network error' })
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#94a3b8' }}>Loading subscribers...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#ef4444' }}>{error}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ ...cardStyle }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>
          Email Subscribers
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
          {data?.count ?? 0} total subscriber{data?.count !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Subscriber list */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem' }}>
          Subscribers
        </h3>
        {!data?.subscribers.length ? (
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No subscribers yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem 0.5rem', color: '#64748b', fontWeight: 600 }}>Email</th>
                <th style={{ textAlign: 'left', padding: '0.5rem 0.5rem', color: '#64748b', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '0.5rem 0.5rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {data.subscribers.map((sub) => (
                <tr key={sub.email} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                  <td style={{ padding: '0.6rem 0.5rem', color: '#1e293b' }}>{sub.email}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: '#64748b' }}>
                    {sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>
                    <button
                      style={btnStyle('danger')}
                      disabled={deleting === sub.email}
                      onClick={() => handleDelete(sub.email)}
                    >
                      {deleting === sub.email ? '...' : 'Remove'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Broadcast */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem' }}>
          Broadcast Email
        </h3>
        <form onSubmit={handleBroadcast}>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="Newsletter subject..."
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
              HTML Body
            </label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              required
              rows={6}
              placeholder="<p>Your email content here...</p>"
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8rem' }}
            />
          </div>
          {broadcastMsg && (
            <p style={{ fontSize: '0.85rem', color: broadcastMsg.ok ? '#22c55e' : '#ef4444', marginBottom: '0.75rem' }}>
              {broadcastMsg.text}
            </p>
          )}
          <button type="submit" disabled={sending || !data?.count} style={btnStyle('primary')}>
            {sending ? 'Sending...' : `Send to ${data?.count ?? 0} subscriber(s)`}
          </button>
        </form>
      </div>
    </div>
  )
}
