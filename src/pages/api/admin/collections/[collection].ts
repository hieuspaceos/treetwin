/**
 * Admin collection API — GET list entries, POST create entry
 */
import type { APIRoute } from 'astro'
import { getContentIO } from '@/lib/admin/content-io'
import { isValidCollection } from '@/lib/admin/validation'
import { validateEntry } from '@/lib/admin/validation'
import { slugify, uniqueSlug } from '@/lib/admin/slug'

export const prerender = false

/** GET /api/admin/collections/[collection] — list entries with optional filters */
export const GET: APIRoute = async ({ params, url }) => {
  const { collection } = params
  if (!collection || !isValidCollection(collection)) {
    return json({ ok: false, error: 'Invalid collection' }, 400)
  }

  const io = getContentIO()
  const entries = await io.listCollection(collection)

  // Apply query filters
  const status = url.searchParams.get('status')
  const search = url.searchParams.get('search')?.toLowerCase()
  const sort = url.searchParams.get('sort') || 'publishedAt'
  const order = url.searchParams.get('order') || 'desc'

  let filtered = entries

  if (status && status !== 'all') {
    filtered = filtered.filter((e) => e.status === status)
  }

  if (search) {
    filtered = filtered.filter(
      (e) =>
        e.title.toLowerCase().includes(search) ||
        e.description.toLowerCase().includes(search),
    )
  }

  // Sort entries
  filtered.sort((a, b) => {
    const aVal = (a as unknown as Record<string, unknown>)[sort] as string || ''
    const bVal = (b as unknown as Record<string, unknown>)[sort] as string || ''
    const cmp = aVal.localeCompare(bVal)
    return order === 'desc' ? -cmp : cmp
  })

  return json({ ok: true, data: { entries: filtered, total: filtered.length } })
}

/** POST /api/admin/collections/[collection] — create new entry */
export const POST: APIRoute = async ({ params, request }) => {
  const { collection } = params
  if (!collection || !isValidCollection(collection)) {
    return json({ ok: false, error: 'Invalid collection' }, 400)
  }

  try {
    const body = (await request.json()) as Record<string, unknown>
    const { valid, errors } = validateEntry(collection, body)
    if (!valid) {
      return json({ ok: false, error: errors.join(', ') }, 400)
    }

    const io = getContentIO()
    const existing = await io.listSlugs(collection)
    const baseSlug = slugify(body.title as string)
    const slug = uniqueSlug(baseSlug, existing)

    // Set defaults
    if (!body.status) body.status = 'draft'
    if (!body.publishedAt) body.publishedAt = new Date().toISOString().split('T')[0]

    await io.writeEntry(collection, slug, { slug, ...body } as any)

    return json({ ok: true, data: { slug } }, 201)
  } catch (err) {
    return json({ ok: false, error: 'Failed to create entry' }, 500)
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
