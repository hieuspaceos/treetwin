/**
 * Product API authentication middleware
 * Validates JWT session + product existence + resource access
 * Used by /api/products/[slug]/... endpoints
 */
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import { verifyToken, COOKIE_NAME } from './auth'
import type { ProductConfig } from './product-types'

const PRODUCTS_DIR = 'src/content/products'

/** Result of product access validation */
export interface ProductAuthResult {
  ok: boolean
  product?: ProductConfig
  error?: string
  status?: number
}

/** Read product YAML from disk by slug */
export function readProductConfig(slug: string): ProductConfig | null {
  const filePath = path.join(process.cwd(), PRODUCTS_DIR, `${slug}.yaml`)
  if (!fs.existsSync(filePath)) return null
  try {
    const raw = yaml.load(fs.readFileSync(filePath, 'utf-8')) as Record<string, unknown>
    return { slug, ...raw } as ProductConfig
  } catch {
    return null
  }
}

/**
 * Validate request has access to a product and its resources.
 * Accepts session cookie JWT (admin users) or Authorization Bearer token (product API key).
 */
export async function validateProductAccess(
  request: Request,
  productSlug: string,
): Promise<ProductAuthResult> {
  // 1. Load product config
  const product = readProductConfig(productSlug)
  if (!product) {
    return { ok: false, error: 'Product not found', status: 404 }
  }

  // 2. Validate auth — try cookie JWT first, then Bearer token
  const cookieHeader = request.headers.get('cookie') || ''
  const cookieMatch = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  const cookieToken = cookieMatch ? cookieMatch[1] : null

  const authHeader = request.headers.get('Authorization') || ''
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  // Try JWT session cookie
  if (cookieToken) {
    const payload = await verifyToken(cookieToken)
    if (payload) {
      // Product-scoped JWT: must match the requested product slug
      // Core admin JWT (no `product` field) has full access to any product
      const jwtProduct = payload.product as string | undefined
      if (jwtProduct && jwtProduct !== productSlug) {
        return { ok: false, error: 'Forbidden: product access mismatch', status: 403 }
      }
      return { ok: true, product }
    }
  }

  // Try Bearer token against ADMIN_SECRET or env-configured product API key
  if (bearerToken) {
    const adminSecret = import.meta.env.ADMIN_SECRET || process.env.ADMIN_SECRET
    if (adminSecret && bearerToken === adminSecret) {
      return { ok: true, product }
    }
  }

  return { ok: false, error: 'Unauthorized', status: 401 }
}

/** Check if a collection is in the product's allowed list */
export function isCollectionAllowed(product: ProductConfig, collection: string): boolean {
  return product.coreCollections.includes(collection)
}

/** Check if a feature is in the product's allowed list */
export function isFeatureAllowed(product: ProductConfig, feature: string): boolean {
  return product.features.includes(feature)
}
