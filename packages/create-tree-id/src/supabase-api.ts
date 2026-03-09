/**
 * Supabase Management API client
 * Docs: https://supabase.com/docs/reference/api
 */

const SUPABASE_API = 'https://api.supabase.com'

export interface SupabaseOrg {
  id: string
  name: string
}

export interface SupabaseProject {
  id: string
  name: string
  status: string
  region: string
  db_host?: string
}

export interface SupabaseCredentials {
  projectId: string
  projectRef: string
  dbHost: string
  dbUrl: string
  anonKey: string
  serviceRoleKey: string
  apiUrl: string
}

/** Fetch all organizations the token has access to */
export async function getOrganizations(token: string): Promise<SupabaseOrg[]> {
  const res = await fetch(`${SUPABASE_API}/v1/organizations`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Supabase orgs fetch failed (${res.status}): ${body}`)
  }
  return res.json() as Promise<SupabaseOrg[]>
}

/** Generate a random secure database password */
export function generateDbPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

/** Create a new Supabase project under the given org */
export async function createProject(
  token: string,
  orgId: string,
  name: string,
  dbPassword: string,
  region: string = 'us-east-1',
): Promise<SupabaseProject> {
  const res = await fetch(`${SUPABASE_API}/v1/projects`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organization_id: orgId,
      name,
      db_pass: dbPassword,
      region,
      plan: 'free',
    }),
  })

  if (res.status === 429) {
    throw new Error('Supabase rate limit hit. Please wait a moment and try again.')
  }
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Supabase project creation failed (${res.status}): ${body}`)
  }
  return res.json() as Promise<SupabaseProject>
}

/** Poll until project status is ACTIVE_HEALTHY — max 60 attempts (2 min) */
export async function waitForActive(
  token: string,
  projectId: string,
  onTick?: (attempt: number) => void,
): Promise<SupabaseProject> {
  const MAX_ATTEMPTS = 60
  const POLL_INTERVAL_MS = 2000

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    onTick?.(attempt)

    const res = await fetch(`${SUPABASE_API}/v1/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Failed to poll project status (${res.status}): ${body}`)
    }

    const project = (await res.json()) as SupabaseProject
    if (project.status === 'ACTIVE_HEALTHY') {
      return project
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    }
  }

  throw new Error('Supabase project did not become active within 2 minutes. Check the Supabase dashboard.')
}

/** Fetch the anon key and service role key for a project */
export async function getProjectKeys(
  token: string,
  projectRef: string,
): Promise<{ anonKey: string; serviceRoleKey: string }> {
  const res = await fetch(`${SUPABASE_API}/v1/projects/${projectRef}/api-keys`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to fetch project API keys (${res.status}): ${body}`)
  }

  const keys = (await res.json()) as Array<{ name: string; api_key: string }>
  const anonKey = keys.find((k) => k.name === 'anon')?.api_key ?? ''
  const serviceRoleKey = keys.find((k) => k.name === 'service_role')?.api_key ?? ''

  return { anonKey, serviceRoleKey }
}

/** Provision a full Supabase project and return all credentials */
export async function provisionSupabase(
  token: string,
  orgId: string,
  projectName: string,
  onStatus: (msg: string) => void,
): Promise<SupabaseCredentials> {
  const dbPassword = generateDbPassword()

  onStatus('Creating Supabase project...')
  const project = await createProject(token, orgId, projectName, dbPassword)

  onStatus(`Project created (id: ${project.id}). Waiting for it to become active...`)
  const active = await waitForActive(token, project.id, (attempt) => {
    if (attempt % 5 === 0) onStatus(`Still provisioning... (${attempt * 2}s elapsed)`)
  })

  const dbHost = active.db_host ?? `db.${project.id}.supabase.co`
  const dbUrl = `postgresql://postgres:${encodeURIComponent(dbPassword)}@${dbHost}:5432/postgres`
  const apiUrl = `https://${project.id}.supabase.co`

  onStatus('Fetching API keys...')
  const { anonKey, serviceRoleKey } = await getProjectKeys(token, project.id)

  return {
    projectId: project.id,
    projectRef: project.id,
    dbHost,
    dbUrl,
    anonKey,
    serviceRoleKey,
    apiUrl,
  }
}
