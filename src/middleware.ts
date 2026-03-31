/**
 * Astro middleware — three auth systems coexist:
 * 1. Admin JWT (site owner) — /admin/*, /api/admin/*
 * 2. Better Auth (SaaS users) — /api/saas/*, /api/auth/*
 * 3. Supabase (marketplace) — /dashboard, /checkout
 */
import { defineMiddleware } from 'astro:middleware'
import { COOKIE_NAME, verifyToken } from '@/lib/admin/auth'

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies } = context
  const path = url.pathname
  const locals = context.locals as Record<string, unknown>

  // --- Better Auth API routes — pass through (Better Auth handles internally) ---
  if (path.startsWith('/api/auth')) {
    return next()
  }

  // --- Better Auth session injection (SaaS users) ---
  // Lazy-load to avoid errors when TURSO_URL is not configured
  const tursoUrl = import.meta.env.TURSO_URL || process.env.TURSO_URL
  if (tursoUrl) {
    try {
      const { getAuth } = await import('@/lib/auth')
      const auth = getAuth()
      const session = await auth.api.getSession({ headers: context.request.headers })
      if (session) {
        locals.saasUser = session.user
        locals.saasSession = session.session
      }
    } catch {
      // Better Auth not configured or DB not ready — skip silently
    }
  }

  // --- SaaS API routes — require Better Auth session ---
  if (path.startsWith('/api/saas')) {
    if (!locals.saasUser) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return next()
  }

  // --- Supabase user session (marketplace auth) ---
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    try {
      const hasAuthCookie =
        context.cookies.has('sb-access-token') ||
        [...context.request.headers.entries()].some(([k]) => k.includes('sb-'))
      if (hasAuthCookie) {
        locals.user = { id: 'pending-ssr-integration' }
      }
    } catch {
      // Auth detection failed — leave locals.user undefined
    }
  }

  // Protect marketplace routes — redirect to login if no session
  const protectedPaths = ['/dashboard', '/checkout']
  const isProtected = protectedPaths.some((p) => path.startsWith(p))
  if (isProtected && supabaseUrl && !locals.user) {
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
