/**
 * Product landing pages API — GET list, POST create
 * Requires 'landing' in product's features list
 */
import type { APIRoute } from 'astro'
import { listLandingConfigs, readLandingConfig, writeLandingConfig } from '@/lib/landing/landing-config-reader'
import { validateProductAccess, isFeatureAllowed } from '@/lib/admin/product-api-auth'
import { isValidSlug } from '@/lib/admin/validation'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** GET /api/products/[slug]/landing — list landing pages */
export const GET: APIRoute = async ({ params, request }) => {
  const { slug } = params
  if (!slug) return json({ ok: false, error: 'Missing product slug' }, 400)

  const auth = await validateProductAccess(request, slug)
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status ?? 401)

  if (!isFeatureAllowed(auth.product!, 'landing')) {
    return json({ ok: false, error: 'Feature "landing" not enabled for this product' }, 403)
  }

  const pages = listLandingConfigs()
  return json({ ok: true, data: { entries: pages, total: pages.length } })
}

/** POST /api/products/[slug]/landing — create landing page */
export const POST: APIRoute = async ({ params, request }) => {
  const { slug } = params
  if (!slug) return json({ ok: false, error: 'Missing product slug' }, 400)

  const auth = await validateProductAccess(request, slug)
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status ?? 401)

  if (!isFeatureAllowed(auth.product!, 'landing')) {
    return json({ ok: false, error: 'Feature "landing" not enabled for this product' }, 403)
  }

  try {
    const body = await request.json()
    if (!body.slug || !isValidSlug(body.slug)) return json({ ok: false, error: 'Invalid slug' }, 400)
    if (!body.title) return json({ ok: false, error: 'title required' }, 400)
    if (readLandingConfig(body.slug)) return json({ ok: false, error: 'Page already exists' }, 409)
    if (!body.sections) body.sections = []
    writeLandingConfig(body.slug, body)
    return json({ ok: true, data: { slug: body.slug } }, 201)
  } catch {
    return json({ ok: false, error: 'Failed to create' }, 500)
  }
}
