/**
 * POST /api/checkout/confirm — simulate payment confirmation (local dev mode).
 * Updates order to paid → fulfilled, generates a license key.
 */
import type { APIRoute } from 'astro'
import { getMarketplaceClient } from '@/lib/supabase/client'
import { generateLicenseKey } from '@/lib/supabase/marketplace-queries'

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { orderId, productId } = body as { orderId?: string; productId?: string }

    if (!orderId || !productId) {
      return new Response(JSON.stringify({ error: 'orderId and productId are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const client = await getMarketplaceClient()

    // H6: Verify the order exists and is still pending before mutating.
    // Also prevents M6 (duplicate license on double confirm) — second call hits 'paid'/'fulfilled' and returns 400.
    const { data: order } = await client.from('orders').select('*').eq('id', orderId).single()
    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if ((order as any).status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Order already processed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Mark order as paid
    await client.from('orders').update({ status: 'paid' }).eq('id', orderId)

    // Generate and insert license
    const licenseKey = generateLicenseKey()
    const { error: licenseError } = await client.from('licenses').insert({
      user_id: 'local-user',
      product_id: productId,
      order_id: orderId,
      license_key: licenseKey,
      status: 'active',
    })

    if (licenseError) {
      console.error('[checkout/confirm] license insert error:', licenseError)
    }

    // Mark order as fulfilled
    await client.from('orders').update({ status: 'fulfilled' }).eq('id', orderId)

    return new Response(JSON.stringify({ success: true, licenseKey }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('[checkout/confirm] unexpected error:', err)
    return new Response(JSON.stringify({ error: err?.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
