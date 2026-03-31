/**
 * Tests for subscriber I/O — YAML-based subscriber CRUD with temp directory
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { mkdtempSync, rmSync, readdirSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  setSubscribersDir,
  addSubscriber,
  isSubscribed,
  getAllSubscribers,
  removeByToken,
  removeByEmail,
  getSubscriberCount,
} from './subscriber-io'

let tempDir: string

beforeAll(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'treetwin-subs-'))
  setSubscribersDir(tempDir)
})

afterAll(() => {
  rmSync(tempDir, { recursive: true, force: true })
})

// Clean up between tests to avoid state leakage
beforeEach(() => {
  try {
    for (const f of readdirSync(tempDir)) {
      if (f.endsWith('.yaml')) unlinkSync(join(tempDir, f))
    }
  } catch { /* dir may not exist yet */ }
})

describe('addSubscriber', () => {
  it('creates subscriber and returns object with token', () => {
    const sub = addSubscriber('test@example.com')
    expect(sub).not.toBeNull()
    expect(sub!.email).toBe('test@example.com')
    expect(sub!.token).toBeTruthy()
    expect(sub!.subscribedAt).toBeTruthy()
  })

  it('normalizes email to lowercase and trims whitespace', () => {
    const sub = addSubscriber('  TEST@EXAMPLE.COM  ')
    expect(sub).not.toBeNull()
    expect(sub!.email).toBe('test@example.com')
  })

  it('returns null for duplicate email', () => {
    addSubscriber('dupe@test.com')
    const second = addSubscriber('dupe@test.com')
    expect(second).toBeNull()
  })

  it('treats same email with different case as duplicate', () => {
    addSubscriber('Case@Test.com')
    const second = addSubscriber('case@test.com')
    expect(second).toBeNull()
  })
})

describe('isSubscribed', () => {
  it('returns true after subscribing', () => {
    addSubscriber('check@test.com')
    expect(isSubscribed('check@test.com')).toBe(true)
  })

  it('returns false for unknown email', () => {
    expect(isSubscribed('unknown@test.com')).toBe(false)
  })
})

describe('getAllSubscribers', () => {
  it('returns empty array when no subscribers', () => {
    const subs = getAllSubscribers()
    expect(subs).toEqual([])
  })

  it('returns all subscribers sorted by date desc', () => {
    addSubscriber('first@test.com')
    addSubscriber('second@test.com')
    const subs = getAllSubscribers()
    expect(subs).toHaveLength(2)
    // Most recent first
    expect(subs[0].subscribedAt >= subs[1].subscribedAt).toBe(true)
  })
})

describe('removeByToken', () => {
  it('removes subscriber with matching token', () => {
    const sub = addSubscriber('tokenremove@test.com')!
    expect(removeByToken(sub.token)).toBe(true)
    expect(isSubscribed('tokenremove@test.com')).toBe(false)
  })

  it('returns false for unknown token', () => {
    expect(removeByToken('nonexistent-token-xyz')).toBe(false)
  })
})

describe('removeByEmail', () => {
  it('removes subscriber by email', () => {
    addSubscriber('emailremove@test.com')
    expect(removeByEmail('emailremove@test.com')).toBe(true)
    expect(isSubscribed('emailremove@test.com')).toBe(false)
  })

  it('returns false for unknown email', () => {
    expect(removeByEmail('noone@test.com')).toBe(false)
  })
})

describe('getSubscriberCount', () => {
  it('returns 0 when empty', () => {
    expect(getSubscriberCount()).toBe(0)
  })

  it('returns correct count after add/remove', () => {
    addSubscriber('count1@test.com')
    addSubscriber('count2@test.com')
    expect(getSubscriberCount()).toBe(2)
    removeByEmail('count1@test.com')
    expect(getSubscriberCount()).toBe(1)
  })
})
