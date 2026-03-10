import type { APIRoute } from 'astro'
import { siteConfig } from '@/config/site-config'

// Prerender at build time — content is static
export const prerender = true

// Dynamic robots.txt — disallows admin and API paths from crawlers
export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: /
Disallow: /keystatic
Disallow: /api

Sitemap: ${siteConfig.url}/sitemap-index.xml`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain' },
  })
}
