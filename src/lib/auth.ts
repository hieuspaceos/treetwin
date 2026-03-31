/**
 * Better Auth server config — SaaS user authentication.
 * Google OAuth sign-in, Drizzle adapter to Turso DB.
 * Separate from admin JWT auth (site owner) and Supabase auth (marketplace).
 */
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { getDb } from '@/db/client'

let _auth: ReturnType<typeof betterAuth> | null = null

/** Get Better Auth instance — lazy-initialized singleton */
export function getAuth() {
  if (_auth) return _auth

  _auth = betterAuth({
    database: drizzleAdapter(getDb(), { provider: 'sqlite' }),
    baseURL: import.meta.env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || 'http://localhost:4321',
    secret: import.meta.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET,
    socialProviders: {
      google: {
        clientId: import.meta.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: import.meta.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
      },
    },
    user: {
      additionalFields: {
        plan: { type: 'string', defaultValue: 'free', input: false },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      cookieCache: { enabled: true, maxAge: 60 * 5 }, // 5 min cache
    },
  })

  return _auth
}
