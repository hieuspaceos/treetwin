/**
 * Tests for schema registry — verifies collection/singleton field definitions
 */
import { describe, it, expect } from 'vitest'
import {
  collectionSchemas,
  singletonSchemas,
  getSchemaForCollection,
  getSchemaForSingleton,
} from './schema-registry'

describe('collectionSchemas', () => {
  it('defines schemas for all collections', () => {
    expect(collectionSchemas).toHaveProperty('articles')
    expect(collectionSchemas).toHaveProperty('notes')
    expect(collectionSchemas).toHaveProperty('records')
    expect(collectionSchemas).toHaveProperty('categories')
  })

  it('articles schema has required title field', () => {
    const titleField = collectionSchemas.articles.find((f) => f.name === 'title')
    expect(titleField).toBeDefined()
    expect(titleField?.required).toBe(true)
    expect(titleField?.type).toBe('text')
  })

  it('articles schema has markdoc content field', () => {
    const contentField = collectionSchemas.articles.find((f) => f.name === 'content')
    expect(contentField).toBeDefined()
    expect(contentField?.type).toBe('markdoc')
  })

  it('categories schema has color field', () => {
    const colorField = collectionSchemas.categories.find((f) => f.name === 'color')
    expect(colorField).toBeDefined()
    expect(colorField?.type).toBe('color')
  })

  it('all schemas have valid field types', () => {
    const validTypes = ['text', 'textarea', 'select', 'checkbox', 'date', 'array', 'object', 'markdoc', 'dynamic-select', 'color']
    for (const [, fields] of Object.entries(collectionSchemas)) {
      for (const field of fields) {
        expect(validTypes).toContain(field.type)
      }
    }
  })
})

describe('getSchemaForCollection', () => {
  it('returns schema for known collections', () => {
    expect(getSchemaForCollection('articles').length).toBeGreaterThan(0)
    expect(getSchemaForCollection('notes').length).toBeGreaterThan(0)
  })

  it('returns empty array for unknown collection', () => {
    expect(getSchemaForCollection('unknown')).toEqual([])
  })
})

describe('getSchemaForSingleton', () => {
  it('returns schema for site-settings', () => {
    expect(getSchemaForSingleton('site-settings').length).toBeGreaterThan(0)
  })

  it('returns empty array for unknown singleton', () => {
    expect(getSchemaForSingleton('unknown')).toEqual([])
  })
})
