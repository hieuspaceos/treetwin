/**
 * Public subscribe endpoint — POST /api/subscribe
 * No auth required. Validates email, adds subscriber, sends welcome email.
 */
import type { APIRoute } from 'astro'
import { checkFeatureEnabled } from '@/lib/admin/feature-guard'
import { addSubscriber, isSubscribed } from '@/lib/email/subscriber-io'
import { sendEmail, isEmailConfigured } from '@/lib/email/resend-client'
import { siteConfig } from '@/config/site-config'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'

export const prerender = false

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ request }) => {
  const ip = getClientIp(request)
  const rl = checkRateLimit(`subscribe:${ip}`, 3, 60_000)
  if (rl.limited) return rl.response

  const fc = checkFeatureEnabled('email')
  if (!fc.enabled) return fc.response
  try {
    const body = await request.json()
    const email = (body?.email ?? '').toString().trim().toLowerCase()

    if (!email) return json({ ok: false, error: 'Email is required' }, 400)
    if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'Invalid email address' }, 400)
    if (isSubscribed(email)) return json({ ok: false, error: 'Already subscribed' }, 409)

    const sub = addSubscriber(email)
    if (!sub) return json({ ok: false, error: 'Already subscribed' }, 409)

    // Send welcome email if Resend is configured (best-effort, don't fail subscribe)
    if (isEmailConfigured()) {
      const unsubUrl = `${siteConfig.url}/api/unsubscribe?token=${sub.token}`
      await sendEmail({
        to: sub.email,
        subject: `Welcome to ${siteConfig.name}`,
        html: `
          <p>Thanks for subscribing to <strong>${siteConfig.name}</strong>!</p>
          <p>You'll get notified when new articles are published.</p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0"/>
          <p style="font-size:12px;color:#94a3b8">
            <a href="${unsubUrl}" style="color:#94a3b8">Unsubscribe</a>
          </p>
        `,
      })
    }

    return json({ ok: true })
  } catch (err) {
    return json({ ok: false, error: 'Subscribe failed' }, 500)
  }
}
