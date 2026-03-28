/**
 * POST /api/marketplace/intent — AI-powered product matching.
 * Uses Gemini Flash if GEMINI_API_KEY is configured, falls back to simple text search.
 */
import type { APIRoute } from 'astro'
import { getMarketplaceClient } from '@/lib/supabase/client'
import { listProducts } from '@/lib/supabase/marketplace-queries'

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { query } = body as { query?: string }

    if (!query?.trim()) {
      return new Response(JSON.stringify({ error: 'Query required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const client = await getMarketplaceClient()
    let products: any[] = []
    try {
      products = await listProducts(client)
    } catch {
      products = []
    }

    // Try Gemini AI matching first
    const apiKey = import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY
    if (apiKey && products.length > 0) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const catalog = products.map((p) => ({
          slug: p.slug,
          title: p.title,
          description: p.short_description || p.description,
          category: p.category,
          price_vnd: p.price_vnd,
        }))

        const prompt = `You are a product matching assistant. Given this query: "${query}"
And this product catalog:
${JSON.stringify(catalog, null, 2)}

Return a JSON array of the top 3 most relevant products, each with:
- slug: product slug
- relevance: 1-10 score
- reason: one sentence why this matches (in the same language as the query)

Return ONLY the JSON array, no other text.`

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        })

        const text = result.response.text()
        const match = text.match(/\[[\s\S]*\]/)
        if (match) {
          const ranked = JSON.parse(match[0]) as Array<{ slug: string; relevance: number; reason: string }>
          const matched = ranked
            .map((r) => ({
              ...products.find((p) => p.slug === r.slug),
              relevance: r.relevance,
              reason: r.reason,
            }))
            .filter((p) => p.slug)

          return new Response(JSON.stringify({ products: matched, aiPowered: true }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }
      } catch (aiErr) {
        console.warn('[intent] Gemini failed, falling back to text search:', aiErr)
      }
    }

    // Fallback: simple case-insensitive text search
    const lower = query.toLowerCase()
    const filtered = products.filter(
      (p) =>
        p.title.toLowerCase().includes(lower) ||
        (p.description || '').toLowerCase().includes(lower) ||
        (p.short_description || '').toLowerCase().includes(lower) ||
        p.category.toLowerCase().includes(lower)
    )

    return new Response(
      JSON.stringify({ products: filtered.length > 0 ? filtered : products, aiPowered: false }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('[intent] unexpected error:', err)
    return new Response(JSON.stringify({ error: err?.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
