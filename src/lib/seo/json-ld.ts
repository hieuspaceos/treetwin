import { siteConfig } from '@/config/site-config'

interface SeedForJsonLd {
  title: string
  description: string
  slug: string
  publishedAt?: string | null
}

/** Generate Article JSON-LD for a seed page */
export function articleJsonLd(seed: SeedForJsonLd) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: seed.title,
    description: seed.description,
    url: `${siteConfig.url}/seeds/${seed.slug}`,
    datePublished: seed.publishedAt ?? undefined,
    author: { '@type': 'Person', name: siteConfig.author.name || siteConfig.name },
    publisher: { '@type': 'Organization', name: siteConfig.name },
  }
}

/** Generate WebSite JSON-LD for the homepage */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
  }
}
