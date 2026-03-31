/**
 * Better Auth API catch-all — handles OAuth callbacks, session management, etc.
 * All /api/auth/* requests are forwarded to Better Auth's handler.
 */
import { getAuth } from '@/lib/auth'
import type { APIRoute } from 'astro'

export const prerender = false

export const ALL: APIRoute = async (ctx) => {
  return getAuth().handler(ctx.request)
}
