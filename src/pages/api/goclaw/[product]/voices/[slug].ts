/**
 * Product-scoped GoClaw single voice profile — GET by slug
 * Requires product to have 'voices' feature enabled
 */
import type { APIRoute } from 'astro'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { verifyProductScope, isFeatureAllowed } from '@/lib/goclaw/product-scope'
import { isValidSlug } from '@/lib/admin/validation'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

/** GET /api/goclaw/[product]/voices/[slug] */
export const GET: APIRoute = async ({ params, request }) => {
  const scope = verifyProductScope(request, params.product)
  if (!scope.ok) return scope.response

  if (!isFeatureAllowed(scope.product, 'voices')) {
    return json({ ok: false, error: `Feature "voices" not enabled for product "${params.product}"` }, 403)
  }

  const { slug } = params
  if (!slug || !isValidSlug(slug)) return json({ ok: false, error: 'Invalid slug' }, 400)

  try {
    const filePath = join(process.cwd(), 'src/content/voices', `${slug}.yaml`)
    const content = await readFile(filePath, 'utf-8')
    const { load } = await import('js-yaml')
    const data = load(content) as Record<string, unknown>
    return json({ ok: true, data: { slug, ...data } })
  } catch {
    return json({ ok: false, error: 'Voice not found' }, 404)
  }
}
