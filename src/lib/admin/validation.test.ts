/**
 * Tests for admin input validation — collection names, slugs, entry data
 */
import { describe, it, expect } from 'vitest'
import {
  isValidCollection,
  isValidSingleton,
  isValidSlug,
  validateEntry,
  validateSingleton,
} from './validation'

describe('isValidCollection', () => {
  it('accepts allowed collections', () => {
    expect(isValidCollection('articles')).toBe(true)
    expect(isValidCollection('notes')).toBe(true)
    expect(isValidCollection('records')).toBe(true)
    expect(isValidCollection('categories')).toBe(true)
  })

  it('rejects unknown collections', () => {
    expect(isValidCollection('users')).toBe(false)
    expect(isValidCollection('')).toBe(false)
    expect(isValidCollection('../etc/passwd')).toBe(false)
  })
})

describe('isValidSingleton', () => {
  it('accepts allowed singletons', () => {
    expect(isValidSingleton('site-settings')).toBe(true)
  })

  it('rejects unknown singletons', () => {
    expect(isValidSingleton('admin-config')).toBe(false)
  })
})

describe('isValidSlug', () => {
  it('accepts valid slugs', () => {
    expect(isValidSlug('hello-world')).toBe(true)
    expect(isValidSlug('my-post-123')).toBe(true)
    expect(isValidSlug('a')).toBe(true)
    expect(isValidSlug('ab')).toBe(true)
  })

  it('rejects empty or too long slugs', () => {
    expect(isValidSlug('')).toBe(false)
    expect(isValidSlug('a'.repeat(201))).toBe(false)
  })

  it('rejects path traversal attempts', () => {
    expect(isValidSlug('../etc')).toBe(false)
    expect(isValidSlug('foo/bar')).toBe(false)
    expect(isValidSlug('foo\\bar')).toBe(false)
  })

  it('rejects uppercase and special chars', () => {
    expect(isValidSlug('Hello')).toBe(false)
    expect(isValidSlug('hello world')).toBe(false)
    expect(isValidSlug('-start-with-dash')).toBe(false)
    expect(isValidSlug('end-with-dash-')).toBe(false)
  })
})

describe('validateEntry', () => {
  it('validates articles require title and description', () => {
    const result = validateEntry('articles', {})
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('title is required')
    expect(result.errors).toContain('description is required')
  })

  it('passes valid article data', () => {
    const result = validateEntry('articles', {
      title: 'My Post',
      description: 'A great post',
      status: 'published',
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects invalid status', () => {
    const result = validateEntry('articles', {
      title: 'Test',
      description: 'Desc',
      status: 'archived',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('status must be "draft" or "published"')
  })

  it('rejects summary over 300 chars', () => {
    const result = validateEntry('articles', {
      title: 'Test',
      description: 'Desc',
      summary: 'x'.repeat(301),
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('summary must be 300 characters or less')
  })

  it('validates categories require name only', () => {
    const result = validateEntry('categories', { name: 'Tech' })
    expect(result.valid).toBe(true)

    const fail = validateEntry('categories', {})
    expect(fail.valid).toBe(false)
    expect(fail.errors).toContain('name is required')
  })

  it('validates records recordType', () => {
    const result = validateEntry('records', {
      title: 'Test',
      description: 'Desc',
      recordType: 'invalid',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('recordType must be "project", "product", or "experiment"')
  })
})

describe('validateSingleton', () => {
  it('passes valid site-settings', () => {
    const result = validateSingleton('site-settings', { themeId: 'liquid-glass' })
    expect(result.valid).toBe(true)
  })

  it('rejects non-string themeId', () => {
    const result = validateSingleton('site-settings', { themeId: 123 })
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain('themeId')
  })
})
