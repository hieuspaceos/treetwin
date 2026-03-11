/**
 * Admin singleton API — GET read, PUT update
 */
import type { APIRoute } from 'astro'
import { getContentIO } from '@/lib/admin/content-io'
import { isValidSingleton, validateSingleton } from '@/lib/admin/validation'

export const prerender = false

/** GET /api/admin/singletons/[singleton] — read singleton */
export const GET: APIRoute = async ({ params }) => {
  const { singleton } = params
  if (!singleton || !isValidSingleton(singleton)) {
    return json({ ok: false, error: 'Invalid singleton' }, 400)
  }

  const io = getContentIO()
  const data = await io.readSingleton(singleton)
  if (!data) {
    return json({ ok: false, error: 'Singleton not found' }, 404)
  }

  return json({ ok: true, data })
}

/** PUT /api/admin/singletons/[singleton] — update singleton */
export const PUT: APIRoute = async ({ params, request }) => {
  const { singleton } = params
  if (!singleton || !isValidSingleton(singleton)) {
    return json({ ok: false, error: 'Invalid singleton' }, 400)
  }

  try {
    const body = (await request.json()) as Record<string, unknown>
    const { valid, errors } = validateSingleton(singleton, body)
    if (!valid) {
      return json({ ok: false, error: errors.join(', ') }, 400)
    }

    const io = getContentIO()
    await io.writeSingleton(singleton, body)
    return json({ ok: true })
  } catch (err) {
    return json({ ok: false, error: 'Failed to update singleton' }, 500)
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
