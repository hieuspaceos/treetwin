// Distribution dashboard helpers — CSV parser, stats aggregator, metrics sync
// Reads logs/distribution-log.csv and syncs stats to docs/marketing-metrics.md

import fs from 'node:fs'
import path from 'node:path'

const PROJECT_ROOT = path.resolve(process.cwd())
const LOG_FILE = path.join(PROJECT_ROOT, 'logs', 'distribution-log.csv')
const METRICS_FILE = path.join(PROJECT_ROOT, 'docs', 'marketing-metrics.md')

/** Single row from distribution-log.csv */
export interface DistributionEntry {
  date: string
  slug: string
  type: string
  platforms: string[]
  status: 'drafted' | 'posted'
  wordCount: number
  notes: string
}

/** Aggregated stats from all CSV entries */
export interface DistributionStats {
  total: number
  posted: number
  drafted: number
  platformCounts: Record<string, number>
  firstDate: string | null
  lastDate: string | null
  avgPerWeek: number
}

/** Content item with distribution info (for the table) */
export interface ContentItem {
  title: string
  slug: string
  collection: 'articles' | 'notes'
  publishedAt: string | null
  distributedPlatforms: string[]
  distributionStatus: 'not_distributed' | 'drafted' | 'posted'
  distributionDate: string | null
}

/** Parse CSV log file into typed entries. Returns [] if file missing. */
export function parseDistributionLog(): DistributionEntry[] {
  if (!fs.existsSync(LOG_FILE)) return []

  const raw = fs.readFileSync(LOG_FILE, 'utf-8').trim()
  if (!raw) return []

  const lines = raw.split('\n')
  // Skip header row
  if (lines.length <= 1) return []

  return lines.slice(1).map((line) => {
    const cols = parseCSVLine(line)
    return {
      date: cols[0] ?? '',
      slug: cols[1] ?? '',
      type: cols[2] ?? '',
      platforms: (cols[3] ?? '').split(',').filter(Boolean),
      status: (cols[4] as 'drafted' | 'posted') ?? 'drafted',
      wordCount: parseInt(cols[5] ?? '0', 10),
      notes: cols[6] ?? '',
    }
  })
}

/** Simple CSV line parser handling quoted fields */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

/** Compute aggregate stats from parsed entries */
export function getDistributionStats(entries: DistributionEntry[]): DistributionStats {
  if (entries.length === 0) {
    return { total: 0, posted: 0, drafted: 0, platformCounts: {}, firstDate: null, lastDate: null, avgPerWeek: 0 }
  }

  const posted = entries.filter((e) => e.status === 'posted').length
  const drafted = entries.filter((e) => e.status === 'drafted').length

  // Count by platform
  const platformCounts: Record<string, number> = {}
  for (const entry of entries) {
    for (const p of entry.platforms) {
      platformCounts[p] = (platformCounts[p] ?? 0) + 1
    }
  }

  // Date range
  const dates = entries.map((e) => e.date).filter(Boolean).sort()
  const firstDate = dates[0] ?? null
  const lastDate = dates[dates.length - 1] ?? null

  // Avg per week
  let avgPerWeek = 0
  if (firstDate && lastDate) {
    const diffMs = new Date(lastDate).getTime() - new Date(firstDate).getTime()
    const weeks = Math.max(1, diffMs / (7 * 24 * 60 * 60 * 1000))
    avgPerWeek = Math.round((entries.length / weeks) * 10) / 10
  } else {
    avgPerWeek = entries.length
  }

  return { total: entries.length, posted, drafted, platformCounts, firstDate, lastDate, avgPerWeek }
}

/** Build content inventory by cross-referencing content collections with CSV log */
export function buildContentInventory(
  seeds: Array<{ data: { title: string; publishedAt?: string | null }; id: string; collection: 'articles' | 'notes' }>,
  entries: DistributionEntry[],
): ContentItem[] {
  // Group CSV entries by slug — latest entry wins
  const entryMap = new Map<string, DistributionEntry>()
  for (const e of entries) {
    entryMap.set(e.slug, e)
  }

  return seeds.map((seed) => {
    const entry = entryMap.get(seed.id)
    return {
      title: seed.data.title,
      slug: seed.id,
      collection: seed.collection,
      publishedAt: seed.data.publishedAt ?? null,
      distributedPlatforms: entry?.platforms ?? [],
      distributionStatus: entry ? entry.status : 'not_distributed',
      distributionDate: entry?.date ?? null,
    }
  })
}

/** Sync current stats into docs/marketing-metrics.md (Distribution Stats section) */
export function syncMetricsDoc(stats: DistributionStats, entries: DistributionEntry[]): void {
  if (!fs.existsSync(METRICS_FILE)) return

  let content = fs.readFileSync(METRICS_FILE, 'utf-8')

  // Count unique articles and notes distributed
  const articleSlugs = new Set(entries.filter((e) => e.type === 'article').map((e) => e.slug))
  const noteSlugs = new Set(entries.filter((e) => e.type === 'note').map((e) => e.slug))

  // Replace Distribution Stats section values
  const replacements: [RegExp, string][] = [
    [/Articles distributed: .+/, `Articles distributed: ${articleSlugs.size || '-'}`],
    [/Notes distributed: .+/, `Notes distributed: ${noteSlugs.size || '-'}`],
    [/Total social posts: .+/, `Total social posts: ${stats.total || '-'}`],
    [/Avg frequency: .+/, `Avg frequency: ${stats.avgPerWeek ? `${stats.avgPerWeek} posts/week` : '- posts/week'}`],
  ]

  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement)
  }

  fs.writeFileSync(METRICS_FILE, content, 'utf-8')
}
