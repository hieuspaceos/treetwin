/**
 * Admin products API — GET list all products, POST create new product
 */
import type { APIRoute } from 'astro'
import { listProducts, readProduct, writeProduct } from '@/lib/admin/product-io'
import { isValidSlug } from '@/lib/admin/validation'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

export const GET: APIRoute = async () => {
  const products = listProducts()
  return json({ ok: true, data: { entries: products, total: products.length } })
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    if (!body.slug || !isValidSlug(body.slug)) return json({ ok: false, error: 'Invalid slug' }, 400)
    if (!body.name) return json({ ok: false, error: 'name required' }, 400)
    if (readProduct(body.slug)) return json({ ok: false, error: 'Product already exists' }, 409)
    if (!Array.isArray(body.features)) body.features = []
    if (!Array.isArray(body.coreCollections)) body.coreCollections = []
    writeProduct(body.slug, body)
    return json({ ok: true, data: { slug: body.slug } }, 201)
  } catch {
    return json({ ok: false, error: 'Failed to create' }, 500)
  }
}
