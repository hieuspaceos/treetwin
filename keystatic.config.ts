// Keystatic CMS configuration — collections mirror Payload CMS content model
// Docs: https://keystatic.com/docs/configuration
import { config, collection, singleton, fields } from '@keystatic/core'

// Shared seed fields — applies to all content types (articles, notes, records)
// Mirrors base-seed-fields from the previous Payload CMS schema
const baseSeedFields = {
  summary: fields.text({
    label: 'AI Summary',
    description: 'Optional short summary for AI discovery (max 300 chars). Falls back to description if empty.',
    multiline: true,
    validation: { isRequired: false },
  }),
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
      focusKeyword: fields.text({ label: 'Focus Keyword' }),
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
    // Categories: taxonomy for organizing content
    categories: collection({
      label: 'Categories',
      slugField: 'name',
      path: 'src/content/categories/*',
      format: { data: 'yaml' },
      schema: {
        name: fields.slug({
          name: { label: 'Name', validation: { isRequired: true } },
        }),
        description: fields.text({ label: 'Description', multiline: true }),
        color: fields.text({ label: 'Color (hex)', validation: { isRequired: false } }),
      },
    }),
    // Voices: writing voice profiles for AI content generation
    voices: collection({
      label: 'Writing Voices',
      slugField: 'name',
      path: 'src/content/voices/*',
      format: { data: 'yaml' },
      schema: {
        name: fields.slug({
          name: { label: 'Voice Name', validation: { isRequired: true } },
        }),
        description: fields.text({ label: 'Description (when to use this voice)', multiline: true }),
        tone: fields.select({
          label: 'Tone',
          options: [
            { label: 'Casual (blog, personal)', value: 'casual' },
            { label: 'Professional (business, corporate)', value: 'professional' },
            { label: 'Technical (tutorial, documentation)', value: 'technical' },
            { label: 'Storytelling (narrative, engaging)', value: 'storytelling' },
            { label: 'Persuasive (sales, marketing)', value: 'persuasive' },
            { label: 'Academic (research, formal)', value: 'academic' },
          ],
          defaultValue: 'casual',
        }),
        industry: fields.select({
          label: 'Industry / Topic',
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
        }),
        audience: fields.select({
          label: 'Target Audience',
          options: [
            { label: 'Junior Developer', value: 'junior-dev' },
            { label: 'Senior Developer', value: 'senior-dev' },
            { label: 'Non-technical', value: 'non-tech' },
            { label: 'Students', value: 'students' },
            { label: 'Business / Management', value: 'business' },
            { label: 'General Public', value: 'general' },
          ],
          defaultValue: 'general',
        }),
        targetReader: fields.text({
          label: 'Target Reader (describe who reads this)',
          description: 'E.g. "Nam 25-35 tuổi, developer Việt Nam, thích đọc Hacker News" or "Female office workers interested in productivity"',
          multiline: true,
        }),
        pronoun: fields.text({ label: 'First Person Pronoun (e.g. "tôi", "I", "we")' }),
        language: fields.select({
          label: 'Primary Language',
          options: [
            { label: 'Tiếng Việt', value: 'vi' },
            { label: 'English', value: 'en' },
          ],
          defaultValue: 'vi',
        }),
        samples: fields.array(
          fields.object({
            context: fields.text({ label: 'Context (e.g. "tech tutorial", "opinion piece")' }),
            text: fields.text({ label: 'Sample Paragraph', multiline: true }),
          }),
          { label: 'Sample Paragraphs', itemLabel: (props) => props.fields.context.value || 'Sample' },
        ),
        avoid: fields.array(fields.text({ label: 'Phrase' }), {
          label: 'Phrases to Avoid',
          itemLabel: (props) => props.value,
        }),
      },
    }),
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
        seoScore: fields.integer({ label: 'SEO Score', validation: { isRequired: false } }),
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
