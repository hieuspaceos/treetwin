/**
 * Site Identity Configuration
 *
 * This is THE file to customize your TreeID instance.
 * Edit these values, deploy, and you're live.
 *
 * Quick start:
 *   1. Fill in name, description, author, socialLinks
 *   2. Set PUBLIC_SITE_URL in .env.local (and in Vercel dashboard)
 *   3. Run `npm run dev` to preview
 */
export const siteConfig = {
  /** Your site/brand name (shown in nav, footer, OG images) */
  name: 'Tree Identity',

  /** One-line description (shown in hero, meta tags, JSON-LD) */
  description: 'Digital Twin content engine',

  /** Your deployed URL (used for sitemap, OG images, JSON-LD)
   *  Set PUBLIC_SITE_URL env var in Vercel — do not hardcode here */
  url: import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321',

  /** Author info (used in JSON-LD, meta tags) */
  author: {
    name: '',    // e.g. 'Jane Doe'
    email: '',   // e.g. 'jane@example.com'
    url: '',     // e.g. 'https://janedoe.com'
  },

  /** Social links (shown in nav bar — leave empty string to hide) */
  socialLinks: {
    twitter: '',   // e.g. 'https://twitter.com/janedoe'
    github: '',    // e.g. 'https://github.com/janedoe'
    linkedin: '',  // e.g. 'https://linkedin.com/in/janedoe'
  },

  /** Active theme — must match a key registered in src/themes/theme-resolver.ts
   *  Built-in options: 'liquid-glass'
   *  To add a theme: create src/themes/my-theme.ts, register in theme-resolver.ts */
  theme: {
    id: 'liquid-glass' as string,
  },

  /** Feature toggles — disable features you don't need */
  features: {
    /** R2-based video manifests (requires R2_* env vars) */
    videoFactory: false,
    /** Pagefind full-text search page at /search */
    search: true,
  },

  /** About/portfolio page — set these to enable /about */
  about: {
    /** Short bio text (plain text or simple markdown) */
    bio: '',
    /** Skill tags displayed on about page */
    skills: [] as string[],
    /** Avatar image URL (leave empty to hide) */
    avatar: '',
  },

  /** Writing voice — guides AI content generation (used by content-creation rules)
   *  Tone: casual (blog), professional (docs), technical (tutorial)
   *  Pronoun: first person word — "tôi" (Vietnamese), "I" (English), "we" etc.
   *  Sample: one paragraph showing your ideal writing style */
  voice: {
    tone: 'casual' as 'casual' | 'professional' | 'technical',
    pronoun: 'tôi',
    language: 'vi' as 'vi' | 'en',
    sample: 'Tôi mất 3 ngày migrate từ Next.js sang Astro. Build time giảm từ 45s xuống 12s, hosting cost từ $20/tháng xuống $0. Nhưng không phải không đau — Keystatic không support live preview, phải tự build.',
    avoid: ['chúng ta sẽ cùng tìm hiểu', 'trong bài viết này', 'như các bạn đã biết'],
  },

  /** Admin dashboard config — customizes the admin SPA at /admin */
  admin: {
    /** Title shown in sidebar header */
    title: 'Admin',
    /** Accent color override for admin UI (optional) */
    brandColor: '',
  },

  /** Google Analytics 4 — set GA_MEASUREMENT_ID env var to enable tracking */
  analytics: {
    measurementId: import.meta.env.GA_MEASUREMENT_ID || '',
  },

  /** Email newsletter — set RESEND_API_KEY env var to enable subscribe form */
  email: {
    /** Sender email address (must be verified in Resend) */
    from: import.meta.env.RESEND_FROM_EMAIL || 'noreply@example.com',
    /** Name shown in email "From" field */
    fromName: 'Tree Identity',
  },

  /** Cloudflare R2 — optional, only needed for video manifests / media storage
   *  Set R2_* env vars in .env.local and Vercel dashboard */
  r2: {
    publicUrl: import.meta.env.R2_PUBLIC_URL || '',
  },
} as const

export type SiteConfig = typeof siteConfig
