/**
 * Admin collection entry API — GET read, PUT update, DELETE remove
 */
import type { APIRoute } from 'astro'
import { getContentIO } from '@/lib/admin/content-io'
import { isValidCollection, isValidSlug, validateEntry } from '@/lib/admin/validation'

export const prerender = false

/** GET /api/admin/collections/[collection]/[slug] — read full entry */
export const GET: APIRoute = async ({ params }) => {
  const { collection, slug } = params
  if (!collection || !isValidCollection(collection) || !slug || !isValidSlug(slug)) {
    return json({ ok: false, error: 'Invalid collection or slug' }, 400)
  }

  const io = getContentIO()
  const entry = await io.readEntry(collection, slug)
  if (!entry) {
    return json({ ok: false, error: 'Entry not found' }, 404)
  }

  return json({ ok: true, data: entry })
}

/** PUT /api/admin/collections/[collection]/[slug] — update entry (partial merge) */
export const PUT: APIRoute = async ({ params, request }) => {
  const { collection, slug } = params
  if (!collection || !isValidCollection(collection) || !slug || !isValidSlug(slug)) {
    return json({ ok: false, error: 'Invalid collection or slug' }, 400)
  }

  try {
    const io = getContentIO()
    const existing = await io.readEntry(collection, slug)
    if (!existing) {
      return json({ ok: false, error: 'Entry not found' }, 404)
    }

    const updates = (await request.json()) as Record<string, unknown>
    const merged = { ...existing, ...updates, slug }

    const { valid, errors } = validateEntry(collection, merged)
    if (!valid) {
      return json({ ok: false, error: errors.join(', ') }, 400)
    }

    await io.writeEntry(collection, slug, merged as any)
    return json({ ok: true, data: { slug } })
  } catch (err) {
    return json({ ok: false, error: 'Failed to update entry' }, 500)
  }
}

/** DELETE /api/admin/collections/[collection]/[slug] — delete entry */
export const DELETE: APIRoute = async ({ params }) => {
  const { collection, slug } = params
  if (!collection || !isValidCollection(collection) || !slug || !isValidSlug(slug)) {
    return json({ ok: false, error: 'Invalid collection or slug' }, 400)
  }

  try {
    const io = getContentIO()
    await io.deleteEntry(collection, slug)
    return json({ ok: true })
  } catch (err) {
    return json({ ok: false, error: 'Failed to delete entry' }, 500)
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
