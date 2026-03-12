/**
 * Admin integrations status — returns configured/not-configured for env-based features
 * Read-only endpoint, no mutations
 */
import type { APIRoute } from 'astro'
import { isMultiUserMode } from '@/lib/admin/auth'
import { isEmailConfigured } from '@/lib/email/resend-client'

export const prerender = false

export const GET: APIRoute = async () => {
  const gaId = import.meta.env.GA_MEASUREMENT_ID || process.env.GA_MEASUREMENT_ID || ''
  const r2 = import.meta.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || ''
  const github = import.meta.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN || ''
  const multiUser = isMultiUserMode()
  const email = isEmailConfigured()

  const integrations = [
    {
      name: 'Google Analytics 4',
      description: 'Site traffic & real-time analytics',
      envVar: 'GA_MEASUREMENT_ID',
      configured: !!gaId,
      value: gaId ? `${gaId.slice(0, 4)}...` : undefined,
      docsUrl: 'https://support.google.com/analytics/answer/9304153',
    },
    {
      name: 'Email Newsletter (Resend)',
      description: 'Subscriber capture & broadcast emails',
      envVar: 'RESEND_API_KEY',
      configured: email,
      docsUrl: 'https://resend.com/docs',
    },
    {
      name: 'Multi-User Auth',
      description: 'Multiple admin/editor accounts',
      envVar: 'ADMIN_USERS',
      configured: multiUser,
      value: multiUser ? 'Enabled' : undefined,
    },
    {
      name: 'GitHub CMS Mode',
      description: 'Content writes via GitHub API (production)',
      envVar: 'GITHUB_TOKEN',
      configured: !!github,
    },
    {
      name: 'Cloudflare R2',
      description: 'Media storage & video manifests',
      envVar: 'R2_ACCESS_KEY_ID',
      configured: !!r2,
    },
  ]

  return new Response(JSON.stringify({ ok: true, data: integrations }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
