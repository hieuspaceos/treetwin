/**
 * Product-scoped GoClaw SEO analysis — POST analyze content for SEO score
 */
import type { APIRoute } from 'astro'
import { analyzeSeo } from '@/lib/admin/seo-analyzer'
import { verifyProductScope } from '@/lib/goclaw/product-scope'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

/** POST /api/goclaw/[product]/seo-analyze */
export const POST: APIRoute = async ({ params, request }) => {
  const scope = verifyProductScope(request, params.product)
  if (!scope.ok) return scope.response

  try {
    const body = (await request.json()) as Record<string, unknown>
    const { title, description, slug, content, seo, cover, tags, links } = body

    if (!title || !description || !slug || !content) {
      return json({ ok: false, error: 'title, description, slug, and content are required' }, 400)
    }

    const result = analyzeSeo({
      title: title as string,
      description: description as string,
      slug: slug as string,
      content: content as string,
      seo: (seo as Record<string, string>) || {},
      cover: (cover as Record<string, string>) || {},
      tags: (tags as string[]) || [],
      links: { outbound: ((links as Record<string, string[]>)?.outbound) || [] },
    })

    return json({ ok: true, data: result })
  } catch {
    return json({ ok: false, error: 'Failed to analyze SEO' }, 500)
  }
}
