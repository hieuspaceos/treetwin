/**
 * GoClaw voices list endpoint — GET all voice profiles
 * Reads YAML files from src/content/voices/ and returns as JSON array
 */
import type { APIRoute } from 'astro'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { verifyGoclawApiKey } from '@/lib/goclaw/api-auth'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** GET /api/goclaw/voices — list all voice profiles */
export const GET: APIRoute = async ({ request }) => {
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response

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
