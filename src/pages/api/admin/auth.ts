/**
 * Admin auth API — POST login, DELETE logout, GET session check
 * Supports multi-user (ADMIN_USERS env) and single-user (ADMIN_PASSWORD) modes
 */
import type { APIRoute } from 'astro'
import { authenticateUser, isMultiUserMode, signToken, buildSessionCookie, buildClearCookie, COOKIE_NAME, verifyToken } from '@/lib/admin/auth'

export const prerender = false

/** POST /api/admin/auth — login with username+password or password-only */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { password, username } = body as { password?: string; username?: string }

    if (!password) {
      return json({ ok: false, error: 'Password is required' }, 400)
    }

    const user = await authenticateUser(password, username)
    if (!user) {
      return json({ ok: false, error: 'Invalid credentials' }, 401)
    }

    const token = await signToken({ username: user.username, role: user.role })
    return new Response(JSON.stringify({ ok: true, data: { username: user.username, role: user.role } }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': buildSessionCookie(token),
      },
    })
  } catch (err) {
    return json({ ok: false, error: 'Login failed' }, 500)
  }
}

/** DELETE /api/admin/auth — logout (clear cookie) */
export const DELETE: APIRoute = async () => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': buildClearCookie(),
    },
  })
}

/** GET /api/admin/auth — check session validity + return user info */
export const GET: APIRoute = async ({ cookies, url }) => {
  // ?mode query returns whether multi-user is enabled (no auth needed)
  if (url.searchParams.get('check') === 'mode') {
    return json({ ok: true, data: { multiUser: isMultiUserMode() } })
  }

  const token = cookies.get(COOKIE_NAME)?.value
  if (!token) return json({ ok: false, error: 'No session' }, 401)

  const payload = await verifyToken(token)
  if (!payload) return json({ ok: false, error: 'Session expired' }, 401)

  return json({
    ok: true,
    data: {
      username: (payload.username as string) || 'admin',
      role: (payload.role as string) || 'admin',
    },
  })
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
