/**
 * Shared type definitions for marketing dashboard components
 */

export interface DistributionStats {
  total: number
  posted: number
  drafted: number
  platformCounts: Record<string, number>
  firstDate: string | null
  lastDate: string | null
  avgPerWeek: number
}

export interface ContentItem {
  title: string
  slug: string
  collection: 'articles' | 'notes'
  publishedAt: string | null
  distributedPlatforms: string[]
  distributionStatus: 'not_distributed' | 'drafted' | 'posted'
  distributionDate: string | null
}

export interface DistributionEntry {
  date: string
  slug: string
  type: string
  status: string
  wordCount: number
}

export interface DistributionData {
  stats: DistributionStats
  inventory: ContentItem[]
  recentEntries: DistributionEntry[]
}
