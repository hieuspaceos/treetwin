/**
 * Product-scoped GoClaw landing section by index — GET/PUT/DELETE
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

/** GET /api/goclaw/[product]/landing/sections/[id] */
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

  const index = parseInt(params.id || '0', 10)
  const section = config.sections[index]
  if (!section) return json({ ok: false, error: 'Section not found' }, 404)
  return json({ ok: true, data: section })
}

/** PUT /api/goclaw/[product]/landing/sections/[id] */
export const PUT: APIRoute = async ({ params, request }) => {
  const scope = verifyProductScope(request, params.product)
  if (!scope.ok) return scope.response

  if (!isFeatureAllowed(scope.product, 'landing')) {
    return json({ ok: false, error: `Feature "landing" not enabled for product "${params.product}"` }, 403)
  }

  const slug = scope.product.landingPage
  if (!slug) return json({ ok: false, error: 'Product has no landing page configured' }, 404)

  const config = readLandingConfig(slug)
  if (!config) return json({ ok: false, error: 'Landing page not found' }, 404)

  const index = parseInt(params.id || '0', 10)
  if (!config.sections[index]) return json({ ok: false, error: 'Section not found' }, 404)

  try {
    const body = await request.json()
    const sections = [...config.sections]
    sections[index] = { ...sections[index], ...body }
    writeLandingConfig(slug, { ...config, sections })
    return json({ ok: true, data: { index } })
  } catch {
    return json({ ok: false, error: 'Failed to update section' }, 500)
  }
}

/** DELETE /api/goclaw/[product]/landing/sections/[id] */
export const DELETE: APIRoute = async ({ params, request }) => {
  const scope = verifyProductScope(request, params.product)
  if (!scope.ok) return scope.response

  if (!isFeatureAllowed(scope.product, 'landing')) {
    return json({ ok: false, error: `Feature "landing" not enabled for product "${params.product}"` }, 403)
  }

  const slug = scope.product.landingPage
  if (!slug) return json({ ok: false, error: 'Product has no landing page configured' }, 404)

  const config = readLandingConfig(slug)
  if (!config) return json({ ok: false, error: 'Landing page not found' }, 404)

  const index = parseInt(params.id || '0', 10)
  if (!config.sections[index]) return json({ ok: false, error: 'Section not found' }, 404)

  const sections = config.sections.filter((_, i) => i !== index)
  writeLandingConfig(slug, { ...config, sections })
  return json({ ok: true, data: { removed: index } })
}
