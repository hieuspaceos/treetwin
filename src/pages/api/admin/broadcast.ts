/**
 * Admin broadcast endpoint — POST /api/admin/broadcast
 * Sends an email to all subscribers via Resend batch API
 * Auth required (handled by middleware)
 */
import type { APIRoute } from 'astro'
import { getAllSubscribers } from '@/lib/email/subscriber-io'
import { sendBatchEmails, isEmailConfigured } from '@/lib/email/resend-client'

export const prerender = false

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** POST /api/admin/broadcast — send email blast to all subscribers */
export const POST: APIRoute = async ({ request }) => {
  try {
    if (!isEmailConfigured()) {
      return json({ ok: false, error: 'Email not configured (RESEND_API_KEY missing)' }, 503)
    }

    const body = await request.json()
    const subject = (body?.subject ?? '').toString().trim()
    const html = (body?.html ?? '').toString().trim()

    if (!subject) return json({ ok: false, error: 'Subject is required' }, 400)
    if (!html) return json({ ok: false, error: 'HTML content is required' }, 400)

    const subscribers = getAllSubscribers()
    if (subscribers.length === 0) {
      return json({ ok: true, sent: 0, message: 'No subscribers to send to' })
    }

    const recipients = subscribers.map((s) => s.email)
    const result = await sendBatchEmails({ recipients, subject, html })

    if (!result.ok) {
      return json({ ok: false, error: result.error || 'Broadcast failed' }, 500)
    }

    return json({ ok: true, sent: result.sent })
  } catch (err) {
    return json({ ok: false, error: 'Broadcast failed' }, 500)
  }
}
