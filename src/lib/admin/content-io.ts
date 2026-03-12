/**
 * Content I/O abstraction — reads/writes content files for admin CRUD
 * LocalContentIO: Node.js fs for dev
 * GitHubContentIO: GitHub API for production (Vercel serverless)
 */
import matter from 'gray-matter'
import yaml from 'js-yaml'
import type { CollectionName } from './validation'

// ── Types ──

export interface EntryMeta {
  slug: string
  title: string
  status: string
  description: string
  publishedAt?: string | null
  tags?: string[]
  category?: string | null
}

export interface EntryData extends EntryMeta {
  [key: string]: unknown
  content?: string // Markdown body for articles
}

export interface ContentIO {
  listCollection(name: CollectionName): Promise<EntryMeta[]>
  readEntry(collection: CollectionName, slug: string): Promise<EntryData | null>
  writeEntry(collection: CollectionName, slug: string, data: EntryData): Promise<void>
  deleteEntry(collection: CollectionName, slug: string): Promise<void>
  readSingleton(name: string): Promise<Record<string, unknown> | null>
  writeSingleton(name: string, data: Record<string, unknown>): Promise<void>
  listSlugs(collection: CollectionName): Promise<string[]>
}

// ── Path helpers ──

/** Content base directory (relative to project root) */
const CONTENT_BASE = 'src/content'

function articlePath(slug: string): string {
  return `${CONTENT_BASE}/articles/${slug}/index.mdoc`
}

function articleDir(slug: string): string {
  return `${CONTENT_BASE}/articles/${slug}`
}

function yamlPath(collection: CollectionName, slug: string): string {
  return `${CONTENT_BASE}/${collection}/${slug}.yaml`
}

function singletonPath(name: string): string {
  // site-settings → src/content/site-settings.yaml
  return `${CONTENT_BASE}/${name}.yaml`
}

function isArticle(collection: CollectionName): boolean {
  return collection === 'articles'
}

// ── Local Content IO (dev mode, Node.js fs) ──

export class LocalContentIO implements ContentIO {
  private fs: typeof import('node:fs/promises') | null = null
  private path: typeof import('node:path') | null = null

  private async getFs() {
    if (!this.fs) {
      this.fs = await import('node:fs/promises')
      this.path = await import('node:path')
    }
    return { fs: this.fs, path: this.path! }
  }

  async listCollection(name: CollectionName): Promise<EntryMeta[]> {
    const { fs, path } = await this.getFs()
    const dir = path.resolve(CONTENT_BASE, name)

    try {
      const items = await fs.readdir(dir, { withFileTypes: true })
      const entries: EntryMeta[] = []

      for (const item of items) {
        try {
          let data: EntryData | null = null
          if (isArticle(name) && item.isDirectory()) {
            data = await this.readEntry(name, item.name)
          } else if (!isArticle(name) && item.isFile() && item.name.endsWith('.yaml')) {
            const slug = item.name.replace(/\.yaml$/, '')
            data = await this.readEntry(name, slug)
          }
          if (data) {
            entries.push({
              slug: data.slug,
              title: data.title || (data as Record<string, unknown>).name as string || data.slug,
              status: data.status || 'draft',
              description: data.description || '',
              publishedAt: data.publishedAt as string | undefined,
              tags: data.tags as string[] | undefined,
              category: data.category as string | undefined,
            })
          }
        } catch {
          // Skip unreadable entries
        }
      }
      return entries
    } catch {
      return []
    }
  }

  async readEntry(collection: CollectionName, slug: string): Promise<EntryData | null> {
    const { fs } = await this.getFs()

    try {
      if (isArticle(collection)) {
        const filePath = articlePath(slug)
        const raw = await fs.readFile(filePath, 'utf-8')
        const { data, content } = matter(raw)
        return { slug, ...data, content } as EntryData
      } else {
        const filePath = yamlPath(collection, slug)
        const raw = await fs.readFile(filePath, 'utf-8')
        const data = yaml.load(raw) as Record<string, unknown>
        return { slug, ...data } as EntryData
      }
    } catch {
      return null
    }
  }

  async writeEntry(collection: CollectionName, slug: string, data: EntryData): Promise<void> {
    const { fs } = await this.getFs()
    // Strip slug from data before writing (it's the filename)
    const { slug: _slug, ...fields } = data

    if (isArticle(collection)) {
      const { content, ...frontmatter } = fields
      const dir = articleDir(slug)
      await fs.mkdir(dir, { recursive: true })
      const output = matter.stringify(content as string || '', frontmatter)
      await fs.writeFile(articlePath(slug), output, 'utf-8')
    } else {
      const output = yaml.dump(fields, { lineWidth: -1, noRefs: true })
      await fs.writeFile(yamlPath(collection, slug), output, 'utf-8')
    }
  }

  async deleteEntry(collection: CollectionName, slug: string): Promise<void> {
    const { fs } = await this.getFs()

    if (isArticle(collection)) {
      await fs.rm(articleDir(slug), { recursive: true, force: true })
    } else {
      await fs.rm(yamlPath(collection, slug), { force: true })
    }
  }

  async readSingleton(name: string): Promise<Record<string, unknown> | null> {
    const { fs } = await this.getFs()
    try {
      const raw = await fs.readFile(singletonPath(name), 'utf-8')
      return yaml.load(raw) as Record<string, unknown>
    } catch {
      return null
    }
  }

  async writeSingleton(name: string, data: Record<string, unknown>): Promise<void> {
    const { fs } = await this.getFs()
    const output = yaml.dump(data, { lineWidth: -1, noRefs: true })
    await fs.writeFile(singletonPath(name), output, 'utf-8')
  }

  async listSlugs(collection: CollectionName): Promise<string[]> {
    const { fs, path } = await this.getFs()
    const dir = path.resolve(CONTENT_BASE, collection)
    try {
      const items = await fs.readdir(dir, { withFileTypes: true })
      if (isArticle(collection)) {
        return items.filter((i) => i.isDirectory()).map((i) => i.name)
      }
      return items
        .filter((i) => i.isFile() && i.name.endsWith('.yaml'))
        .map((i) => i.name.replace(/\.yaml$/, ''))
    } catch {
      return []
    }
  }
}

// ── GitHub Content IO (production, Vercel serverless) ──

export class GitHubContentIO implements ContentIO {
  private owner: string
  private repo: string
  private token: string
  private branch: string

  constructor() {
    const repoSlug = import.meta.env.GITHUB_REPO || process.env.GITHUB_REPO || 'hieuspaceos/tree-id'
    const [owner, repo] = repoSlug.split('/')
    this.owner = owner
    this.repo = repo
    this.token = import.meta.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN || ''
    this.branch = import.meta.env.GITHUB_BRANCH || process.env.GITHUB_BRANCH || 'main'
  }

  private async ghFetch(path: string, opts: RequestInit = {}): Promise<Response> {
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`
    return fetch(url, {
      ...opts,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
      },
    })
  }

  /** Get file content and SHA from GitHub */
  private async getFile(path: string): Promise<{ content: string; sha: string } | null> {
    const res = await this.ghFetch(path)
    if (!res.ok) return null
    const json = await res.json()
    const content = Buffer.from(json.content, 'base64').toString('utf-8')
    return { content, sha: json.sha }
  }

  /** Create or update a file on GitHub */
  private async putFile(path: string, content: string, message: string): Promise<void> {
    // Check if file exists to get SHA for updates
    const existing = await this.getFile(path)
    const body: Record<string, unknown> = {
      message,
      content: Buffer.from(content).toString('base64'),
      branch: this.branch,
    }
    if (existing) body.sha = existing.sha

    const res = await this.ghFetch(path, { method: 'PUT', body: JSON.stringify(body) })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`GitHub API error: ${res.status} ${err}`)
    }
  }

  /** Delete a file on GitHub */
  private async deleteFile(path: string, message: string): Promise<void> {
    const existing = await this.getFile(path)
    if (!existing) return

    const body = { message, sha: existing.sha, branch: this.branch }
    const res = await this.ghFetch(path, { method: 'DELETE', body: JSON.stringify(body) })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`GitHub API delete error: ${res.status} ${err}`)
    }
  }

  async listCollection(name: CollectionName): Promise<EntryMeta[]> {
    const dir = `${CONTENT_BASE}/${name}`
    const res = await this.ghFetch(dir)
    if (!res.ok) return []

    const items = (await res.json()) as Array<{ name: string; type: string }>
    const entries: EntryMeta[] = []

    for (const item of items) {
      try {
        if (isArticle(name) && item.type === 'dir') {
          const entry = await this.readEntry(name, item.name)
          if (entry) entries.push(pickMeta(entry))
        } else if (!isArticle(name) && item.type === 'file' && item.name.endsWith('.yaml')) {
          const slug = item.name.replace(/\.yaml$/, '')
          const entry = await this.readEntry(name, slug)
          if (entry) entries.push(pickMeta(entry))
        }
      } catch {
        // Skip unreadable entries
      }
    }
    return entries
  }

  async readEntry(collection: CollectionName, slug: string): Promise<EntryData | null> {
    const path = isArticle(collection) ? articlePath(slug) : yamlPath(collection, slug)
    const file = await this.getFile(path)
    if (!file) return null

    if (isArticle(collection)) {
      const { data, content } = matter(file.content)
      return { slug, ...data, content } as EntryData
    } else {
      const data = yaml.load(file.content) as Record<string, unknown>
      return { slug, ...data } as EntryData
    }
  }

  async writeEntry(collection: CollectionName, slug: string, data: EntryData): Promise<void> {
    const { slug: _slug, ...fields } = data

    if (isArticle(collection)) {
      const { content, ...frontmatter } = fields
      const output = matter.stringify(content as string || '', frontmatter)
      await this.putFile(articlePath(slug), output, `admin: update ${collection}/${slug}`)
    } else {
      const output = yaml.dump(fields, { lineWidth: -1, noRefs: true })
      await this.putFile(yamlPath(collection, slug), output, `admin: update ${collection}/${slug}`)
    }
  }

  async deleteEntry(collection: CollectionName, slug: string): Promise<void> {
    if (isArticle(collection)) {
      // Delete the index.mdoc file (GitHub doesn't support directory delete directly)
      await this.deleteFile(articlePath(slug), `admin: delete ${collection}/${slug}`)
    } else {
      await this.deleteFile(yamlPath(collection, slug), `admin: delete ${collection}/${slug}`)
    }
  }

  async readSingleton(name: string): Promise<Record<string, unknown> | null> {
    const file = await this.getFile(singletonPath(name))
    if (!file) return null
    return yaml.load(file.content) as Record<string, unknown>
  }

  async writeSingleton(name: string, data: Record<string, unknown>): Promise<void> {
    const output = yaml.dump(data, { lineWidth: -1, noRefs: true })
    await this.putFile(singletonPath(name), output, `admin: update singleton ${name}`)
  }

  async listSlugs(collection: CollectionName): Promise<string[]> {
    const dir = `${CONTENT_BASE}/${collection}`
    const res = await this.ghFetch(dir)
    if (!res.ok) return []

    const items = (await res.json()) as Array<{ name: string; type: string }>
    if (isArticle(collection)) {
      return items.filter((i) => i.type === 'dir').map((i) => i.name)
    }
    return items
      .filter((i) => i.type === 'file' && i.name.endsWith('.yaml'))
      .map((i) => i.name.replace(/\.yaml$/, ''))
  }
}

// ── Helpers ──

function pickMeta(entry: EntryData): EntryMeta {
  return {
    slug: entry.slug,
    title: entry.title,
    status: entry.status || 'draft',
    description: entry.description || '',
    publishedAt: entry.publishedAt as string | undefined,
    tags: entry.tags as string[] | undefined,
    category: entry.category as string | undefined,
  }
}

// ── Factory ──

let _instance: ContentIO | null = null

/** Get the appropriate ContentIO implementation based on environment */
export function getContentIO(): ContentIO {
  if (!_instance) {
    _instance = import.meta.env.PROD ? new GitHubContentIO() : new LocalContentIO()
  }
  return _instance
}
