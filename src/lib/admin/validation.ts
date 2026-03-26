/**
 * Input validation for admin CRUD operations
 * Validates required fields per collection type
 */
import { z } from 'zod'

/** Allowed collection names (prevents path traversal) */
export const ALLOWED_COLLECTIONS = ['articles', 'notes', 'records', 'categories', 'voices'] as const
export type CollectionName = (typeof ALLOWED_COLLECTIONS)[number]

/** Allowed singleton names */
export const ALLOWED_SINGLETONS = ['site-settings'] as const
export type SingletonName = (typeof ALLOWED_SINGLETONS)[number]

export function isValidCollection(name: string): name is CollectionName {
  return (ALLOWED_COLLECTIONS as readonly string[]).includes(name)
}

export function isValidSingleton(name: string): name is SingletonName {
  return (ALLOWED_SINGLETONS as readonly string[]).includes(name)
}

/** Validate a slug is safe (no path traversal, no special chars) */
export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length > 200) return false
  // Only allow lowercase alphanumeric, hyphens, and digits
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(slug)
}

interface ValidationResult {
  valid: boolean
  errors: string[]
}

/** Validate entry data for a given collection */
export function validateEntry(collection: string, data: Record<string, unknown>): ValidationResult {
  const errors: string[] = []

  // Categories have different required fields
  if (collection === 'categories') {
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      errors.push('name is required')
    }
    return { valid: errors.length === 0, errors }
  }

  // Common required fields for content collections
  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    errors.push('title is required')
  }
  if (!data.description || typeof data.description !== 'string' || !data.description.trim()) {
    errors.push('description is required')
  }

  // Status validation
  if (data.status && !['draft', 'published'].includes(data.status as string)) {
    errors.push('status must be "draft" or "published"')
  }

  // Summary length check (GEO optimization: max 300 chars)
  if (data.summary && typeof data.summary === 'string' && data.summary.length > 300) {
    errors.push('summary must be 300 characters or less')
  }

  // Collection-specific validation
  if (collection === 'records') {
    if (data.recordType && !['project', 'product', 'experiment'].includes(data.recordType as string)) {
      errors.push('recordType must be "project", "product", or "experiment"')
    }
  }

  return { valid: errors.length === 0, errors }
}

/** Validate singleton data */
/** Zod schema for site-settings.yaml — validates structure on read/write */
export const siteSettingsSchema = z.object({
  themeId: z.string().default('liquid-glass'),
  activeVoice: z.string().optional(),
  enabledFeatures: z
    .record(z.string(), z.boolean())
    .optional(),
}).passthrough()

export function validateSingleton(name: string, data: Record<string, unknown>): ValidationResult {
  const errors: string[] = []

  if (name === 'site-settings') {
    const result = siteSettingsSchema.safeParse(data)
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push(`${issue.path.join('.')}: ${issue.message}`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}
