/**
 * GoClaw SEO analysis endpoint
 * POST /api/goclaw/seo-analyze — analyze content and return SEO score
 */
import type { APIRoute } from 'astro'
import { verifyGoclawApiKey } from '@/lib/goclaw/api-auth'
import { analyzeSeo } from '@/lib/admin/seo-analyzer'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** POST /api/goclaw/seo-analyze — run SEO analysis on provided content */
export const POST: APIRoute = async ({ request }) => {
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response

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
