/**
 * Entity IO — CRUD for custom entity definitions and instances.
 * Definitions live in src/content/entity-definitions/<name>.yaml
 * Instances live in src/content/entities/<name>/<slug>.yaml
 */
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

const DEFS_DIR = 'src/content/entity-definitions'
const ENTITIES_DIR = 'src/content/entities'

export interface EntityFieldDef {
  name: string
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'date' | 'array'
  label: string
  required?: boolean
  options?: string[]
}

export interface EntityPublicConfig {
  enabled: boolean
  path: string              // URL segment, e.g. "customers" → /e/customers
  listTitle?: string        // fallback: capitalized entity name
  detailTitleField?: string // fallback: first text field or 'slug'
  listFields?: string[]     // fallback: all fields
  description?: string      // meta description for list page
}

export interface EntityDefinition {
  name: string
  label: string
  description?: string
  fields: EntityFieldDef[]
  public?: EntityPublicConfig
}

export interface EntityInstance {
  slug: string
  [key: string]: unknown
}

/** Validate slug/name — reject path traversal patterns */
function validateSlug(slug: string): void {
  if (!slug || slug.includes('..') || slug.includes('\0') || slug.startsWith('/')) {
    throw new Error(`Invalid slug: ${slug}`)
  }
}

// ── Definitions ──

export function listEntityDefinitions(basePath = process.cwd()): EntityDefinition[] {
  const dir = path.join(basePath, DEFS_DIR)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => {
      const name = f.replace('.yaml', '')
      return getEntityDefinition(name, basePath)
    })
    .filter(Boolean) as EntityDefinition[]
}

export function getEntityDefinition(name: string, basePath = process.cwd()): EntityDefinition | null {
  validateSlug(name)
  const filePath = path.join(basePath, DEFS_DIR, `${name}.yaml`)
  if (!fs.existsSync(filePath)) return null
  try {
    const raw = yaml.load(fs.readFileSync(filePath, 'utf-8')) as Record<string, unknown>
    return { name, ...raw } as EntityDefinition
  } catch { return null }
}

export function writeEntityDefinition(name: string, def: Omit<EntityDefinition, 'name'>, basePath = process.cwd()): void {
  validateSlug(name)
  const dir = path.join(basePath, DEFS_DIR)
  fs.mkdirSync(dir, { recursive: true })
  const { name: _n, ...rest } = def as any
  fs.writeFileSync(path.join(dir, `${name}.yaml`), yaml.dump(rest, { lineWidth: 120 }))
}

export function deleteEntityDefinition(name: string, basePath = process.cwd()): boolean {
  validateSlug(name)
  const filePath = path.join(basePath, DEFS_DIR, `${name}.yaml`)
  if (!fs.existsSync(filePath)) return false
  fs.unlinkSync(filePath)
  return true
}

/** Returns only entity definitions with public.enabled === true */
export function listPublicEntityDefinitions(basePath = process.cwd()): EntityDefinition[] {
  return listEntityDefinitions(basePath).filter(d => d.public?.enabled === true)
}

/** Returns public config for a specific entity type, or null if not public */
export function getPublicConfig(name: string, basePath = process.cwd()): EntityPublicConfig | null {
  const def = getEntityDefinition(name, basePath)
  return def?.public?.enabled ? def.public : null
}

// ── Instances ──

export function listEntityInstances(name: string, basePath = process.cwd()): EntityInstance[] {
  validateSlug(name)
  const dir = path.join(basePath, ENTITIES_DIR, name)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => {
      const slug = f.replace('.yaml', '')
      return readEntityInstance(name, slug, basePath)
    })
    .filter(Boolean) as EntityInstance[]
}

export function readEntityInstance(name: string, slug: string, basePath = process.cwd()): EntityInstance | null {
  validateSlug(name)
  validateSlug(slug)
  const filePath = path.join(basePath, ENTITIES_DIR, name, `${slug}.yaml`)
  if (!fs.existsSync(filePath)) return null
  try {
    const raw = yaml.load(fs.readFileSync(filePath, 'utf-8')) as Record<string, unknown>
    return { slug, ...raw } as EntityInstance
  } catch { return null }
}

export function writeEntityInstance(name: string, slug: string, data: Record<string, unknown>, basePath = process.cwd()): void {
  validateSlug(name)
  validateSlug(slug)
  const dir = path.join(basePath, ENTITIES_DIR, name)
  fs.mkdirSync(dir, { recursive: true })
  const { slug: _s, ...rest } = data
  fs.writeFileSync(path.join(dir, `${slug}.yaml`), yaml.dump(rest, { lineWidth: 120 }))
}

export function deleteEntityInstance(name: string, slug: string, basePath = process.cwd()): boolean {
  validateSlug(name)
  validateSlug(slug)
  const filePath = path.join(basePath, ENTITIES_DIR, name, `${slug}.yaml`)
  if (!fs.existsSync(filePath)) return false
  fs.unlinkSync(filePath)
  return true
}
