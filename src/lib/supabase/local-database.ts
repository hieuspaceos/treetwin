/**
 * Local SQLite fallback for marketplace data.
 * Used when Supabase env vars are not configured (local dev).
 * Implements a subset of Supabase client API (from/select/insert/eq/single/order).
 * better-sqlite3 is synchronous — getDb() must NOT be async.
 */
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'data', 'marketplace.db')

let db: Database.Database | null = null

/** Returns the singleton SQLite database instance, creating and seeding it on first call. */
function getDb(): Database.Database {
  if (!db) {
    // Ensure data directory exists (sync)
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema(db)
  }
  return db
}

/** Creates tables and seeds initial product data if the database is empty. */
function initSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      short_description TEXT,
      category TEXT NOT NULL DEFAULT 'tool',
      price_vnd INTEGER NOT NULL DEFAULT 0,
      price_usd INTEGER DEFAULT 0,
      currency TEXT DEFAULT 'VND',
      status TEXT DEFAULT 'draft',
      cover_image TEXT,
      gallery TEXT DEFAULT '[]',
      features TEXT DEFAULT '[]',
      metadata TEXT DEFAULT '{}',
      landing_slug TEXT,
      download_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      display_name TEXT,
      email TEXT NOT NULL,
      avatar_url TEXT,
      phone TEXT,
      locale TEXT DEFAULT 'vi',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      order_number TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL REFERENCES profiles(id),
      status TEXT DEFAULT 'pending',
      total_vnd INTEGER NOT NULL DEFAULT 0,
      total_usd INTEGER DEFAULT 0,
      payment_method TEXT,
      payment_id TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      price_vnd INTEGER NOT NULL,
      price_usd INTEGER DEFAULT 0,
      quantity INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS licenses (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL REFERENCES profiles(id),
      product_id TEXT NOT NULL REFERENCES products(id),
      order_id TEXT NOT NULL REFERENCES orders(id),
      license_key TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active',
      activated_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT,
      metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)

  // Seed if empty
  const count = database.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number }
  if (count.c === 0) {
    database.exec(`
      INSERT INTO products (id, slug, title, description, short_description, category, price_vnd, price_usd, currency, status, features) VALUES
      ('prod-001', 'claudekit-engineer', 'ClaudeKit Engineer', 'Production-ready AI subagents for development workflows', 'AI dev team in a box', 'tool', 2490000, 9900, 'VND', 'published', '["Multi-agent orchestration", "Code review automation", "Test generation", "Documentation sync"]'),
      ('prod-002', 'claudekit-marketing', 'ClaudeKit Marketing', 'AI-powered content creation and distribution pipeline', 'AI marketing team', 'tool', 2490000, 9900, 'VND', 'published', '["Content generation", "Social media scheduling", "SEO optimization", "Analytics dashboard"]'),
      ('prod-003', 'astro-starter-template', 'Astro Starter Template', 'Production-ready Astro template with CMS, auth, and marketplace', 'Full-stack Astro template', 'template', 990000, 3900, 'VND', 'published', '["Hybrid SSR", "Admin dashboard", "Landing page builder", "Content management"]');
    `)
  }
}

/** Parse JSON string fields in a row object in-place. */
function parseJsonFields(row: Record<string, unknown>): void {
  for (const key of ['gallery', 'features', 'metadata', 'payload']) {
    if (typeof row[key] === 'string') {
      try {
        row[key] = JSON.parse(row[key] as string)
      } catch {
        // leave as-is if invalid JSON
      }
    }
  }
}

/** Minimal Supabase-compatible query builder backed by SQLite. */
class QueryBuilder {
  private table: string
  private conditions: Array<{ col: string; val: unknown }> = []
  private orderCol?: string
  private orderAsc = true
  private isSingle = false

  constructor(table: string) {
    this.table = table
  }

  select(_cols = '*') { return this }

  eq(col: string, val: unknown) {
    this.conditions.push({ col, val })
    return this
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col
    this.orderAsc = opts?.ascending ?? true
    return this
  }

  single() {
    this.isSingle = true
    return this
  }

  /** Allows `await queryBuilder` — makes the builder thenable. */
  then(
    resolve: (v: { data: unknown; error: unknown }) => void,
    reject?: (e: unknown) => void
  ): void {
    try {
      const database = getDb()
      let sql = `SELECT * FROM ${this.table}`
      const params: unknown[] = []

      if (this.conditions.length) {
        sql +=
          ' WHERE ' +
          this.conditions
            .map((c) => {
              params.push(c.val)
              return `${c.col} = ?`
            })
            .join(' AND ')
      }

      if (this.orderCol) {
        sql += ` ORDER BY ${this.orderCol} ${this.orderAsc ? 'ASC' : 'DESC'}`
      }

      if (this.isSingle) {
        const row = database.prepare(sql).get(...(params as Parameters<Database.Statement['get']>)) as
          | Record<string, unknown>
          | undefined
        if (row) parseJsonFields(row)
        resolve({
          data: row ?? null,
          error: row ? null : { message: 'Not found' },
        })
      } else {
        const rows = database
          .prepare(sql)
          .all(...(params as Parameters<Database.Statement['all']>)) as Record<string, unknown>[]
        rows.forEach((r) => parseJsonFields(r))
        resolve({ data: rows, error: null })
      }
    } catch (error) {
      if (reject) reject(error)
      else resolve({ data: null, error })
    }
  }

  /** Insert one or more rows into the table. */
  async insert(data: Record<string, unknown> | Record<string, unknown>[]) {
    try {
      const database = getDb()
      const rows = Array.isArray(data) ? data : [data]
      for (const row of rows) {
        const cols = Object.keys(row)
        const vals = cols.map((c) =>
          typeof row[c] === 'object' && row[c] !== null ? JSON.stringify(row[c]) : row[c]
        )
        database
          .prepare(
            `INSERT INTO ${this.table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`
          )
          .run(...(vals as Parameters<Database.Statement['run']>))
      }
      return { data: rows, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}

/** Create a local SQLite client that mimics the Supabase client API surface used by marketplace queries. */
export function createLocalClient() {
  return {
    from(table: string) {
      return new QueryBuilder(table)
    },
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithOAuth: async () => ({
        data: null,
        error: { message: 'Local mode: auth disabled' },
      }),
      signOut: async () => ({ error: null }),
    },
  }
}
