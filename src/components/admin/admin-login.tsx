/**
 * Admin login form — glass-card centered, password auth
 */
import { useState } from 'react'
import { api } from '@/lib/admin/api-client'
import { useToast } from './admin-toast'

interface Props {
  siteName: string
  onLogin: () => void
}

export function AdminLogin({ siteName, onLogin }: Props) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await api.auth.login(password)
    setLoading(false)

    if (res.ok) {
      toast.success('Logged in')
      onLogin()
    } else {
      setError(res.error || 'Login failed')
    }
  }

  return (
    <div className="admin-login-wrapper">
      <form onSubmit={handleSubmit} className="admin-login-card glass-panel">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
            {siteName}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Admin Dashboard
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: '#fee2e2',
              color: '#dc2626',
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        <label
          htmlFor="admin-password"
          style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}
        >
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="glass-input"
          placeholder="Enter admin password"
          autoFocus
          required
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            boxSizing: 'border-box',
          }}
        />

        <button
          type="submit"
          disabled={loading || !password}
          className="admin-btn admin-btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9rem' }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
