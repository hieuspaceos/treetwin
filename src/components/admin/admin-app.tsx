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

  async function handleLogout() {
    await api.auth.logout()
    setAuthed(false)
    toast.success('Logged out')
  }

  // Loading state
  if (authed === null) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8',
        fontSize: '0.875rem',
      }}>
        Loading...
      </div>
    )
  }

  if (!authed) {
    return <AdminLogin siteName={siteName} onLogin={() => setAuthed(true)} />
  }

  return <AdminLayout siteName={siteName} onLogout={handleLogout} />
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
