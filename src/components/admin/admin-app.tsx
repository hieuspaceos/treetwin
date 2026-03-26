/**
 * Admin SPA root — handles auth state, renders login or layout
 * Mounted via client:only="react" in Astro page
 */
import { useEffect, useState, useCallback } from 'react'
import { Router } from 'wouter'
import { AdminToastProvider, useToast } from './admin-toast'
import { AdminLogin } from './admin-login'
import { AdminLayout } from './admin-layout'
import { AdminErrorBoundary } from './admin-error-boundary'
import { KeyboardShortcuts } from './keyboard-shortcuts'
import { api } from '@/lib/admin/api-client'
import type { ProductConfig } from '@/lib/admin/product-types'

interface Props {
  siteName: string
  productConfig?: ProductConfig
}

export interface AdminUserInfo {
  username: string
  role: string
}

function AdminAppInner({ siteName, productConfig }: Props) {
  const [authed, setAuthed] = useState<boolean | null>(null) // null = checking
  const [user, setUser] = useState<AdminUserInfo | null>(null)
  const [enabledFeatures, setEnabledFeatures] = useState<Record<string, boolean> | undefined>(undefined)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const toast = useToast()

  // Check session on mount
  useEffect(() => {
    api.auth.check().then((res) => {
      setAuthed(res.ok)
      if (res.ok && res.data) {
        setUser({ username: res.data.username, role: res.data.role })
      }
    })
  }, [])

  // Fetch site-settings to get feature toggle state
  useEffect(() => {
    if (!authed) return
    api.singletons.read('site-settings').then((res) => {
      if (res.ok && res.data) {
        setEnabledFeatures((res.data as Record<string, any>).enabledFeatures)
      }
    })
  }, [authed])

  // Re-fetch features when settings are saved (custom event from settings-editor)
  useEffect(() => {
    const handler = () => {
      api.singletons.read('site-settings').then((res) => {
        if (res.ok && res.data) {
          setEnabledFeatures((res.data as Record<string, any>).enabledFeatures)
        }
      })
    }
    window.addEventListener('settings-changed', handler)
    return () => window.removeEventListener('settings-changed', handler)
  }, [])

  // Hide static Astro loader only AFTER auth check completes
  useEffect(() => {
    if (authed === null) return
    const loader = document.getElementById('admin-loader')
    if (loader) loader.remove()
  }, [authed])

  // Global keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip when typing in input/textarea
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      // Only handle Ctrl+S inside form fields
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        // Trigger closest form submit
        const form = (e.target as HTMLElement).closest('form')
        if (form) form.requestSubmit()
      }
      return
    }

    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      setShowShortcuts((s) => !s)
    }
    if (e.key === 'Escape') {
      setShowShortcuts(false)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  async function handleLogout() {
    await api.auth.logout()
    setAuthed(false)
    setUser(null)
    toast.success('Logged out')
  }

  // Still checking — Astro static loader stays visible
  if (authed === null) return null

  if (!authed) {
    return (
      <div className="admin-root">
        <AdminLogin
          siteName={siteName}
          onLogin={(u) => {
            setUser(u)
            setAuthed(true)
          }}
          productSlug={productConfig?.slug}
          productName={productConfig?.name}
        />
      </div>
    )
  }

  return (
    <div className="admin-root">
      <AdminLayout siteName={siteName} onLogout={handleLogout} user={user} enabledFeatures={enabledFeatures} productConfig={productConfig} />
      {showShortcuts && <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />}
    </div>
  )
}

/** Root component mounted by Astro — wraps with Router + Toast + ErrorBoundary */
export default function AdminApp({ siteName, productConfig }: Props) {
  const routerBase = productConfig ? `/${productConfig.slug}/admin` : '/admin'
  return (
    <Router base={routerBase}>
      <AdminErrorBoundary>
        <AdminToastProvider>
          <AdminAppInner siteName={siteName} productConfig={productConfig} />
        </AdminToastProvider>
      </AdminErrorBoundary>
    </Router>
  )
}
