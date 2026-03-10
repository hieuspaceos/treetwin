import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { siteConfig } from '@/config/site-config'
import { getAllPublishedSeeds } from '@/lib/content-helpers'

// Prerender at build time
export const prerender = true

/** RSS feed — used by Bing/ChatGPT search for freshness signaling */
export async function GET(context: APIContext) {
  const seeds = await getAllPublishedSeeds()

  return rss({
    title: siteConfig.name,
    description: siteConfig.description,
    site: context.site?.toString() || siteConfig.url,
    items: seeds.map((seed) => ({
      title: seed.data.title,
      description: seed.data.summary || seed.data.description,
      pubDate: seed.data.publishedAt ? new Date(seed.data.publishedAt) : undefined,
      link: `/seeds/${seed.id}`,
      categories: seed.data.tags ?? [],
    })),
  })
}
