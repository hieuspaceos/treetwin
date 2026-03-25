/**
 * GoClaw health check endpoint
 * GET /api/goclaw/health — returns service status and version
 */
import type { APIRoute } from 'astro'
import { verifyGoclawApiKey } from '@/lib/goclaw/api-auth'

export const prerender = false

export const GET: APIRoute = async ({ request }) => {
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response

  return new Response(JSON.stringify({ ok: true, version: '2.1.0' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
