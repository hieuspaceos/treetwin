/**
 * Resend API wrapper — sends transactional and broadcast emails
 * Graceful degradation: returns null if RESEND_API_KEY not set
 */
import { Resend } from 'resend'
import { siteConfig } from '@/config/site-config'

let _client: Resend | null = null

/** Get Resend client (lazy singleton), null if not configured */
export function getResendClient(): Resend | null {
  const apiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY
  if (!apiKey) return null
  if (!_client) _client = new Resend(apiKey)
  return _client
}

/** Check if email feature is available */
export function isEmailConfigured(): boolean {
  return !!(import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY)
}

/** Send a single email via Resend */
export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<{ ok: boolean; error?: string }> {
  const client = getResendClient()
  if (!client) return { ok: false, error: 'Email not configured' }

  try {
    const { error } = await client.emails.send({
      from: `${siteConfig.email.fromName} <${siteConfig.email.from}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Send failed' }
  }
}

/** Send batch emails (up to 100 per call via Resend batch API) */
export async function sendBatchEmails(params: {
  recipients: string[]
  subject: string
  html: string
}): Promise<{ ok: boolean; sent: number; error?: string }> {
  const client = getResendClient()
  if (!client) return { ok: false, sent: 0, error: 'Email not configured' }

  try {
    const emails = params.recipients.map((to) => ({
      from: `${siteConfig.email.fromName} <${siteConfig.email.from}>`,
      to,
      subject: params.subject,
      html: params.html,
    }))
    const { error } = await client.batch.send(emails)
    if (error) return { ok: false, sent: 0, error: error.message }
    return { ok: true, sent: emails.length }
  } catch (err) {
    return { ok: false, sent: 0, error: err instanceof Error ? err.message : 'Batch send failed' }
  }
}
