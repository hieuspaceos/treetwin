/**
 * Feature registry — central registry for optional admin features.
 * Each feature declares routes, nav items, and metadata.
 * Admin layout + sidebar consume this to dynamically render features.
 * Features default to enabled when enabledFeatures key is missing (backward compat).
 */
import type { ComponentType } from 'react'
import type { ProductConfig } from './product-types'

export interface FeatureNavItem {
  href: string
  label: string
  iconKey: string
}

export interface FeatureRoute {
  path: string
  /** Lazy import returning a React component */
  component: () => Promise<{ default: ComponentType<any> }>
}

export interface FeatureModule {
  id: string
  label: string
  description: string
  section: 'content' | 'assets' | 'marketing' | 'system'
  iconKey: string
  /** Env var names to check — shown in settings integration panel */
  envCheck?: string[]
  routes: FeatureRoute[]
  navItems: FeatureNavItem[]
}

export type EnabledFeaturesMap = Record<string, boolean>

/** Core collection definition — registered here so product configs can filter them */
export interface CoreCollectionDef {
  id: string
  label: string
  iconKey: string
  routes: { list: string; new: string; edit: string }
}

/** All core content collections in the system */
export const CORE_COLLECTIONS: CoreCollectionDef[] = [
  { id: 'articles', label: 'Articles', iconKey: 'fileText', routes: { list: '/articles', new: '/articles/new', edit: '/articles/:slug' } },
  { id: 'notes', label: 'Notes', iconKey: 'stickyNote', routes: { list: '/notes', new: '/notes/new', edit: '/notes/:slug' } },
  { id: 'categories', label: 'Categories', iconKey: 'folder', routes: { list: '/categories', new: '/categories/new', edit: '/categories/:slug' } },
]

/** Get core collections available in product context — no product = all collections (core admin) */
export function getProductCoreCollections(product?: ProductConfig): CoreCollectionDef[] {
  if (!product) return CORE_COLLECTIONS
  return CORE_COLLECTIONS.filter((c) => product.coreCollections.includes(c.id))
}

/** All optional features registered in the system */
export const FEATURE_MODULES: FeatureModule[] = [
  {
    id: 'voices',
    label: 'Writing Voices',
    description: 'AI writing voice profiles for content creation',
    section: 'content',
    iconKey: 'userPen',
    envCheck: ['GEMINI_API_KEY'],
    routes: [], // collection-based — handled inline in admin-layout
    navItems: [{ href: '/voices', label: 'Voices', iconKey: 'userPen' }],
  },
  {
    id: 'translations',
    label: 'Translations',
    description: 'i18n translation management',
    section: 'content',
    iconKey: 'globe',
    routes: [
      {
        path: '/translations',
        component: () =>
          import('@/components/admin/admin-translations-page').then((m) => ({
            default: m.AdminTranslationsPage,
          })),
      },
    ],
    navItems: [{ href: '/translations', label: 'Translations', iconKey: 'globe' }],
  },
  {
    id: 'media',
    label: 'Media Library',
    description: 'Image and file uploads via Cloudflare R2',
    section: 'assets',
    iconKey: 'image',
    envCheck: ['R2_ACCESS_KEY_ID'],
    routes: [
      {
        path: '/media',
        component: () =>
          import('@/components/admin/media-browser').then((m) => ({
            default: m.MediaBrowser,
          })),
      },
    ],
    navItems: [{ href: '/media', label: 'Media', iconKey: 'image' }],
  },
  {
    id: 'distribution',
    label: 'Distribution',
    description: 'Social media content distribution & scheduling',
    section: 'marketing',
    iconKey: 'megaphone',
    envCheck: ['GEMINI_API_KEY'],
    routes: [
      {
        path: '/marketing',
        component: () =>
          import('@/components/admin/marketing-dashboard').then((m) => ({
            default: m.MarketingDashboard,
          })),
      },
    ],
    navItems: [{ href: '/marketing', label: 'Distribution', iconKey: 'megaphone' }],
  },
  {
    id: 'email',
    label: 'Email & Subscribers',
    description: 'Newsletter subscriber management & broadcast',
    section: 'marketing',
    iconKey: 'mail',
    envCheck: ['RESEND_API_KEY'],
    routes: [
      {
        path: '/subscribers',
        component: () =>
          import('@/components/admin/admin-subscribers-page').then((m) => ({
            default: m.AdminSubscribersPage,
          })),
      },
    ],
    navItems: [{ href: '/subscribers', label: 'Subscribers', iconKey: 'mail' }],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Google Analytics 4 dashboard',
    section: 'marketing',
    iconKey: 'chart',
    envCheck: ['GA_MEASUREMENT_ID'],
    routes: [
      {
        path: '/analytics',
        component: () =>
          import('@/components/admin/admin-analytics-page').then((m) => ({
            default: m.AdminAnalyticsPage,
          })),
      },
    ],
    navItems: [{ href: '/analytics', label: 'Analytics', iconKey: 'chart' }],
  },
  {
    id: 'goclaw',
    label: 'GoClaw API',
    description: 'External agent API adapter endpoints',
    section: 'system',
    iconKey: 'database',
    envCheck: ['GOCLAW_API_KEY'],
    routes: [],
    navItems: [],
  },
  {
    id: 'landing',
    label: 'Landing Pages',
    description: 'Visual landing page builder with sections',
    section: 'content',
    iconKey: 'layout',
    routes: [
      {
        path: '/landing',
        component: () =>
          import('@/components/admin/landing/landing-pages-list').then((m) => ({
            default: m.LandingPagesList,
          })),
      },
    ],
    navItems: [{ href: '/landing', label: 'Landing Pages', iconKey: 'layout' }],
  },
  {
    id: 'entities',
    label: 'Custom Entities',
    description: 'Define and manage custom data entities',
    section: 'content',
    iconKey: 'database',
    routes: [
      {
        path: '/entities',
        component: () =>
          import('@/components/admin/entities/entity-definitions-page').then((m) => ({
            default: m.EntityDefinitionsPage,
          })),
      },
    ],
    navItems: [{ href: '/entities', label: 'Entities', iconKey: 'database' }],
  },
  {
    id: 'setup-wizard',
    label: 'AI Setup Wizard',
    description: 'Generate landing pages with Gemini Flash AI',
    section: 'system',
    iconKey: 'sparkles',
    envCheck: ['GEMINI_API_KEY'],
    routes: [],
    navItems: [],
  },
  {
    id: 'feature-builder',
    label: 'Feature Builder',
    description: 'AI-assisted feature module generator',
    section: 'system',
    iconKey: 'sparkles',
    envCheck: ['GEMINI_API_KEY'],
    routes: [
      {
        path: '/feature-builder',
        component: () =>
          import('@/components/admin/feature-builder/feature-builder-wizard').then((m) => ({
            default: m.FeatureBuilderWizard,
          })),
      },
    ],
    navItems: [{ href: '/feature-builder', label: 'Feature Builder', iconKey: 'sparkles' }],
  },
]

/** Check if feature enabled — defaults true when key missing (backward compat) */
export function isFeatureEnabled(
  featureId: string,
  enabledFeatures?: EnabledFeaturesMap
): boolean {
  if (!enabledFeatures) return true
  return enabledFeatures[featureId] !== false
}

export function getFeatureById(id: string): FeatureModule | undefined {
  return FEATURE_MODULES.find((f) => f.id === id)
}

export function getEnabledFeatures(enabledFeatures?: EnabledFeaturesMap): FeatureModule[] {
  return FEATURE_MODULES.filter((f) => isFeatureEnabled(f.id, enabledFeatures))
}

/** Group enabled features by section for sidebar rendering */
export function getFeaturesBySection(enabledFeatures?: EnabledFeaturesMap) {
  const enabled = getEnabledFeatures(enabledFeatures)
  return {
    content: enabled.filter((f) => f.section === 'content'),
    assets: enabled.filter((f) => f.section === 'assets'),
    marketing: enabled.filter((f) => f.section === 'marketing'),
    system: enabled.filter((f) => f.section === 'system'),
  }
}

/** Filter features to those included in a product config */
export function getProductFeatures(
  product: ProductConfig,
  enabledFeatures?: EnabledFeaturesMap
): FeatureModule[] {
  return FEATURE_MODULES.filter(
    (f) => product.features.includes(f.id) && isFeatureEnabled(f.id, enabledFeatures)
  )
}

/** Check if a feature is available in product context — no product = everything allowed */
export function isFeatureInProduct(featureId: string, product?: ProductConfig): boolean {
  if (!product) return true
  return product.features.includes(featureId)
}

/** Check if a core collection is available in product context — no product = everything allowed */
export function isCollectionInProduct(collection: string, product?: ProductConfig): boolean {
  if (!product) return true
  return product.coreCollections.includes(collection)
}

/** Get features by section, filtered by product */
export function getProductFeaturesBySection(
  product: ProductConfig,
  enabledFeatures?: EnabledFeaturesMap
) {
  const productFeatures = getProductFeatures(product, enabledFeatures)
  return {
    content: productFeatures.filter((f) => f.section === 'content'),
    assets: productFeatures.filter((f) => f.section === 'assets'),
    marketing: productFeatures.filter((f) => f.section === 'marketing'),
    system: productFeatures.filter((f) => f.section === 'system'),
  }
}
