/**
 * POST /api/admin/feature-builder/generate
 * Reads SkillSpec, generates skill folder + treetwin code, writes to disk.
 */
import type { APIRoute } from 'astro'
import { checkFeatureEnabled } from '@/lib/admin/feature-guard'
import { generateAllFiles } from '@/lib/admin/feature-builder-generate'
import fs from 'node:fs/promises'
import path from 'node:path'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ request }) => {
  const fc = checkFeatureEnabled('feature-builder')
  if (!fc.enabled) return fc.response

  let body: any
  try {
    body = await request.json()
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, 400)
  }

  try {
    const spec = body?.spec

    if (!spec?.skill?.name || typeof spec.skill.name !== 'string') {
      return json({ ok: false, error: 'Invalid spec: missing skill.name' }, 400)
    }
    if (!spec?.treeidIntegration) {
      return json({ ok: false, error: 'Invalid spec: missing treeidIntegration' }, 400)
    }

    const name = spec.skill.name.replace(/[^a-z0-9-]/g, '')
    if (!name) {
      return json({ ok: false, error: 'Invalid spec: skill.name empty after sanitization' }, 400)
    }

    const result = generateAllFiles(spec)
    const root = process.cwd()
    const warnings = [...result.warnings]
    const writtenFiles: string[] = []

    for (const fd of result.files) {
      const fullPath = path.join(root, fd.path)

      // Detect overwrite
      try {
        await fs.access(fullPath)
        warnings.push(`Overwrote: ${fd.path}`)
      } catch { /* file doesn't exist — good */ }

      await fs.mkdir(path.dirname(fullPath), { recursive: true })
      await fs.writeFile(fullPath, fd.content, 'utf-8')
      writtenFiles.push(fd.path)
    }

    return json({
      ok: true,
      data: { files: writtenFiles, registrySnippet: result.registrySnippet, warnings },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    return json({ ok: false, error: message }, 500)
  }
}
