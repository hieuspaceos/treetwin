/**
 * GoClaw template by name — GET read single template
 */
import type { APIRoute } from 'astro'
import { readTemplate } from '@/lib/landing/landing-config-reader'
import { checkFeatureEnabled } from '@/lib/admin/feature-guard'
import { verifyGoclawApiKey } from '@/lib/goclaw/api-auth'
import { isValidSlug } from '@/lib/admin/validation'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

export const GET: APIRoute = async ({ request, params }) => {
  const fc = checkFeatureEnabled('goclaw')
  if (!fc.enabled) return fc.response
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response

  const { name } = params
  if (!name || !isValidSlug(name)) return json({ ok: false, error: 'Invalid template name' }, 400)
  const template = readTemplate(name)
  if (!template) return json({ ok: false, error: 'Template not found' }, 404)
  return json({ ok: true, data: { name, ...template } })
}
