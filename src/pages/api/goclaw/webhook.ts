/**
 * GoClaw webhook receiver
 * POST /api/goclaw/webhook — receive callbacks from GoClaw with HMAC-SHA256 verification
 */
import type { APIRoute } from 'astro'
import { checkFeatureEnabled } from '@/lib/admin/feature-guard'
import { verifyGoclawApiKey } from '@/lib/goclaw/api-auth'
import type { WebhookPayload } from '@/lib/goclaw/types'

export const prerender = false

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Verify HMAC-SHA256 signature from GoClaw webhook */
async function verifyHmacSignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const expected = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  // Strip 'sha256=' prefix if present
  const incoming = signature.startsWith('sha256=') ? signature.slice(7) : signature
  // Timing-safe comparison
  const encoder2 = new TextEncoder()
  const a = encoder2.encode(expected)
  const b = encoder2.encode(incoming)
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

/** POST /api/goclaw/webhook — receive GoClaw event callbacks */
export const POST: APIRoute = async ({ request }) => {
  const fc = checkFeatureEnabled('goclaw')
  if (!fc.enabled) return fc.response
  const auth = verifyGoclawApiKey(request)
  if (!auth.ok) return auth.response

  const webhookSecret = import.meta.env.GOCLAW_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.warn('[goclaw/webhook] WARNING: GOCLAW_WEBHOOK_SECRET not configured — webhook signatures are NOT verified. Set this env var in production.')
  }
  const rawBody = await request.text()

  // Verify HMAC signature if secret is configured
  if (webhookSecret) {
    const signature = request.headers.get('x-goclaw-signature') || ''
    if (!signature) return json({ ok: false, error: 'Missing webhook signature' }, 401)

    const valid = await verifyHmacSignature(rawBody, signature, webhookSecret)
    if (!valid) return json({ ok: false, error: 'Invalid webhook signature' }, 401)
  }

  try {
    const payload = JSON.parse(rawBody) as WebhookPayload
    // Phase 4 will add event processing — log and acknowledge for now
    console.log('[goclaw/webhook] received event:', payload.event, {
      agentId: payload.agentId,
      taskId: payload.taskId,
      timestamp: payload.timestamp,
    })
    return json({ ok: true, data: { received: true, event: payload.event } })
  } catch {
    return json({ ok: false, error: 'Invalid JSON payload' }, 400)
  }
}
