import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

// Build an S3Client pointed at Cloudflare R2 using env vars
function buildR2Client(): S3Client {
  const endpoint = process.env.R2_ENDPOINT
  if (!endpoint) throw new Error('R2_ENDPOINT env var is not set')

  return new S3Client({
    region: process.env.R2_REGION || 'auto',
    endpoint: `https://${endpoint}`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

// Upload a JSON manifest to R2 at manifests/{slug}.json
export async function uploadManifest(slug: string, manifest: Record<string, unknown>): Promise<void> {
  const bucket = process.env.R2_BUCKET
  if (!bucket) throw new Error('R2_BUCKET env var is not set')

  const client = buildR2Client()
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: `manifests/${slug}.json`,
    Body: JSON.stringify(manifest, null, 2),
    ContentType: 'application/json',
  }))
}

/** Read a manifest JSON from R2 by slug, returns null if not found */
export async function getManifest(slug: string): Promise<Record<string, unknown> | null> {
  const bucket = process.env.R2_BUCKET
  if (!bucket) return null

  try {
    const client = buildR2Client()
    const response = await client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: `manifests/${slug}.json`,
    }))
    const body = await response.Body?.transformToString()
    return body ? JSON.parse(body) : null
  } catch {
    return null
  }
}