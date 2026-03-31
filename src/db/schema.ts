/**
 * Drizzle schema — Turso (SQLite edge) tables.
 * Better Auth tables (user, session, account, verification) are added in Phase 3.
 * Owner landing pages (ck2, ck3) stay in YAML — this table is for SaaS user pages only.
 */
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const landingPages = sqliteTable('landing_pages', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  slug: text('slug').unique().notNull(),
  name: text('name').notNull(),
  /** JSON string — same structure as LandingPageConfig from landing-types.ts */
  config: text('config').notNull(),
  published: integer('published', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default("(datetime('now'))"),
  updatedAt: text('updated_at').default("(datetime('now'))"),
})
