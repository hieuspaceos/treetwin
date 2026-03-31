/**
 * Image proxy — fetches external images server-side to avoid CORS/hotlink blocks.
 * Security: requires admin auth, blocks private IPs, validates content-type, limits size.
 */
import type { APIRoute } from 'astro'
import { verifyToken, COOKIE_NAME } from '@/lib/admin/auth'

export const prerender = false

/** Blocked IP ranges: private networks, loopback, link-local, cloud metadata */
const BLOCKED_PATTERNS = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^127\./,
  /^0\./,
  /^169\.254\./,
  /^fc00:/i,
  /^fe80:/i,
  /^::1$/,
  /^localhost$/i,
]

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

function isBlockedHost(hostname: string): boolean {
  return BLOCKED_PATTERNS.some((p) => p.test(hostname))
}

export const GET: APIRoute = async ({ request, url }) => {
  // Require admin auth
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  const token = match ? match[1] : null
  if (!token) return new Response('Unauthorized', { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return new Response('Unauthorized', { status: 401 })

  const imageUrl = url.searchParams.get('url')
  if (!imageUrl) return new Response('Missing url param', { status: 400 })

  // Validate URL
  let parsed: URL
  try {
    parsed = new URL(imageUrl)
  } catch {
    return new Response('Invalid URL', { status: 400 })
  }

  // Block non-HTTP(S) protocols
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return new Response('Only HTTP/HTTPS allowed', { status: 400 })
  }

  // Block private/internal hosts
  if (isBlockedHost(parsed.hostname)) {
    return new Response('Blocked host', { status: 403 })
  }

  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TreeTwin-Bot/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return new Response('Failed to fetch image', { status: res.status })

    // Validate content-type is an image
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      return new Response('Not an image', { status: 400 })
    }

    // Check content-length if available
    const contentLength = parseInt(res.headers.get('content-length') || '0', 10)
    if (contentLength > MAX_SIZE) {
      return new Response('Image too large', { status: 413 })
    }

    const body = await res.arrayBuffer()
    if (body.byteLength > MAX_SIZE) {
      return new Response('Image too large', { status: 413 })
    }

    return new Response(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return new Response('Image fetch error', { status: 500 })
  }
}
