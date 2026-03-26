/**
 * Product-scoped GoClaw landing config API — GET/PUT
 * Auto-resolves slug from product.landingPage — agent doesn't need to know the landing slug.
 * Requires product to have 'landing' feature enabled.
 */
import type { APIRoute } from 'astro'
import { readLandingConfig, writeLandingConfig } from '@/lib/landing/landing-config-reader'
import { verifyProductScope, isFeatureAllowed } from '@/lib/goclaw/product-scope'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

/** GET /api/goclaw/[product]/landing/config */
export const GET: APIRoute = async ({ params, request }) => {
  const scope = verifyProductScope(request, params.product)
  if (!scope.ok) return scope.response

  if (!isFeatureAllowed(scope.product, 'landing')) {
    return json({ ok: false, error: `Feature "landing" not enabled for product "${params.product}"` }, 403)
  }

  const slug = scope.product.landingPage
  if (!slug) return json({ ok: false, error: 'Product has no landing page configured' }, 404)

  const config = readLandingConfig(slug)
  if (!config) return json({ ok: false, error: 'Landing page not found' }, 404)
  return json({ ok: true, data: config })
}

/** PUT /api/goclaw/[product]/landing/config */
export const PUT: APIRoute = async ({ params, request }) => {
  const scope = verifyProductScope(request, params.product)
  if (!scope.ok) return scope.response

  if (!isFeatureAllowed(scope.product, 'landing')) {
    return json({ ok: false, error: `Feature "landing" not enabled for product "${params.product}"` }, 403)
  }

  const slug = scope.product.landingPage
  if (!slug) return json({ ok: false, error: 'Product has no landing page configured' }, 404)

  try {
    const body = await request.json()
    if (!body.title) return json({ ok: false, error: 'title required' }, 400)
    writeLandingConfig(slug, { ...body, slug })
    return json({ ok: true, data: { slug } })
  } catch {
    return json({ ok: false, error: 'Failed to update' }, 500)
  }
}
