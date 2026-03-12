/**
 * Public unsubscribe endpoint — GET /api/unsubscribe?token=xxx
 * No auth required. Returns HTML confirmation page.
 */
import type { APIRoute } from 'astro'
import { removeByToken } from '@/lib/email/subscriber-io'
import { siteConfig } from '@/config/site-config'

export const prerender = false

export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token') ?? ''

  const removed = token ? removeByToken(token) : false

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Unsubscribe — ${siteConfig.name}</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; }
    .card { background: white; border-radius: 16px; padding: 2.5rem 3rem; max-width: 420px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,.07); }
    h1 { font-size: 1.4rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem; }
    p { color: #64748b; margin: 0 0 1.5rem; }
    a { color: #3b82f6; text-decoration: none; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="card">
    ${removed
      ? `<h1>You've been unsubscribed</h1><p>You won't receive any more emails from ${siteConfig.name}.</p>`
      : `<h1>Invalid or expired link</h1><p>This unsubscribe link is invalid or has already been used.</p>`
    }
    <a href="${siteConfig.url}">Back to ${siteConfig.name}</a>
  </div>
</body>
</html>`

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
