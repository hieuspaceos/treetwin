import type { APIRoute } from 'astro'
import { siteConfig } from '@/config/site-config'
import { getAllPublishedSeeds } from '@/lib/content-helpers'

// Prerender at build time — content is static
export const prerender = true

/**
 * llms-full.txt — extended site context for AI models
 * Includes article summaries, tags, categories for deeper AI understanding
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
    if (siteConfig.author.email) lines.push(`Contact: ${siteConfig.author.email}`)
    lines.push('')
  }

  // Collect all unique tags and categories
  const allTags = new Set<string>()
  const allCategories = new Set<string>()
  for (const seed of seeds) {
    seed.data.tags?.forEach((t) => allTags.add(t))
    if (seed.data.category) allCategories.add(seed.data.category)
  }

  if (allCategories.size > 0) {
    lines.push(`## Categories`, '')
    lines.push([...allCategories].join(', '))
    lines.push('')
  }

  if (allTags.size > 0) {
    lines.push(`## Topics`, '')
    lines.push([...allTags].join(', '))
    lines.push('')
  }

  lines.push('## Content', '')

  for (const seed of seeds) {
    const url = `${siteConfig.url}/seeds/${seed.id}`
    const summary = seed.data.summary || seed.data.description
    const type = seed.collection === 'articles' ? 'Article' : 'Note'

    lines.push(`### ${seed.data.title}`)
    lines.push('')
    lines.push(`- URL: ${url}`)
    lines.push(`- Type: ${type}`)
    if (seed.data.publishedAt) lines.push(`- Published: ${seed.data.publishedAt}`)
    if (seed.data.category) lines.push(`- Category: ${seed.data.category}`)
    if (seed.data.tags?.length) lines.push(`- Tags: ${seed.data.tags.join(', ')}`)
    lines.push(`- Summary: ${summary}`)
    lines.push('')
  }

  lines.push('## Links', '')
  lines.push(`- [Sitemap](${siteConfig.url}/sitemap-index.xml)`)
  lines.push(`- [Lightweight version](${siteConfig.url}/llms.txt)`)

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
