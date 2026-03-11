/**
 * Schema registry — maps collection/singleton names to field definitions
 * Derived from keystatic.config.ts baseSeedFields + collection-specific fields
 */

export interface FieldOption {
  label: string
  value: string
}

export interface FieldSchema {
  name: string
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'array' | 'object' | 'markdoc'
  label: string
  required?: boolean
  options?: FieldOption[]
  fields?: FieldSchema[] // for object type
  defaultValue?: unknown
}

/** Shared seed fields (mirrors baseSeedFields in keystatic.config.ts) */
const baseSeedFields: FieldSchema[] = [
  { name: 'description', type: 'textarea', label: 'Description', required: true },
  { name: 'summary', type: 'textarea', label: 'AI Summary (max 300 chars)' },
  {
    name: 'status',
    type: 'select',
    label: 'Status',
    options: [
      { label: 'Draft', value: 'draft' },
      { label: 'Published', value: 'published' },
    ],
    defaultValue: 'draft',
  },
  { name: 'publishedAt', type: 'date', label: 'Published At' },
  { name: 'tags', type: 'array', label: 'Tags' },
  { name: 'category', type: 'text', label: 'Category' },
  {
    name: 'seo',
    type: 'object',
    label: 'SEO',
    fields: [
      { name: 'seoTitle', type: 'text', label: 'SEO Title' },
      { name: 'ogImage', type: 'text', label: 'OG Image URL' },
      { name: 'noindex', type: 'checkbox', label: 'No Index' },
    ],
  },
  {
    name: 'cover',
    type: 'object',
    label: 'Cover Image',
    fields: [
      { name: 'url', type: 'text', label: 'Cover URL' },
      { name: 'alt', type: 'text', label: 'Cover Alt Text' },
    ],
  },
  {
    name: 'video',
    type: 'object',
    label: 'Video Factory',
    fields: [
      { name: 'enabled', type: 'checkbox', label: 'Video Enabled' },
      {
        name: 'style',
        type: 'select',
        label: 'Style',
        options: [
          { label: 'Cinematic', value: 'cinematic' },
          { label: 'Tutorial', value: 'tutorial' },
          { label: 'Vlog', value: 'vlog' },
        ],
        defaultValue: 'cinematic',
      },
    ],
  },
  {
    name: 'links',
    type: 'object',
    label: 'Links',
    fields: [{ name: 'outbound', type: 'array', label: 'Outbound Links' }],
  },
]

/** Schema definitions per collection */
export const collectionSchemas: Record<string, FieldSchema[]> = {
  articles: [
    { name: 'title', type: 'text', label: 'Title', required: true },
    ...baseSeedFields,
    { name: 'content', type: 'markdoc', label: 'Content' },
  ],
  notes: [
    { name: 'title', type: 'text', label: 'Title', required: true },
    ...baseSeedFields,
    { name: 'content', type: 'textarea', label: 'Content' },
  ],
  records: [
    { name: 'title', type: 'text', label: 'Title', required: true },
    ...baseSeedFields,
    {
      name: 'recordType',
      type: 'select',
      label: 'Record Type',
      options: [
        { label: 'Project', value: 'project' },
        { label: 'Product', value: 'product' },
        { label: 'Experiment', value: 'experiment' },
      ],
      defaultValue: 'project',
    },
    { name: 'recordData', type: 'textarea', label: 'Record Data (JSON)' },
  ],
}

/** Schema definitions per singleton */
export const singletonSchemas: Record<string, FieldSchema[]> = {
  'site-settings': [
    {
      name: 'themeId',
      type: 'select',
      label: 'Frontend Theme',
      options: [{ label: 'Liquid Glass', value: 'liquid-glass' }],
      defaultValue: 'liquid-glass',
    },
  ],
}

/** Get field schema for a collection */
export function getSchemaForCollection(name: string): FieldSchema[] {
  return collectionSchemas[name] || []
}

/** Get field schema for a singleton */
export function getSchemaForSingleton(name: string): FieldSchema[] {
  return singletonSchemas[name] || []
}
