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

interface Props {
  siteName: string
}

export interface AdminUserInfo {
  username: string
  role: string
}

function AdminAppInner({ siteName }: Props) {
  const [authed, setAuthed] = useState<boolean | null>(null) // null = checking
  const [user, setUser] = useState<AdminUserInfo | null>(null)
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
        />
      </div>
    )
  }

  return (
    <div className="admin-root">
      <AdminLayout siteName={siteName} onLogout={handleLogout} user={user} />
      {showShortcuts && <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />}
    </div>
  )
}

/** Root component mounted by Astro — wraps with Router + Toast + ErrorBoundary */
export default function AdminApp({ siteName }: Props) {
  return (
    <Router base="/admin">
      <AdminErrorBoundary>
        <AdminToastProvider>
          <AdminAppInner siteName={siteName} />
        </AdminToastProvider>
      </AdminErrorBoundary>
    </Router>
  )
}
