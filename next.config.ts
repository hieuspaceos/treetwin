import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
    ],
  },
  // Keep drizzle-kit available at runtime for Payload's db.push schema sync
  serverExternalPackages: ['drizzle-kit'],
}

export default withPayload(nextConfig)
