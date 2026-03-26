/**
 * Product-scoped GoClaw landing sections API — GET list / POST add section
 * Auto-resolves landing slug from product.landingPage.
 * Requires product to have 'landing' feature enabled.
 */
import type { APIRoute } from 'astro'
import { readLandingConfig, writeLandingConfig } from '@/lib/landing/landing-config-reader'
import { verifyProductScope, isFeatureAllowed } from '@/lib/goclaw/product-scope'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

/** GET /api/goclaw/[product]/landing/sections */
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
  return json({ ok: true, data: { sections: config.sections, total: config.sections.length } })
}

/** POST /api/goclaw/[product]/landing/sections — add section */
export const POST: APIRoute = async ({ params, request }) => {
  const scope = verifyProductScope(request, params.product)
  if (!scope.ok) return scope.response

  if (!isFeatureAllowed(scope.product, 'landing')) {
    return json({ ok: false, error: `Feature "landing" not enabled for product "${params.product}"` }, 403)
  }

  const slug = scope.product.landingPage
  if (!slug) return json({ ok: false, error: 'Product has no landing page configured' }, 404)

  const config = readLandingConfig(slug)
  if (!config) return json({ ok: false, error: 'Landing page not found' }, 404)

  try {
    const section = await request.json()
    if (!section.type) return json({ ok: false, error: 'section.type required' }, 400)
    const newSection = { enabled: true, order: config.sections.length, ...section }
    const updated = { ...config, sections: [...config.sections, newSection] }
    writeLandingConfig(slug, updated)
    return json({ ok: true, data: { index: updated.sections.length - 1 } }, 201)
  } catch {
    return json({ ok: false, error: 'Failed to add section' }, 500)
  }
}
