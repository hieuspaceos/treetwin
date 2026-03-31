/**
 * Tests for LocalContentIO — CRUD operations on articles (Markdoc) and YAML collections
 * Uses temp directory to avoid touching real content
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtemp, rm, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { LocalContentIO } from './content-io'

let tempDir: string
let io: LocalContentIO

beforeAll(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'treetwin-test-'))
  // Create collection directories
  await mkdir(join(tempDir, 'articles'), { recursive: true })
  await mkdir(join(tempDir, 'notes'), { recursive: true })
  await mkdir(join(tempDir, 'records'), { recursive: true })
  io = new LocalContentIO(tempDir)
})

afterAll(async () => {
  await rm(tempDir, { recursive: true, force: true })
})

describe('articles CRUD', () => {
  it('writeEntry creates article dir and index.mdoc', async () => {
    await io.writeEntry('articles', 'test-article', {
      slug: 'test-article',
      title: 'Test Article',
      description: 'A test article',
      status: 'published',
      content: '# Hello\n\nThis is a test.',
    })
    const entry = await io.readEntry('articles', 'test-article')
    expect(entry).not.toBeNull()
    expect(entry!.title).toBe('Test Article')
    expect(entry!.status).toBe('published')
    expect(entry!.content).toContain('# Hello')
  })

  it('readEntry returns null for missing article', async () => {
    const entry = await io.readEntry('articles', 'nonexistent')
    expect(entry).toBeNull()
  })

  it('listCollection returns article metas', async () => {
    const list = await io.listCollection('articles')
    expect(list.length).toBeGreaterThanOrEqual(1)
    const found = list.find((e) => e.slug === 'test-article')
    expect(found).toBeDefined()
    expect(found!.title).toBe('Test Article')
    expect(found!.status).toBe('published')
  })

  it('listSlugs returns article slugs', async () => {
    const slugs = await io.listSlugs('articles')
    expect(slugs).toContain('test-article')
  })

  it('deleteEntry removes article directory', async () => {
    await io.writeEntry('articles', 'to-delete', {
      slug: 'to-delete',
      title: 'Delete Me',
      description: '',
      status: 'draft',
      content: '',
    })
    await io.deleteEntry('articles', 'to-delete')
    const entry = await io.readEntry('articles', 'to-delete')
    expect(entry).toBeNull()
  })
})

describe('notes CRUD (YAML)', () => {
  it('writeEntry creates YAML file', async () => {
    await io.writeEntry('notes', 'test-note', {
      slug: 'test-note',
      title: 'Test Note',
      description: 'A note',
      status: 'published',
    })
    const entry = await io.readEntry('notes', 'test-note')
    expect(entry).not.toBeNull()
    expect(entry!.title).toBe('Test Note')
    expect(entry!.slug).toBe('test-note')
  })

  it('readEntry returns null for missing note', async () => {
    const entry = await io.readEntry('notes', 'nonexistent')
    expect(entry).toBeNull()
  })

  it('listCollection returns note metas', async () => {
    const list = await io.listCollection('notes')
    expect(list.length).toBeGreaterThanOrEqual(1)
    const found = list.find((e) => e.slug === 'test-note')
    expect(found).toBeDefined()
  })

  it('deleteEntry removes YAML file', async () => {
    await io.writeEntry('notes', 'delete-me', {
      slug: 'delete-me',
      title: 'Temporary',
      description: '',
      status: 'draft',
    })
    await io.deleteEntry('notes', 'delete-me')
    const entry = await io.readEntry('notes', 'delete-me')
    expect(entry).toBeNull()
  })
})

describe('singletons', () => {
  it('writeSingleton + readSingleton round-trips', async () => {
    await io.writeSingleton('site-settings', { siteName: 'Test', language: 'en' })
    const data = await io.readSingleton('site-settings')
    expect(data).not.toBeNull()
    expect(data!.siteName).toBe('Test')
    expect(data!.language).toBe('en')
  })

  it('readSingleton returns null for missing', async () => {
    const data = await io.readSingleton('nonexistent')
    expect(data).toBeNull()
  })
})

describe('edge cases', () => {
  it('listCollection on empty dir returns empty array', async () => {
    const list = await io.listCollection('records')
    expect(list).toEqual([])
  })

  it('listSlugs on empty dir returns empty array', async () => {
    const slugs = await io.listSlugs('records')
    expect(slugs).toEqual([])
  })
})
