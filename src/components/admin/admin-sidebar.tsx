/**
 * Admin sidebar navigation — fixed left panel with nav links
 * Collapsible on desktop (icon-only mode), mobile overlay via hamburger
 * Routes are relative — wouter Router base="/admin" handles the prefix
 */
import { useLocation, Link } from 'wouter'

// Inline SVG icons (no icon library dependency)
const icons = {
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  fileText: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  stickyNote: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
      <path d="M14 3v4a2 2 0 0 0 2 2h4" />
    </svg>
  ),
  database: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  folder: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  image: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  mail: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  chart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  megaphone: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l18-5v12L3 13v-2z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  externalLink: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
  logOut: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  chevronLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  chevronRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
}

interface Props {
  siteName: string
  open: boolean
  collapsed: boolean
  onClose: () => void
  onLogout: () => void
  onToggleCollapse: () => void
}

function NavItem({ href, icon, label, collapsed }: { href: string; icon: React.ReactNode; label: string; collapsed: boolean }) {
  const [location] = useLocation()
  const isActive = href === '/'
    ? location === '/' || location === ''
    : location.startsWith(href)

  return (
    <Link
      href={href}
      className={`admin-nav-item ${isActive ? 'active' : ''}`}
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && label}
    </Link>
  )
}

export function AdminSidebar({ siteName, open, collapsed, onClose, onLogout, onToggleCollapse }: Props) {
  return (
    <>
      {open && <div className="admin-sidebar-backdrop" onClick={onClose} />}

      <aside className={`admin-sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="admin-sidebar-header">
          {!collapsed && (
            <span className="admin-sidebar-title">{siteName}</span>
          )}
          <button
            className="admin-sidebar-toggle"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? icons.chevronRight : icons.chevronLeft}
          </button>
        </div>

        <div className="admin-nav-divider" />

        <NavItem href="/" icon={icons.home} label="Dashboard" collapsed={collapsed} />

        {!collapsed && <div className="admin-nav-section">Content</div>}
        {collapsed && <div className="admin-nav-divider" style={{ margin: '0.25rem 0.5rem' }} />}
        <NavItem href="/articles" icon={icons.fileText} label="Articles" collapsed={collapsed} />
        <NavItem href="/notes" icon={icons.stickyNote} label="Notes" collapsed={collapsed} />
        <NavItem href="/records" icon={icons.database} label="Records" collapsed={collapsed} />
        <NavItem href="/categories" icon={icons.folder} label="Categories" collapsed={collapsed} />

        {!collapsed && <div className="admin-nav-section">Assets</div>}
        {collapsed && <div className="admin-nav-divider" style={{ margin: '0.25rem 0.5rem' }} />}
        <NavItem href="/media" icon={icons.image} label="Media" collapsed={collapsed} />

        {!collapsed && <div className="admin-nav-section">Marketing</div>}
        {collapsed && <div className="admin-nav-divider" style={{ margin: '0.25rem 0.5rem' }} />}
        <NavItem href="/marketing" icon={icons.megaphone} label="Distribution" collapsed={collapsed} />
        <NavItem href="/subscribers" icon={icons.mail} label="Subscribers" collapsed={collapsed} />
        <NavItem href="/analytics" icon={icons.chart} label="Analytics" collapsed={collapsed} />

        {!collapsed && <div className="admin-nav-section">System</div>}
        {collapsed && <div className="admin-nav-divider" style={{ margin: '0.25rem 0.5rem' }} />}
        <NavItem href="/settings" icon={icons.settings} label="Settings" collapsed={collapsed} />

        <div style={{ flex: 1 }} />
        <div className="admin-nav-divider" />

        <a href="/" target="_blank" rel="noopener noreferrer" className="admin-nav-item" title={collapsed ? 'Back to site' : undefined}>
          {icons.externalLink}
          {!collapsed && 'Back to site'}
        </a>
        <button onClick={onLogout} className="admin-nav-item" title={collapsed ? 'Logout' : undefined}>
          {icons.logOut}
          {!collapsed && 'Logout'}
        </button>
      </aside>
    </>
  )
}
