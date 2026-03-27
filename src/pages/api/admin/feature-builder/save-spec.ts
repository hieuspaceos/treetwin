/**
 * POST /api/admin/feature-builder/save-spec
 * Validates and writes a SkillSpec JSON to src/content/feature-specs/{name}.json.
 * Consumed by Claude Code's /skill-creator to scaffold the actual skill folder.
 */
import type { APIRoute } from 'astro'
import { checkFeatureEnabled } from '@/lib/admin/feature-guard'
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

  try {
    const body = await request.json()
    const spec = body?.spec

    if (!spec?.skill?.name || typeof spec.skill.name !== 'string') {
      return json({ ok: false, error: 'Invalid spec: missing skill.name' }, 400)
    }

    // Sanitize name — only allow kebab-case alphanumeric
    const name = spec.skill.name.replace(/[^a-z0-9-]/g, '')
    if (!name) {
      return json({ ok: false, error: 'Invalid spec: skill.name is empty after sanitization' }, 400)
    }

    const dir = path.join(process.cwd(), 'src/content/feature-specs')
    await fs.mkdir(dir, { recursive: true })

    const filePath = path.join(dir, `${name}.json`)
    await fs.writeFile(filePath, JSON.stringify(spec, null, 2), 'utf-8')

    return json({ ok: true, data: { path: `src/content/feature-specs/${name}.json` } })
  } catch {
    return json({ ok: false, error: 'Failed to save spec' }, 500)
  }
}
