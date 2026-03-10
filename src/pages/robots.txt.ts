import type { APIRoute } from 'astro'
import { siteConfig } from '@/config/site-config'

// Prerender at build time — content is static
export const prerender = true

/**
 * robots.txt with per-agent AI crawler granularity.
 *
 * Policy: Allow search/citation crawlers, block training-only crawlers.
 * - Search bots (OAI-SearchBot, Claude-SearchBot) → Allow (drives citations)
 * - Training bots (GPTBot, ClaudeBot, Meta-ExternalAgent) → Disallow (scraping for model training)
 * - Research bots (Gemini-Deep-Research, PerplexityBot) → Allow (drives referral traffic)
 */
export const GET: APIRoute = () => {
  const body = `# Default: allow all crawlers
User-agent: *
Allow: /
Disallow: /keystatic
Disallow: /api

# AI Search/Citation bots — ALLOW (drives traffic + citations)
User-agent: OAI-SearchBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Gemini-Deep-Research
Allow: /

# AI Training bots — BLOCK (scraping for model training, no referral value)
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Meta-ExternalAgent
Disallow: /

Sitemap: ${siteConfig.url}/sitemap-index.xml

# AI/LLM context files (non-standard, speculative)
# See https://llmstxt.org
LLMs-Txt: ${siteConfig.url}/llms.txt`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain' },
  })
}
