/**
 * GoClaw landing section by index — GET/PUT/DELETE individual section
 * Uses ?slug=page-slug&id=section-index query params
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

function getConfig(slug: string) {
  return readLandingConfig(slug)
}

export const GET: APIRoute = async ({ request, url, params }) => {
  const fc = checkFeatureEnabled('goclaw')
  if (!fc.enabled) return fc.response
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response

  const slug = url.searchParams.get('slug') || 'home'
  if (!isValidSlug(slug)) return json({ ok: false, error: 'Invalid slug' }, 400)
  const index = parseInt(params.id || '0', 10)
  const config = getConfig(slug)
  if (!config) return json({ ok: false, error: 'Landing page not found' }, 404)
  const section = config.sections[index]
  if (!section) return json({ ok: false, error: 'Section not found' }, 404)
  return json({ ok: true, data: section })
}

export const PUT: APIRoute = async ({ request, url, params }) => {
  const fc = checkFeatureEnabled('goclaw')
  if (!fc.enabled) return fc.response
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response

  const slug = url.searchParams.get('slug') || 'home'
  if (!isValidSlug(slug)) return json({ ok: false, error: 'Invalid slug' }, 400)
  const index = parseInt(params.id || '0', 10)
  const config = getConfig(slug)
  if (!config) return json({ ok: false, error: 'Landing page not found' }, 404)
  if (!config.sections[index]) return json({ ok: false, error: 'Section not found' }, 404)

  try {
    const body = await request.json()
    const sections = [...config.sections]
    sections[index] = { ...sections[index], ...body }
    writeLandingConfig(slug, { ...config, sections })
    return json({ ok: true, data: { index } })
  } catch { return json({ ok: false, error: 'Failed to update section' }, 500) }
}

export const DELETE: APIRoute = async ({ request, url, params }) => {
  const fc = checkFeatureEnabled('goclaw')
  if (!fc.enabled) return fc.response
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response

  const slug = url.searchParams.get('slug') || 'home'
  if (!isValidSlug(slug)) return json({ ok: false, error: 'Invalid slug' }, 400)
  const index = parseInt(params.id || '0', 10)
  const config = getConfig(slug)
  if (!config) return json({ ok: false, error: 'Landing page not found' }, 404)
  if (!config.sections[index]) return json({ ok: false, error: 'Section not found' }, 404)

  const sections = config.sections.filter((_, i) => i !== index)
  writeLandingConfig(slug, { ...config, sections })
  return json({ ok: true, data: { removed: index } })
}
