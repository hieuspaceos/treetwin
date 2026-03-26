/**
 * Product collections API — GET list, POST create
 * Scoped to product's declared coreCollections
 */
import type { APIRoute } from 'astro'
import { getContentIO } from '@/lib/admin/content-io'
import { validateEntry, isValidCollection } from '@/lib/admin/validation'
import { slugify, uniqueSlug } from '@/lib/admin/slug'
import { validateProductAccess, isCollectionAllowed } from '@/lib/admin/product-api-auth'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** GET /api/products/[slug]/collections/[collection] — list entries */
export const GET: APIRoute = async ({ params, request, url }) => {
  const { slug, collection } = params
  if (!slug || !collection) return json({ ok: false, error: 'Missing params' }, 400)

  const auth = await validateProductAccess(request, slug)
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status ?? 401)

  if (!isCollectionAllowed(auth.product!, collection)) {
    return json({ ok: false, error: `Collection "${collection}" not allowed for this product` }, 403)
  }

  if (!isValidCollection(collection)) {
    return json({ ok: false, error: 'Invalid collection' }, 400)
  }

  const io = getContentIO()
  let entries = await io.listCollection(collection)

  // Apply query filters
  const status = url.searchParams.get('status')
  const search = url.searchParams.get('search')?.toLowerCase()
  const sort = url.searchParams.get('sort') || 'publishedAt'
  const order = url.searchParams.get('order') || 'desc'

  if (status && status !== 'all') {
    entries = entries.filter((e) => e.status === status)
  }
  if (search) {
    entries = entries.filter(
      (e) => e.title.toLowerCase().includes(search) || e.description.toLowerCase().includes(search),
    )
  }
  entries.sort((a, b) => {
    const aVal = (a as unknown as Record<string, unknown>)[sort] as string || ''
    const bVal = (b as unknown as Record<string, unknown>)[sort] as string || ''
    const cmp = aVal.localeCompare(bVal)
    return order === 'desc' ? -cmp : cmp
  })

  return json({ ok: true, data: { entries, total: entries.length } })
}

/** POST /api/products/[slug]/collections/[collection] — create entry */
export const POST: APIRoute = async ({ params, request }) => {
  const { slug, collection } = params
  if (!slug || !collection) return json({ ok: false, error: 'Missing params' }, 400)

  const auth = await validateProductAccess(request, slug)
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status ?? 401)

  if (!isCollectionAllowed(auth.product!, collection)) {
    return json({ ok: false, error: `Collection "${collection}" not allowed for this product` }, 403)
  }

  if (!isValidCollection(collection)) {
    return json({ ok: false, error: 'Invalid collection' }, 400)
  }

  try {
    const body = (await request.json()) as Record<string, unknown>
    const { valid, errors } = validateEntry(collection, body)
    if (!valid) return json({ ok: false, error: errors.join(', ') }, 400)

    const io = getContentIO()
    const existing = await io.listSlugs(collection)
    const slugSource = (body.title || body.name) as string
    const entrySlug = uniqueSlug(slugify(slugSource), existing)

    if (!body.status) body.status = 'draft'
    if (!body.publishedAt) body.publishedAt = new Date().toISOString().split('T')[0]

    await io.writeEntry(collection, entrySlug, { slug: entrySlug, ...body } as any)
    return json({ ok: true, data: { slug: entrySlug } }, 201)
  } catch {
    return json({ ok: false, error: 'Failed to create entry' }, 500)
  }
}
