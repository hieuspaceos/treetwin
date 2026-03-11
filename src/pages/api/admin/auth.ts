/**
 * Admin auth API — POST login, DELETE logout, GET session check
 */
import type { APIRoute } from 'astro'
import { checkAdminPassword, signToken, buildSessionCookie, buildClearCookie, COOKIE_NAME, verifyToken } from '@/lib/admin/auth'

export const prerender = false

/** POST /api/admin/auth — login with password */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { password } = body as { password?: string }

    if (!password) {
      return json({ ok: false, error: 'Password is required' }, 400)
    }

    const valid = await checkAdminPassword(password)
    if (!valid) {
      return json({ ok: false, error: 'Invalid password' }, 401)
    }

    const token = await signToken()
    return new Response(JSON.stringify({ ok: true }), {
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

/** GET /api/admin/auth — check session validity */
export const GET: APIRoute = async ({ cookies }) => {
  const token = cookies.get(COOKIE_NAME)?.value
  if (!token) return json({ ok: false, error: 'No session' }, 401)

  const payload = await verifyToken(token)
  if (!payload) return json({ ok: false, error: 'Session expired' }, 401)

  return json({ ok: true, data: { role: 'admin' } })
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
