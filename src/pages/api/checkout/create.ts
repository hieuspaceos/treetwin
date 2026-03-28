/**
 * POST /api/checkout/create — creates a pending order for a product.
 * In local mode: inserts into SQLite with a placeholder user_id.
 */
import type { APIRoute } from 'astro'
import { getMarketplaceClient } from '@/lib/supabase/client'
import { getProduct, generateOrderNumber } from '@/lib/supabase/marketplace-queries'

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { productSlug } = body as { productSlug?: string }

    if (!productSlug) {
      return new Response(JSON.stringify({ error: 'productSlug is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const client = await getMarketplaceClient()

    let product: any
    try {
      product = await getProduct(client, productSlug)
    } catch {
      product = null
    }

    if (!product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const orderNumber = generateOrderNumber()

    // Ensure local profile exists (SQLite FK constraint)
    const isLocal = !import.meta.env.PUBLIC_SUPABASE_URL && !process.env.PUBLIC_SUPABASE_URL
    if (isLocal) {
      await client.from('profiles').insert({
        id: 'local-user',
        email: 'dev@local.test',
        display_name: 'Local Dev User',
      }).select()
    }

    const { data: order, error: orderError } = await client
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: 'local-user',
        total_vnd: product.price_vnd,
        total_usd: product.price_usd || 0,
        status: 'pending',
        payment_method: 'local',
      })
      .select()
      .single()

    if (orderError) {
      console.error('[checkout/create] order insert error:', orderError)
    }

    const orderId = order?.id || `local-${Date.now()}`

    // Create order item
    if (orderId) {
      await client.from('order_items').insert({
        order_id: orderId,
        product_id: product.id,
        price_vnd: product.price_vnd,
        price_usd: product.price_usd || 0,
      }).select()
    }

    return new Response(
      JSON.stringify({
        order: order || {
          id: orderId,
          order_number: orderNumber,
          status: 'pending',
          product_id: product.id,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('[checkout/create] unexpected error:', err)
    return new Response(JSON.stringify({ error: err?.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
