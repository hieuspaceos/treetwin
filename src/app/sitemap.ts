import type { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/payload-helpers'
import { siteConfig } from '@/config/site-config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()
  const [articles, notes] = await Promise.all([
    payload.find({ collection: 'articles', where: { status: { equals: 'published' } }, limit: 1000 }),
    payload.find({ collection: 'notes', where: { status: { equals: 'published' } }, limit: 1000 }),
  ])

  const seedUrls = [...articles.docs, ...notes.docs].map((doc) => ({
    url: `${siteConfig.url}/seeds/${(doc as unknown as { slug: string }).slug}`,
    lastModified: (doc as unknown as { updatedAt?: string }).updatedAt
      ? new Date((doc as unknown as { updatedAt: string }).updatedAt)
      : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    { url: siteConfig.url, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteConfig.url}/search`, changeFrequency: 'monthly' as const, priority: 0.3 },
    ...seedUrls,
  ]
}
