/**
 * Admin entity instances API — GET list instances, POST create instance
 */
import type { APIRoute } from 'astro'
import { listEntityInstances, writeEntityInstance, getEntityDefinition } from '@/lib/admin/entity-io'
import { isValidSlug } from '@/lib/admin/validation'
import { slugify, uniqueSlug } from '@/lib/admin/slug'
import { checkFeatureEnabled } from '@/lib/admin/feature-guard'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

export const GET: APIRoute = async ({ params }) => {
  const fc = checkFeatureEnabled('entities')
  if (!fc.enabled) return fc.response
  const { name } = params
  if (!name || !isValidSlug(name)) return json({ ok: false, error: 'Invalid entity name' }, 400)
  if (!getEntityDefinition(name)) return json({ ok: false, error: 'Entity definition not found' }, 404)
  const instances = listEntityInstances(name)
  return json({ ok: true, data: { entries: instances, total: instances.length } })
}

export const POST: APIRoute = async ({ params, request }) => {
  const fc = checkFeatureEnabled('entities')
  if (!fc.enabled) return fc.response
  const { name } = params
  if (!name || !isValidSlug(name)) return json({ ok: false, error: 'Invalid entity name' }, 400)
  if (!getEntityDefinition(name)) return json({ ok: false, error: 'Entity definition not found' }, 404)
  try {
    const body = await request.json() as Record<string, unknown>
    const existing = listEntityInstances(name).map((i) => i.slug)
    const slugSource = (body.title || body.name || body.slug || 'entry') as string
    const baseSlug = slugify(slugSource) || 'entry'
    const slug = uniqueSlug(baseSlug, existing)
    if (!isValidSlug(slug)) return json({ ok: false, error: 'Could not generate a valid slug' }, 400)
    writeEntityInstance(name, slug, body)
    return json({ ok: true, data: { slug } }, 201)
  } catch { return json({ ok: false, error: 'Failed to create instance' }, 500) }
}
