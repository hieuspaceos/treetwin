/**
 * Product-scoped GoClaw entities API — GET list entity definitions
 */
import type { APIRoute } from 'astro'
import { listEntityDefinitions } from '@/lib/admin/entity-io'
import { verifyProductScope } from '@/lib/goclaw/product-scope'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

/** GET /api/goclaw/[product]/entities — list entity definitions */
export const GET: APIRoute = async ({ params, request }) => {
  const scope = verifyProductScope(request, params.product)
  if (!scope.ok) return scope.response

  const defs = listEntityDefinitions()
  return json({ ok: true, data: { entries: defs, total: defs.length } })
}
