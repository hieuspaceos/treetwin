/**
 * Admin file upload API — POST multipart to R2
 */
import type { APIRoute } from 'astro'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export const prerender = false

const MAX_SIZE = 4 * 1024 * 1024 // 4MB (Vercel serverless limit)
const ALLOWED_TYPES = ['image/', 'video/', 'application/pdf']

/** POST /api/admin/upload — upload file to R2 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const rawPath = (formData.get('path') as string) || 'shared'
    // Sanitize path: strip traversal attempts, only allow alphanumeric/hyphens
    const uploadPath = rawPath.replace(/[^a-z0-9-]/gi, '').slice(0, 50) || 'shared'

    if (!file) {
      return json({ ok: false, error: 'No file provided' }, 400)
    }

    // Validate file type
    const isAllowed = ALLOWED_TYPES.some((t) => file.type.startsWith(t))
    if (!isAllowed) {
      return json({ ok: false, error: 'File type not allowed' }, 400)
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return json({ ok: false, error: 'File too large (max 4MB)' }, 400)
    }

    // Check R2 configuration
    const bucket = process.env.R2_BUCKET
    const endpoint = process.env.R2_ENDPOINT
    const publicUrl = process.env.R2_PUBLIC_URL
    if (!bucket || !endpoint || !publicUrl) {
      return json({ ok: false, error: 'R2 storage not configured' }, 503)
    }

    // Sanitize filename
    const safeName = file.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9.\-_]/g, '')
    const timestamp = Date.now()
    const key = `media/${uploadPath}/${timestamp}-${safeName}`

    // Upload to R2
    const client = new S3Client({
      region: process.env.R2_REGION || 'auto',
      endpoint: `https://${endpoint}`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })

    const buffer = Buffer.from(await file.arrayBuffer())
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    )

    const url = `${publicUrl}/${key}`
    return json({ ok: true, data: { url, key } }, 201)
  } catch (err) {
    return json({ ok: false, error: 'Upload failed' }, 500)
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
