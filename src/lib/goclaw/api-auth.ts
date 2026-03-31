/**
 * GoClaw API authentication helper
 * Verifies Bearer token against GOCLAW_API_KEY env var
 */

type AuthSuccess = { ok: true }
type AuthFailure = { ok: false; response: Response }

/** Verify the incoming request has a valid GoClaw API key */
export function verifyGoclawApiKey(request: Request): AuthSuccess | AuthFailure {
  const apiKey = import.meta.env.GOCLAW_API_KEY

  // Integration not configured — return 503
  if (!apiKey) {
    return {
      ok: false,
      response: json({ ok: false, error: 'GoClaw integration not configured' }, 503),
    }
  }

  const authHeader = request.headers.get('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    return {
      ok: false,
      response: json({ ok: false, error: 'Invalid API key' }, 401),
    }
  }
  // Timing-safe comparison to prevent key extraction via timing attacks
  const encoder = new TextEncoder()
  const a = encoder.encode(token)
  const b = encoder.encode(apiKey)
  let mismatch = a.length !== b.length ? 1 : 0
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    mismatch |= (a[i] || 0) ^ (b[i] || 0)
  }
  if (mismatch !== 0) {
    return {
      ok: false,
      response: json({ ok: false, error: 'Invalid API key' }, 401),
    }
  }

  return { ok: true }
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
