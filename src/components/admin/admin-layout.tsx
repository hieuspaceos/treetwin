/**
 * Admin layout — sidebar + topbar + content area with client-side routing.
 * Feature routes are gated by enabledFeatures from site-settings.
 * Optional pages lazy-loaded via React.lazy for code splitting.
 */
import { useState, useEffect, Suspense, lazy, Fragment } from 'react'
import { Route, Switch } from 'wouter'
import type { AdminUserInfo } from './admin-app'
import { AdminSidebar } from './admin-sidebar'
import { AdminTopbar } from './admin-topbar'
import { AdminDashboard } from './admin-dashboard'
import { ContentList } from './content-list'
import { ContentEditor } from './content-editor'
import { SettingsEditor } from './settings-editor'
import { CategoriesList } from './categories-list'
import { CategoryEditor } from './category-editor'
import { isFeatureEnabled, isFeatureInProduct, isCollectionInProduct, getProductCoreCollections, type EnabledFeaturesMap } from '@/lib/admin/feature-registry'
import type { ProductConfig } from '@/lib/admin/product-types'

// Lazy-loaded feature pages — only fetched when route is matched
const LazyMediaBrowser = lazy(() => import('./media-browser').then((m) => ({ default: m.MediaBrowser })))
const LazyMarketingDashboard = lazy(() => import('./marketing-dashboard').then((m) => ({ default: m.MarketingDashboard })))
const LazySubscribersPage = lazy(() => import('./admin-subscribers-page').then((m) => ({ default: m.AdminSubscribersPage })))
const LazyAnalyticsPage = lazy(() => import('./admin-analytics-page').then((m) => ({ default: m.AdminAnalyticsPage })))
const LazyTranslationsPage = lazy(() => import('./admin-translations-page').then((m) => ({ default: m.AdminTranslationsPage })))

// Landing page builder — lazy, gated by 'landing' feature
const LazyLandingList = lazy(() => import('./landing/landing-pages-list').then((m) => ({ default: m.LandingPagesList })))
const LazyLandingEditor = lazy(() => import('./landing/landing-page-editor').then((m) => ({ default: m.LandingPageEditor })))
const LazySetupWizard = lazy(() => import('./landing/landing-setup-wizard').then((m) => ({ default: m.LandingSetupWizard })))

// Custom entities — lazy, gated by 'entities' feature
const LazyEntityDefs = lazy(() => import('./entities/entity-definitions-page').then((m) => ({ default: m.EntityDefinitionsPage })))
const LazyEntityList = lazy(() => import('./entities/entity-list-page').then((m) => ({ default: m.EntityListPage })))
const LazyEntityEditor = lazy(() => import('./entities/entity-editor-page').then((m) => ({ default: m.EntityEditorPage })))

// Products — lazy, only in core admin (not product admin)
const LazyProductList = lazy(() => import('./products/product-list-page').then((m) => ({ default: m.ProductListPage })))
const LazyProductEditor = lazy(() => import('./products/product-editor-page').then((m) => ({ default: m.ProductEditorPage })))

interface Props {
  siteName: string
  onLogout: () => void
  user: AdminUserInfo | null
  enabledFeatures?: EnabledFeaturesMap
  productConfig?: ProductConfig
}

const SIDEBAR_KEY = 'admin-sidebar-collapsed'

/** Loading fallback for lazy-loaded feature routes */
function RouteLoading() {
  return (
    <div className="glass-panel" style={{ padding: '2rem', borderRadius: '14px', textAlign: 'center' }}>
      <p style={{ color: '#94a3b8' }}>Loading...</p>
    </div>
  )
}

export function AdminLayout({ siteName, onLogout, user, enabledFeatures, productConfig }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === 'true' } catch { return false }
  })

  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed)) } catch {}
  }, [sidebarCollapsed])

  const ef = enabledFeatures

  return (
    <div className={sidebarCollapsed ? 'admin-wrapper sidebar-collapsed' : 'admin-wrapper'}>
      <AdminSidebar
        siteName={siteName}
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        enabledFeatures={ef}
        productConfig={productConfig}
      />

      <main className="admin-main">
        <AdminTopbar onToggleSidebar={() => setSidebarOpen((s) => !s)} user={user} />

        <Switch>
          <Route path="/" component={AdminDashboard} />

          {/* Core content routes — generated from CORE_COLLECTIONS registry, gated by product */}
          {getProductCoreCollections(productConfig)
            .filter((col) => col.id !== 'categories')
            .map((col) => (
              <Fragment key={col.id}>
                <Route path={col.routes.list}><ContentList collection={col.id} /></Route>
                <Route path={col.routes.new}><ContentEditor collection={col.id} /></Route>
                <Route path={col.routes.edit}>
                  {(params) => <ContentEditor collection={col.id} slug={(params as Record<string, string | undefined>).slug} />}
                </Route>
              </Fragment>
            ))}

          {/* Categories — dedicated list/editor components, gated by product.coreCollections */}
          {isCollectionInProduct('categories', productConfig) && (
            <Fragment>
              <Route path="/categories"><CategoriesList /></Route>
              <Route path="/categories/new"><CategoryEditor /></Route>
              <Route path="/categories/:slug">
                {(params) => <CategoryEditor slug={params.slug} />}
              </Route>
            </Fragment>
          )}

          {/* Voices — collection-based, gated by feature toggle + product */}
          {isFeatureEnabled('voices', ef) && isCollectionInProduct('voices', productConfig) && (
            <Route path="/voices"><ContentList collection="voices" /></Route>
          )}
          {isFeatureEnabled('voices', ef) && isCollectionInProduct('voices', productConfig) && (
            <Route path="/voices/new"><ContentEditor collection="voices" /></Route>
          )}
          {isFeatureEnabled('voices', ef) && isCollectionInProduct('voices', productConfig) && (
            <Route path="/voices/:slug">
              {(params) => <ContentEditor collection="voices" slug={params.slug} />}
            </Route>
          )}

          {/* Media — lazy, gated by feature toggle + product */}
          {isFeatureEnabled('media', ef) && isFeatureInProduct('media', productConfig) && (
            <Route path="/media">
              <Suspense fallback={<RouteLoading />}>
                <LazyMediaBrowser mode="page" />
              </Suspense>
            </Route>
          )}

          {/* Distribution — lazy, gated */}
          {isFeatureEnabled('distribution', ef) && isFeatureInProduct('distribution', productConfig) && (
            <Route path="/marketing">
              <Suspense fallback={<RouteLoading />}><LazyMarketingDashboard /></Suspense>
            </Route>
          )}

          {/* Subscribers — lazy, gated */}
          {isFeatureEnabled('email', ef) && isFeatureInProduct('email', productConfig) && (
            <Route path="/subscribers">
              <Suspense fallback={<RouteLoading />}><LazySubscribersPage /></Suspense>
            </Route>
          )}

          {/* Analytics — lazy, gated */}
          {isFeatureEnabled('analytics', ef) && isFeatureInProduct('analytics', productConfig) && (
            <Route path="/analytics">
              <Suspense fallback={<RouteLoading />}><LazyAnalyticsPage /></Suspense>
            </Route>
          )}

          {/* Translations — lazy, gated */}
          {isFeatureEnabled('translations', ef) && isFeatureInProduct('translations', productConfig) && (
            <Route path="/translations">
              <Suspense fallback={<RouteLoading />}><LazyTranslationsPage /></Suspense>
            </Route>
          )}

          {/* Landing pages — lazy, gated */}
          {isFeatureEnabled('landing', ef) && isFeatureInProduct('landing', productConfig) && (
            <Route path="/landing">
              <Suspense fallback={<RouteLoading />}><LazyLandingList /></Suspense>
            </Route>
          )}
          {isFeatureEnabled('landing', ef) && isFeatureInProduct('landing', productConfig) && (
            <Route path="/landing/wizard">
              <Suspense fallback={<RouteLoading />}><LazySetupWizard /></Suspense>
            </Route>
          )}
          {isFeatureEnabled('landing', ef) && isFeatureInProduct('landing', productConfig) && (
            <Route path="/landing/new">
              <Suspense fallback={<RouteLoading />}><LazyLandingEditor /></Suspense>
            </Route>
          )}
          {isFeatureEnabled('landing', ef) && isFeatureInProduct('landing', productConfig) && (
            <Route path="/landing/:slug">
              {(params) => (
                <Suspense fallback={<RouteLoading />}><LazyLandingEditor slug={params.slug} /></Suspense>
              )}
            </Route>
          )}

          {/* Custom entities — lazy, gated */}
          {isFeatureEnabled('entities', ef) && isFeatureInProduct('entities', productConfig) && (
            <Route path="/entities">
              <Suspense fallback={<RouteLoading />}><LazyEntityDefs /></Suspense>
            </Route>
          )}
          {isFeatureEnabled('entities', ef) && isFeatureInProduct('entities', productConfig) && (
            <Route path="/entities/:name">
              {(params) => (
                <Suspense fallback={<RouteLoading />}><LazyEntityList name={params.name} /></Suspense>
              )}
            </Route>
          )}
          {isFeatureEnabled('entities', ef) && isFeatureInProduct('entities', productConfig) && (
            <Route path="/entities/:name/new">
              {(params) => (
                <Suspense fallback={<RouteLoading />}><LazyEntityEditor name={params.name} /></Suspense>
              )}
            </Route>
          )}
          {isFeatureEnabled('entities', ef) && isFeatureInProduct('entities', productConfig) && (
            <Route path="/entities/:name/:slug">
              {(params) => (
                <Suspense fallback={<RouteLoading />}><LazyEntityEditor name={params.name} slug={params.slug} /></Suspense>
              )}
            </Route>
          )}

          {/* Products — core admin only, not visible in product admin */}
          {!productConfig && (
            <Fragment>
              <Route path="/products">
                <Suspense fallback={<RouteLoading />}><LazyProductList /></Suspense>
              </Route>
              <Route path="/products/new">
                <Suspense fallback={<RouteLoading />}><LazyProductEditor /></Suspense>
              </Route>
              <Route path="/products/:slug">
                {(params) => (
                  <Suspense fallback={<RouteLoading />}><LazyProductEditor slug={params.slug} /></Suspense>
                )}
              </Route>
            </Fragment>
          )}

          {/* Settings — always on */}
          <Route path="/settings"><SettingsEditor /></Route>

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
