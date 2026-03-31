/**
 * LocalContentIO — reads/writes content files via Node.js fs (dev mode)
 * Uses lazy imports for fs/path to avoid issues in non-Node environments
 */
import type { CollectionName } from './validation'
import { CONTENT_BASE, isArticle, pickMeta } from './content-io-types'
import type { ContentIO, EntryMeta, EntryData } from './content-io-types'
import {
  parseMarkdocContent,
  serializeMarkdocContent,
  parseYamlContent,
  serializeYamlContent,
} from './content-io-shared'

/** Validate slug — reject path traversal patterns */
function validateSlug(slug: string): void {
  if (!slug || slug.includes('..') || slug.includes('\0') || slug.startsWith('/')) {
    throw new Error(`Invalid slug: ${slug}`)
  }
}

export class LocalContentIO implements ContentIO {
  private fs: typeof import('node:fs/promises') | null = null
  private path: typeof import('node:path') | null = null
  private basePath: string

  constructor(basePath: string = CONTENT_BASE) {
    this.basePath = basePath
  }

  private async getFs() {
    if (!this.fs) {
      this.fs = await import('node:fs/promises')
      this.path = await import('node:path')
    }
    return { fs: this.fs, path: this.path! }
  }

  /** Resolve path relative to this instance's basePath */
  private articlePath(slug: string): string {
    return `${this.basePath}/articles/${slug}/index.mdoc`
  }
  private articleDir(slug: string): string {
    return `${this.basePath}/articles/${slug}`
  }
  private yamlPath(collection: CollectionName, slug: string): string {
    return `${this.basePath}/${collection}/${slug}.yaml`
  }
  private singletonPath(name: string): string {
    return `${this.basePath}/${name}.yaml`
  }

  async listCollection(name: CollectionName): Promise<EntryMeta[]> {
    const { fs, path } = await this.getFs()
    const dir = path.resolve(this.basePath, name)

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
            entries.push(pickMeta(data))
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
    validateSlug(slug)
    const { fs } = await this.getFs()

    try {
      if (isArticle(collection)) {
        const raw = await fs.readFile(this.articlePath(slug), 'utf-8')
        const { frontmatter, content } = parseMarkdocContent(raw)
        return { slug, ...frontmatter, content } as EntryData
      } else {
        const raw = await fs.readFile(this.yamlPath(collection, slug), 'utf-8')
        const data = parseYamlContent(raw)
        return { slug, ...data } as EntryData
      }
    } catch {
      return null
    }
  }

  async writeEntry(collection: CollectionName, slug: string, data: EntryData): Promise<void> {
    validateSlug(slug)
    const { fs } = await this.getFs()
    const { slug: _slug, ...fields } = data

    if (isArticle(collection)) {
      const { content, ...frontmatter } = fields
      await fs.mkdir(this.articleDir(slug), { recursive: true })
      const output = serializeMarkdocContent(frontmatter, content as string)
      await fs.writeFile(this.articlePath(slug), output, 'utf-8')
    } else {
      const output = serializeYamlContent(fields)
      await fs.writeFile(this.yamlPath(collection, slug), output, 'utf-8')
    }
  }

  async deleteEntry(collection: CollectionName, slug: string): Promise<void> {
    validateSlug(slug)
    const { fs } = await this.getFs()

    if (isArticle(collection)) {
      await fs.rm(this.articleDir(slug), { recursive: true, force: true })
    } else {
      await fs.rm(this.yamlPath(collection, slug), { force: true })
    }
  }

  async readSingleton(name: string): Promise<Record<string, unknown> | null> {
    const { fs } = await this.getFs()
    try {
      const raw = await fs.readFile(this.singletonPath(name), 'utf-8')
      return parseYamlContent(raw)
    } catch {
      return null
    }
  }

  async writeSingleton(name: string, data: Record<string, unknown>): Promise<void> {
    const { fs } = await this.getFs()
    await fs.writeFile(this.singletonPath(name), serializeYamlContent(data), 'utf-8')
  }

  async listSlugs(collection: CollectionName): Promise<string[]> {
    const { fs, path } = await this.getFs()
    const dir = path.resolve(this.basePath, collection)
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
