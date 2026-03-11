/**
 * Admin layout — sidebar + topbar + content area with client-side routing
 * Routes are relative to wouter Router base="/admin"
 */
import { useState } from 'react'
import { Route, Switch } from 'wouter'
import { AdminSidebar } from './admin-sidebar'
import { AdminTopbar } from './admin-topbar'
import { AdminDashboard } from './admin-dashboard'

interface Props {
  siteName: string
  onLogout: () => void
}

export function AdminLayout({ siteName, onLogout }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div>
      <AdminSidebar
        siteName={siteName}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
      />

      <main className="admin-main">
        <AdminTopbar onToggleSidebar={() => setSidebarOpen((s) => !s)} />

        <Switch>
          <Route path="/" component={AdminDashboard} />

          {/* Content list routes — placeholder for Phase 4 */}
          <Route path="/articles">
            <ContentPlaceholder collection="articles" />
          </Route>
          <Route path="/notes">
            <ContentPlaceholder collection="notes" />
          </Route>
          <Route path="/records">
            <ContentPlaceholder collection="records" />
          </Route>

          {/* Create routes — placeholder for Phase 4 */}
          <Route path="/articles/new">
            <EditorPlaceholder collection="articles" mode="create" />
          </Route>
          <Route path="/notes/new">
            <EditorPlaceholder collection="notes" mode="create" />
          </Route>
          <Route path="/records/new">
            <EditorPlaceholder collection="records" mode="create" />
          </Route>

          {/* Edit routes — placeholder for Phase 4 */}
          <Route path="/articles/:slug">
            {(params) => <EditorPlaceholder collection="articles" mode="edit" slug={params.slug} />}
          </Route>
          <Route path="/notes/:slug">
            {(params) => <EditorPlaceholder collection="notes" mode="edit" slug={params.slug} />}
          </Route>
          <Route path="/records/:slug">
            {(params) => <EditorPlaceholder collection="records" mode="edit" slug={params.slug} />}
          </Route>

          {/* Settings — placeholder for Phase 4 */}
          <Route path="/settings">
            <SettingsPlaceholder />
          </Route>

          {/* 404 */}
          <Route>
            <div className="glass-panel" style={{ padding: '3rem', borderRadius: '16px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                Page not found
              </h2>
              <p style={{ color: '#94a3b8' }}>This admin page doesn't exist.</p>
            </div>
          </Route>
        </Switch>
      </main>
    </div>
  )
}

// ── Placeholder components (replaced in Phase 4) ──

function ContentPlaceholder({ collection }: { collection: string }) {
  return (
    <div className="glass-panel" style={{ padding: '2rem', borderRadius: '14px', textAlign: 'center', color: '#94a3b8' }}>
      <h2 style={{ color: '#1e293b', marginBottom: '0.5rem', textTransform: 'capitalize' }}>{collection}</h2>
      <p>Content list UI coming in Phase 4</p>
    </div>
  )
}

function EditorPlaceholder({ collection, mode, slug }: { collection: string; mode: string; slug?: string }) {
  return (
    <div className="glass-panel" style={{ padding: '2rem', borderRadius: '14px', textAlign: 'center', color: '#94a3b8' }}>
      <h2 style={{ color: '#1e293b', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
        {mode === 'create' ? `New ${collection}` : `Edit ${slug}`}
      </h2>
      <p>Content editor UI coming in Phase 4</p>
    </div>
  )
}

function SettingsPlaceholder() {
  return (
    <div className="glass-panel" style={{ padding: '2rem', borderRadius: '14px', textAlign: 'center', color: '#94a3b8' }}>
      <h2 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>Settings</h2>
      <p>Settings editor UI coming in Phase 4</p>
    </div>
  )
}
