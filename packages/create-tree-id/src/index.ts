/**
 * create-tree-id — main CLI entry point
 * Interactive scaffolding tool for Tree Identity sites
 *
 * Flow:
 *   1. Welcome
 *   2. Site name
 *   3. Supabase token (optional) → provision project
 *   4. Cloudflare token (optional) → provision R2 bucket
 *   5. Write .env.local
 *   6. npm install
 *   7. payload migrate
 *   8. Success message
 */

import {
  intro,
  outro,
  text,
  password,
  select,
  confirm,
  spinner,
  note,
  cancel,
  isCancel,
} from '@clack/prompts'
import { getOrganizations, provisionSupabase } from './supabase-api.js'
import { listAccounts, provisionR2 } from './cloudflare-api.js'
import { writeEnvFile, generatePayloadSecret, type EnvVars } from './env-writer.js'
import { runNpmInstall, runMigrations } from './migrations-runner.js'
import { resolve } from 'node:path'

/** Handle cancellation uniformly */
function assertNotCancelled(value: unknown, message = 'Operation cancelled.'): void {
  if (isCancel(value)) {
    cancel(message)
    process.exit(0)
  }
}

/** Print manual Supabase setup instructions when token is skipped */
function printManualSupabaseInstructions(siteName: string): void {
  note(
    [
      '1. Go to https://supabase.com and create a new project named "' + siteName + '"',
      '2. Copy the connection string from Project Settings → Database → Connection String (URI)',
      '3. Copy the anon key and service role key from Settings → API',
      '4. Add to .env.local:',
      '   DATABASE_URI="postgresql://postgres:[password]@[host]:5432/postgres"',
      '   SUPABASE_URL="https://[project-ref].supabase.co"',
      '   SUPABASE_ANON_KEY="[anon-key]"',
      '   SUPABASE_SERVICE_ROLE_KEY="[service-role-key]"',
    ].join('\n'),
    'Manual Supabase Setup',
  )
}

/** Print manual R2 setup instructions when token is skipped */
function printManualR2Instructions(siteName: string): void {
  note(
    [
      '1. Go to https://dash.cloudflare.com → R2',
      '2. Create a bucket named "' + siteName.toLowerCase().replace(/\s+/g, '-') + '-media"',
      '3. Set CORS: allowed origins = * (or your domain), methods = GET PUT POST DELETE HEAD',
      '4. Create an R2 API token (R2 → Manage R2 API tokens → Create API Token)',
      '5. Add to .env.local:',
      '   R2_BUCKET="[bucket-name]"',
      '   R2_ENDPOINT="https://[account-id].r2.cloudflarestorage.com"',
      '   R2_ACCESS_KEY_ID="[access-key-id]"',
      '   R2_SECRET_ACCESS_KEY="[secret-access-key]"',
      '   R2_ACCOUNT_ID="[account-id]"',
    ].join('\n'),
    'Manual Cloudflare R2 Setup',
  )
}

/** Main CLI entry point — exported for bin/cli.js */
export async function main(): Promise<void> {
  // Handle Ctrl+C globally
  process.on('SIGINT', () => {
    cancel('Interrupted.')
    process.exit(0)
  })

  intro('create-tree-id — Tree Identity Site Setup')

  // --- Site name ---
  const siteName = await text({
    message: 'What is your site name?',
    placeholder: 'my-tree-site',
    validate: (v) => {
      if (!v.trim()) return 'Site name cannot be empty'
      if (!/^[a-z0-9-]+$/i.test(v.trim())) return 'Use only letters, numbers, and hyphens'
    },
  })
  assertNotCancelled(siteName)
  const siteNameStr = (siteName as string).trim()

  const targetDir = resolve(process.cwd(), siteNameStr)
  const env: EnvVars = {}

  // --- Supabase ---
  const supabaseToken = await password({
    message: 'Supabase Management API token (leave blank to skip / set up manually):',
  })
  assertNotCancelled(supabaseToken)
  const supabaseTokenStr = (supabaseToken as string).trim()

  if (supabaseTokenStr) {
    const s = spinner()
    try {
      s.start('Fetching Supabase organizations...')
      const orgs = await getOrganizations(supabaseTokenStr)
      s.stop('Organizations fetched.')

      if (orgs.length === 0) {
        cancel('No Supabase organizations found for that token. Create one at https://supabase.com first.')
        process.exit(1)
      }

      const orgId = await select({
        message: 'Select a Supabase organization:',
        options: orgs.map((o) => ({ value: o.id, label: o.name })),
      })
      assertNotCancelled(orgId)

      s.start('Provisioning Supabase project (this takes ~60s)...')
      const creds = await provisionSupabase(
        supabaseTokenStr,
        orgId as string,
        siteNameStr,
        (msg) => s.message(msg),
      )
      s.stop('Supabase project ready.')

      env.DATABASE_URI = creds.dbUrl
      env.SUPABASE_URL = creds.apiUrl
      env.SUPABASE_ANON_KEY = creds.anonKey
      env.SUPABASE_SERVICE_ROLE_KEY = creds.serviceRoleKey
    } catch (err) {
      s.stop('Supabase provisioning failed.')
      const message = err instanceof Error ? err.message : String(err)
      note(`Error: ${message}\n\nFalling back to manual setup.`, 'Supabase Error')
      printManualSupabaseInstructions(siteNameStr)
    }
  } else {
    printManualSupabaseInstructions(siteNameStr)
  }

  // --- Cloudflare R2 ---
  const cfToken = await password({
    message: 'Cloudflare API token with R2 permissions (leave blank to skip / set up manually):',
  })
  assertNotCancelled(cfToken)
  const cfTokenStr = (cfToken as string).trim()

  if (cfTokenStr) {
    const s = spinner()
    try {
      s.start('Fetching Cloudflare accounts...')
      const accounts = await listAccounts(cfTokenStr)
      s.stop('Accounts fetched.')

      if (accounts.length === 0) {
        throw new Error('No Cloudflare accounts found for that token.')
      }

      let accountId: string
      if (accounts.length === 1) {
        accountId = accounts[0].id
      } else {
        const selected = await select({
          message: 'Select a Cloudflare account:',
          options: accounts.map((a) => ({ value: a.id, label: a.name })),
        })
        assertNotCancelled(selected)
        accountId = selected as string
      }

      const bucketName = `${siteNameStr.toLowerCase().replace(/\s+/g, '-')}-media`
      const siteOrigin = env.NEXT_PUBLIC_SERVER_URL ?? '*'

      s.start(`Provisioning R2 bucket "${bucketName}"...`)
      const r2Creds = await provisionR2(cfTokenStr, accountId, bucketName, siteOrigin, (msg) =>
        s.message(msg),
      )
      s.stop('R2 bucket ready.')

      env.R2_BUCKET = r2Creds.bucketName
      env.R2_ENDPOINT = r2Creds.endpoint
      env.R2_PUBLIC_URL = r2Creds.publicUrl
      env.R2_ACCESS_KEY_ID = r2Creds.accessKeyId
      env.R2_SECRET_ACCESS_KEY = r2Creds.secretAccessKey
      env.R2_ACCOUNT_ID = r2Creds.accountId

      note(
        'R2 S3-compatible credentials (R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY) must be\n' +
        'created manually: CF Dashboard → R2 → Manage R2 API tokens → Create API Token.\n' +
        'Update the placeholder values in .env.local after setup.',
        'Action Required: R2 API Token',
      )
    } catch (err) {
      s.stop('Cloudflare provisioning failed.')
      const message = err instanceof Error ? err.message : String(err)
      note(`Error: ${message}\n\nFalling back to manual setup.`, 'Cloudflare Error')
      printManualR2Instructions(siteNameStr)
    }
  } else {
    printManualR2Instructions(siteNameStr)
  }

  // --- Payload secret ---
  env.PAYLOAD_SECRET = generatePayloadSecret()
  env.NEXT_PUBLIC_SERVER_URL = `http://localhost:3000`

  // --- Write .env.local ---
  const s = spinner()
  try {
    s.start('Writing .env.local...')
    const envPath = await writeEnvFile(targetDir, env)
    s.stop(`.env.local written to ${envPath}`)
  } catch (err) {
    s.stop('.env.local write failed — check directory permissions.')
    const message = err instanceof Error ? err.message : String(err)
    note(`Could not write .env.local: ${message}\nAdd the variables manually.`, 'Env Write Error')
  }

  // --- npm install ---
  const runInstall = await confirm({
    message: 'Run npm install now?',
    initialValue: true,
  })
  assertNotCancelled(runInstall)

  if (runInstall) {
    try {
      s.start('Running npm install...')
      await runNpmInstall(targetDir)
      s.stop('npm install complete.')
    } catch (err) {
      s.stop('npm install failed.')
      const message = err instanceof Error ? err.message : String(err)
      note(`Error: ${message}\nRun "npm install" manually in ${targetDir}`, 'npm install Error')
    }
  }

  // --- Migrations ---
  if (env.DATABASE_URI) {
    const runMigs = await confirm({
      message: 'Run payload migrate now?',
      initialValue: true,
    })
    assertNotCancelled(runMigs)

    if (runMigs) {
      try {
        s.start('Running payload migrate...')
        await runMigrations(targetDir, { ...process.env, ...Object.fromEntries(
          Object.entries(env).filter(([, v]) => v !== undefined) as [string, string][],
        )})
        s.stop('Migrations complete.')
      } catch (err) {
        s.stop('Migrations failed.')
        const message = err instanceof Error ? err.message : String(err)
        note(
          `Error: ${message}\nRun "npx payload migrate" manually in ${targetDir} after updating .env.local`,
          'Migration Error',
        )
      }
    }
  } else {
    note(
      'Skipping migrations — no DATABASE_URI set.\n' +
      'After adding your database credentials to .env.local, run:\n' +
      '  npx payload migrate',
      'Migrations Skipped',
    )
  }

  // --- Success ---
  outro(
    [
      `Your Tree Identity site "${siteNameStr}" is ready!`,
      '',
      '  cd ' + siteNameStr,
      '  npm run dev',
      '',
      'Deploy to Vercel:',
      '  https://vercel.com/new?utm_source=create-tree-id',
      '',
      'Docs: https://github.com/your-org/tree-id#readme',
    ].join('\n'),
  )
}
