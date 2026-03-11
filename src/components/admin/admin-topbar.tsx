/**
 * Admin topbar — breadcrumb + quick actions + mobile hamburger
 */
import { useLocation } from 'wouter'

interface Props {
  onToggleSidebar: () => void
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

export function AdminTopbar({ onToggleSidebar }: Props) {
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
