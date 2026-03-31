/**
 * Admin landing page clone API — POST with URL, returns AI-analyzed sections + design.
 * Requires GEMINI_API_KEY env var and admin auth.
 */
import type { APIRoute } from 'astro'
import { cloneLandingPage } from '@/lib/admin/landing-clone-ai'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = getClientIp(request)
    const rl = checkRateLimit(`ai:${ip}`, 10, 60_000)
    if (rl.limited) return rl.response

    const body = await request.json()
    const url = body?.url?.trim()
    const intent = typeof body?.intent === 'string' ? body.intent.trim() : undefined

    if (!url || typeof url !== 'string') {
      return json({ ok: false, error: 'URL is required' }, 400)
    }

    // Basic URL validation
    try { new URL(url) } catch {
      return json({ ok: false, error: 'Invalid URL format' }, 400)
    }

    const result = await cloneLandingPage(url, intent)
    return json({ ok: true, data: result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Clone failed'
    const status = msg.includes('not configured') ? 503 : 500
    return json({ ok: false, error: msg }, status)
  }
}
