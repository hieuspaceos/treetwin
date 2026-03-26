/**
 * POST /api/admin/feature-builder/clarify
 * Sends feature description + conversation history to Gemini Flash.
 * Returns clarifying questions or readyToPlan signal.
 */
import type { APIRoute } from 'astro'
import { clarifyFeature } from '@/lib/admin/feature-builder-ai'
import { checkFeatureEnabled } from '@/lib/admin/feature-guard'

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

  if (!import.meta.env.GEMINI_API_KEY) {
    // Return readyToPlan so client can skip clarification gracefully
    return json({ ok: true, data: { questions: [], readyToPlan: true } })
  }

  try {
    const body = await request.json() as Record<string, unknown>
    const { description, history } = body as {
      description?: unknown
      history?: unknown
    }

    if (!description || typeof description !== 'object') {
      return json({ ok: false, error: 'Missing or invalid description' }, 400)
    }

    const desc = description as Record<string, unknown>
    if (!desc.name || !desc.purpose) {
      return json({ ok: false, error: 'description.name and description.purpose are required' }, 400)
    }

    const safeHistory = Array.isArray(history) ? history : []

    const result = await clarifyFeature(desc as any, safeHistory as any)
    return json({ ok: true, data: result })
  } catch {
    return json({ ok: false, error: 'Clarification failed' }, 500)
  }
}
