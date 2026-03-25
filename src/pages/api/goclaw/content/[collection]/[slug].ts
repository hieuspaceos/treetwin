/**
 * GoClaw content entry API — GET read, PUT update, DELETE remove
 * All updates preserve draft status unless explicitly set otherwise
 */
import type { APIRoute } from 'astro'
import { verifyGoclawApiKey } from '@/lib/goclaw/api-auth'
import { getContentIO } from '@/lib/admin/content-io'
import { isValidCollection, isValidSlug, validateEntry } from '@/lib/admin/validation'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** GET /api/goclaw/content/[collection]/[slug] — read entry */
export const GET: APIRoute = async ({ params, request }) => {
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response

  const { collection, slug } = params
  if (!collection || !isValidCollection(collection) || !slug || !isValidSlug(slug)) {
    return json({ ok: false, error: 'Invalid collection or slug' }, 400)
  }

  const io = getContentIO()
  const entry = await io.readEntry(collection, slug)
  if (!entry) return json({ ok: false, error: 'Entry not found' }, 404)

  return json({ ok: true, data: entry })
}

/** PUT /api/goclaw/content/[collection]/[slug] — update entry (partial merge, force draft) */
export const PUT: APIRoute = async ({ params, request }) => {
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response

  const { collection, slug } = params
  if (!collection || !isValidCollection(collection) || !slug || !isValidSlug(slug)) {
    return json({ ok: false, error: 'Invalid collection or slug' }, 400)
  }

  try {
    const io = getContentIO()
    const existing = await io.readEntry(collection, slug)
    if (!existing) return json({ ok: false, error: 'Entry not found' }, 404)

    const updates = (await request.json()) as Record<string, unknown>
    // Force draft — GoClaw cannot publish directly
    const merged = { ...existing, ...updates, slug, status: 'draft' }

    const { valid, errors } = validateEntry(collection, merged)
    if (!valid) return json({ ok: false, error: errors.join(', ') }, 400)

    await io.writeEntry(collection, slug, merged as any)
    return json({ ok: true, data: { slug } })
  } catch {
    return json({ ok: false, error: 'Failed to update entry' }, 500)
  }
}

/** DELETE /api/goclaw/content/[collection]/[slug] — delete entry */
export const DELETE: APIRoute = async ({ params, request }) => {
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response

  const { collection, slug } = params
  if (!collection || !isValidCollection(collection) || !slug || !isValidSlug(slug)) {
    return json({ ok: false, error: 'Invalid collection or slug' }, 400)
  }

  try {
    const io = getContentIO()
    await io.deleteEntry(collection, slug)
    return json({ ok: true })
  } catch {
    return json({ ok: false, error: 'Failed to delete entry' }, 500)
  }
}
