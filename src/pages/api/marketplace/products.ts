import type { APIRoute } from 'astro'
import { getMarketplaceClient } from '@/lib/supabase/client'
import { listProducts } from '@/lib/supabase/marketplace-queries'

/** GET /api/marketplace/products?category=tool */
export const GET: APIRoute = async ({ url }) => {
  try {
    const client = await getMarketplaceClient()
    const category = url.searchParams.get('category') || undefined
    const products = await listProducts(client, category)
    return new Response(JSON.stringify(products), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch products' }), { status: 500 })
  }
}
