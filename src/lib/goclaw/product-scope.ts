/**
 * Product-scoped GoClaw auth module
 * Combines feature gate + Bearer API key auth + product resolution into one call.
 * Used by all /api/goclaw/[product]/* endpoints.
 */
import { checkFeatureEnabled } from '@/lib/admin/feature-guard'
import { verifyGoclawApiKey } from '@/lib/goclaw/api-auth'
import { readProductConfig } from '@/lib/admin/product-api-auth'
import type { ProductScopeResult } from '@/lib/goclaw/types'

export type { ProductScopeSuccess, ProductScopeFailure, ProductScopeResult } from '@/lib/goclaw/types'
export { isCollectionAllowed, isFeatureAllowed } from '@/lib/admin/product-api-auth'

function jsonResponse(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Verify product-scoped GoClaw request:
 * 1. GoClaw feature must be enabled
 * 2. Bearer API key must be valid (GOCLAW_API_KEY)
 * 3. Product slug must resolve to a known product config
 */
export function verifyProductScope(request: Request, productSlug: string | undefined): ProductScopeResult {
  // 1. Feature gate
  const fc = checkFeatureEnabled('goclaw')
  if (!fc.enabled) return { ok: false, response: fc.response }

  // 2. Bearer API key
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return { ok: false, response: auth.response }

  // 3. Product resolution
  if (!productSlug) {
    return { ok: false, response: jsonResponse({ ok: false, error: 'Product slug required' }, 400) }
  }

  const product = readProductConfig(productSlug)
  if (!product) {
    return { ok: false, response: jsonResponse({ ok: false, error: 'Product not found' }, 404) }
  }

  return { ok: true, product }
}
