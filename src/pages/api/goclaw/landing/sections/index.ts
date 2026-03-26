/**
 * GoClaw landing sections API — GET list / POST add section
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
  if (!config) return json({ ok: false, error: 'Landing page not found' }, 404)
  return json({ ok: true, data: { sections: config.sections, total: config.sections.length } })
}

export const POST: APIRoute = async ({ request, url }) => {
  const fc = checkFeatureEnabled('goclaw')
  if (!fc.enabled) return fc.response
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response

  const slug = url.searchParams.get('slug') || 'home'
  if (!isValidSlug(slug)) return json({ ok: false, error: 'Invalid slug' }, 400)
  const config = readLandingConfig(slug)
  if (!config) return json({ ok: false, error: 'Landing page not found' }, 404)

  try {
    const section = await request.json()
    if (!section.type) return json({ ok: false, error: 'section.type required' }, 400)
    const newSection = { enabled: true, order: config.sections.length, ...section }
    const updated = { ...config, sections: [...config.sections, newSection] }
    writeLandingConfig(slug, updated)
    return json({ ok: true, data: { index: updated.sections.length - 1 } }, 201)
  } catch { return json({ ok: false, error: 'Failed to add section' }, 500) }
}
