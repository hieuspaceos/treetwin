/**
 * Product module types — defines a product config with its feature subset and content access.
 * Products are YAML-configured modules (src/content/products/*.yaml) that declare
 * which features and core collections they expose in the admin sidebar.
 */

/** Per-product user entry — scoped to a single product's admin */
export interface ProductUser {
  username: string
  password: string
  role: string
}

/** Product config — defines a product module with its feature subset and user access */
export interface ProductConfig {
  /** URL-safe identifier, used as admin route prefix (e.g. /landing-page-builder/admin) */
  slug: string
  /** Display name shown in the admin UI */
  name: string
  /** Short description of the product's purpose */
  description?: string
  /** Ref to landing-pages/*.yaml slug — links product to its public landing page */
  landingPage?: string
  /** Sidebar icon key from admin icon registry (e.g. 'layout', 'fileText') */
  icon?: string
  /** Feature registry IDs to enable for this product (e.g. 'landing', 'media', 'voices') */
  features: string[]
  /** Core Astro content collections to include: 'articles' | 'notes' | 'records' | 'categories' | 'voices' */
  coreCollections: string[]
  /** Override sidebar section labels — keys are section IDs, values are display labels */
  sidebarSections?: Record<string, string>
  /** Per-product users — can only access this product's admin (not core admin) */
  users?: ProductUser[]
}
