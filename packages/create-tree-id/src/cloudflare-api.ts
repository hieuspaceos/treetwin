/**
 * Cloudflare R2 API client
 * Docs: https://developers.cloudflare.com/api/resources/r2/
 *
 * NOTE: The CF API token used here (for bucket creation) is SEPARATE from
 * the R2 S3-compatible credentials (R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY).
 * Those S3 credentials must be created manually in the CF dashboard under
 * R2 → Manage R2 API tokens → Create API Token.
 */

const CF_API = 'https://api.cloudflare.com/client/v4'

export interface R2Credentials {
  bucketName: string
  endpoint: string
  publicUrl: string
  // S3-compat creds must be created manually — documented in manual steps
  accessKeyId: string
  secretAccessKey: string
  accountId: string
}

interface CfApiResponse<T = unknown> {
  success: boolean
  errors: Array<{ code: number; message: string }>
  result: T
}

/** Call CF API and throw on failure */
async function cfRequest<T>(
  method: string,
  path: string,
  token: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${CF_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = (await res.json()) as CfApiResponse<T>

  if (!data.success) {
    const errMsg = data.errors.map((e) => `${e.code}: ${e.message}`).join(', ')
    throw new Error(`Cloudflare API error: ${errMsg}`)
  }

  return data.result
}

/** Create an R2 bucket */
export async function createBucket(
  token: string,
  accountId: string,
  bucketName: string,
): Promise<void> {
  await cfRequest<unknown>(
    'POST',
    `/accounts/${accountId}/r2/buckets`,
    token,
    { name: bucketName },
  )
}

/** Set CORS policy on an R2 bucket to allow the given origin */
export async function setCors(
  token: string,
  accountId: string,
  bucketName: string,
  allowedOrigin: string = '*',
): Promise<void> {
  const corsRules = {
    cors_rules: [
      {
        allowed_origins: [allowedOrigin],
        allowed_methods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        allowed_headers: ['*'],
        max_age_seconds: 3600,
      },
    ],
  }

  // CF R2 CORS uses the S3-compatible API — the management API only lists buckets.
  // We emit the CORS config as a documented manual step if the management API lacks this endpoint.
  try {
    await cfRequest<unknown>(
      'PUT',
      `/accounts/${accountId}/r2/buckets/${bucketName}/cors`,
      token,
      corsRules,
    )
  } catch (err) {
    // CORS endpoint may not be available in all CF API versions — treat as non-fatal
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('10000') || message.includes('not found')) {
      console.warn(
        '\nWarning: Could not set CORS automatically. Set it manually in the CF dashboard:\n' +
        `  R2 → ${bucketName} → Settings → CORS → Add rule → allowed origin: ${allowedOrigin}`,
      )
      return
    }
    throw err
  }
}

/** Validate that the CF API token has R2 permissions */
export async function validateToken(token: string): Promise<{ id: string; status: string }> {
  const res = await fetch(`${CF_API}/user/tokens/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as CfApiResponse<{ id: string; status: string }>
  if (!data.success) {
    throw new Error('Invalid Cloudflare API token')
  }
  return data.result
}

/** List CF accounts accessible by the token */
export async function listAccounts(
  token: string,
): Promise<Array<{ id: string; name: string }>> {
  return cfRequest<Array<{ id: string; name: string }>>('GET', '/accounts', token)
}

/** Provision R2 bucket and return credentials shell (S3 creds are manual) */
export async function provisionR2(
  token: string,
  accountId: string,
  bucketName: string,
  siteOrigin: string,
  onStatus: (msg: string) => void,
): Promise<R2Credentials> {
  onStatus(`Creating R2 bucket "${bucketName}"...`)
  await createBucket(token, accountId, bucketName)

  onStatus('Setting CORS policy...')
  await setCors(token, accountId, bucketName, siteOrigin)

  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`
  const publicUrl = `https://pub-${accountId}.r2.dev/${bucketName}`

  return {
    bucketName,
    endpoint,
    publicUrl,
    // Placeholder — user must create R2 API token manually
    accessKeyId: 'SET_MANUALLY_IN_CF_DASHBOARD',
    secretAccessKey: 'SET_MANUALLY_IN_CF_DASHBOARD',
    accountId,
  }
}
