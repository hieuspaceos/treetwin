import { getPublishedSeeds } from '@/lib/payload-helpers'
import { SeedCard } from '@/components/seed-card'
import { siteConfig } from '@/config/site-config'
import { generateHomeMetadata } from '@/lib/seo/generate-metadata'
import { websiteJsonLd } from '@/lib/seo/json-ld'

export function generateMetadata() {
  return generateHomeMetadata()
}

/** Base seed shape until payload-types.ts is generated */
interface SeedDoc {
  id: string | number
  title: string
  description: string
  slug: string
  publishedAt?: string | null
  tags?: { tag: string }[] | null
  [key: string]: unknown
}

export const revalidate = 3600

export default async function HomePage() {
  const [articles, notes] = await Promise.all([
    getPublishedSeeds('articles', 6),
    getPublishedSeeds('notes', 6),
  ])

  // Merge and sort by publishedAt descending
  const seeds = [
    ...(articles.docs as SeedDoc[]).map((doc) => ({ ...doc, collection: 'articles' as const })),
    ...(notes.docs as SeedDoc[]).map((doc) => ({ ...doc, collection: 'notes' as const })),
  ].sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
    return dateB - dateA
  })

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }} />
      <section className="mb-12">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{siteConfig.name}</h1>
        <p className="text-lg text-gray-600">{siteConfig.description}</p>
      </section>

      {seeds.length === 0 ? (
        <p className="text-gray-500">No published seeds yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {seeds.map((seed) => (
            <SeedCard
              key={seed.slug}
              title={seed.title}
              description={seed.description}
              slug={seed.slug}
              publishedAt={seed.publishedAt ?? null}
              tags={(seed.tags as { tag: string }[] | null) ?? []}
              collection={seed.collection}
            />
          ))}
        </div>
      )}
    </div>
  )
}
