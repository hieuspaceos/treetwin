/**
 * Better Auth client — for React islands and client-side auth actions.
 * Used by login page to trigger Google OAuth flow.
 */
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321',
})
