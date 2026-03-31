/**
 * Turso DB connection factory — singleton for serverless reuse.
 * All DB access is server-side only (API routes, SSR pages).
 * Never import this in client components.
 */
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle> | null = null

/** Get Drizzle DB instance — reuses connection across requests */
export function getDb() {
  if (_db) return _db
  const url = import.meta.env.TURSO_URL || process.env.TURSO_URL
  const authToken = import.meta.env.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN
  if (!url) throw new Error('TURSO_URL env var required')

  const client = createClient({ url, authToken })
  _db = drizzle(client, { schema })
  return _db
}
