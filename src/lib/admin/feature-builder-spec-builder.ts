/**
 * Spec builder — pure function that transforms a FeatureDescription
 * into a portable SkillSpec. No AI calls, deterministic template logic.
 */
import type { FeatureDescription } from './feature-builder-ai'
import type { SkillSpec, DataSchemaField, SkillFileEntry } from './feature-builder-spec-types'

/** Map uiNeeds to component + route templates */
const UI_TEMPLATES: Record<string, { components: (n: string) => string[]; routes: (n: string) => string[] }> = {
  'list-detail': {
    components: (n) => [`feature-${n}-list.tsx`, `feature-${n}-editor.tsx`],
    routes: (n) => [`api/admin/${n}.ts`],
  },
  form: {
    components: (n) => [`feature-${n}-form.tsx`],
    routes: (n) => [`api/admin/${n}.ts`],
  },
  dashboard: {
    components: (n) => [`feature-${n}-dashboard.tsx`],
    routes: (n) => [`api/admin/${n}.ts`],
  },
  none: {
    components: () => [],
    routes: (n) => [`api/admin/${n}.ts`],
  },
}

/** Section → suggested icon mapping */
const SECTION_ICONS: Record<string, string> = {
  content: 'FileText',
  assets: 'Image',
  marketing: 'BarChart',
  system: 'Settings',
}

/** Heuristic type detection keywords */
const TYPE_HINTS: [RegExp, DataSchemaField['type']][] = [
  [/\b(number|count|rating|price|amount|quantity|total|score)\b/i, 'number'],
  [/\b(date|time|created|updated|expired|deadline)\b/i, 'date'],
  [/\b(bool|boolean|enabled|active|visible|published|flag)\b/i, 'boolean'],
  [/\b(body|content|description|bio|summary|html|markdown)\b/i, 'rich-text'],
]

/**
 * Parse free-text data description into suggested schema fields.
 * Best-effort — user refines in Review step.
 */
export function parseDataFields(text: string): DataSchemaField[] {
  if (!text.trim()) return []

  const chunks = text
    .split(/[,\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  return chunks.map((chunk) => {
    const name = chunk
      .replace(/\(.*?\)/g, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    let type: DataSchemaField['type'] = 'text'
    for (const [re, t] of TYPE_HINTS) {
      if (re.test(chunk)) { type = t; break }
    }

    return { name: name || 'field', type, required: false }
  })
}

/** Generate SKILL.md body outline from feature description */
function buildSkillBody(desc: FeatureDescription, refined?: string): string {
  const lines = [
    `# ${desc.label}`,
    '',
    refined || desc.purpose,
    '',
    '## Workflow',
    '',
    `Use this skill when you need to work with ${desc.label.toLowerCase()}.`,
    '',
    '## Data Schema',
    '',
    desc.dataDescription || 'No data schema defined.',
    '',
    '## Gotchas',
    '',
    '- TODO: Add edge cases and common pitfalls discovered during implementation',
  ]
  return lines.join('\n')
}

/** Build a complete SkillSpec from feature description + optional refined text */
export function buildSkillSpec(desc: FeatureDescription, refined?: string): SkillSpec {
  const tmpl = UI_TEMPLATES[desc.uiNeeds] || UI_TEMPLATES.none
  const iconKey = SECTION_ICONS[desc.section] || 'Box'

  const references: SkillFileEntry[] = [
    { filename: 'implementation-guide.md', purpose: `Step-by-step guide for implementing ${desc.label}` },
  ]

  return {
    skill: {
      name: desc.name,
      description: `Activate when working with ${desc.label.toLowerCase()} — ${desc.purpose.slice(0, 100)}`,
      version: '1.0.0',
      body: buildSkillBody(desc, refined),
    },
    references,
    scripts: [],
    dataSchema: {
      description: desc.dataDescription,
      suggestedFields: parseDataFields(desc.dataDescription),
    },
    treeidIntegration: {
      section: desc.section,
      uiNeeds: desc.uiNeeds,
      components: tmpl.components(desc.name),
      apiRoutes: tmpl.routes(desc.name),
      registryEntry: `'${desc.name}': { label: '${desc.label.replace(/'/g, "\\'")}', section: '${desc.section}' }`,
      navItem: { href: `/${desc.name}`, label: desc.label, iconKey },
    },
  }
}
