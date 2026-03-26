/**
 * Shared types for GoClaw API adapter layer
 */
import type { ProductConfig } from '@/lib/admin/product-types'

/** Webhook payload received from GoClaw callbacks */
export interface WebhookPayload {
  event: string
  agentId?: string
  taskId?: string
  result?: Record<string, unknown>
  timestamp: string
}

/** Standard API response envelope */
export interface GoclawApiResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: string
}

/** Result types for product-scoped GoClaw auth */
export type ProductScopeSuccess = { ok: true; product: ProductConfig }
export type ProductScopeFailure = { ok: false; response: Response }
export type ProductScopeResult = ProductScopeSuccess | ProductScopeFailure
