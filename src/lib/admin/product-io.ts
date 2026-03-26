/**
 * Product I/O — server-side helpers for reading/writing product YAML configs.
 * Mirrors landing-config-reader.ts pattern for consistency.
 */
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import type { ProductConfig } from './product-types'

const PRODUCTS_DIR = 'src/content/products'

/** List all product configs (metadata for list views) */
export function listProducts(basePath = process.cwd()): Array<{ slug: string; name: string; description?: string; featuresCount: number; icon?: string }> {
  const dir = path.join(basePath, PRODUCTS_DIR)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => {
      const slug = f.replace('.yaml', '')
      const config = readProduct(slug, basePath)
      return config
        ? { slug, name: config.name, description: config.description, featuresCount: config.features?.length ?? 0, icon: config.icon }
        : null
    })
    .filter(Boolean) as Array<{ slug: string; name: string; description?: string; featuresCount: number; icon?: string }>
}

/** Read a single product config by slug */
export function readProduct(slug: string, basePath = process.cwd()): ProductConfig | null {
  const filePath = path.join(basePath, PRODUCTS_DIR, `${slug}.yaml`)
  if (!fs.existsSync(filePath)) return null
  try {
    const raw = yaml.load(fs.readFileSync(filePath, 'utf-8')) as Record<string, unknown>
    return { slug, features: [], coreCollections: [], name: '', ...raw } as ProductConfig
  } catch {
    return null
  }
}

/** Write a product config YAML file */
export function writeProduct(slug: string, config: ProductConfig, basePath = process.cwd()): void {
  const dir = path.join(basePath, PRODUCTS_DIR)
  fs.mkdirSync(dir, { recursive: true })
  const data = { ...config, slug }
  fs.writeFileSync(path.join(dir, `${slug}.yaml`), yaml.dump(data, { lineWidth: 120 }))
}

/** Delete a product config YAML file */
export function deleteProduct(slug: string, basePath = process.cwd()): boolean {
  const filePath = path.join(basePath, PRODUCTS_DIR, `${slug}.yaml`)
  if (!fs.existsSync(filePath)) return false
  fs.unlinkSync(filePath)
  return true
}
