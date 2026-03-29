/**
 * Clone section backlog — tracks ALL sections from clones for improvement.
 * Logs every section type + quality assessment → identifies what to CREATE or UPGRADE.
 * Data: data/clone-section-backlog.json
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const LOG_PATH = join(process.cwd(), 'data', 'clone-section-backlog.json')

interface SectionLog {
  /** Section type used */
  type: string
  /** How well this section matches the original site */
  quality: 'good' | 'partial' | 'poor' | 'missing'
  /** What's wrong or could be improved */
  issue: string
  /** Count across clones */
  count: number
  /** URLs */
  urls: string[]
  firstSeen: string
  lastSeen: string
}

interface Backlog {
  totalClones: number
  sections: SectionLog[]
  lastReviewedAt: string | null
  updatedAt: string
}

function readBacklog(): Backlog {
  try {
    if (existsSync(LOG_PATH)) return JSON.parse(readFileSync(LOG_PATH, 'utf8'))
  } catch {}
  return { totalClones: 0, sections: [], lastReviewedAt: null, updatedAt: '' }
}

function saveBacklog(b: Backlog) {
  const dir = join(process.cwd(), 'data')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(LOG_PATH, JSON.stringify(b, null, 2))
}

/** Log ALL sections from a clone — assess quality of each */
export function logCloneSections(
  url: string,
  sections: Array<{ type: string; data?: Record<string, unknown> }>
) {
  const b = readBacklog()
  b.totalClones++
  b.updatedAt = new Date().toISOString()
  const now = b.updatedAt

  for (const s of sections) {
    const data = s.data || {}
    const type = s.type

    // Assess quality based on how much data was filled
    let quality: SectionLog['quality'] = 'good'
    let issue = ''

    if (type === 'rich-text') {
      quality = 'partial'
      issue = 'Used rich-text catch-all — may need dedicated section type'
    } else if (type === 'unknown') {
      quality = 'missing'
      issue = 'No matching section type exists'
    } else {
      // Check if section data is mostly empty
      const values = Object.values(data).filter(v => v != null && v !== '' && v !== undefined)
      const hasContent = values.length > 0
      const hasItems = Array.isArray(data.items) ? data.items.length > 0 : true
      const hasHeading = !!(data.headline || data.heading || data.brandName || data.text)

      if (!hasContent) {
        quality = 'poor'
        issue = 'Section created but NO content extracted'
      } else if (!hasHeading && type !== 'divider' && type !== 'social-proof') {
        quality = 'partial'
        issue = 'Missing heading/title — content may be incomplete'
      } else if (type === 'features' && Array.isArray(data.items) && data.items.length < 2) {
        quality = 'partial'
        issue = `Only ${data.items.length} items extracted — likely missing items`
      } else if (type === 'testimonials' && Array.isArray(data.items) && data.items.length < 2) {
        quality = 'partial'
        issue = `Only ${data.items.length} testimonials — likely missing`
      } else if (type === 'hero' && !data.backgroundImage && !data.embed) {
        quality = 'partial'
        issue = 'Hero without image or video — may need visual'
      } else if (type === 'gallery' && Array.isArray(data.images) && data.images.length < 2) {
        quality = 'partial'
        issue = 'Gallery with few images — likely missing'
      }
    }

    // Only log partial/poor/missing (good sections don't need improvement)
    if (quality !== 'good') {
      const key = `${type}:${issue.slice(0, 40)}`
      let entry = b.sections.find(e => `${e.type}:${e.issue.slice(0, 40)}` === key)
      if (!entry) {
        entry = { type, quality, issue, count: 0, urls: [], firstSeen: now, lastSeen: now }
        b.sections.push(entry)
      }
      entry.count++
      entry.lastSeen = now
      entry.quality = quality
      if (!entry.urls.includes(url) && entry.urls.length < 10) entry.urls.push(url)
    }
  }

  saveBacklog(b)
}

/** Get backlog sorted by count */
export function getBacklog(): { totalClones: number; needsReview: boolean; sections: SectionLog[] } {
  const b = readBacklog()
  const sinceReview = b.sections.filter(s => !b.lastReviewedAt || s.lastSeen > b.lastReviewedAt)
  return {
    totalClones: b.totalClones,
    needsReview: sinceReview.length >= 5,
    sections: b.sections.sort((a, c) => c.count - a.count),
  }
}

/** Mark reviewed */
export function markReviewed() {
  const b = readBacklog()
  b.lastReviewedAt = new Date().toISOString()
  saveBacklog(b)
}
