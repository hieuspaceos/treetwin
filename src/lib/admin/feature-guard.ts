/**
 * Server-side feature guard — checks if a feature is enabled in site-settings.
 * Used by API routes to block requests when feature is toggled off.
 * Reads site-settings.yaml with 5s cache to avoid disk I/O per request.
 */
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import { siteSettingsSchema } from './validation'

interface CacheEntry {
  data: Record<string, boolean> | undefined
  timestamp: number
}

const CACHE_TTL = 5000
let cache: CacheEntry | null = null

/** Read enabledFeatures from site-settings.yaml with cache */
function readEnabledFeatures(): Record<string, boolean> | undefined {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data
  }

  try {
    const settingsPath = path.join(process.cwd(), 'src/content/site-settings.yaml')
    const raw = fs.readFileSync(settingsPath, 'utf-8')
    const parsed = yaml.load(raw) as Record<string, unknown> | null
    const validated = siteSettingsSchema.safeParse(parsed)
    const features = validated.success
      ? validated.data.enabledFeatures
      : undefined

    cache = { data: features, timestamp: Date.now() }
    return features
  } catch {
    // File missing or malformed — default all enabled
    cache = { data: undefined, timestamp: Date.now() }
    return undefined
  }
}

/**
 * Check if a feature is enabled. Returns 403 response if disabled.
 *
 * Usage at top of API route handler:
 *   const check = checkFeatureEnabled('email')
 *   if (!check.enabled) return check.response
 */
export function checkFeatureEnabled(featureId: string):
  | { enabled: true }
  | { enabled: false; response: Response } {
  const features = readEnabledFeatures()

  // No enabledFeatures config = all features enabled (backward compat)
  if (!features) return { enabled: true }

  // Missing key = enabled (backward compat)
  if (features[featureId] !== false) return { enabled: true }

  return {
    enabled: false,
    response: new Response(
      JSON.stringify({ ok: false, error: `Feature "${featureId}" is disabled` }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    ),
  }
}
