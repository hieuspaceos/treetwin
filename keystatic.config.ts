// Keystatic CMS configuration — collections mirror Payload CMS content model
// Docs: https://keystatic.com/docs/configuration
import { config, collection, singleton, fields } from '@keystatic/core'

// Shared seed fields — applies to all content types (articles, notes, records)
// Mirrors base-seed-fields from the previous Payload CMS schema
const baseSeedFields = {
  status: fields.select({
    label: 'Status',
    options: [
      { label: 'Draft', value: 'draft' },
      { label: 'Published', value: 'published' },
    ],
    defaultValue: 'draft',
  }),
  description: fields.text({
    label: 'Description',
    multiline: true,
    validation: { isRequired: true },
  }),
  publishedAt: fields.date({ label: 'Published At' }),
  tags: fields.array(fields.text({ label: 'Tag' }), {
    label: 'Tags',
    itemLabel: (props) => props.value,
  }),
  category: fields.text({ label: 'Category' }),
  seo: fields.object(
    {
      seoTitle: fields.text({ label: 'SEO Title' }),
      ogImage: fields.text({ label: 'OG Image URL' }),
      noindex: fields.checkbox({ label: 'No Index', defaultValue: false }),
    },
    { label: 'SEO' },
  ),
  cover: fields.object(
    {
      url: fields.text({ label: 'Cover URL' }),
      alt: fields.text({ label: 'Cover Alt Text' }),
    },
    { label: 'Cover Image' },
  ),
  video: fields.object(
    {
      enabled: fields.checkbox({ label: 'Video Enabled', defaultValue: false }),
      style: fields.select({
        label: 'Style',
        options: [
          { label: 'Cinematic', value: 'cinematic' },
          { label: 'Tutorial', value: 'tutorial' },
          { label: 'Vlog', value: 'vlog' },
        ],
        defaultValue: 'cinematic',
      }),
    },
    { label: 'Video Factory' },
  ),
  links: fields.object(
    {
      outbound: fields.array(fields.text({ label: 'Slug' }), {
        label: 'Outbound Links',
        itemLabel: (props) => props.value,
      }),
    },
    { label: 'Links' },
  ),
}

// Use GitHub storage on production (CTV can edit via web), local in dev
const isProduction = import.meta.env.PROD

export default config({
  storage: isProduction
    ? { kind: 'github', repo: 'hieuspaceos/tree-id' }
    : { kind: 'local' },
  collections: {
    // Articles: long-form Markdoc content (replaces Payload Lexical richText)
    articles: collection({
      label: 'Articles',
      slugField: 'title',
      path: 'src/content/articles/*/',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({
          name: { label: 'Title', validation: { isRequired: true } },
        }),
        ...baseSeedFields,
        content: fields.markdoc({ label: 'Content' }),
      },
    }),
    // Notes: short YAML-only entries (content as frontmatter field, no Markdoc body)
    notes: collection({
      label: 'Notes',
      slugField: 'title',
      path: 'src/content/notes/*',
      format: { data: 'yaml' },
      schema: {
        title: fields.slug({
          name: { label: 'Title', validation: { isRequired: true } },
        }),
        ...baseSeedFields,
        content: fields.text({ label: 'Content', multiline: true }),
      },
    }),
    // Records: structured YAML data (projects, products, experiments)
    records: collection({
      label: 'Records',
      slugField: 'title',
      path: 'src/content/records/*',
      format: { data: 'yaml' },
      schema: {
        title: fields.slug({
          name: { label: 'Title', validation: { isRequired: true } },
        }),
        ...baseSeedFields,
        recordType: fields.select({
          label: 'Record Type',
          options: [
            { label: 'Project', value: 'project' },
            { label: 'Product', value: 'product' },
            { label: 'Experiment', value: 'experiment' },
          ],
          defaultValue: 'project',
        }),
        recordData: fields.text({
          label: 'Record Data (JSON)',
          multiline: true,
        }),
      },
    }),
  },
  singletons: {
    // Site Settings: global config stored as YAML (was DB row in Payload)
    siteSettings: singleton({
      label: 'Site Settings',
      path: 'src/content/site-settings',
      format: { data: 'yaml' },
      schema: {
        themeId: fields.select({
          label: 'Frontend Theme',
          options: [{ label: 'Liquid Glass', value: 'liquid-glass' }],
          defaultValue: 'liquid-glass',
        }),
      },
    }),
  },
})
