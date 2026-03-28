/**
 * Image proxy — fetches external images server-side to avoid CORS/hotlink blocks.
 * Usage: /api/proxy-image?url=https://example.com/image.jpg
 * Caches response headers for 1 hour.
 */
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ url }) => {
  const imageUrl = url.searchParams.get('url')
  if (!imageUrl) return new Response('Missing url param', { status: 400 })

  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TreeID-Bot/1.0)' },
    })
    if (!res.ok) return new Response('Failed to fetch image', { status: res.status })

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const body = await res.arrayBuffer()

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
