/**
 * Product settings API — GET read, PUT update
 * Returns the product config (YAML) as read-only settings.
 * Settings are the product's own YAML file fields.
 */
import type { APIRoute } from 'astro'
import { validateProductAccess } from '@/lib/admin/product-api-auth'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** GET /api/products/[slug]/settings — read product settings */
export const GET: APIRoute = async ({ params, request }) => {
  const { slug } = params
  if (!slug) return json({ ok: false, error: 'Missing product slug' }, 400)

  const auth = await validateProductAccess(request, slug)
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status ?? 401)

  // Return product config as settings (excludes sensitive internal fields)
  const { slug: _slug, ...settings } = auth.product!
  return json({ ok: true, data: { slug, ...settings } })
}

/** PUT /api/products/[slug]/settings — update product settings (not implemented — YAML is source of truth) */
export const PUT: APIRoute = async ({ params, request }) => {
  const { slug } = params
  if (!slug) return json({ ok: false, error: 'Missing product slug' }, 400)

  const auth = await validateProductAccess(request, slug)
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status ?? 401)

  // Product config is managed via YAML files — direct API updates not supported
  return json({ ok: false, error: 'Product settings are managed via YAML configuration files' }, 501)
}
