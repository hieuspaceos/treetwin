import type { Metadata } from 'next'
import { siteConfig } from '@/config/site-config'

interface SeedMeta {
  title: string
  description: string
  slug: string
  seo?: { seoTitle?: string | null; ogImage?: string | null; noindex?: boolean | null } | null
  publishedAt?: string | null
  updatedAt?: string | null
}

/** Generate Next.js Metadata for a seed detail page */
export function generateSeedMetadata(seed: SeedMeta): Metadata {
  const title = seed.seo?.seoTitle || seed.title
  const ogImageUrl = seed.seo?.ogImage ||
    `${siteConfig.url}/og?title=${encodeURIComponent(title)}&desc=${encodeURIComponent(seed.description)}`

  return {
    title: `${title} | ${siteConfig.name}`,
    description: seed.description,
    openGraph: {
      title,
      description: seed.description,
      url: `${siteConfig.url}/seeds/${seed.slug}`,
      siteName: siteConfig.name,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      type: 'article',
      publishedTime: seed.publishedAt ?? undefined,
      modifiedTime: seed.updatedAt ?? undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: seed.description,
      images: [ogImageUrl],
    },
    robots: seed.seo?.noindex ? { index: false, follow: false } : undefined,
  }
}

/** Generate Next.js Metadata for the homepage */
export function generateHomeMetadata(): Metadata {
  return {
    title: siteConfig.name,
    description: siteConfig.description,
    openGraph: {
      title: siteConfig.name,
      description: siteConfig.description,
      url: siteConfig.url,
      siteName: siteConfig.name,
      type: 'website',
    },
  }
}
