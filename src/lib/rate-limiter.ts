/**
 * In-memory sliding window rate limiter.
 * Resets on server restart / Vercel redeploy (stateless).
 * Use for auth endpoints, AI endpoints, and subscribe.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

/** Clean expired entries periodically */
function cleanup() {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}
setInterval(cleanup, 60_000)

/**
 * Check if a request is rate-limited.
 * @param key - unique identifier (e.g., IP + endpoint)
 * @param maxRequests - max requests per window
 * @param windowMs - time window in milliseconds
 * @returns { limited: false } or { limited: true, response: Response }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { limited: false } | { limited: true; response: Response } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false }
  }

  entry.count++
  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return {
      limited: true,
      response: new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
        },
      }),
    }
  }

  return { limited: false }
}

/** Extract client IP from request headers (Vercel/Cloudflare) */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}
