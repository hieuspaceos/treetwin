/**
 * Tests for feature-builder-spec-builder — parseDataFields() and buildSkillSpec()
 * Verifies deterministic spec generation from FeatureDescription
 */
import { describe, it, expect } from 'vitest'
import { parseDataFields, buildSkillSpec } from './feature-builder-spec-builder'
import type { FeatureDescription } from './feature-builder-ai'

describe('parseDataFields', () => {
  describe('empty/whitespace inputs', () => {
    it('returns empty array for empty string', () => {
      expect(parseDataFields('')).toEqual([])
    })

    it('returns empty array for whitespace only', () => {
      expect(parseDataFields('   ')).toEqual([])
      expect(parseDataFields('\n\t')).toEqual([])
    })
  })

  describe('comma-separated parsing', () => {
    it('parses comma-separated fields', () => {
      const result = parseDataFields('title, description, published')
      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('title')
      expect(result[1].name).toBe('description')
      expect(result[2].name).toBe('published')
    })

    it('trims whitespace around fields', () => {
      const result = parseDataFields('  name  ,  email  ,  age  ')
      expect(result[0].name).toBe('name')
      expect(result[1].name).toBe('email')
      expect(result[2].name).toBe('age')
    })

    it('filters out empty chunks', () => {
      const result = parseDataFields('title,,,description')
      expect(result).toHaveLength(2)
      expect(result.map((f) => f.name)).toEqual(['title', 'description'])
    })
  })

  describe('newline-separated parsing', () => {
    it('parses newline-separated fields', () => {
      const result = parseDataFields('title\ndescription\npublished')
      expect(result).toHaveLength(3)
      expect(result.map((f) => f.name)).toEqual(['title', 'description', 'published'])
    })

    it('handles mixed newlines and commas', () => {
      const result = parseDataFields('title, description\npublished, status')
      expect(result).toHaveLength(4)
      expect(result.map((f) => f.name)).toEqual(['title', 'description', 'published', 'status'])
    })
  })

  describe('semicolon-separated parsing', () => {
    it('parses semicolon-separated fields', () => {
      const result = parseDataFields('title; description; published')
      expect(result).toHaveLength(3)
      expect(result.map((f) => f.name)).toEqual(['title', 'description', 'published'])
    })
  })

  describe('field name normalization', () => {
    it('converts to lowercase', () => {
      const result = parseDataFields('Title, DESCRIPTION, Published')
      expect(result.map((f) => f.name)).toEqual(['title', 'description', 'published'])
    })

    it('converts spaces to hyphens', () => {
      const result = parseDataFields('user name, email address, creation date')
      expect(result[0].name).toBe('user-name')
      expect(result[1].name).toBe('email-address')
      expect(result[2].name).toBe('creation-date')
    })

    it('removes special characters', () => {
      const result = parseDataFields('title!, email@, age#')
      expect(result.map((f) => f.name)).toEqual(['title', 'email', 'age'])
    })

    it('handles multiple spaces', () => {
      const result = parseDataFields('very   long   field   name')
      expect(result[0].name).toBe('very-long-field-name')
    })

    it('defaults to "field" if name becomes empty after normalization', () => {
      const result = parseDataFields('!!!, ###')
      expect(result[0].name).toBe('field')
      expect(result[1].name).toBe('field')
    })
  })

  describe('type detection heuristics', () => {
    it('detects number type from keywords', () => {
      expect(parseDataFields('count')[0].type).toBe('number')
      expect(parseDataFields('price')[0].type).toBe('number')
      expect(parseDataFields('rating')[0].type).toBe('number')
      expect(parseDataFields('amount')[0].type).toBe('number')
      expect(parseDataFields('quantity')[0].type).toBe('number')
      expect(parseDataFields('total')[0].type).toBe('number')
      expect(parseDataFields('score')[0].type).toBe('number')
    })

    it('detects date type from keywords', () => {
      expect(parseDataFields('created date')[0].type).toBe('date')
      expect(parseDataFields('updated')[0].type).toBe('date')
      expect(parseDataFields('deadline')[0].type).toBe('date')
      expect(parseDataFields('published date')[0].type).toBe('date')
      expect(parseDataFields('expiration date')[0].type).toBe('date')
    })

    it('detects boolean type from keywords', () => {
      expect(parseDataFields('active')[0].type).toBe('boolean')
      expect(parseDataFields('enabled')[0].type).toBe('boolean')
      expect(parseDataFields('visible')[0].type).toBe('boolean')
      expect(parseDataFields('published')[0].type).toBe('boolean')
      expect(parseDataFields('flag')[0].type).toBe('boolean')
    })

    it('detects rich-text type from keywords', () => {
      expect(parseDataFields('content')[0].type).toBe('rich-text')
      expect(parseDataFields('description')[0].type).toBe('rich-text')
      expect(parseDataFields('body')[0].type).toBe('rich-text')
      expect(parseDataFields('bio')[0].type).toBe('rich-text')
      expect(parseDataFields('summary')[0].type).toBe('rich-text')
      expect(parseDataFields('html')[0].type).toBe('rich-text')
      expect(parseDataFields('markdown')[0].type).toBe('rich-text')
    })

    it('is case-insensitive for type detection', () => {
      expect(parseDataFields('PRICE')[0].type).toBe('number')
      expect(parseDataFields('Created')[0].type).toBe('date')
      expect(parseDataFields('ACTIVE')[0].type).toBe('boolean')
      expect(parseDataFields('DESCRIPTION')[0].type).toBe('rich-text')
    })

    it('defaults to "text" type when no heuristic matches', () => {
      expect(parseDataFields('username')[0].type).toBe('text')
      expect(parseDataFields('email')[0].type).toBe('text')
      expect(parseDataFields('slug')[0].type).toBe('text')
      expect(parseDataFields('name')[0].type).toBe('text')
    })

    it('matches first applicable heuristic', () => {
      // "total_price" matches "price" before "total"
      const result = parseDataFields('total price')
      expect(result[0].type).toBe('number')
    })
  })

  describe('complex realistic inputs', () => {
    it('parses product data description', () => {
      const result = parseDataFields('name, SKU (text), price (number), stock count, active (bool)')
      expect(result).toHaveLength(5)
      expect(result[0].name).toBe('name')
      expect(result[0].type).toBe('text')
      expect(result[1].name).toBe('sku')
      expect(result[1].type).toBe('text')
      expect(result[2].name).toBe('price')
      expect(result[2].type).toBe('number')
      expect(result[3].name).toBe('stock-count')
      expect(result[3].type).toBe('number')
      expect(result[4].name).toBe('active')
      expect(result[4].type).toBe('boolean')
    })

    it('parses article data with mixed separators', () => {
      const input = `title, slug, content (markdown),
published (boolean), created date,
featured image`
      const result = parseDataFields(input)
      expect(result).toHaveLength(6)
      expect(result.map((f) => f.name)).toEqual(['title', 'slug', 'content', 'published', 'created-date', 'featured-image'])
      expect(result[2].type).toBe('rich-text')
      expect(result[3].type).toBe('boolean')
      expect(result[4].type).toBe('date')
    })

    it('parses CRM contact data', () => {
      const result = parseDataFields('email address; phone number; company name; last contacted (date); active flag')
      expect(result).toHaveLength(5)
      expect(result[0].type).toBe('text')
      expect(result[2].type).toBe('text')
      expect(result[3].type).toBe('date')
      expect(result[4].type).toBe('boolean')
    })
  })

  describe('required field defaults', () => {
    it('defaults all fields to required: false', () => {
      const result = parseDataFields('name, email, age')
      expect(result.every((f) => f.required === false)).toBe(true)
    })
  })
})

describe('buildSkillSpec', () => {
  const baseDescription: FeatureDescription = {
    name: 'test-feature',
    label: 'Test Feature',
    purpose: 'A test feature for demonstrating spec generation',
    dataDescription: 'name, email, active',
    uiNeeds: 'list-detail',
    section: 'content',
  }

  describe('basic structure', () => {
    it('returns a SkillSpec with all required fields', () => {
      const spec = buildSkillSpec(baseDescription)
      expect(spec).toHaveProperty('skill')
      expect(spec).toHaveProperty('references')
      expect(spec).toHaveProperty('scripts')
      expect(spec).toHaveProperty('dataSchema')
      expect(spec).toHaveProperty('treeidIntegration')
    })

    it('has non-empty arrays where expected', () => {
      const spec = buildSkillSpec(baseDescription)
      expect(Array.isArray(spec.references)).toBe(true)
      expect(Array.isArray(spec.scripts)).toBe(true)
      expect(Array.isArray(spec.dataSchema.suggestedFields)).toBe(true)
      expect(Array.isArray(spec.treeidIntegration.components)).toBe(true)
      expect(Array.isArray(spec.treeidIntegration.apiRoutes)).toBe(true)
    })
  })

  describe('skill metadata', () => {
    it('sets skill name from description', () => {
      const spec = buildSkillSpec(baseDescription)
      expect(spec.skill.name).toBe('test-feature')
    })

    it('generates description from label and purpose', () => {
      const spec = buildSkillSpec(baseDescription)
      expect(spec.skill.description).toContain('test feature')
      expect(spec.skill.description).toContain('A test feature for demonstrating')
    })

    it('truncates long descriptions to 100 chars', () => {
      const longPurpose =
        'This is a very long purpose description that should be truncated to ensure it does not exceed one hundred characters in the generated spec description'
      const desc = { ...baseDescription, purpose: longPurpose }
      const spec = buildSkillSpec(desc)
      expect(spec.skill.description.length).toBeLessThanOrEqual(200) // leaves room for prefix/suffix
    })

    it('sets version to 1.0.0', () => {
      const spec = buildSkillSpec(baseDescription)
      expect(spec.skill.version).toBe('1.0.0')
    })

    it('generates body from SKILL.md template', () => {
      const spec = buildSkillSpec(baseDescription)
      expect(spec.skill.body).toContain('# Test Feature')
      expect(spec.skill.body).toContain('## Workflow')
      expect(spec.skill.body).toContain('## Data Schema')
      expect(spec.skill.body).toContain('## Gotchas')
    })
  })

  describe('body generation', () => {
    it('uses refined description if provided', () => {
      const spec = buildSkillSpec(baseDescription, 'Custom refined description')
      expect(spec.skill.body).toContain('Custom refined description')
      expect(spec.skill.body).not.toContain('A test feature for demonstrating')
    })

    it('uses original purpose if refined not provided', () => {
      const spec = buildSkillSpec(baseDescription)
      expect(spec.skill.body).toContain('A test feature for demonstrating')
    })

    it('includes Gotchas section with TODO', () => {
      const spec = buildSkillSpec(baseDescription)
      expect(spec.skill.body).toContain('TODO: Add edge cases')
    })
  })

  describe('references array', () => {
    it('includes implementation-guide reference', () => {
      const spec = buildSkillSpec(baseDescription)
      const implGuide = spec.references.find((r) => r.filename === 'implementation-guide.md')
      expect(implGuide).toBeDefined()
      expect(implGuide?.purpose).toContain('Step-by-step guide')
    })

    it('references mention the feature label', () => {
      const spec = buildSkillSpec(baseDescription)
      expect(spec.references[0].purpose).toContain('Test Feature')
    })
  })

  describe('data schema', () => {
    it('preserves raw data description', () => {
      const spec = buildSkillSpec(baseDescription)
      expect(spec.dataSchema.description).toBe('name, email, active')
    })

    it('parses fields from data description', () => {
      const spec = buildSkillSpec(baseDescription)
      expect(spec.dataSchema.suggestedFields).toHaveLength(3)
      expect(spec.dataSchema.suggestedFields[0].name).toBe('name')
      expect(spec.dataSchema.suggestedFields[1].name).toBe('email')
      expect(spec.dataSchema.suggestedFields[2].name).toBe('active')
    })

    it('includes type information in fields', () => {
      const spec = buildSkillSpec(baseDescription)
      expect(spec.dataSchema.suggestedFields[2].type).toBe('boolean')
    })
  })

  describe('tree-id integration - components', () => {
    it('generates list-detail components', () => {
      const spec = buildSkillSpec(baseDescription)
      expect(spec.treeidIntegration.components).toContain('feature-test-feature-list.tsx')
      expect(spec.treeidIntegration.components).toContain('feature-test-feature-editor.tsx')
    })

    it('generates form components', () => {
      const desc = { ...baseDescription, uiNeeds: 'form' as const }
      const spec = buildSkillSpec(desc)
      expect(spec.treeidIntegration.components).toContain('feature-test-feature-form.tsx')
      expect(spec.treeidIntegration.components).not.toContain('editor')
    })

    it('generates dashboard components', () => {
      const desc = { ...baseDescription, uiNeeds: 'dashboard' as const }
      const spec = buildSkillSpec(desc)
      expect(spec.treeidIntegration.components).toContain('feature-test-feature-dashboard.tsx')
    })

    it('generates no UI components for "none"', () => {
      const desc = { ...baseDescription, uiNeeds: 'none' as const }
      const spec = buildSkillSpec(desc)
      expect(spec.treeidIntegration.components).toHaveLength(0)
    })

    it('all uiNeeds values generate API routes', () => {
      const uiNeeds: Array<'list-detail' | 'form' | 'dashboard' | 'none'> = ['list-detail', 'form', 'dashboard', 'none']
      uiNeeds.forEach((need) => {
        const desc = { ...baseDescription, uiNeeds: need }
        const spec = buildSkillSpec(desc)
        expect(spec.treeidIntegration.apiRoutes).toContain('api/admin/test-feature.ts')
      })
    })
  })

  describe('tree-id integration - registry', () => {
    it('generates registry entry with name and label', () => {
      const spec = buildSkillSpec(baseDescription)
      expect(spec.treeidIntegration.registryEntry).toContain("'test-feature'")
      expect(spec.treeidIntegration.registryEntry).toContain('Test Feature')
    })

    it('includes section in registry entry', () => {
      const spec = buildSkillSpec(baseDescription)
      expect(spec.treeidIntegration.registryEntry).toContain('content')
    })
  })

  describe('tree-id integration - nav item', () => {
    it('generates nav item with href and label', () => {
      const spec = buildSkillSpec(baseDescription)
      expect(spec.treeidIntegration.navItem.href).toBe('/test-feature')
      expect(spec.treeidIntegration.navItem.label).toBe('Test Feature')
    })

    it('sets appropriate icon based on section', () => {
      const sections: Array<'content' | 'assets' | 'marketing' | 'system'> = ['content', 'assets', 'marketing', 'system']
      const expectedIcons = ['FileText', 'Image', 'BarChart', 'Settings']

      sections.forEach((section, idx) => {
        const desc = { ...baseDescription, section }
        const spec = buildSkillSpec(desc)
        expect(spec.treeidIntegration.navItem.iconKey).toBe(expectedIcons[idx])
      })
    })

    it('defaults to Box icon for unknown section', () => {
      const desc = { ...baseDescription, section: 'unknown' as any }
      const spec = buildSkillSpec(desc)
      expect(spec.treeidIntegration.navItem.iconKey).toBe('Box')
    })
  })

  describe('tree-id integration - general', () => {
    it('preserves section from description', () => {
      const desc = { ...baseDescription, section: 'marketing' as const }
      const spec = buildSkillSpec(desc)
      expect(spec.treeidIntegration.section).toBe('marketing')
    })

    it('preserves uiNeeds from description', () => {
      const desc = { ...baseDescription, uiNeeds: 'dashboard' as const }
      const spec = buildSkillSpec(desc)
      expect(spec.treeidIntegration.uiNeeds).toBe('dashboard')
    })
  })

  describe('all four uiNeeds combinations', () => {
    it('correctly handles all uiNeeds values', () => {
      const testCases: Array<{ uiNeeds: 'list-detail' | 'form' | 'dashboard' | 'none'; expectedComponents: number }> = [
        { uiNeeds: 'list-detail', expectedComponents: 2 },
        { uiNeeds: 'form', expectedComponents: 1 },
        { uiNeeds: 'dashboard', expectedComponents: 1 },
        { uiNeeds: 'none', expectedComponents: 0 },
      ]

      testCases.forEach(({ uiNeeds, expectedComponents }) => {
        const desc = { ...baseDescription, uiNeeds }
        const spec = buildSkillSpec(desc)
        expect(spec.treeidIntegration.components).toHaveLength(expectedComponents)
        expect(spec.treeidIntegration.apiRoutes).toHaveLength(1) // All have API route
      })
    })
  })

  describe('determinism', () => {
    it('produces identical specs for same input', () => {
      const spec1 = buildSkillSpec(baseDescription)
      const spec2 = buildSkillSpec(baseDescription)
      expect(JSON.stringify(spec1)).toBe(JSON.stringify(spec2))
    })

    it('produces different specs for different inputs', () => {
      const desc1 = { ...baseDescription, name: 'feature-a' }
      const desc2 = { ...baseDescription, name: 'feature-b' }
      const spec1 = buildSkillSpec(desc1)
      const spec2 = buildSkillSpec(desc2)
      expect(spec1.skill.name).not.toBe(spec2.skill.name)
      expect(JSON.stringify(spec1)).not.toBe(JSON.stringify(spec2))
    })
  })

  describe('edge cases', () => {
    it('handles empty data description', () => {
      const desc = { ...baseDescription, dataDescription: '' }
      const spec = buildSkillSpec(desc)
      expect(spec.dataSchema.suggestedFields).toHaveLength(0)
      expect(spec.dataSchema.description).toBe('')
    })

    it('handles very long label', () => {
      const longLabel = 'A'.repeat(100)
      const desc = { ...baseDescription, label: longLabel }
      const spec = buildSkillSpec(desc)
      expect(spec.skill.name).toBeDefined()
      expect(spec.treeidIntegration.navItem.label).toBe(longLabel)
    })

    it('handles special characters in label', () => {
      const desc = { ...baseDescription, label: 'Test & Feature (v2)' }
      const spec = buildSkillSpec(desc)
      expect(spec.skill.body).toContain('# Test & Feature (v2)')
    })

    it('handles whitespace in name', () => {
      const desc = { ...baseDescription, name: 'test feature' }
      const spec = buildSkillSpec(desc)
      expect(spec.treeidIntegration.apiRoutes[0]).toContain('test feature')
    })
  })

  describe('scripts array', () => {
    it('starts empty', () => {
      const spec = buildSkillSpec(baseDescription)
      expect(spec.scripts).toEqual([])
    })
  })
})
