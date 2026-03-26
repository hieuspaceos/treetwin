/**
 * Admin product by slug — GET read, PUT update, DELETE remove
 */
import type { APIRoute } from 'astro'
import { readProduct, writeProduct, deleteProduct } from '@/lib/admin/product-io'
import { isValidSlug } from '@/lib/admin/validation'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

export const GET: APIRoute = async ({ params }) => {
  const { slug } = params
  if (!slug || !isValidSlug(slug)) return json({ ok: false, error: 'Invalid slug' }, 400)
  const product = readProduct(slug)
  if (!product) return json({ ok: false, error: 'Not found' }, 404)
  return json({ ok: true, data: product })
}

export const PUT: APIRoute = async ({ params, request }) => {
  const { slug } = params
  if (!slug || !isValidSlug(slug)) return json({ ok: false, error: 'Invalid slug' }, 400)
  if (!readProduct(slug)) return json({ ok: false, error: 'Not found' }, 404)
  try {
    const body = await request.json()
    if (!body.name) return json({ ok: false, error: 'name required' }, 400)
    if (!Array.isArray(body.features)) body.features = []
    if (!Array.isArray(body.coreCollections)) body.coreCollections = []
    writeProduct(slug, { ...body, slug })
    return json({ ok: true, data: { slug } })
  } catch {
    return json({ ok: false, error: 'Failed to update' }, 500)
  }
}

export const DELETE: APIRoute = async ({ params }) => {
  const { slug } = params
  if (!slug || !isValidSlug(slug)) return json({ ok: false, error: 'Invalid slug' }, 400)
  const deleted = deleteProduct(slug)
  if (!deleted) return json({ ok: false, error: 'Not found' }, 404)
  return json({ ok: true, data: { slug } })
}
