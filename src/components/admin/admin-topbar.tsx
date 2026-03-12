/**
 * Admin topbar — breadcrumb + logged-in user badge + mobile hamburger
 */
import { useLocation } from 'wouter'
import type { AdminUserInfo } from './admin-app'

interface Props {
  onToggleSidebar: () => void
  user: AdminUserInfo | null
}

/** Derive breadcrumb segments from current path (relative to base) */
function getBreadcrumb(path: string): string[] {
  const segments = path
    .replace(/^\//, '')
    .split('/')
    .filter(Boolean)

  if (segments.length === 0) return ['Dashboard']

  return segments.map((s) =>
    s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')
  )
}

const hamburgerIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

export function AdminTopbar({ onToggleSidebar, user }: Props) {
  const [location] = useLocation()
  const crumbs = getBreadcrumb(location)

  return (
    <div className="admin-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Mobile hamburger */}
        <button
          onClick={onToggleSidebar}
          className="admin-btn admin-btn-ghost"
          style={{ display: 'none', padding: '0.4rem' }}
          aria-label="Toggle sidebar"
        >
          {hamburgerIcon}
        </button>

        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>
          {crumbs.map((crumb, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {i > 0 && <span>/</span>}
              <span style={i === crumbs.length - 1 ? { color: '#1e293b', fontWeight: 600 } : undefined}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* User badge */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              background: 'rgba(0,0,0,0.04)',
              color: '#64748b',
              fontWeight: 500,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {user.username}
          </span>
          <span
            style={{
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: user.role === 'admin' ? 'rgba(99,102,241,0.1)' : 'rgba(34,197,94,0.1)',
              color: user.role === 'admin' ? '#6366f1' : '#22c55e',
            }}
          >
            {user.role}
          </span>
        </div>
      )}

      {/* Show hamburger on mobile via inline responsive style */}
      <style>{`
        @media (max-width: 768px) {
          .admin-topbar button[aria-label="Toggle sidebar"] {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  )
}
