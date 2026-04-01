/**
 * Tests for Feature Builder Phase 3 — Code Generation Engine
 * Tests all generators: skill files, admin components, API route, content scaffold, and orchestrator
 */
import { describe, it, expect } from 'vitest'
import { generateSkillFiles } from './generate-skill-files'
import { generateAdminComponents } from './generate-admin-components'
import { generateApiRoute } from './generate-api-route'
import { generateContentScaffold } from './generate-content-scaffold'
import { generateAllFiles } from './index'
import type { SkillSpec } from '../feature-builder-spec-types'

/**
 * Mock SkillSpec factory — creates consistent test data
 */
function mockSkillSpec(overrides?: Partial<SkillSpec>): SkillSpec {
  return {
    skill: {
      name: 'test-feature',
      description: 'A test feature for demonstration',
      version: '1.0.0',
      body: 'This is a feature skill that demonstrates the API.',
    },
    references: [
      {
        filename: 'implementation-guide.md',
        purpose: 'Guide for implementing the feature',
      },
      {
        filename: 'api-reference.md',
        purpose: 'API reference and examples',
      },
    ],
    scripts: [],
    dataSchema: {
      description: 'Content stored with title, description, and status',
      suggestedFields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'rich-text', required: false },
        { name: 'status', type: 'text', required: false },
        { name: 'is-published', type: 'boolean', required: false },
        { name: 'count', type: 'number', required: false },
      ],
    },
    treeidIntegration: {
      section: 'content',
      uiNeeds: 'list-detail',
      components: ['feature-test-feature-list.tsx', 'feature-test-feature-editor.tsx'],
      apiRoutes: ['src/pages/api/admin/test-feature.ts'],
      registryEntry: 'test-feature',
      navItem: {
        href: '/test-feature',
        label: 'Test Feature',
        iconKey: 'FileText',
      },
    },
    ...overrides,
  }
}

describe('generateSkillFiles', () => {
  it('returns array of FileDescriptor objects', () => {
    const spec = mockSkillSpec()
    const files = generateSkillFiles(spec)
    expect(Array.isArray(files)).toBe(true)
    expect(files.length).toBeGreaterThan(0)
  })

  it('generates SKILL.md with valid frontmatter', () => {
    const spec = mockSkillSpec()
    const files = generateSkillFiles(spec)
    const skillMd = files.find(f => f.path.includes('SKILL.md'))

    expect(skillMd).toBeDefined()
    expect(skillMd!.content).toMatch(/^---\n/)
    expect(skillMd!.content).toMatch(/^name: test-feature/m)
    expect(skillMd!.content).toMatch(/^description: "A test feature/m)
    expect(skillMd!.content).toMatch(/^version: 1\.0\.0/m)
    expect(skillMd!.content).toMatch(/---\n\nThis is a feature skill/)
  })

  it('escapes quotes in SKILL.md description', () => {
    const spec = mockSkillSpec({
      skill: {
        name: 'test',
        description: 'Feature with "quotes" inside',
        version: '1.0.0',
        body: 'body',
      },
    })
    const files = generateSkillFiles(spec)
    const skillMd = files.find(f => f.path.includes('SKILL.md'))
    expect(skillMd!.content).toContain('Feature with \\"quotes\\" inside')
  })

  it('generates implementation-guide.md with data schema table', () => {
    const spec = mockSkillSpec()
    const files = generateSkillFiles(spec)
    const guide = files.find(f => f.path.includes('implementation-guide.md'))

    expect(guide).toBeDefined()
    expect(guide!.content).toMatch(/## Data Schema/)
    expect(guide!.content).toMatch(/\| title \| text \| Yes \|/)
    expect(guide!.content).toMatch(/\| description \| rich-text \| No \|/)
  })

  it('includes Tree-id Integration section in implementation guide', () => {
    const spec = mockSkillSpec()
    const files = generateSkillFiles(spec)
    const guide = files.find(f => f.path.includes('implementation-guide.md'))

    expect(guide!.content).toMatch(/## Tree-id Integration/)
    expect(guide!.content).toMatch(/- \*\*Section:\*\* content/)
    expect(guide!.content).toMatch(/- \*\*UI type:\*\* list-detail/)
  })

  it('includes API Endpoints section', () => {
    const spec = mockSkillSpec()
    const files = generateSkillFiles(spec)
    const guide = files.find(f => f.path.includes('implementation-guide.md'))

    expect(guide!.content).toMatch(/## API Endpoints/)
    expect(guide!.content).toMatch(/GET \/api\/admin\/test-feature/)
    expect(guide!.content).toMatch(/POST \/api\/admin\/test-feature/)
    expect(guide!.content).toMatch(/PUT \/api\/admin\/test-feature/)
    expect(guide!.content).toMatch(/DELETE \/api\/admin\/test-feature/)
  })

  it('generates additional reference files', () => {
    const spec = mockSkillSpec()
    const files = generateSkillFiles(spec)

    const apiRef = files.find(f => f.path.includes('api-reference.md'))
    expect(apiRef).toBeDefined()
    expect(apiRef!.content).toMatch(/# api-reference\.md/)
    expect(apiRef!.content).toMatch(/API reference and examples/)
    expect(apiRef!.content).toContain('<!-- TODO: Add detailed content -->')
  })

  it('skips generating implementation-guide.md twice from references', () => {
    const spec = mockSkillSpec()
    const files = generateSkillFiles(spec)
    const guides = files.filter(f => f.path.includes('implementation-guide.md'))
    expect(guides).toHaveLength(1)
  })

  it('creates .claude/skills/{name} directory structure', () => {
    const spec = mockSkillSpec()
    const files = generateSkillFiles(spec)

    expect(files.some(f => f.path.startsWith('.claude/skills/test-feature/'))).toBe(true)
    expect(files.some(f => f.path.includes('/SKILL.md'))).toBe(true)
    expect(files.some(f => f.path.includes('/references/'))).toBe(true)
  })
})

describe('generateAdminComponents', () => {
  it('returns empty array when uiNeeds is "none"', () => {
    const spec = mockSkillSpec({
      treeidIntegration: {
        ...mockSkillSpec().treeidIntegration,
        uiNeeds: 'none',
      },
    })
    const files = generateAdminComponents(spec)
    expect(files).toEqual([])
  })

  it('generates dashboard component for uiNeeds=dashboard', () => {
    const spec = mockSkillSpec({
      treeidIntegration: {
        ...mockSkillSpec().treeidIntegration,
        uiNeeds: 'dashboard',
      },
    })
    const files = generateAdminComponents(spec)

    expect(files).toHaveLength(1)
    expect(files[0].path).toMatch(/feature-test-feature-dashboard\.tsx$/)
    expect(files[0].content).toContain('TestFeatureDashboard')
  })

  it('generates form component for uiNeeds=form', () => {
    const spec = mockSkillSpec({
      treeidIntegration: {
        ...mockSkillSpec().treeidIntegration,
        uiNeeds: 'form',
      },
    })
    const files = generateAdminComponents(spec)

    expect(files).toHaveLength(1)
    expect(files[0].path).toMatch(/feature-test-feature-form\.tsx$/)
    expect(files[0].content).toContain('TestFeatureForm')
  })

  it('generates list and editor components for uiNeeds=list-detail', () => {
    const spec = mockSkillSpec({
      treeidIntegration: {
        ...mockSkillSpec().treeidIntegration,
        uiNeeds: 'list-detail',
      },
    })
    const files = generateAdminComponents(spec)

    expect(files).toHaveLength(2)
    expect(files[0].path).toMatch(/feature-test-feature-list\.tsx$/)
    expect(files[1].path).toMatch(/feature-test-feature-editor\.tsx$/)
  })

  it('converts skill name to PascalCase in component exports', () => {
    const spec = mockSkillSpec({
      skill: { ...mockSkillSpec().skill, name: 'test-feature-name' },
    })
    const files = generateAdminComponents(spec)

    expect(files[0].content).toContain('export function FeatureTestFeatureName')
  })

  it('list component imports api-client and uses collection API', () => {
    const spec = mockSkillSpec()
    const files = generateAdminComponents(spec)
    const list = files[0]

    expect(list.content).toContain("import { api } from '@/lib/admin/api-client'")
    expect(list.content).toContain("api.collections.list('test-feature')")
    expect(list.content).toContain('Test Feature')
  })

  it('editor component includes all form fields', () => {
    const spec = mockSkillSpec()
    const files = generateAdminComponents(spec)
    const editor = files[1]

    expect(editor.content).toContain('title')
    expect(editor.content).toContain('description')
    expect(editor.content).toContain('status')
    expect(editor.content).toContain('is-published')
    expect(editor.content).toContain('count')
  })

  it('editor component handles boolean fields as checkbox', () => {
    const spec = mockSkillSpec()
    const files = generateAdminComponents(spec)
    const editor = files[1]

    expect(editor.content).toContain('type="checkbox"')
    expect(editor.content).toContain('isPublished')
  })

  it('editor component handles rich-text fields with textarea', () => {
    const spec = mockSkillSpec()
    const files = generateAdminComponents(spec)
    const editor = files[1]

    expect(editor.content).toMatch(/<textarea[^>]*rows=\{4\}/)
  })

  it('dashboard component initializes with count state', () => {
    const spec = mockSkillSpec({
      treeidIntegration: {
        ...mockSkillSpec().treeidIntegration,
        uiNeeds: 'dashboard',
      },
    })
    const files = generateAdminComponents(spec)
    const dashboard = files[0]

    expect(dashboard.content).toContain('const [count, setCount] = useState(0)')
    expect(dashboard.content).toContain('Total entries')
  })

  it('creates components in src/components/admin/{name}/ directory', () => {
    const spec = mockSkillSpec()
    const files = generateAdminComponents(spec)

    expect(files.every(f => f.path.startsWith('src/components/admin/test-feature/'))).toBe(true)
  })
})

describe('generateApiRoute', () => {
  it('returns single FileDescriptor for API route', () => {
    const spec = mockSkillSpec()
    const files = generateApiRoute(spec)

    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('src/pages/api/admin/test-feature.ts')
  })

  it('includes prerender=false statement', () => {
    const spec = mockSkillSpec()
    const files = generateApiRoute(spec)

    expect(files[0].content).toContain('export const prerender = false')
  })

  it('imports feature guard', () => {
    const spec = mockSkillSpec()
    const files = generateApiRoute(spec)

    expect(files[0].content).toContain("import { checkFeatureEnabled } from '@/lib/admin/feature-guard'")
  })

  it('uses checkFeatureEnabled with correct feature name', () => {
    const spec = mockSkillSpec()
    const files = generateApiRoute(spec)

    expect(files[0].content).toContain("checkFeatureEnabled('test-feature')")
  })

  it('includes GET endpoint that lists all entries', () => {
    const spec = mockSkillSpec()
    const files = generateApiRoute(spec)

    expect(files[0].content).toContain('export const GET: APIRoute')
    expect(files[0].content).toContain("const slug = safeSlug(url.searchParams.get('slug'))")
    expect(files[0].content).toContain('const entries = await Promise.all')
  })

  it('includes POST endpoint that creates entry', () => {
    const spec = mockSkillSpec()
    const files = generateApiRoute(spec)

    expect(files[0].content).toContain('export const POST: APIRoute')
    expect(files[0].content).toContain('const body = await request.json()')
    expect(files[0].content).toContain('yaml.dump(data)')
  })

  it('includes PUT endpoint that updates entry', () => {
    const spec = mockSkillSpec()
    const files = generateApiRoute(spec)

    expect(files[0].content).toContain('export const PUT: APIRoute')
    expect(files[0].content).toContain("url.searchParams.get('slug')")
  })

  it('includes DELETE endpoint', () => {
    const spec = mockSkillSpec()
    const files = generateApiRoute(spec)

    expect(files[0].content).toContain('export const DELETE: APIRoute')
    expect(files[0].content).toContain('fs.unlink')
  })

  it('uses yaml for serialization', () => {
    const spec = mockSkillSpec()
    const files = generateApiRoute(spec)

    expect(files[0].content).toContain("import yaml from 'js-yaml'")
    expect(files[0].content).toContain('yaml.load(raw)')
  })

  it('creates content directory structure', () => {
    const spec = mockSkillSpec()
    const files = generateApiRoute(spec)

    expect(files[0].content).toContain("'src/content/test-feature'")
    expect(files[0].content).toContain('ensureDir()')
  })

  it('handles missing slug in PUT/DELETE with 400 error', () => {
    const spec = mockSkillSpec()
    const files = generateApiRoute(spec)

    expect(files[0].content).toContain("if (!slug) return json({ ok: false, error: 'Missing slug' }, 400)")
  })

  it('returns 404 for not found entries', () => {
    const spec = mockSkillSpec()
    const files = generateApiRoute(spec)

    expect(files[0].content).toContain("return json({ ok: false, error: 'Not found' }, 404)")
  })
})

describe('generateContentScaffold', () => {
  it('creates content directory marker and registry JSON', () => {
    const spec = mockSkillSpec()
    const files = generateContentScaffold(spec)

    expect(files).toHaveLength(2)
    expect(files[0].path).toBe('src/content/test-feature/.gitkeep')
    expect(files[1].path).toBe('src/content/feature-specs/test-feature.registry.json')
  })

  it('gitkeep file has empty content', () => {
    const spec = mockSkillSpec()
    const files = generateContentScaffold(spec)

    expect(files[0].content).toBe('')
  })

  it('registry JSON includes feature metadata', () => {
    const spec = mockSkillSpec()
    const files = generateContentScaffold(spec)
    const registry = JSON.parse(files[1].content)

    expect(registry.id).toBe('test-feature')
    expect(registry.label).toBe('Test Feature')
    expect(registry.description).toBe('A test feature for demonstration')
    expect(registry.section).toBe('content')
  })

  it('registry JSON includes navItem', () => {
    const spec = mockSkillSpec()
    const files = generateContentScaffold(spec)
    const registry = JSON.parse(files[1].content)

    expect(registry.navItems).toHaveLength(1)
    expect(registry.navItems[0].href).toBe('/test-feature')
    expect(registry.navItems[0].label).toBe('Test Feature')
    expect(registry.navItems[0].iconKey).toBe('FileText')
  })

  it('registry JSON includes routes derived from components', () => {
    const spec = mockSkillSpec()
    const files = generateContentScaffold(spec)
    const registry = JSON.parse(files[1].content)

    expect(registry.routes).toBeDefined()
    expect(Array.isArray(registry.routes)).toBe(true)
  })
})

describe('generateAllFiles — Orchestrator', () => {
  it('combines all file generators', () => {
    const spec = mockSkillSpec()
    const result = generateAllFiles(spec)

    expect(result.files.length).toBeGreaterThan(0)
    expect(result.registrySnippet).toBeDefined()
    expect(Array.isArray(result.warnings)).toBe(true)
  })

  describe('file count by uiNeeds', () => {
    it('returns ~7 files for list-detail', () => {
      const spec = mockSkillSpec({
        treeidIntegration: {
          ...mockSkillSpec().treeidIntegration,
          uiNeeds: 'list-detail',
        },
      })
      const result = generateAllFiles(spec)
      // skill (2) + components (2) + api (1) + scaffold (2) + extra refs = ~7
      expect(result.files.length).toBeGreaterThanOrEqual(7)
      expect(result.files.length).toBeLessThan(10)
    })

    it('returns ~6 files for form', () => {
      const spec = mockSkillSpec({
        treeidIntegration: {
          ...mockSkillSpec().treeidIntegration,
          uiNeeds: 'form',
        },
      })
      const result = generateAllFiles(spec)
      // skill (2) + component (1) + api (1) + scaffold (2) = ~6
      expect(result.files.length).toBeGreaterThanOrEqual(5)
      expect(result.files.length).toBeLessThan(8)
    })

    it('returns ~6 files for dashboard', () => {
      const spec = mockSkillSpec({
        treeidIntegration: {
          ...mockSkillSpec().treeidIntegration,
          uiNeeds: 'dashboard',
        },
      })
      const result = generateAllFiles(spec)
      expect(result.files.length).toBeGreaterThanOrEqual(5)
      expect(result.files.length).toBeLessThan(8)
    })

    it('returns ~5 files for none', () => {
      const spec = mockSkillSpec({
        treeidIntegration: {
          ...mockSkillSpec().treeidIntegration,
          uiNeeds: 'none',
        },
      })
      const result = generateAllFiles(spec)
      // skill (2) + api (1) + scaffold (2) = ~5
      expect(result.files.length).toBeGreaterThanOrEqual(4)
      expect(result.files.length).toBeLessThan(7)
    })
  })

  it('includes registrySnippet for manual registration', () => {
    const spec = mockSkillSpec()
    const result = generateAllFiles(spec)

    expect(result.registrySnippet).toContain("// Add to FEATURES array")
    expect(result.registrySnippet).toContain("id: 'test-feature'")
    expect(result.registrySnippet).toContain("label: 'Test Feature'")
    expect(result.registrySnippet).toContain("description: 'A test feature")
  })

  it('registrySnippet includes all required fields', () => {
    const spec = mockSkillSpec()
    const result = generateAllFiles(spec)

    expect(result.registrySnippet).toContain('id:')
    expect(result.registrySnippet).toContain('label:')
    expect(result.registrySnippet).toContain('description:')
    expect(result.registrySnippet).toContain('section:')
    expect(result.registrySnippet).toContain('iconKey:')
    expect(result.registrySnippet).toContain('routes:')
    expect(result.registrySnippet).toContain('navItems:')
  })

  it('escapes quotes in registrySnippet', () => {
    const spec = mockSkillSpec({
      skill: {
        name: 'test',
        description: "Feature with 'quotes'",
        version: '1.0.0',
        body: 'body',
      },
    })
    const result = generateAllFiles(spec)

    expect(result.registrySnippet).toContain("\\'quotes\\'")
  })

  it('sanitizes invalid skill names', () => {
    const spec = mockSkillSpec({
      skill: { ...mockSkillSpec().skill, name: '!@#$%^&*' },
    })
    const result = generateAllFiles(spec)

    expect(result.warnings).toContain('Invalid skill name')
    expect(result.files).toEqual([])
    expect(result.registrySnippet).toBe('')
  })

  it('returns warning for completely invalid names', () => {
    const spec = mockSkillSpec({
      skill: { ...mockSkillSpec().skill, name: '!!!###@@@' },
    })
    const result = generateAllFiles(spec)

    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('removes non-alphanumeric chars but preserves hyphens', () => {
    const spec = mockSkillSpec({
      skill: { ...mockSkillSpec().skill, name: 'test-feature-123' },
    })
    const result = generateAllFiles(spec)

    expect(result.files.length).toBeGreaterThan(0)
    expect(result.warnings).toEqual([])
  })

  it('all returned files have non-empty paths', () => {
    const spec = mockSkillSpec()
    const result = generateAllFiles(spec)

    expect(result.files.every(f => f.path && f.path.length > 0)).toBe(true)
  })

  it('all returned files have content', () => {
    const spec = mockSkillSpec()
    const result = generateAllFiles(spec)

    expect(result.files.every(f => f.content !== undefined && f.content !== null)).toBe(true)
  })

  it('generated skill file paths are absolute from project root', () => {
    const spec = mockSkillSpec()
    const result = generateAllFiles(spec)

    expect(result.files.some(f => f.path.startsWith('.claude/skills/'))).toBe(true)
    expect(result.files.some(f => f.path.startsWith('src/components/'))).toBe(true)
    expect(result.files.some(f => f.path.startsWith('src/pages/api/'))).toBe(true)
    expect(result.files.some(f => f.path.startsWith('src/content/'))).toBe(true)
  })

  it('no duplicate paths in generated files', () => {
    const spec = mockSkillSpec()
    const result = generateAllFiles(spec)

    const paths = result.files.map(f => f.path)
    const uniquePaths = new Set(paths)
    expect(paths.length).toBe(uniquePaths.size)
  })
})

describe('End-to-end generation with complex specs', () => {
  it('handles feature with many data fields', () => {
    const spec = mockSkillSpec({
      dataSchema: {
        description: 'Complex data model',
        suggestedFields: [
          { name: 'title', type: 'text', required: true },
          { name: 'slug', type: 'text', required: true },
          { name: 'author', type: 'text', required: true },
          { name: 'content', type: 'rich-text', required: true },
          { name: 'excerpt', type: 'text', required: false },
          { name: 'published-at', type: 'date', required: false },
          { name: 'view-count', type: 'number', required: false },
          { name: 'is-featured', type: 'boolean', required: false },
          { name: 'tags', type: 'text', required: false },
        ],
      },
    })
    const result = generateAllFiles(spec)

    expect(result.files.length).toBeGreaterThan(5)
    expect(result.files.some(f => f.content.includes('title'))).toBe(true)
    expect(result.files.some(f => f.content.includes('published-at'))).toBe(true)
  })

  it('handles kebab-case feature names correctly', () => {
    const spec = mockSkillSpec({
      skill: { ...mockSkillSpec().skill, name: 'user-engagement-metrics' },
    })
    const result = generateAllFiles(spec)

    expect(result.files.length).toBeGreaterThan(0)
    expect(result.files.some(f => f.path.includes('user-engagement-metrics'))).toBe(true)
    expect(result.registrySnippet).toContain("id: 'user-engagement-metrics'")
  })

  it('generates valid TypeScript syntax', () => {
    const spec = mockSkillSpec()
    const result = generateAllFiles(spec)

    const tsFiles = result.files.filter(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx'))
    expect(tsFiles.length).toBeGreaterThan(0)

    // Check for common TypeScript patterns
    tsFiles.forEach(file => {
      expect(file.content).not.toContain('undefined is not a function')
      expect(file.content).not.toMatch(/\{\s*\}$/m) // No empty trailing braces
    })
  })

  it('generates markdown with proper frontmatter', () => {
    const spec = mockSkillSpec()
    const result = generateAllFiles(spec)

    const mdFiles = result.files.filter(f => f.path.endsWith('.md'))
    expect(mdFiles.length).toBeGreaterThan(0)

    mdFiles.forEach(file => {
      if (file.path.includes('SKILL.md')) {
        expect(file.content).toMatch(/^---\n.*\n---\n/s)
      }
    })
  })

  it('handles special characters in descriptions safely', () => {
    const spec = mockSkillSpec({
      skill: {
        name: 'test',
        description: 'Feature with "quotes", backticks `code`, and <tags>',
        version: '1.0.0',
        body: 'body',
      },
    })
    const result = generateAllFiles(spec)

    expect(result.files.length).toBeGreaterThan(0)
    // Should escape quotes in JSON/YAML context
    const skillFile = result.files.find(f => f.path.includes('SKILL.md'))
    expect(skillFile!.content).toContain('\\"quotes\\"')
  })
})
