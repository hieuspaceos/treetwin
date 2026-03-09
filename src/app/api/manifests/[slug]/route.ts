import { NextResponse } from 'next/server'
import { getManifest } from '@/lib/r2/upload-manifest'

/** GET /api/manifests/[slug] — Read video manifest JSON from R2 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  // Sanitize slug to prevent path traversal
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  const manifest = await getManifest(slug)
  if (!manifest) {
    return NextResponse.json({ error: 'Manifest not found' }, { status: 404 })
  }

  return NextResponse.json(manifest, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  })
}
