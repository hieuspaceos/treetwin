/**
 * Admin layout — sidebar + topbar + content area with client-side routing
 * Routes are relative to wouter Router base="/admin"
 */
import { useState, useEffect } from 'react'
import { Route, Switch } from 'wouter'
import type { AdminUserInfo } from './admin-app'
import { AdminSidebar } from './admin-sidebar'
import { AdminTopbar } from './admin-topbar'
import { AdminDashboard } from './admin-dashboard'
import { ContentList } from './content-list'
import { ContentEditor } from './content-editor'
import { SettingsEditor } from './settings-editor'
import { MediaBrowser } from './media-browser'
import { MarketingDashboard } from './marketing-dashboard'
import { CategoriesList } from './categories-list'
import { CategoryEditor } from './category-editor'
import { AdminSubscribersPage } from './admin-subscribers-page'
import { AdminAnalyticsPage } from './admin-analytics-page'

interface Props {
  siteName: string
  onLogout: () => void
  user: AdminUserInfo | null
}

const SIDEBAR_KEY = 'admin-sidebar-collapsed'

export function AdminLayout({ siteName, onLogout, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === 'true' } catch { return false }
  })

  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed)) } catch {}
  }, [sidebarCollapsed])

  return (
    <div className={sidebarCollapsed ? 'admin-wrapper sidebar-collapsed' : 'admin-wrapper'}>
      <AdminSidebar
        siteName={siteName}
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      <main className="admin-main">
        <AdminTopbar onToggleSidebar={() => setSidebarOpen((s) => !s)} user={user} />

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

          {/* Categories */}
          <Route path="/categories">
            <CategoriesList />
          </Route>
          <Route path="/categories/new">
            <CategoryEditor />
          </Route>
          <Route path="/categories/:slug">
            {(params) => <CategoryEditor slug={params.slug} />}
          </Route>

          {/* Media */}
          <Route path="/media">
            <MediaBrowser mode="page" />
          </Route>

          {/* Marketing */}
          <Route path="/marketing">
            <MarketingDashboard />
          </Route>

          {/* Subscribers */}
          <Route path="/subscribers">
            <AdminSubscribersPage />
          </Route>

          {/* Analytics */}
          <Route path="/analytics">
            <AdminAnalyticsPage />
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
