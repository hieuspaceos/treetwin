/**
 * Admin layout — sidebar + topbar + content area with client-side routing
 * Routes are relative to wouter Router base="/admin"
 */
import { useState } from 'react'
import { Route, Switch } from 'wouter'
import { AdminSidebar } from './admin-sidebar'
import { AdminTopbar } from './admin-topbar'
import { AdminDashboard } from './admin-dashboard'
import { ContentList } from './content-list'
import { ContentEditor } from './content-editor'
import { SettingsEditor } from './settings-editor'

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

          {/* Content list routes */}
          <Route path="/articles">
            <ContentList collection="articles" />
          </Route>
          <Route path="/notes">
            <ContentList collection="notes" />
          </Route>
          <Route path="/records">
            <ContentList collection="records" />
          </Route>

          {/* Create routes */}
          <Route path="/articles/new">
            <ContentEditor collection="articles" />
          </Route>
          <Route path="/notes/new">
            <ContentEditor collection="notes" />
          </Route>
          <Route path="/records/new">
            <ContentEditor collection="records" />
          </Route>

          {/* Edit routes */}
          <Route path="/articles/:slug">
            {(params) => <ContentEditor collection="articles" slug={params.slug} />}
          </Route>
          <Route path="/notes/:slug">
            {(params) => <ContentEditor collection="notes" slug={params.slug} />}
          </Route>
          <Route path="/records/:slug">
            {(params) => <ContentEditor collection="records" slug={params.slug} />}
          </Route>

          {/* Settings */}
          <Route path="/settings">
            <SettingsEditor />
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
