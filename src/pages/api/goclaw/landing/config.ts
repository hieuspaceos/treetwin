/**
 * GoClaw landing config API — GET/PUT full landing page config by slug query param
 */
import type { APIRoute } from 'astro'
import { readLandingConfig, writeLandingConfig } from '@/lib/landing/landing-config-reader'
import { checkFeatureEnabled } from '@/lib/admin/feature-guard'
import { verifyGoclawApiKey } from '@/lib/goclaw/api-auth'
import { isValidSlug } from '@/lib/admin/validation'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

export const GET: APIRoute = async ({ request, url }) => {
  const fc = checkFeatureEnabled('goclaw')
  if (!fc.enabled) return fc.response
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response

  const slug = url.searchParams.get('slug') || 'home'
  if (!isValidSlug(slug)) return json({ ok: false, error: 'Invalid slug' }, 400)
  const config = readLandingConfig(slug)
  if (!config) return json({ ok: false, error: 'Not found' }, 404)
  return json({ ok: true, data: config })
}

export const PUT: APIRoute = async ({ request, url }) => {
  const fc = checkFeatureEnabled('goclaw')
  if (!fc.enabled) return fc.response
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response

  const slug = url.searchParams.get('slug') || 'home'
  if (!isValidSlug(slug)) return json({ ok: false, error: 'Invalid slug' }, 400)
  try {
    const body = await request.json()
    if (!body.title) return json({ ok: false, error: 'title required' }, 400)
    writeLandingConfig(slug, { ...body, slug })
    return json({ ok: true, data: { slug } })
  } catch { return json({ ok: false, error: 'Failed to update' }, 500) }
}
