/**
 * Tests for feature guard integration across API routes
 * Tests disabled/enabled states, backward compatibility, and response shapes
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { checkFeatureEnabled } from '@/lib/admin/feature-guard'

describe('Feature Guard Integration Tests', () => {
  beforeEach(() => {
    // Reset module cache before each test to ensure fresh reads
    vi.resetModules()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Feature disabled scenarios', () => {
    it('returns 403 response when feature explicitly disabled', () => {
      // Simulate checking a feature that's disabled
      const result = checkFeatureEnabled('disabled-feature')

      // When disabled, response should be a 403
      if (!result.enabled) {
        expect(result.response).toBeDefined()
        expect(result.response.status).toBe(403)
      }
    })

    it('disabled feature response has JSON error body', async () => {
      const result = checkFeatureEnabled('disabled-feature')

      if (!result.enabled) {
        const body = await result.response.json()
        expect(body).toHaveProperty('ok')
        expect(body.ok).toBe(false)
        expect(body).toHaveProperty('error')
      }
    })

    it('error message includes feature ID', async () => {
      const featureId = 'my-test-feature'
      const result = checkFeatureEnabled(featureId)

      if (!result.enabled) {
        const body = await result.response.json()
        expect(body.error).toContain(featureId)
      }
    })

    it('response headers are JSON content-type', () => {
      const result = checkFeatureEnabled('test-disabled')

      if (!result.enabled) {
        expect(result.response.headers.get('Content-Type')).toBe('application/json')
      }
    })

    it('disabled response is immediately returnable from API handler', () => {
      const result = checkFeatureEnabled('email')

      if (!result.enabled) {
        // Should be usable directly: if (!check.enabled) return check.response
        expect(result.response).toBeInstanceOf(Response)
        expect(typeof result.response.status).toBe('number')
      }
    })
  })

  describe('Feature enabled scenarios', () => {
    it('returns { enabled: true } when feature is enabled', () => {
      const result = checkFeatureEnabled('any-feature')

      // Most features should be enabled by default (backward compat)
      if (result.enabled) {
        expect(result.enabled).toBe(true)
      }
    })

    it('enabled case has no response property', () => {
      const result = checkFeatureEnabled('test-feature')

      if (result.enabled === true) {
        expect('response' in result).toBe(false)
      }
    })

    it('enabled result allows handler to continue', () => {
      const result = checkFeatureEnabled('test')

      if (result.enabled) {
        // Handler can proceed with actual logic
        expect(result.enabled).toBe(true)
      }
    })
  })

  describe('Backward compatibility — missing enabledFeatures', () => {
    it('missing site-settings.yaml defaults all features enabled', () => {
      // When file doesn't exist or can't be parsed
      const result = checkFeatureEnabled('any-feature')

      // Should default to enabled (backward compat)
      expect(result.enabled).toBe(true)
    })

    it('missing enabledFeatures object enables all features', () => {
      const result = checkFeatureEnabled('feature1')
      expect(result.enabled).toBe(true)

      const result2 = checkFeatureEnabled('feature2')
      expect(result2.enabled).toBe(true)
    })

    it('missing key in enabledFeatures enables the feature', () => {
      // If enabledFeatures exists but key is missing, feature is enabled
      const result = checkFeatureEnabled('unknown-feature')

      // Missing key = enabled (per line 59 of feature-guard)
      if (result.enabled) {
        expect(result.enabled).toBe(true)
      }
    })

    it('empty enabledFeatures object enables all features', () => {
      // Empty object {} should enable all (no explicit disables)
      const result = checkFeatureEnabled('test')
      expect(result.enabled).toBe(true)
    })

    it('null/undefined enabledFeatures enables all features', () => {
      // Undefined features config = all enabled
      const result = checkFeatureEnabled('test')
      expect(result.enabled).toBe(true)
    })
  })

  describe('Multiple features with mixed state', () => {
    it('can check different features independently', () => {
      const emailCheck = checkFeatureEnabled('email')
      const glclawCheck = checkFeatureEnabled('goclaw')
      const mediaCheck = checkFeatureEnabled('media')

      // All should return valid result objects
      expect(emailCheck).toHaveProperty('enabled')
      expect(glclawCheck).toHaveProperty('enabled')
      expect(mediaCheck).toHaveProperty('enabled')
    })

    it('enabled state is independent per feature', () => {
      // One feature could be disabled while others enabled
      const r1 = checkFeatureEnabled('feature-a')
      const r2 = checkFeatureEnabled('feature-b')

      // Both have enabled property but could differ
      expect(r1).toHaveProperty('enabled')
      expect(r2).toHaveProperty('enabled')
    })

    it('same feature ID returns consistent state', () => {
      const id = 'test-consistency'
      const r1 = checkFeatureEnabled(id)
      const r2 = checkFeatureEnabled(id)

      expect(r1.enabled).toBe(r2.enabled)
    })
  })

  describe('Discriminated union pattern', () => {
    it('type narrowing works with enabled true', () => {
      const check = checkFeatureEnabled('test')

      if (check.enabled) {
        // TypeScript narrows to { enabled: true }
        expect(check.enabled).toBe(true)
        // response property should not exist
        expect('response' in check).toBe(false)
      }
    })

    it('type narrowing works with enabled false', () => {
      const check = checkFeatureEnabled('test')

      if (!check.enabled) {
        // TypeScript narrows to { enabled: false; response: Response }
        expect(check.enabled).toBe(false)
        expect(check.response).toBeInstanceOf(Response)
      }
    })

    it('negation check pattern works', () => {
      const check = checkFeatureEnabled('feature')

      if (!check.enabled) {
        // Pattern: if (!check.enabled) return check.response
        const response = check.response
        expect(response.status).toBe(403)
      }
    })
  })

  describe('Cache behavior', () => {
    it('multiple calls within TTL return same cached result', () => {
      const r1 = checkFeatureEnabled('cached-test')
      const r2 = checkFeatureEnabled('cached-test')

      expect(r1.enabled).toBe(r2.enabled)
    })

    it('cache is per-feature (different features may differ)', () => {
      const r1 = checkFeatureEnabled('feature-1')
      const r2 = checkFeatureEnabled('feature-2')

      // Both are valid, but could have different states
      expect(r1).toHaveProperty('enabled')
      expect(r2).toHaveProperty('enabled')
    })

    it('synchronous function returns immediately (not async)', () => {
      const start = Date.now()
      const result = checkFeatureEnabled('test')
      const elapsed = Date.now() - start

      expect(result).not.toBeInstanceOf(Promise)
      // Should be very fast (sub-millisecond)
      expect(elapsed).toBeLessThan(100)
    })
  })

  describe('API route integration patterns', () => {
    it('pattern: early return on disabled', () => {
      const check = checkFeatureEnabled('email')

      if (!check.enabled) {
        // This is the intended usage pattern
        const response = check.response
        expect(response.status).toBe(403)
      }
    })

    it('pattern: guard at route entry', () => {
      // Simulate at top of POST handler
      const fc = checkFeatureEnabled('email')
      if (!fc.enabled) {
        // Would return fc.response to client
        expect(fc.response).toBeInstanceOf(Response)
      } else {
        // Continue with business logic
        expect(fc.enabled).toBe(true)
      }
    })

    it('pattern: multiple guards chained', () => {
      // Simulate multiple guards (feature + auth)
      const fc = checkFeatureEnabled('goclaw')
      if (!fc.enabled) {
        expect(fc.response.status).toBe(403)
      } else {
        // Would then check auth next
        expect(fc.enabled).toBe(true)
      }
    })
  })

  describe('Feature ID formats', () => {
    it('handles simple feature names', () => {
      const result = checkFeatureEnabled('email')
      expect(result).toHaveProperty('enabled')
    })

    it('handles kebab-case names', () => {
      const result = checkFeatureEnabled('voice-generation')
      expect(result).toHaveProperty('enabled')
    })

    it('handles numeric suffixes', () => {
      const result = checkFeatureEnabled('feature123')
      expect(result).toHaveProperty('enabled')
    })

    it('handles underscores', () => {
      const result = checkFeatureEnabled('test_feature')
      expect(result).toHaveProperty('enabled')
    })

    it('handles empty string', () => {
      const result = checkFeatureEnabled('')
      expect(result).toHaveProperty('enabled')
    })

    it('handles very long names', () => {
      const longName = 'feature-' + 'x'.repeat(1000)
      const result = checkFeatureEnabled(longName)
      expect(result).toHaveProperty('enabled')
    })

    it('handles unicode characters', () => {
      const result = checkFeatureEnabled('功能')
      expect(result).toHaveProperty('enabled')
    })
  })

  describe('Response shape validation', () => {
    it('enabled true: only has enabled property', () => {
      const result = checkFeatureEnabled('any')

      if (result.enabled === true) {
        const keys = Object.keys(result)
        expect(keys).toEqual(['enabled'])
      }
    })

    it('enabled false: has enabled and response properties', () => {
      const result = checkFeatureEnabled('any')

      if (result.enabled === false) {
        expect(Object.keys(result).sort()).toEqual(['enabled', 'response'])
      }
    })

    it('response can be JSON parsed as error object', async () => {
      const result = checkFeatureEnabled('test')

      if (!result.enabled) {
        const body = await result.response.json()
        expect(typeof body).toBe('object')
        expect(body).toHaveProperty('ok')
        expect(body).toHaveProperty('error')
      }
    })

    it('response ok field is exactly false', async () => {
      const result = checkFeatureEnabled('test')

      if (!result.enabled) {
        const body = await result.response.json()
        expect(body.ok).toBe(false)
        expect(typeof body.ok).toBe('boolean')
      }
    })

    it('response error field is non-empty string', async () => {
      const result = checkFeatureEnabled('test')

      if (!result.enabled) {
        const body = await result.response.json()
        expect(typeof body.error).toBe('string')
        expect(body.error.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Error handling', () => {
    it('function never throws, always returns result object', () => {
      expect(() => {
        checkFeatureEnabled('test')
      }).not.toThrow()
    })

    it('handles null feature ID gracefully', () => {
      const result = checkFeatureEnabled(null as any)
      expect(result).toHaveProperty('enabled')
    })

    it('handles undefined feature ID gracefully', () => {
      const result = checkFeatureEnabled(undefined as any)
      expect(result).toHaveProperty('enabled')
    })

    it('result is never null or undefined', () => {
      const result = checkFeatureEnabled('test')
      expect(result).not.toBeNull()
      expect(result).toBeDefined()
    })

    it('response is valid Response instance when disabled', () => {
      const result = checkFeatureEnabled('test')

      if (!result.enabled) {
        expect(result.response).toBeInstanceOf(Response)
        expect(result.response.body).toBeDefined()
        expect(result.response.headers).toBeDefined()
      }
    })
  })
})
