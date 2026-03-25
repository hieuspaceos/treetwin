/**
 * GoClaw single voice profile endpoint — GET voice by slug
 * Reads and parses YAML from src/content/voices/[slug].yaml
 */
import type { APIRoute } from 'astro'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { verifyGoclawApiKey } from '@/lib/goclaw/api-auth'
import { isValidSlug } from '@/lib/admin/validation'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** GET /api/goclaw/voices/[slug] — read single voice profile */
export const GET: APIRoute = async ({ params, request }) => {
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response

  const { slug } = params
  if (!slug || !isValidSlug(slug)) {
    return json({ ok: false, error: 'Invalid slug' }, 400)
  }

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
