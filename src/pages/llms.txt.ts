import type { APIRoute } from 'astro'
import { siteConfig } from '@/config/site-config'
import { getAllPublishedSeeds } from '@/lib/content-helpers'

// Prerender at build time — content is static
export const prerender = true

/**
 * llms.txt — lightweight site overview for AI models
 * Follows https://llmstxt.org spec: markdown format, H1 site name, content sections
 */
export const GET: APIRoute = async () => {
  const seeds = await getAllPublishedSeeds()

  const lines: string[] = [
    `# ${siteConfig.name}`,
    '',
    `> ${siteConfig.description}`,
    '',
  ]

  if (siteConfig.author.name) {
    lines.push(`Author: ${siteConfig.author.name}`)
    if (siteConfig.author.url) lines.push(`Website: ${siteConfig.author.url}`)
    lines.push('')
  }

  lines.push('## Articles & Notes', '')

  for (const seed of seeds) {
    const url = `${siteConfig.url}/seeds/${seed.id}`
    const summary = seed.data.summary || seed.data.description
    lines.push(`- [${seed.data.title}](${url}): ${summary}`)
  }

  lines.push('')
  lines.push('## Links', '')
  lines.push(`- [Sitemap](${siteConfig.url}/sitemap-index.xml)`)
  lines.push(`- [Full LLM context](${siteConfig.url}/llms-full.txt)`)

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
