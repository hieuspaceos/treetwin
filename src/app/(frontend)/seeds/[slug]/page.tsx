import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { SerializedEditorState } from 'lexical'
import { getPayloadClient, getSeedBySlug } from '@/lib/payload-helpers'
import { Breadcrumb } from '@/components/breadcrumb'
import { LexicalRenderer, extractHeadings } from '@/components/lexical-renderer'
import { Toc } from '@/components/toc'
import { generateSeedMetadata } from '@/lib/seo/generate-metadata'
import { articleJsonLd } from '@/lib/seo/json-ld'

/** Seed shape until payload-types.ts is generated */
interface SeedDoc {
  title: string
  description: string
  slug: string
  publishedAt?: string | null
  content?: unknown
  tags?: { tag: string }[] | null
  [key: string]: unknown
}

export const revalidate = 3600

interface SeedPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: SeedPageProps): Promise<Metadata> {
  const { slug } = await params
  const seed = (await getSeedBySlug('articles', slug) || await getSeedBySlug('notes', slug)) as unknown as SeedDoc | null
  if (!seed) return {}
  return generateSeedMetadata(seed)
}

export default async function SeedPage({ params }: SeedPageProps) {
  const { slug } = await params

  // Query both collections in parallel to avoid waterfall
  const [articleResult, noteResult] = await Promise.all([
    getSeedBySlug('articles', slug),
    getSeedBySlug('notes', slug),
  ])
  let seed = (articleResult as unknown as SeedDoc | null)
  let collection: 'articles' | 'notes' = 'articles'
  if (!seed) {
    seed = (noteResult as unknown as SeedDoc | null)
    collection = 'notes'
  }
  if (!seed) notFound()

  const isArticle = collection === 'articles'
  const content = seed.content as SerializedEditorState | string | null
  const headings = isArticle && content ? extractHeadings(content as SerializedEditorState) : []
  const date = seed.publishedAt
    ? new Date(seed.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(seed)) }} />
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: collection === 'articles' ? 'Articles' : 'Notes' },
          { label: seed.title },
        ]}
      />

      <header className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{seed.title}</h1>
        <p className="mb-3 text-lg text-gray-600">{seed.description}</p>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="capitalize">{collection}</span>
          {date && <time dateTime={seed.publishedAt!}>{date}</time>}
        </div>
      </header>

      <div className={headings.length > 0 ? 'lg:grid lg:grid-cols-[1fr_220px] lg:gap-8' : ''}>
        <div>
          {isArticle && content ? (
            <LexicalRenderer data={content as SerializedEditorState} />
          ) : (
            <div className="prose prose-gray max-w-none whitespace-pre-wrap">
              {typeof content === 'string' ? content : null}
            </div>
          )}
        </div>

        {headings.length > 0 && (
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <Toc headings={headings} />
            </div>
          </aside>
        )}
      </div>
    </article>
  )
}

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const [articles, notes] = await Promise.all([
    payload.find({ collection: 'articles', where: { status: { equals: 'published' } }, limit: 100 }),
    payload.find({ collection: 'notes', where: { status: { equals: 'published' } }, limit: 100 }),
  ])
  return [...articles.docs, ...notes.docs].map((doc) => ({ slug: (doc as unknown as SeedDoc).slug }))
}
