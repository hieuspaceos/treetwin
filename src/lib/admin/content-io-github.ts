/**
 * GitHubContentIO — reads/writes content via GitHub API (production, Vercel serverless)
 * Uses GitHub Contents API for CRUD on content files stored in the repository
 */
import type { CollectionName } from './validation'
import {
  CONTENT_BASE,
  articlePath,
  yamlPath,
  singletonPath,
  isArticle,
  pickMeta,
} from './content-io-types'
import type { ContentIO, EntryMeta, EntryData } from './content-io-types'
import {
  parseMarkdocContent,
  serializeMarkdocContent,
  parseYamlContent,
  serializeYamlContent,
} from './content-io-shared'

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
      const { frontmatter, content } = parseMarkdocContent(file.content)
      return { slug, ...frontmatter, content } as EntryData
    } else {
      const data = parseYamlContent(file.content)
      return { slug, ...data } as EntryData
    }
  }

  async writeEntry(collection: CollectionName, slug: string, data: EntryData): Promise<void> {
    const { slug: _slug, ...fields } = data

    if (isArticle(collection)) {
      const { content, ...frontmatter } = fields
      const output = serializeMarkdocContent(frontmatter, content as string)
      await this.putFile(articlePath(slug), output, `admin: update ${collection}/${slug}`)
    } else {
      const output = serializeYamlContent(fields)
      await this.putFile(yamlPath(collection, slug), output, `admin: update ${collection}/${slug}`)
    }
  }

  async deleteEntry(collection: CollectionName, slug: string): Promise<void> {
    if (isArticle(collection)) {
      await this.deleteFile(articlePath(slug), `admin: delete ${collection}/${slug}`)
    } else {
      await this.deleteFile(yamlPath(collection, slug), `admin: delete ${collection}/${slug}`)
    }
  }

  async readSingleton(name: string): Promise<Record<string, unknown> | null> {
    const file = await this.getFile(singletonPath(name))
    if (!file) return null
    return parseYamlContent(file.content)
  }

  async writeSingleton(name: string, data: Record<string, unknown>): Promise<void> {
    await this.putFile(singletonPath(name), serializeYamlContent(data), `admin: update singleton ${name}`)
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
