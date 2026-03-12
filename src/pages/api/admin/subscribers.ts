/**
 * Admin subscribers endpoint — GET list, DELETE by email
 * Auth required (handled by middleware)
 */
import type { APIRoute } from 'astro'
import { getAllSubscribers, getSubscriberCount, removeByEmail } from '@/lib/email/subscriber-io'

export const prerender = false

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** GET /api/admin/subscribers — list all subscribers */
export const GET: APIRoute = async () => {
  try {
    const subscribers = getAllSubscribers()
    const count = getSubscriberCount()
    return json({ ok: true, data: { subscribers, count } })
  } catch (err) {
    return json({ ok: false, error: 'Failed to load subscribers' }, 500)
  }
}

/** DELETE /api/admin/subscribers — remove subscriber by email */
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const email = (body?.email ?? '').toString().trim()
    if (!email) return json({ ok: false, error: 'Email is required' }, 400)

    const removed = removeByEmail(email)
    if (!removed) return json({ ok: false, error: 'Subscriber not found' }, 404)

    return json({ ok: true })
  } catch (err) {
    return json({ ok: false, error: 'Delete failed' }, 500)
  }
}
