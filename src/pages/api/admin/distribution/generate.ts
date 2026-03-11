/**
 * POST /api/admin/distribution/generate
 * Generate social media posts for a content entry via Gemini Flash
 * Body: { collection: string, slug: string }
 * Returns: { ok: true, data: { posts: SocialPost[] } }
 */
import type { APIRoute } from 'astro'
import { generateSocialPosts, type LanguageOption } from '@/lib/admin/distribution-generator'

export const prerender = false

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { collection, slug, language, platforms } = body as {
      collection?: string; slug?: string; language?: LanguageOption; platforms?: string[]
    }

    if (!collection || !slug) {
      return json({ ok: false, error: 'Missing collection or slug' }, 400)
    }

    // Prevent path traversal in slug
    if (/[\/\\.]/.test(slug)) {
      return json({ ok: false, error: 'Invalid slug' }, 400)
    }

    if (!['articles', 'notes'].includes(collection)) {
      return json({ ok: false, error: 'Invalid collection' }, 400)
    }

    const validLanguages: LanguageOption[] = ['auto', 'vi', 'en']
    const lang = validLanguages.includes(language as LanguageOption) ? (language as LanguageOption) : 'auto'

    // Validate platforms if provided
    const validPlatforms = Array.isArray(platforms) ? platforms.filter((p) => typeof p === 'string') : undefined
    const posts = await generateSocialPosts(collection, slug, lang, validPlatforms)
    return json({ ok: true, data: { posts } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    return json({ ok: false, error: message }, 500)
  }
}
