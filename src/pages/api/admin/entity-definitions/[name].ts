/**
 * Admin entity definition by name — GET read, PUT update, DELETE remove
 */
import type { APIRoute } from 'astro'
import { getEntityDefinition, writeEntityDefinition, deleteEntityDefinition } from '@/lib/admin/entity-io'
import { isValidSlug } from '@/lib/admin/validation'
import { checkFeatureEnabled } from '@/lib/admin/feature-guard'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

export const GET: APIRoute = async ({ params }) => {
  const fc = checkFeatureEnabled('entities')
  if (!fc.enabled) return fc.response
  const { name } = params
  if (!name || !isValidSlug(name)) return json({ ok: false, error: 'Invalid name' }, 400)
  const def = getEntityDefinition(name)
  if (!def) return json({ ok: false, error: 'Not found' }, 404)
  return json({ ok: true, data: def })
}

export const PUT: APIRoute = async ({ params, request }) => {
  const fc = checkFeatureEnabled('entities')
  if (!fc.enabled) return fc.response
  const { name } = params
  if (!name || !isValidSlug(name)) return json({ ok: false, error: 'Invalid name' }, 400)
  if (!getEntityDefinition(name)) return json({ ok: false, error: 'Not found' }, 404)
  try {
    const body = await request.json()
    if (!body.label) return json({ ok: false, error: 'label required' }, 400)
    writeEntityDefinition(name, { label: body.label, fields: body.fields || [], ...body })
    return json({ ok: true, data: { name } })
  } catch {
    return json({ ok: false, error: 'Failed to update' }, 500)
  }
}

export const DELETE: APIRoute = async ({ params }) => {
  const fc = checkFeatureEnabled('entities')
  if (!fc.enabled) return fc.response
  const { name } = params
  if (!name || !isValidSlug(name)) return json({ ok: false, error: 'Invalid name' }, 400)
  const deleted = deleteEntityDefinition(name)
  if (!deleted) return json({ ok: false, error: 'Not found' }, 404)
  return json({ ok: true, data: { name } })
}
