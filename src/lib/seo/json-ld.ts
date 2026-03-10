import { siteConfig } from '@/config/site-config'

interface SeedForJsonLd {
  title: string
  description: string
  summary?: string | null
  slug: string
  publishedAt?: string | null
  image?: string | null
  keywords?: string[]
  category?: string | null
  language?: string
}

/** Safely serialize JSON-LD — escapes </script> to prevent tag break-out */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/<\//g, '\\u003c/')
}

/** Generate Article JSON-LD for a seed page */
export function articleJsonLd(seed: SeedForJsonLd) {
  const authorUrl = siteConfig.author.url
  const result: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: seed.title,
    description: seed.description,
    url: `${siteConfig.url}/seeds/${seed.slug}`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteConfig.url}/seeds/${seed.slug}` },
    datePublished: seed.publishedAt ?? undefined,
    inLanguage: seed.language || 'en',
    author: {
      '@type': 'Person',
      name: siteConfig.author.name || siteConfig.name,
      ...(authorUrl ? { url: authorUrl } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  }

  if (seed.summary) result.abstract = seed.summary
  if (seed.image) result.image = seed.image
  if (seed.keywords?.length) result.keywords = seed.keywords.join(', ')
  if (seed.category) result.articleSection = seed.category

  return result
}

/** Generate WebSite JSON-LD for the homepage */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: 'en',
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  }
}

/** Generate BreadcrumbList JSON-LD */
export function breadcrumbJsonLd(
  items: { name: string; url?: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  }
}

/** Generate Person JSON-LD for author identity */
export function personJsonLd() {
  const { name, url, email } = siteConfig.author
  if (!name) return null

  const result: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
  }

  if (url) result.url = url
  if (email) result.email = email

  const sameAs = [
    siteConfig.socialLinks.twitter,
    siteConfig.socialLinks.github,
    siteConfig.socialLinks.linkedin,
  ].filter(Boolean)

  if (sameAs.length > 0) result.sameAs = sameAs

  return result
}
