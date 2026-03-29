/**
 * Clone section logger — tracks sections to CREATE or UPGRADE after each clone.
 * After ~10 clones, review the list → pick items → create plan → implement.
 * Data: data/clone-section-backlog.json
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const LOG_PATH = join(process.cwd(), 'data', 'clone-section-backlog.json')

interface BacklogItem {
  /** Action needed */
  action: 'create' | 'upgrade'
  /** Section type (existing for upgrade, suggested name for create) */
  sectionType: string
  /** What's missing or needs improvement */
  description: string
  /** How many times this came up */
  count: number
  /** URLs where this was detected */
  urls: string[]
  /** AI confidence when detected */
  confidence: number
  /** First/last seen */
  firstSeen: string
  lastSeen: string
}

interface Backlog {
  totalClones: number
  items: BacklogItem[]
  lastReviewedAt: string | null
  updatedAt: string
}

function readBacklog(): Backlog {
  try {
    if (existsSync(LOG_PATH)) return JSON.parse(readFileSync(LOG_PATH, 'utf8'))
  } catch {}
  return { totalClones: 0, items: [], lastReviewedAt: null, updatedAt: new Date().toISOString() }
}

function saveBacklog(b: Backlog) {
  const dir = join(process.cwd(), 'data')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(LOG_PATH, JSON.stringify(b, null, 2))
}

/** Log sections from a clone — detects what to CREATE or UPGRADE */
export function logCloneSections(
  url: string,
  sections: Array<{ type: string; data?: Record<string, unknown> }>,
  structure?: Array<{ type: string; confidence: number; note: string; variant?: string }>
) {
  const b = readBacklog()
  b.totalClones++
  b.updatedAt = new Date().toISOString()
  const now = b.updatedAt

  const items = structure || sections.map(s => ({
    type: s.type,
    confidence: (s as any).confidence ?? 100,
    note: (s as any).note || '',
    variant: (s.data as any)?.variant || '',
  }))

  for (const s of items) {
    const conf = (s as any).confidence ?? 100
    const note = (s as any).note || ''

    // CREATE: unknown type
    if (s.type === 'unknown') {
      addItem(b, 'create', note || 'unknown-section', `AI detected a section that doesn't match any existing type: ${note}`, conf, url, now)
    }
    // UPGRADE: rich-text used as catch-all (means we're missing a proper section type)
    else if (s.type === 'rich-text') {
      const desc = note || 'Rich-text used as catch-all — may need dedicated section type'
      addItem(b, 'upgrade', 'rich-text', desc, conf, url, now)
    }
    // UPGRADE: low confidence
    else if (conf < 60) {
      addItem(b, 'upgrade', s.type, `Low confidence (${conf}%): ${note || 'section may not fit well'}`, conf, url, now)
    }
  }

  saveBacklog(b)
}

function addItem(b: Backlog, action: 'create' | 'upgrade', type: string, desc: string, conf: number, url: string, now: string) {
  // Find existing or create new
  const key = `${action}:${type}:${desc.slice(0, 50)}`
  let item = b.items.find(i => `${i.action}:${i.sectionType}:${i.description.slice(0, 50)}` === key)
  if (!item) {
    item = { action, sectionType: type, description: desc, count: 0, urls: [], confidence: conf, firstSeen: now, lastSeen: now }
    b.items.push(item)
  }
  item.count++
  item.lastSeen = now
  item.confidence = Math.round((item.confidence * (item.count - 1) + conf) / item.count)
  if (!item.urls.includes(url) && item.urls.length < 10) item.urls.push(url)
}

/** Get backlog — sorted by count (most requested first) */
export function getBacklog(): { totalClones: number; needsReview: boolean; items: BacklogItem[] } {
  const b = readBacklog()
  const sinceReview = b.items.filter(i => !b.lastReviewedAt || i.lastSeen > b.lastReviewedAt)
  return {
    totalClones: b.totalClones,
    needsReview: sinceReview.length >= 10,
    items: b.items.sort((a, c) => c.count - a.count),
  }
}

/** Mark backlog as reviewed */
export function markReviewed() {
  const b = readBacklog()
  b.lastReviewedAt = new Date().toISOString()
  saveBacklog(b)
}
