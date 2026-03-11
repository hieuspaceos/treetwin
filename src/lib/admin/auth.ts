/**
 * Admin authentication — PBKDF2 password hashing + JWT session tokens
 * Uses Web Crypto API (works in Node.js 18+ and Vercel Edge)
 */
import { SignJWT, jwtVerify } from 'jose'

// Cookie config
export const COOKIE_NAME = 'admin_session'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

/** Derive a 256-bit key from ADMIN_SECRET env var for JWT signing */
function getSecret(): Uint8Array {
  const secret = import.meta.env.ADMIN_SECRET || process.env.ADMIN_SECRET
  if (!secret) throw new Error('ADMIN_SECRET env var is required')
  return new TextEncoder().encode(secret)
}

/** Hash a plaintext password with PBKDF2 (SHA-256, 100k iterations) */
export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(plain),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    key,
    256,
  )
  const hashHex = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `${saltHex}:${hashHex}`
}

/** Verify plaintext against a PBKDF2 hash string (salt:hash) */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [saltHex, expectedHash] = stored.split(':')
  if (!saltHex || !expectedHash) return false

  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)))
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(plain),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    key,
    256,
  )
  const actualHash = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return actualHash === expectedHash
}

/**
 * Compare plaintext against ADMIN_PASSWORD env var.
 * If ADMIN_PASSWORD_HASH is set, verifies against stored hash.
 * Otherwise, does direct string comparison (simple mode).
 */
export async function checkAdminPassword(plain: string): Promise<boolean> {
  const hash = import.meta.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD_HASH
  if (hash) {
    return verifyPassword(plain, hash)
  }
  // Simple mode: constant-time comparison against ADMIN_PASSWORD
  const password = import.meta.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD
  if (!password) return false
  const a = new TextEncoder().encode(plain)
  const b = new TextEncoder().encode(password)
  if (a.length !== b.length) return false
  // Use subtle crypto for timing-safe compare
  const key = await crypto.subtle.importKey('raw', a, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, b)
  const expected = await crypto.subtle.sign('HMAC', key, a)
  const sigArr = new Uint8Array(sig)
  const expArr = new Uint8Array(expected)
  let diff = 0
  for (let i = 0; i < sigArr.length; i++) diff |= sigArr[i] ^ expArr[i]
  return diff === 0
}

/** Sign a JWT token with 7-day expiration */
export async function signToken(payload: Record<string, unknown> = {}): Promise<string> {
  return new SignJWT({ ...payload, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

/** Verify a JWT token, returns payload or null if invalid/expired */
export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as Record<string, unknown>
  } catch {
    return null
  }
}

/** Build Set-Cookie header value for admin session */
export function buildSessionCookie(token: string): string {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Strict`,
    `Max-Age=${COOKIE_MAX_AGE}`,
  ]
  // Add Secure flag in production
  if (import.meta.env.PROD) parts.push('Secure')
  return parts.join('; ')
}

/** Build Set-Cookie header value to clear admin session */
export function buildClearCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
}
