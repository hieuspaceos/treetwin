/**
 * Product-scoped GoClaw setup API — POST AI-generate landing page config
 * Auto-targets product.landingPage slug. Requires 'landing' feature.
 */
import type { APIRoute } from 'astro'
import { generateLandingPageFromDescription } from '@/lib/landing/ai-setup-generator'
import { verifyProductScope, isFeatureAllowed } from '@/lib/goclaw/product-scope'
import { isValidSlug } from '@/lib/admin/validation'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

/** POST /api/goclaw/[product]/setup */
export const POST: APIRoute = async ({ params, request }) => {
  const scope = verifyProductScope(request, params.product)
  if (!scope.ok) return scope.response

  if (!isFeatureAllowed(scope.product, 'landing')) {
    return json({ ok: false, error: `Feature "landing" not enabled for product "${params.product}"` }, 403)
  }

  if (!import.meta.env.GEMINI_API_KEY) {
    return json({ ok: false, error: 'GEMINI_API_KEY not configured' }, 503)
  }

  // Auto-use product's landing page slug, fall back to body.slug or 'landing'
  const productLandingSlug = scope.product.landingPage

  try {
    const body = (await request.json()) as Record<string, unknown>
    const description = body.description as string
    const slug = productLandingSlug || (body.slug as string) || 'landing'

    if (!description || description.trim().length < 10) {
      return json({ ok: false, error: 'description must be at least 10 characters' }, 400)
    }
    if (!isValidSlug(slug)) {
      return json({ ok: false, error: 'Invalid slug' }, 400)
    }

    const config = await generateLandingPageFromDescription(description.trim(), slug)
    if (!config) return json({ ok: false, error: 'AI generation failed' }, 500)

    return json({ ok: true, data: config })
  } catch {
    return json({ ok: false, error: 'Failed to generate' }, 500)
  }
}
