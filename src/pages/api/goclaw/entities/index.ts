/**
 * GoClaw entities API — GET list entity definitions
 */
import type { APIRoute } from 'astro'
import { listEntityDefinitions } from '@/lib/admin/entity-io'
import { checkFeatureEnabled } from '@/lib/admin/feature-guard'
import { verifyGoclawApiKey } from '@/lib/goclaw/api-auth'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

export const GET: APIRoute = async ({ request }) => {
  const fc = checkFeatureEnabled('goclaw')
  if (!fc.enabled) return fc.response
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response

  const defs = listEntityDefinitions()
  return json({ ok: true, data: { entries: defs, total: defs.length } })
}
