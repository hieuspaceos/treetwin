/**
 * Astro middleware — admin auth guard + Supabase session injection
 * Checks JWT cookie on /admin/* and /api/admin/* routes.
 * Skips auth for POST /api/admin/auth (login endpoint).
 * Injects Supabase user into locals when Supabase is configured.
 * Protects /dashboard and /checkout from unauthenticated access.
 */
import { defineMiddleware } from 'astro:middleware'
import { COOKIE_NAME, verifyToken } from '@/lib/admin/auth'

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies } = context
  const path = url.pathname
  const locals = context.locals as Record<string, unknown>

  // --- Supabase user session (marketplace auth) ---
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    try {
      const { createServerSupabase } = await import('./lib/supabase/client')
      const supabase = createServerSupabase()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      locals.user = user
      locals.supabase = supabase
    } catch {
      // Supabase unavailable — leave locals.user undefined
    }
  }

  // Protect marketplace routes — redirect to login if no session
  const protectedPaths = ['/dashboard', '/checkout']
  const isProtected = protectedPaths.some((p) => path.startsWith(p))
  if (isProtected && !locals.user) {
    return context.redirect(`/auth/login?redirect=${encodeURIComponent(path)}`)
  }

  // --- Admin auth guard ---
  const isAdminPage = path.startsWith('/admin')
  const isAdminApi = path.startsWith('/api/admin')

  if (!isAdminPage && !isAdminApi) {
    return next()
  }

  // Allow auth endpoint without cookie (login POST + session check GET + logout DELETE)
  if (path === '/api/admin/auth') {
    return next()
  }

  // Check session cookie
  const token = cookies.get(COOKIE_NAME)?.value
  if (!token) {
    if (isAdminApi) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    // For admin pages, let the SPA handle login display
    // (the SPA checks auth state on mount)
    return next()
  }

  const payload = await verifyToken(token)
  if (!payload) {
    if (isAdminApi) {
      return new Response(JSON.stringify({ ok: false, error: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return next()
  }

  // Set admin user info for downstream handlers
  locals.isAdmin = true
  locals.adminUser = {
    username: (payload.username as string) || 'admin',
    role: (payload.role as string) || 'admin',
  }
  return next()
})
