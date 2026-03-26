// Astro content collections — type-safe query API for Keystatic-managed content
// Docs: https://docs.astro.build/en/guides/content-collections/
// Schema must mirror keystatic.config.ts fields so Keystatic writes what Astro reads
import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

// Shared base schema — mirrors baseSeedFields in keystatic.config.ts
const baseSeedSchema = z.object({
  title: z.string(),
  description: z.string(),
  summary: z.string().max(300).optional().nullable(),
  status: z.enum(['draft', 'published']).default('draft'),
  publishedAt: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  category: z.string().optional().nullable(),
  seo: z
    .object({
      focusKeyword: z.string().optional().nullable(),
      seoTitle: z.string().optional().nullable(),
      ogImage: z.string().optional().nullable(),
      noindex: z.boolean().default(false),
    })
    .optional()
    .nullable(),
  seoScore: z.number().optional().nullable(),
  cover: z
    .object({
      url: z.string().optional().nullable(),
      alt: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  video: z
    .object({
      enabled: z.boolean().default(false),
      style: z.enum(['cinematic', 'tutorial', 'vlog']).optional(),
    })
    .optional()
    .nullable(),
  links: z
    .object({
      outbound: z.array(z.string()).default([]),
    })
    .optional()
    .nullable(),
})

// Articles: long-form Markdoc files in src/content/articles/**/index.mdoc
const articles = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: './src/content/articles' }),
  schema: baseSeedSchema,
})

// Notes: short YAML-only entries in src/content/notes/*.yaml
const notes = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/notes' }),
  schema: baseSeedSchema.extend({
    content: z.string().optional().nullable(),
  }),
})

// Records: structured YAML data in src/content/records/*.yaml
const records = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/records' }),
  schema: baseSeedSchema.extend({
    recordType: z.enum(['project', 'product', 'experiment']),
    recordData: z.string().optional().nullable(),
  }),
})

// Categories: taxonomy for organizing content in src/content/categories/*.yaml
const categories = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/categories' }),
  schema: z.object({
    name: z.string(),
    description: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
  }),
})

// Voices: writing voice profiles for AI content generation
const voices = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/voices' }),
  schema: z.object({
    name: z.string(),
    description: z.string().optional().nullable(),
    tone: z.array(z.string()).default(['casual']),
    industry: z.array(z.string()).default(['technology']),
    audience: z.array(z.string()).default(['general']),
    targetReader: z.string().optional().nullable(),
    pronoun: z.string().optional().nullable(),
    language: z.enum(['vi', 'en']).default('vi'),
    samples: z.array(z.object({
      context: z.string().optional().nullable(),
      text: z.string(),
    })).default([]),
    avoid: z.array(z.string()).default([]),
  }),
})

// Landing pages: YAML-configured modular landing pages with section components
const landingPages = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/landing-pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    template: z.string().optional(),
    sections: z.array(z.object({
      type: z.enum(['hero', 'features', 'pricing', 'testimonials', 'faq', 'cta', 'stats', 'how-it-works', 'team', 'logo-wall', 'nav', 'footer', 'video', 'image', 'image-text', 'gallery', 'map', 'rich-text', 'divider', 'countdown', 'contact-form', 'banner', 'layout']),
      order: z.number(),
      enabled: z.boolean().default(true),
      data: z.record(z.unknown()),
    })),
  }),
})

// Templates: pre-built landing page templates with default section configs
const templates = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/templates' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    targetAudience: z.string().optional(),
    previewImage: z.string().optional(),
    sections: z.array(z.object({
      type: z.enum(['hero', 'features', 'pricing', 'testimonials', 'faq', 'cta', 'stats', 'how-it-works', 'team', 'logo-wall', 'nav', 'footer', 'video', 'image', 'image-text', 'gallery', 'map', 'rich-text', 'divider', 'countdown', 'contact-form', 'banner', 'layout']),
      order: z.number(),
      enabled: z.boolean().default(true),
      data: z.record(z.unknown()),
    })),
  }),
})

// Products: product module configs that declare which features and collections each product exposes
const products = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/products' }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    landingPage: z.string().optional(),
    icon: z.string().optional(),
    features: z.array(z.string()).default([]),
    coreCollections: z.array(
      z.enum(['articles', 'notes', 'records', 'categories', 'voices'])
    ).default([]),
    sidebarSections: z.record(z.string()).optional(),
    // Per-product users — scoped to this product's admin only
    users: z.array(z.object({
      username: z.string(),
      password: z.string(),
      role: z.enum(['admin', 'editor']).default('editor'),
    })).optional().default([]),
  }),
})

export const collections = { articles, notes, records, categories, voices, landingPages, templates, products }
