/**
 * Shared types for GoClaw API adapter layer
 */

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
