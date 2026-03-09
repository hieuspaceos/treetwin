import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import type { Field, CollectionConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { searchPlugin } from '@payloadcms/plugin-search'
import sharp from 'sharp'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Access helpers
const publicRead = () => true
const authOnly = ({ req }: { req: { user?: unknown } }) => Boolean(req?.user)
const writeAccess = { read: publicRead, create: authOnly, update: authOnly, delete: authOnly }

// Hooks — inlined stubs to avoid Payload CLI ESM resolution issues with local .ts imports.
// Canonical typed versions live in ./collections/hooks/*.ts for Next.js runtime use.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const autoSlug = ({ data, operation }: any) => {
  if (operation === 'create' && data?.title && !data?.slug) {
    data.slug = String(data.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }
  return data
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setPublishedAt = ({ data, originalDoc }: any) => {
  if (data.status === 'published' && originalDoc?.status !== 'published') {
    data.publishedAt = new Date().toISOString()
  }
  return data
}

// Stub hooks — full implementations in ./collections/hooks/*.ts for Next.js runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const revalidatePage = ({ doc }: any) => doc
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateVideoManifest = ({ doc }: any) => doc

const contentHooks = {
  beforeValidate: [autoSlug],
  beforeChange: [setPublishedAt],
  afterChange: [revalidatePage, generateVideoManifest],
}

// Base fields — canonical definition in ./collections/fields/base-seed-fields.ts
const baseSeedFields: Field[] = [
  { name: 'title', type: 'text', required: true },
  { name: 'description', type: 'textarea', required: true },
  { name: 'slug', type: 'text', required: true, unique: true, admin: { readOnly: true, position: 'sidebar' } },
  {
    name: 'status', type: 'select',
    options: [{ label: 'Draft', value: 'draft' }, { label: 'Published', value: 'published' }],
    defaultValue: 'draft', required: true,
  },
  { name: 'publishedAt', type: 'date', admin: { readOnly: true, position: 'sidebar' } },
  { name: 'tags', type: 'array', fields: [{ name: 'tag', type: 'text', required: true }] },
  { name: 'category', type: 'text' },
  {
    name: 'seo', type: 'group',
    fields: [{ name: 'seoTitle', type: 'text' }, { name: 'ogImage', type: 'text' }, { name: 'noindex', type: 'checkbox', defaultValue: false }],
  },
  { name: 'cover', type: 'group', fields: [{ name: 'url', type: 'text' }, { name: 'alt', type: 'text' }] },
  {
    name: 'video', type: 'group',
    fields: [
      { name: 'enabled', type: 'checkbox', defaultValue: false },
      {
        name: 'style', type: 'select',
        options: [{ label: 'Cinematic', value: 'cinematic' }, { label: 'Tutorial', value: 'tutorial' }, { label: 'Vlog', value: 'vlog' }],
      },
      {
        name: 'sections', type: 'array',
        fields: [
          { name: 'sectionId', type: 'text', required: true },
          { name: 'timestamp', type: 'text' },
          { name: 'narration', type: 'textarea' },
          { name: 'bRollQuery', type: 'text' },
          { name: 'onScreenText', type: 'text' },
          { name: 'mediaRefs', type: 'array', fields: [{ name: 'ref', type: 'text' }] },
        ],
      },
    ],
  },
  { name: 'links', type: 'group', fields: [{ name: 'outbound', type: 'array', fields: [{ name: 'slug', type: 'text' }] }] },
]

const Users = { slug: 'users', auth: true, admin: { useAsTitle: 'email' }, fields: [] } satisfies CollectionConfig

const Articles = {
  slug: 'articles', admin: { useAsTitle: 'title' }, access: writeAccess,
  fields: [...baseSeedFields, { name: 'content', type: 'richText' as const, editor: lexicalEditor() }],
  hooks: contentHooks,
} satisfies CollectionConfig

const Notes = {
  slug: 'notes', admin: { useAsTitle: 'title' }, access: writeAccess,
  fields: [...baseSeedFields, { name: 'content', type: 'textarea' as const }],
  hooks: contentHooks,
} satisfies CollectionConfig

const Records = {
  slug: 'records', admin: { useAsTitle: 'title' }, access: writeAccess,
  fields: [
    ...baseSeedFields,
    { name: 'recordType', type: 'select' as const, options: ['project', 'product', 'experiment'], required: true },
    { name: 'recordData', type: 'json' as const },
  ],
  hooks: contentHooks,
} satisfies CollectionConfig

const Media = {
  slug: 'media', upload: true, access: writeAccess,
  fields: [{ name: 'alt', type: 'text' as const, required: true }],
} satisfies CollectionConfig

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  secret: process.env.PAYLOAD_SECRET || '',

  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },

  collections: [Users, Articles, Notes, Records, Media],

  editor: lexicalEditor(),

  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL },
  }),

  plugins: [
    searchPlugin({ collections: ['articles', 'notes'] }),
    s3Storage({
      collections: { media: true },
      bucket: process.env.R2_BUCKET || '',
      config: {
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        region: process.env.R2_REGION || 'auto',
        endpoint: `https://${process.env.R2_ENDPOINT || 'placeholder.r2.cloudflarestorage.com'}`,
      },
    }),
  ],

  sharp,

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
