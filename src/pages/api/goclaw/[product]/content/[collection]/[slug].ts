/**
 * Product-scoped GoClaw content entry API — GET/PUT/DELETE single entry
 * Scoped to collections allowed in product.coreCollections
 */
import type { APIRoute } from 'astro'
import { verifyProductScope, isCollectionAllowed } from '@/lib/goclaw/product-scope'
import { getContentIO } from '@/lib/admin/content-io'
import { isValidCollection, isValidSlug, validateEntry } from '@/lib/admin/validation'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

/** GET /api/goclaw/[product]/content/[collection]/[slug] */
export const GET: APIRoute = async ({ params, request }) => {
  const scope = verifyProductScope(request, params.product)
  if (!scope.ok) return scope.response

  const { collection, slug } = params
  if (!collection || !isValidCollection(collection)) return json({ ok: false, error: 'Invalid collection' }, 400)
  if (!isCollectionAllowed(scope.product, collection)) {
    return json({ ok: false, error: `Collection "${collection}" not allowed for product "${params.product}"` }, 403)
  }
  if (!slug || !isValidSlug(slug)) return json({ ok: false, error: 'Invalid slug' }, 400)

  const io = getContentIO()
  const entry = await io.readEntry(collection, slug)
  if (!entry) return json({ ok: false, error: 'Entry not found' }, 404)
  return json({ ok: true, data: entry })
}

/** PUT /api/goclaw/[product]/content/[collection]/[slug] — update (force draft) */
export const PUT: APIRoute = async ({ params, request }) => {
  const scope = verifyProductScope(request, params.product)
  if (!scope.ok) return scope.response

  const { collection, slug } = params
  if (!collection || !isValidCollection(collection)) return json({ ok: false, error: 'Invalid collection' }, 400)
  if (!isCollectionAllowed(scope.product, collection)) {
    return json({ ok: false, error: `Collection "${collection}" not allowed for product "${params.product}"` }, 403)
  }
  if (!slug || !isValidSlug(slug)) return json({ ok: false, error: 'Invalid slug' }, 400)

  try {
    const io = getContentIO()
    const existing = await io.readEntry(collection, slug)
    if (!existing) return json({ ok: false, error: 'Entry not found' }, 404)

    const updates = (await request.json()) as Record<string, unknown>
    const merged = { ...existing, ...updates, slug, status: 'draft' }

    const { valid, errors } = validateEntry(collection, merged)
    if (!valid) return json({ ok: false, error: errors.join(', ') }, 400)

    await io.writeEntry(collection, slug, merged as any)
    return json({ ok: true, data: { slug } })
  } catch {
    return json({ ok: false, error: 'Failed to update entry' }, 500)
  }
}

/** DELETE /api/goclaw/[product]/content/[collection]/[slug] */
export const DELETE: APIRoute = async ({ params, request }) => {
  const scope = verifyProductScope(request, params.product)
  if (!scope.ok) return scope.response

  const { collection, slug } = params
  if (!collection || !isValidCollection(collection)) return json({ ok: false, error: 'Invalid collection' }, 400)
  if (!isCollectionAllowed(scope.product, collection)) {
    return json({ ok: false, error: `Collection "${collection}" not allowed for product "${params.product}"` }, 403)
  }
  if (!slug || !isValidSlug(slug)) return json({ ok: false, error: 'Invalid slug' }, 400)

  try {
    const io = getContentIO()
    await io.deleteEntry(collection, slug)
    return json({ ok: true })
  } catch {
    return json({ ok: false, error: 'Failed to delete entry' }, 500)
  }
}
