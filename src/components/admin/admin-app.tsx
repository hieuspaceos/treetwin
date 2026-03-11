/**
 * Admin SPA root — handles auth state, renders login or layout
 * Mounted via client:only="react" in Astro page
 */
import { useEffect, useState } from 'react'
import { Router } from 'wouter'
import { AdminToastProvider, useToast } from './admin-toast'
import { AdminLogin } from './admin-login'
import { AdminLayout } from './admin-layout'
import { api } from '@/lib/admin/api-client'

interface Props {
  siteName: string
}

function AdminAppInner({ siteName }: Props) {
  const [authed, setAuthed] = useState<boolean | null>(null) // null = checking
  const toast = useToast()

  // Check session on mount
  useEffect(() => {
    api.auth.check().then((res) => {
      setAuthed(res.ok)
    })
  }, [])

  // Hide static Astro loader only AFTER auth check completes
  useEffect(() => {
    if (authed === null) return
    const loader = document.getElementById('admin-loader')
    if (loader) loader.remove()
  }, [authed])

  async function handleLogout() {
    await api.auth.logout()
    setAuthed(false)
    toast.success('Logged out')
  }

  // Still checking — Astro static loader stays visible
  if (authed === null) return null

  if (!authed) {
    return (
      <div className="admin-root">
        <AdminLogin siteName={siteName} onLogin={() => setAuthed(true)} />
      </div>
    )
  }

  return (
    <div className="admin-root">
      <AdminLayout siteName={siteName} onLogout={handleLogout} />
    </div>
  )
}

/** Root component mounted by Astro — wraps with Router + Toast providers */
export default function AdminApp({ siteName }: Props) {
  return (
    <Router base="/admin">
      <AdminToastProvider>
        <AdminAppInner siteName={siteName} />
      </AdminToastProvider>
    </Router>
  )
}
