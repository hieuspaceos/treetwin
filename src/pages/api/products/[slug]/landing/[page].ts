/**
 * Product landing page by slug — GET read, PUT update, DELETE remove
 * Requires 'landing' in product's features list
 */
import type { APIRoute } from 'astro'
import { readLandingConfig, writeLandingConfig, deleteLandingConfig } from '@/lib/landing/landing-config-reader'
import { validateProductAccess, isFeatureAllowed } from '@/lib/admin/product-api-auth'
import { isValidSlug } from '@/lib/admin/validation'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function authGuard(request: Request, slug: string | undefined, page: string | undefined) {
  if (!slug || !page) return { err: json({ ok: false, error: 'Missing params' }, 400) }

  const auth = await validateProductAccess(request, slug)
  if (!auth.ok) return { err: json({ ok: false, error: auth.error }, auth.status ?? 401) }

  if (!isFeatureAllowed(auth.product!, 'landing')) {
    return { err: json({ ok: false, error: 'Feature "landing" not enabled for this product' }, 403) }
  }

  if (!isValidSlug(page)) return { err: json({ ok: false, error: 'Invalid page slug' }, 400) }

  return { page }
}

/** GET /api/products/[slug]/landing/[page] — read landing page */
export const GET: APIRoute = async ({ params, request }) => {
  const check = await authGuard(request, params.slug, params.page)
  if ('err' in check) return check.err

  const config = readLandingConfig(check.page!)
  if (!config) return json({ ok: false, error: 'Not found' }, 404)
  return json({ ok: true, data: config })
}

/** PUT /api/products/[slug]/landing/[page] — update landing page */
export const PUT: APIRoute = async ({ params, request }) => {
  const check = await authGuard(request, params.slug, params.page)
  if ('err' in check) return check.err

  if (!readLandingConfig(check.page!)) return json({ ok: false, error: 'Not found' }, 404)

  try {
    const body = await request.json()
    if (!body.title) return json({ ok: false, error: 'title required' }, 400)
    writeLandingConfig(check.page!, { ...body, slug: check.page })
    return json({ ok: true, data: { slug: check.page } })
  } catch {
    return json({ ok: false, error: 'Failed to update' }, 500)
  }
}

/** DELETE /api/products/[slug]/landing/[page] — delete landing page */
export const DELETE: APIRoute = async ({ params, request }) => {
  const check = await authGuard(request, params.slug, params.page)
  if ('err' in check) return check.err

  const deleted = deleteLandingConfig(check.page!)
  if (!deleted) return json({ ok: false, error: 'Not found' }, 404)
  return json({ ok: true, data: { slug: check.page } })
}
