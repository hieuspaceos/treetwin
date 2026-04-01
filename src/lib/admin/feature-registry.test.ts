/**
 * Tests for feature-registry — feature module system, enablement checks, and grouping
 */
import { describe, it, expect } from 'vitest'
import {
  isFeatureEnabled,
  getFeatureById,
  getEnabledFeatures,
  getFeaturesBySection,
  FEATURE_MODULES,
  type EnabledFeaturesMap,
} from './feature-registry'

describe('feature-registry', () => {
  describe('FEATURE_MODULES registry', () => {
    it('exports 11 feature modules', () => {
      expect(FEATURE_MODULES.length).toBe(11)
    })

    it('all features have required fields', () => {
      FEATURE_MODULES.forEach((feature) => {
        expect(feature.id).toBeDefined()
        expect(typeof feature.id).toBe('string')
        expect(feature.label).toBeDefined()
        expect(feature.description).toBeDefined()
        expect(feature.section).toMatch(/^(content|assets|marketing|system)$/)
        expect(feature.iconKey).toBeDefined()
        expect(Array.isArray(feature.routes)).toBe(true)
        expect(Array.isArray(feature.navItems)).toBe(true)
      })
    })

    it('all features have unique IDs', () => {
      const ids = FEATURE_MODULES.map((f) => f.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('features are grouped into 4 sections', () => {
      const sections = new Set(FEATURE_MODULES.map((f) => f.section))
      expect(sections).toEqual(new Set(['content', 'assets', 'marketing', 'system']))
    })

    it('voices feature registered', () => {
      const voices = FEATURE_MODULES.find((f) => f.id === 'voices')
      expect(voices).toBeDefined()
      expect(voices?.label).toBe('Writing Voices')
      expect(voices?.section).toBe('content')
      expect(voices?.envCheck).toContain('GEMINI_API_KEY')
    })

    it('goclaw feature registered', () => {
      const goclaw = FEATURE_MODULES.find((f) => f.id === 'goclaw')
      expect(goclaw).toBeDefined()
      expect(goclaw?.label).toBe('GoClaw API')
      expect(goclaw?.section).toBe('system')
      expect(goclaw?.envCheck).toContain('GOCLAW_API_KEY')
    })
  })

  describe('isFeatureEnabled', () => {
    it('returns true when enabledFeatures is undefined (backward compat)', () => {
      expect(isFeatureEnabled('voices')).toBe(true)
      expect(isFeatureEnabled('media')).toBe(true)
      expect(isFeatureEnabled('goclaw')).toBe(true)
    })

    it('returns true when enabledFeatures is empty object (backward compat)', () => {
      const empty: EnabledFeaturesMap = {}
      expect(isFeatureEnabled('voices', empty)).toBe(true)
      expect(isFeatureEnabled('email', empty)).toBe(true)
    })

    it('returns true when feature key not in map (backward compat)', () => {
      const map: EnabledFeaturesMap = { media: false }
      expect(isFeatureEnabled('voices', map)).toBe(true)
      expect(isFeatureEnabled('email', map)).toBe(true)
    })

    it('returns true when feature explicitly enabled', () => {
      const map: EnabledFeaturesMap = { voices: true, media: true }
      expect(isFeatureEnabled('voices', map)).toBe(true)
      expect(isFeatureEnabled('media', map)).toBe(true)
    })

    it('returns false when feature explicitly disabled', () => {
      const map: EnabledFeaturesMap = { voices: false, media: false }
      expect(isFeatureEnabled('voices', map)).toBe(false)
      expect(isFeatureEnabled('media', map)).toBe(false)
    })

    it('respects mixed enabled/disabled states', () => {
      const map: EnabledFeaturesMap = {
        voices: true,
        media: false,
        email: true,
        distribution: false,
      }
      expect(isFeatureEnabled('voices', map)).toBe(true)
      expect(isFeatureEnabled('media', map)).toBe(false)
      expect(isFeatureEnabled('email', map)).toBe(true)
      expect(isFeatureEnabled('distribution', map)).toBe(false)
      // missing key defaults to true
      expect(isFeatureEnabled('analytics', map)).toBe(true)
    })
  })

  describe('getFeatureById', () => {
    it('returns feature module by ID', () => {
      const voices = getFeatureById('voices')
      expect(voices).toBeDefined()
      expect(voices?.id).toBe('voices')
      expect(voices?.label).toBe('Writing Voices')
    })

    it('returns undefined for unknown ID', () => {
      expect(getFeatureById('nonexistent')).toBeUndefined()
      expect(getFeatureById('fake-feature')).toBeUndefined()
    })

    it('finds all 11 registered features', () => {
      const ids = ['voices', 'translations', 'media', 'distribution', 'email', 'analytics', 'goclaw', 'landing', 'entities', 'setup-wizard', 'feature-builder']
      ids.forEach((id) => {
        expect(getFeatureById(id)).toBeDefined()
      })
    })
  })

  describe('getEnabledFeatures', () => {
    it('returns all features when enabledFeatures undefined', () => {
      const enabled = getEnabledFeatures()
      expect(enabled.length).toBe(11)
      expect(enabled).toEqual(FEATURE_MODULES)
    })

    it('returns all features when enabledFeatures empty', () => {
      const enabled = getEnabledFeatures({})
      expect(enabled.length).toBe(11)
    })

    it('filters out disabled features', () => {
      const map: EnabledFeaturesMap = {
        voices: true,
        media: false,
        email: false,
        distribution: true,
      }
      const enabled = getEnabledFeatures(map)
      const ids = enabled.map((f) => f.id)

      expect(ids).toContain('voices')
      expect(ids).toContain('distribution')
      expect(ids).not.toContain('media')
      expect(ids).not.toContain('email')
      // missing keys default to true
      expect(ids).toContain('translations')
      expect(ids).toContain('analytics')
      expect(ids).toContain('goclaw')
      expect(ids).toContain('landing')
      expect(ids).toContain('entities')
      expect(ids).toContain('setup-wizard')
    })

    it('returns empty array when all features disabled', () => {
      const map: EnabledFeaturesMap = {
        voices: false,
        translations: false,
        media: false,
        distribution: false,
        email: false,
        analytics: false,
        goclaw: false,
        landing: false,
        entities: false,
        'setup-wizard': false,
        'feature-builder': false,
      }
      const enabled = getEnabledFeatures(map)
      expect(enabled.length).toBe(0)
    })

    it('preserves feature metadata in results', () => {
      const map: EnabledFeaturesMap = { voices: true }
      const enabled = getEnabledFeatures(map)
      const voices = enabled.find((f) => f.id === 'voices')

      expect(voices?.label).toBe('Writing Voices')
      expect(voices?.section).toBe('content')
      expect(voices?.description).toBeDefined()
      expect(voices?.envCheck).toEqual(['GEMINI_API_KEY'])
    })
  })

  describe('getFeaturesBySection', () => {
    it('returns all features grouped when enabledFeatures undefined', () => {
      const grouped = getFeaturesBySection()

      expect(grouped.content).toHaveLength(4) // voices, translations, landing, entities
      expect(grouped.assets).toHaveLength(1) // media
      expect(grouped.marketing).toHaveLength(3) // distribution, email, analytics
      expect(grouped.system).toHaveLength(3) // goclaw, setup-wizard, feature-builder
    })

    it('returns empty sections when enabledFeatures empty', () => {
      const grouped = getFeaturesBySection({})

      expect(grouped.content).toHaveLength(4)
      expect(grouped.assets).toHaveLength(1)
      expect(grouped.marketing).toHaveLength(3)
      expect(grouped.system).toHaveLength(3)
    })

    it('groups enabled features correctly with mixed state', () => {
      const map: EnabledFeaturesMap = {
        voices: true,
        translations: false,
        media: true,
        distribution: false,
        email: true,
        analytics: true,
        goclaw: false,
        landing: false,
        entities: false,
        'setup-wizard': false,
        'feature-builder': false,
      }
      const grouped = getFeaturesBySection(map)

      expect(grouped.content.map((f) => f.id)).toEqual(['voices']) // translations, landing, entities disabled
      expect(grouped.assets.map((f) => f.id)).toEqual(['media'])
      expect(grouped.marketing.map((f) => f.id)).toEqual(['email', 'analytics']) // distribution disabled
      expect(grouped.system).toHaveLength(0) // goclaw, setup-wizard, feature-builder disabled
    })

    it('respects backward compat — missing keys default to enabled', () => {
      // Only media explicitly disabled
      const map: EnabledFeaturesMap = { media: false }
      const grouped = getFeaturesBySection(map)

      expect(grouped.content.map((f) => f.id)).toEqual(['voices', 'translations', 'landing', 'entities'])
      expect(grouped.assets).toHaveLength(0) // media disabled
      expect(grouped.marketing.map((f) => f.id)).toEqual(['distribution', 'email', 'analytics'])
      expect(grouped.system.map((f) => f.id)).toEqual(['goclaw', 'setup-wizard', 'feature-builder'])
    })

    it('returns all empty sections when all features disabled', () => {
      const map: EnabledFeaturesMap = {
        voices: false,
        translations: false,
        media: false,
        distribution: false,
        email: false,
        analytics: false,
        goclaw: false,
        landing: false,
        entities: false,
        'setup-wizard': false,
        'feature-builder': false,
      }
      const grouped = getFeaturesBySection(map)

      expect(grouped.content).toHaveLength(0)
      expect(grouped.assets).toHaveLength(0)
      expect(grouped.marketing).toHaveLength(0)
      expect(grouped.system).toHaveLength(0)
    })

    it('section grouping maintains feature order within section', () => {
      const grouped = getFeaturesBySection()

      // Check order in marketing section (should follow FEATURE_MODULES order)
      const marketingIds = grouped.marketing.map((f) => f.id)
      expect(marketingIds).toEqual(['distribution', 'email', 'analytics'])
    })

    it('returns correct structure with all 4 section keys', () => {
      const grouped = getFeaturesBySection()

      expect(Object.keys(grouped).sort()).toEqual(['assets', 'content', 'marketing', 'system'])
      expect(grouped.content).toBeDefined()
      expect(grouped.assets).toBeDefined()
      expect(grouped.marketing).toBeDefined()
      expect(grouped.system).toBeDefined()
    })
  })
})
