/**
 * Runs npm install and payload migrations in the target project directory
 * Uses Node.js child_process.spawn for real-time stdio passthrough
 */

import { spawn } from 'node:child_process'

const DEFAULT_TIMEOUT_MS = 60_000

/** Spawn a command and wait for it to finish, with optional timeout */
function spawnAsync(
  cmd: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv = process.env,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      env,
      stdio: 'inherit',
      // Use shell on Windows so npm/npx resolve correctly
      shell: process.platform === 'win32',
    })

    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error(`Command "${cmd} ${args.join(' ')}" timed out after ${timeoutMs / 1000}s`))
    }, timeoutMs)

    child.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command "${cmd} ${args.join(' ')}" exited with code ${code}`))
      }
    })

    child.on('error', (err) => {
      clearTimeout(timer)
      reject(new Error(`Failed to spawn "${cmd}": ${err.message}`))
    })
  })
}

/** Run npm install in the target directory */
export async function runNpmInstall(targetDir: string): Promise<void> {
  await spawnAsync('npm', ['install'], targetDir, process.env, 120_000)
}

/** Run npx payload migrate in the target directory with the given env */
export async function runMigrations(
  targetDir: string,
  env: NodeJS.ProcessEnv,
): Promise<void> {
  await spawnAsync('npx', ['payload', 'migrate'], targetDir, env, DEFAULT_TIMEOUT_MS)
}
