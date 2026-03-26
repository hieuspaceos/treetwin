/**
 * Product-scoped GoClaw content collection API — GET list, POST create
 * Scoped to collections allowed in product.coreCollections
 */
import type { APIRoute } from 'astro'
import { verifyProductScope, isCollectionAllowed } from '@/lib/goclaw/product-scope'
import { getContentIO } from '@/lib/admin/content-io'
import { isValidCollection, validateEntry } from '@/lib/admin/validation'
import { slugify, uniqueSlug } from '@/lib/admin/slug'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

/** GET /api/goclaw/[product]/content/[collection] — list entries */
export const GET: APIRoute = async ({ params, request }) => {
  const scope = verifyProductScope(request, params.product)
  if (!scope.ok) return scope.response

  const { collection } = params
  if (!collection || !isValidCollection(collection)) return json({ ok: false, error: 'Invalid collection' }, 400)
  if (!isCollectionAllowed(scope.product, collection)) {
    return json({ ok: false, error: `Collection "${collection}" not allowed for product "${params.product}"` }, 403)
  }

  const io = getContentIO()
  const entries = await io.listCollection(collection)
  return json({ ok: true, data: { entries, total: entries.length } })
}

/** POST /api/goclaw/[product]/content/[collection] — create entry (always draft) */
export const POST: APIRoute = async ({ params, request }) => {
  const scope = verifyProductScope(request, params.product)
  if (!scope.ok) return scope.response

  const { collection } = params
  if (!collection || !isValidCollection(collection)) return json({ ok: false, error: 'Invalid collection' }, 400)
  if (!isCollectionAllowed(scope.product, collection)) {
    return json({ ok: false, error: `Collection "${collection}" not allowed for product "${params.product}"` }, 403)
  }

  try {
    const body = (await request.json()) as Record<string, unknown>
    body.status = 'draft'
    if (!body.publishedAt) body.publishedAt = new Date().toISOString().split('T')[0]

    const { valid, errors } = validateEntry(collection, body)
    if (!valid) return json({ ok: false, error: errors.join(', ') }, 400)

    const io = getContentIO()
    const existing = await io.listSlugs(collection)
    const slugSource = (body.title || body.name) as string
    const slug = uniqueSlug(slugify(slugSource), existing)

    await io.writeEntry(collection, slug, { slug, ...body } as any)
    return json({ ok: true, data: { slug } }, 201)
  } catch {
    return json({ ok: false, error: 'Failed to create entry' }, 500)
  }
}
