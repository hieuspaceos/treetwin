/** Clone section backlog — quality tracker for section improvements */
import type { APIRoute } from 'astro'
import { getBacklog, markReviewed } from '@/lib/admin/clone-section-logger'

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(getBacklog()), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async () => {
  markReviewed()
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
