/**
 * Product-scoped GoClaw entity instances API — GET list / POST create
 */
import type { APIRoute } from 'astro'
import { listEntityInstances, writeEntityInstance, getEntityDefinition } from '@/lib/admin/entity-io'
import { verifyProductScope } from '@/lib/goclaw/product-scope'
import { slugify, uniqueSlug } from '@/lib/admin/slug'
import { isValidSlug } from '@/lib/admin/validation'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

/** GET /api/goclaw/[product]/entities/[name] — list instances */
export const GET: APIRoute = async ({ params, request }) => {
  const scope = verifyProductScope(request, params.product)
  if (!scope.ok) return scope.response

  const { name } = params
  if (!name || !isValidSlug(name)) return json({ ok: false, error: 'Invalid entity name' }, 400)
  if (!getEntityDefinition(name)) return json({ ok: false, error: 'Entity definition not found' }, 404)

  const instances = listEntityInstances(name)
  return json({ ok: true, data: { entries: instances, total: instances.length } })
}

/** POST /api/goclaw/[product]/entities/[name] — create instance */
export const POST: APIRoute = async ({ params, request }) => {
  const scope = verifyProductScope(request, params.product)
  if (!scope.ok) return scope.response

  const { name } = params
  if (!name || !isValidSlug(name)) return json({ ok: false, error: 'Invalid entity name' }, 400)
  if (!getEntityDefinition(name)) return json({ ok: false, error: 'Entity definition not found' }, 404)

  try {
    const body = (await request.json()) as Record<string, unknown>
    const existing = listEntityInstances(name).map((i) => i.slug)
    const slugSource = (body.title || body.name || body.slug || 'entry') as string
    const slug = uniqueSlug(slugify(slugSource), existing)
    writeEntityInstance(name, slug, body)
    return json({ ok: true, data: { slug } }, 201)
  } catch {
    return json({ ok: false, error: 'Failed to create instance' }, 500)
  }
}
