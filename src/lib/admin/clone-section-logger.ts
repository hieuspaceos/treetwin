/**
 * Clone section logger — tracks unknown/low-confidence sections from AI clone.
 * Data stored in data/clone-section-log.json.
 * Used to identify which new section types to create (flywheel strategy).
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const LOG_PATH = join(process.cwd(), 'data', 'clone-section-log.json')

interface SectionLogEntry {
  /** Pattern description from AI (e.g. "travel search form", "mega menu dropdown") */
  pattern: string
  /** How many times this pattern appeared across clones */
  count: number
  /** URLs where this pattern was found */
  urls: string[]
  /** AI confidence when it was detected */
  avgConfidence: number
  /** First seen timestamp */
  firstSeen: string
  /** Last seen timestamp */
  lastSeen: string
}

interface CloneLog {
  /** Total clone attempts */
  totalClones: number
  /** Unknown/low-confidence section patterns */
  patterns: Record<string, SectionLogEntry>
  /** Last updated */
  updatedAt: string
}

/** Read current log */
function readLog(): CloneLog {
  try {
    if (existsSync(LOG_PATH)) return JSON.parse(readFileSync(LOG_PATH, 'utf8'))
  } catch {}
  return { totalClones: 0, patterns: {}, updatedAt: new Date().toISOString() }
}

/** Save log */
function saveLog(log: CloneLog) {
  const dir = join(process.cwd(), 'data')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(LOG_PATH, JSON.stringify(log, null, 2))
}

/** Log sections from a clone result — tracks unknown types and low confidence */
export function logCloneSections(url: string, sections: Array<{ type: string; data?: Record<string, unknown>; confidence?: number; note?: string }>, structure?: Array<{ type: string; confidence: number; note: string }>) {
  const log = readLog()
  log.totalClones++
  log.updatedAt = new Date().toISOString()
  const now = log.updatedAt

  // Find sections to log: unknown type OR confidence < 60
  const toLog = (structure || sections).filter(s => {
    const conf = (s as any).confidence ?? 100
    return s.type === 'unknown' || s.type === 'rich-text' || conf < 60
  })

  for (const s of toLog) {
    // Create a pattern key from the note or type
    const note = (s as any).note || ''
    const key = note ? note.toLowerCase().slice(0, 80) : `low-confidence-${s.type}`

    if (!log.patterns[key]) {
      log.patterns[key] = {
        pattern: note || `${s.type} (low confidence)`,
        count: 0,
        urls: [],
        avgConfidence: 0,
        firstSeen: now,
        lastSeen: now,
      }
    }

    const entry = log.patterns[key]
    entry.count++
    entry.lastSeen = now
    if (!entry.urls.includes(url) && entry.urls.length < 20) entry.urls.push(url)
    const conf = (s as any).confidence ?? 50
    entry.avgConfidence = Math.round((entry.avgConfidence * (entry.count - 1) + conf) / entry.count)
  }

  saveLog(log)
}

/** Get top patterns that need new section types (sorted by frequency) */
export function getTopMissingSections(limit = 10): Array<SectionLogEntry & { key: string }> {
  const log = readLog()
  return Object.entries(log.patterns)
    .map(([key, entry]) => ({ ...entry, key }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

/** Get clone stats */
export function getCloneStats(): { totalClones: number; uniquePatterns: number; topPattern: string } {
  const log = readLog()
  const patterns = Object.values(log.patterns)
  const top = patterns.sort((a, b) => b.count - a.count)[0]
  return {
    totalClones: log.totalClones,
    uniquePatterns: patterns.length,
    topPattern: top?.pattern || 'none',
  }
}
