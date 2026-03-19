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
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'array' | 'object' | 'markdoc' | 'dynamic-select' | 'color'
  label: string
  required?: boolean
  options?: FieldOption[]
  fields?: FieldSchema[] // for object type
  defaultValue?: unknown
  mediaBrowse?: boolean // show "Browse Media" button for URL fields
  apiEndpoint?: string // for dynamic-select: fetch options from this API
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
  {
    name: 'category',
    type: 'dynamic-select',
    label: 'Category',
    apiEndpoint: '/api/admin/collections/categories',
  },
  {
    name: 'seo',
    type: 'object',
    label: 'SEO',
    fields: [
      { name: 'focusKeyword', type: 'text', label: 'Focus Keyword' },
      { name: 'seoTitle', type: 'text', label: 'SEO Title' },
      { name: 'ogImage', type: 'text', label: 'OG Image URL', mediaBrowse: true },
      { name: 'noindex', type: 'checkbox', label: 'No Index' },
    ],
  },
  {
    name: 'cover',
    type: 'object',
    label: 'Cover Image',
    fields: [
      { name: 'url', type: 'text', label: 'Cover URL', mediaBrowse: true },
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
  categories: [
    { name: 'name', type: 'text', label: 'Name', required: true },
    { name: 'description', type: 'textarea', label: 'Description' },
    { name: 'color', type: 'color', label: 'Color' },
  ],
  voices: [
    { name: 'name', type: 'text', label: 'Voice Name', required: true },
    { name: 'description', type: 'textarea', label: 'Description (when to use this voice)' },
    {
      name: 'tone', type: 'select', label: 'Tone',
      options: [
        { label: 'Casual (blog, personal)', value: 'casual' },
        { label: 'Professional (business)', value: 'professional' },
        { label: 'Technical (tutorial, docs)', value: 'technical' },
        { label: 'Storytelling (narrative)', value: 'storytelling' },
        { label: 'Persuasive (sales, marketing)', value: 'persuasive' },
        { label: 'Academic (research, formal)', value: 'academic' },
      ],
      defaultValue: 'casual',
    },
    {
      name: 'industry', type: 'select', label: 'Industry / Topic',
      options: [
        { label: 'Technology', value: 'technology' },
        { label: 'Business', value: 'business' },
        { label: 'Travel', value: 'travel' },
        { label: 'Lifestyle', value: 'lifestyle' },
        { label: 'Finance', value: 'finance' },
        { label: 'Health', value: 'health' },
        { label: 'Education', value: 'education' },
        { label: 'Food', value: 'food' },
        { label: 'General', value: 'general' },
      ],
      defaultValue: 'technology',
    },
    {
      name: 'audience', type: 'select', label: 'Target Audience',
      options: [
        { label: 'Junior Developer', value: 'junior-dev' },
        { label: 'Senior Developer', value: 'senior-dev' },
        { label: 'Non-technical', value: 'non-tech' },
        { label: 'Students', value: 'students' },
        { label: 'Business / Management', value: 'business' },
        { label: 'General Public', value: 'general' },
      ],
      defaultValue: 'general',
    },
    { name: 'targetReader', type: 'textarea', label: 'Target Reader (describe who reads this)' },
    { name: 'pronoun', type: 'text', label: 'First Person Pronoun (e.g. "tôi", "I", "we")' },
    {
      name: 'language', type: 'select', label: 'Primary Language',
      options: [
        { label: 'Tiếng Việt', value: 'vi' },
        { label: 'English', value: 'en' },
      ],
      defaultValue: 'vi',
    },
    { name: 'samples', type: 'array', label: 'Sample Paragraphs' },
    { name: 'avoid', type: 'array', label: 'Phrases to Avoid' },
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
    {
      name: 'activeVoice',
      type: 'dynamic-select',
      label: 'Active Writing Voice',
      apiEndpoint: '/api/admin/collections/voices',
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
