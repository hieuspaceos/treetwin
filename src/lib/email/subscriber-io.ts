/**
 * Subscriber I/O — read/write subscriber YAML files in src/content/subscribers/
 * Each subscriber is a YAML file named by email hash for dedup
 * Git-tracked: subscribers are part of the repo (no database needed)
 */
import { readFileSync, writeFileSync, unlinkSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const SUBSCRIBERS_DIR = join(process.cwd(), 'src/content/subscribers')

export interface Subscriber {
  email: string
  subscribedAt: string
  token: string
}

/** Ensure subscribers directory exists */
function ensureDir(): void {
  if (!existsSync(SUBSCRIBERS_DIR)) mkdirSync(SUBSCRIBERS_DIR, { recursive: true })
}

/** Generate a deterministic filename from email */
function emailToFilename(email: string): string {
  const hash = createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 12)
  return `${hash}.yaml`
}

/** Generate a unique unsubscribe token */
function generateToken(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Parse a simple YAML subscriber file (key: value format) */
function parseSubscriberYaml(content: string): Subscriber | null {
  const lines = content.split('\n')
  const data: Record<string, string> = {}
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/)
    if (match) data[match[1]] = match[2].trim()
  }
  if (!data.email || !data.token) return null
  return { email: data.email, subscribedAt: data.subscribedAt || '', token: data.token }
}

/** Serialize subscriber to YAML */
function toYaml(sub: Subscriber): string {
  return `email: ${sub.email}\nsubscribedAt: ${sub.subscribedAt}\ntoken: ${sub.token}\n`
}

/** Get all subscribers */
export function getAllSubscribers(): Subscriber[] {
  ensureDir()
  const files = readdirSync(SUBSCRIBERS_DIR).filter((f) => f.endsWith('.yaml'))
  const subs: Subscriber[] = []
  for (const file of files) {
    try {
      const content = readFileSync(join(SUBSCRIBERS_DIR, file), 'utf-8')
      const sub = parseSubscriberYaml(content)
      if (sub) subs.push(sub)
    } catch { /* skip corrupt files */ }
  }
  return subs.sort((a, b) => b.subscribedAt.localeCompare(a.subscribedAt))
}

/** Check if email is already subscribed */
export function isSubscribed(email: string): boolean {
  ensureDir()
  const filename = emailToFilename(email)
  return existsSync(join(SUBSCRIBERS_DIR, filename))
}

/** Add a new subscriber. Returns the subscriber or null if duplicate */
export function addSubscriber(email: string): Subscriber | null {
  ensureDir()
  const normalized = email.toLowerCase().trim()
  if (isSubscribed(normalized)) return null

  const sub: Subscriber = {
    email: normalized,
    subscribedAt: new Date().toISOString(),
    token: generateToken(),
  }
  const filename = emailToFilename(normalized)
  writeFileSync(join(SUBSCRIBERS_DIR, filename), toYaml(sub), 'utf-8')
  return sub
}

/** Remove subscriber by unsubscribe token. Returns true if found and removed */
export function removeByToken(token: string): boolean {
  ensureDir()
  const files = readdirSync(SUBSCRIBERS_DIR).filter((f) => f.endsWith('.yaml'))
  for (const file of files) {
    try {
      const content = readFileSync(join(SUBSCRIBERS_DIR, file), 'utf-8')
      const sub = parseSubscriberYaml(content)
      if (sub && sub.token === token) {
        unlinkSync(join(SUBSCRIBERS_DIR, file))
        return true
      }
    } catch { /* skip */ }
  }
  return false
}

/** Remove subscriber by email */
export function removeByEmail(email: string): boolean {
  ensureDir()
  const filename = emailToFilename(email.toLowerCase().trim())
  const filepath = join(SUBSCRIBERS_DIR, filename)
  if (!existsSync(filepath)) return false
  unlinkSync(filepath)
  return true
}

/** Get subscriber count */
export function getSubscriberCount(): number {
  ensureDir()
  return readdirSync(SUBSCRIBERS_DIR).filter((f) => f.endsWith('.yaml')).length
}
