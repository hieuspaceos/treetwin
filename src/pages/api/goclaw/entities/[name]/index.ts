/**
 * GoClaw entity instances API — GET list / POST create instance
 */
import type { APIRoute } from 'astro'
import { listEntityInstances, writeEntityInstance, getEntityDefinition } from '@/lib/admin/entity-io'
import { checkFeatureEnabled } from '@/lib/admin/feature-guard'
import { verifyGoclawApiKey } from '@/lib/goclaw/api-auth'
import { slugify, uniqueSlug } from '@/lib/admin/slug'
import { isValidSlug } from '@/lib/admin/validation'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

export const GET: APIRoute = async ({ request, params }) => {
  const fc = checkFeatureEnabled('goclaw')
  if (!fc.enabled) return fc.response
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response

  const { name } = params
  if (!name || !isValidSlug(name)) return json({ ok: false, error: 'Invalid entity name' }, 400)
  if (!getEntityDefinition(name)) return json({ ok: false, error: 'Entity definition not found' }, 404)

  const instances = listEntityInstances(name)
  return json({ ok: true, data: { entries: instances, total: instances.length } })
}

export const POST: APIRoute = async ({ request, params }) => {
  const fc = checkFeatureEnabled('goclaw')
  if (!fc.enabled) return fc.response
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response

  const { name } = params
  if (!name || !isValidSlug(name)) return json({ ok: false, error: 'Invalid entity name' }, 400)
  if (!getEntityDefinition(name)) return json({ ok: false, error: 'Entity definition not found' }, 404)

  try {
    const body = await request.json() as Record<string, unknown>
    const existing = listEntityInstances(name).map((i) => i.slug)
    const slugSource = (body.title || body.name || body.slug || 'entry') as string
    const slug = uniqueSlug(slugify(slugSource), existing)
    writeEntityInstance(name, slug, body)
    return json({ ok: true, data: { slug } }, 201)
  } catch { return json({ ok: false, error: 'Failed to create instance' }, 500) }
}
