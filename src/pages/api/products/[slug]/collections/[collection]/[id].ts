/**
 * Product collection entry API — GET read, PUT update, DELETE remove
 * Scoped to product's declared coreCollections
 */
import type { APIRoute } from 'astro'
import { getContentIO } from '@/lib/admin/content-io'
import { isValidCollection, isValidSlug, validateEntry } from '@/lib/admin/validation'
import { validateProductAccess, isCollectionAllowed } from '@/lib/admin/product-api-auth'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function authAndValidate(
  request: Request,
  slug: string | undefined,
  collection: string | undefined,
  id: string | undefined,
) {
  if (!slug || !collection || !id) return { err: json({ ok: false, error: 'Missing params' }, 400) }

  const auth = await validateProductAccess(request, slug)
  if (!auth.ok) return { err: json({ ok: false, error: auth.error }, auth.status ?? 401) }

  if (!isCollectionAllowed(auth.product!, collection)) {
    return { err: json({ ok: false, error: `Collection "${collection}" not allowed for this product` }, 403) }
  }

  if (!isValidCollection(collection) || !isValidSlug(id)) {
    return { err: json({ ok: false, error: 'Invalid collection or id' }, 400) }
  }

  return { collection, id }
}

/** GET /api/products/[slug]/collections/[collection]/[id] — read single entry */
export const GET: APIRoute = async ({ params, request }) => {
  const { slug, collection, id } = params
  const check = await authAndValidate(request, slug, collection, id)
  if ('err' in check) return check.err

  const io = getContentIO()
  const entry = await io.readEntry(check.collection!, check.id!)
  if (!entry) return json({ ok: false, error: 'Entry not found' }, 404)

  return json({ ok: true, data: entry })
}

/** PUT /api/products/[slug]/collections/[collection]/[id] — update entry */
export const PUT: APIRoute = async ({ params, request }) => {
  const { slug, collection, id } = params
  const check = await authAndValidate(request, slug, collection, id)
  if ('err' in check) return check.err

  try {
    const io = getContentIO()
    const existing = await io.readEntry(check.collection!, check.id!)
    if (!existing) return json({ ok: false, error: 'Entry not found' }, 404)

    const updates = (await request.json()) as Record<string, unknown>
    const merged = { ...existing, ...updates, slug: check.id }

    const { valid, errors } = validateEntry(check.collection!, merged)
    if (!valid) return json({ ok: false, error: errors.join(', ') }, 400)

    await io.writeEntry(check.collection!, check.id!, merged as any)
    return json({ ok: true, data: { slug: check.id } })
  } catch {
    return json({ ok: false, error: 'Failed to update entry' }, 500)
  }
}

/** DELETE /api/products/[slug]/collections/[collection]/[id] — delete entry */
export const DELETE: APIRoute = async ({ params, request }) => {
  const { slug, collection, id } = params
  const check = await authAndValidate(request, slug, collection, id)
  if ('err' in check) return check.err

  try {
    const io = getContentIO()
    await io.deleteEntry(check.collection!, check.id!)
    return json({ ok: true })
  } catch {
    return json({ ok: false, error: 'Failed to delete entry' }, 500)
  }
}
