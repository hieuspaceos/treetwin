/**
 * Distribution post generator — calls Gemini Flash to generate social posts
 * Ported from scripts/distribute-content.py to TypeScript for admin UI use
 * Requires GEMINI_API_KEY env var
 */
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getContentIO } from './content-io'
import type { CollectionName } from './validation'

export interface SocialPost {
  platform: string
  content: string
}

const GEMINI_MODEL = 'gemini-2.5-flash'

/** Load brand rules from content-distribution.md */
async function loadBrandRules(): Promise<string> {
  try {
    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    const rulesPath = path.resolve('.claude/rules/content-distribution.md')
    return await fs.readFile(rulesPath, 'utf-8')
  } catch {
    return ''
  }
}

export type LanguageOption = 'auto' | 'vi' | 'en'

/** All available platforms for distribution */
export const ALL_PLATFORMS = [
  'Twitter/X', 'LinkedIn', 'Facebook', 'Reddit', 'Threads',
  'Hacker News', 'Dev.to', 'Hashnode', 'Medium', 'Viblo', 'Substack',
] as const

/** Build Gemini prompt for social post generation */
function buildPrompt(
  articleContent: string,
  contentType: string,
  slug: string,
  siteUrl: string,
  language: LanguageOption = 'auto',
  selectedPlatforms?: string[],
): string {
  const url = contentType === 'article'
    ? `${siteUrl}/seeds/${slug}`
    : `${siteUrl}/notes/${slug}`

  // Use selected platforms or default based on language
  let platformList: string[]
  if (selectedPlatforms && selectedPlatforms.length > 0) {
    platformList = selectedPlatforms
  } else {
    platformList = language === 'en'
      ? ALL_PLATFORMS.filter((p) => p !== 'Viblo') as unknown as string[]
      : [...ALL_PLATFORMS]
  }
  const platforms = platformList.join(', ')

  // Language instruction
  const languageInstruction = language === 'vi'
    ? 'Generate ALL posts in Vietnamese.'
    : language === 'en'
      ? 'Generate ALL posts in English.'
      : 'Match the language of the original content (Vietnamese → Vietnamese posts, English → English posts).'

  return `Generate social media posts for this ${contentType}.

Article URL: ${url}

Content:
---
${articleContent}
---

Generate posts for these platforms: ${platforms}.
Follow the brand voice rules and output format from your system prompt.
Use the article URL as-is. Do NOT append UTM parameters or query strings to the URL.
${languageInstruction}

IMPORTANT: Return your response as a valid JSON array of objects with "platform" and "content" keys.
Example: [{"platform":"Twitter/X","content":"..."},{"platform":"LinkedIn","content":"..."}]
Return ONLY the JSON array, no other text.`
}

/** Generate social posts via Gemini Flash API */
export async function generateSocialPosts(
  collection: string,
  slug: string,
  language: LanguageOption = 'auto',
  selectedPlatforms?: string[],
): Promise<SocialPost[]> {
  const apiKey = import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured. Set it in environment variables.')
  }

  // Read content via content-io
  const io = getContentIO()
  const entry = await io.readEntry(collection as CollectionName, slug)
  if (!entry) {
    throw new Error(`Content not found: ${collection}/${slug}`)
  }

  const contentType = collection === 'articles' ? 'article' : 'note'
  const articleContent = entry.content
    ? `${entry.title}\n\n${entry.content}`
    : `${entry.title}\n\n${entry.description || ''}`

  const siteUrl = import.meta.env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || 'https://tree-id.dev'

  // Load brand rules as system instruction
  const systemPrompt = await loadBrandRules()
  const userPrompt = buildPrompt(articleContent, contentType, slug, siteUrl, language, selectedPlatforms)

  // Call Gemini
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt || undefined,
  })

  const result = await model.generateContent(userPrompt)
  const text = result.response.text()

  // Parse JSON response — strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
  try {
    const posts = JSON.parse(cleaned) as SocialPost[]
    if (!Array.isArray(posts)) throw new Error('Expected array')
    return posts.map((p) => ({
      platform: String(p.platform || 'Unknown'),
      content: String(p.content || ''),
    }))
  } catch {
    // Fallback: return raw text as single post
    return [{ platform: 'Raw Output', content: text }]
  }
}
