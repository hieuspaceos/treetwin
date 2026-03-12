/**
 * Astro middleware — admin auth guard
 * Checks JWT cookie on /admin/* and /api/admin/* routes
 * Skips auth for POST /api/admin/auth (login endpoint)
 */
import { defineMiddleware } from 'astro:middleware'
import { COOKIE_NAME, verifyToken } from '@/lib/admin/auth'

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies } = context
  const path = url.pathname

  // Only guard admin routes
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
  const locals = context.locals as Record<string, unknown>
  locals.isAdmin = true
  locals.adminUser = {
    username: (payload.username as string) || 'admin',
    role: (payload.role as string) || 'admin',
  }
  return next()
})
