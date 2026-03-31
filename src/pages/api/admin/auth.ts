/**
 * Admin auth API — POST login, DELETE logout, GET session check
 * Supports multi-user (ADMIN_USERS env) and single-user (ADMIN_PASSWORD) modes.
 * When `product` is provided in the request body, validates against product YAML users.
 */
import type { APIRoute } from 'astro'
import { authenticateUser, isMultiUserMode, signToken, buildSessionCookie, buildClearCookie, COOKIE_NAME, verifyToken, verifyPassword, timingSafeCompare } from '@/lib/admin/auth'
import { readProduct } from '@/lib/admin/product-io'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'

export const prerender = false

/** POST /api/admin/auth — login with username+password or password-only */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Rate limit: 5 login attempts per minute per IP
    const ip = getClientIp(request)
    const rl = checkRateLimit(`auth:${ip}`, 5, 60_000)
    if (rl.limited) return rl.response

    const body = await request.json()
    const { password, username, product: productSlug } = body as {
      password?: string
      username?: string
      product?: string
    }

    if (!password) {
      return json({ ok: false, error: 'Password is required' }, 400)
    }

    // Product-scoped login: validate against product YAML users list
    if (productSlug) {
      const productConfig = readProduct(productSlug)
      if (!productConfig) {
        return json({ ok: false, error: 'Product not found' }, 404)
      }
      const productUsers = productConfig.users ?? []
      if (!username) {
        return json({ ok: false, error: 'Username is required for product login' }, 400)
      }
      const match = productUsers.find((u) => u.username === username)
      if (!match) {
        return json({ ok: false, error: 'Invalid credentials' }, 401)
      }
      // Support hashed passwords (salt:hash format) and plain with timing-safe compare
      const isHashed = match.password.includes(':')
      const passwordValid = isHashed
        ? await verifyPassword(password, match.password)
        : await timingSafeCompare(password, match.password)
      if (!passwordValid) {
        return json({ ok: false, error: 'Invalid credentials' }, 401)
      }
      // Embed product slug in JWT so API middleware can enforce product scope
      const token = await signToken({ username: match.username, role: match.role, product: productSlug })
      return new Response(JSON.stringify({ ok: true, data: { username: match.username, role: match.role } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Set-Cookie': buildSessionCookie(token) },
      })
    }

    // Core admin login: ADMIN_USERS env var or ADMIN_PASSWORD fallback
    const user = await authenticateUser(password, username)
    if (!user) {
      return json({ ok: false, error: 'Invalid credentials' }, 401)
    }

    // Core admin JWT has no `product` field — full access
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
