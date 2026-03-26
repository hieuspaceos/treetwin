/**
 * Product-scoped GoClaw voices list — GET all voice profiles
 * Requires product to have 'voices' feature enabled
 */
import type { APIRoute } from 'astro'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { verifyProductScope, isFeatureAllowed } from '@/lib/goclaw/product-scope'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

/** GET /api/goclaw/[product]/voices — list voice profiles */
export const GET: APIRoute = async ({ params, request }) => {
  const scope = verifyProductScope(request, params.product)
  if (!scope.ok) return scope.response

  if (!isFeatureAllowed(scope.product, 'voices')) {
    return json({ ok: false, error: `Feature "voices" not enabled for product "${params.product}"` }, 403)
  }

  try {
    const voicesDir = join(process.cwd(), 'src/content/voices')
    const files = await readdir(voicesDir)
    const yamlFiles = files.filter((f) => f.endsWith('.yaml'))

    const { load } = await import('js-yaml')
    const voices = await Promise.all(
      yamlFiles.map(async (file) => {
        const content = await readFile(join(voicesDir, file), 'utf-8')
        const data = load(content) as Record<string, unknown>
        return { slug: file.replace('.yaml', ''), ...data }
      }),
    )

    return json({ ok: true, data: { voices, total: voices.length } })
  } catch {
    return json({ ok: false, error: 'Failed to load voices' }, 500)
  }
}
