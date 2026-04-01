/**
 * Design extraction utilities for AI clone pipeline.
 * Handles design system extraction, per-section style extraction,
 * scoped CSS generation, and programmatic CSS from section styles.
 */
import { geminiCall, safeJsonParse, type CloneResult } from './clone-ai-utils'
import {
  DESIGN_EXTRACT_PROMPT,
  SECTION_STYLES_PROMPT,
} from './clone-prompts'

/** Separate Gemini call to extract design from HTML/CSS (more accurate than Markdown) */
export async function extractDesign(
  apiKey: string,
  html: string
): Promise<{ design: CloneResult['design']; promptTokens: number; outputTokens: number }> {
  // Keep style tags for design extraction — only strip scripts/SVGs
  const designHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .slice(0, 30_000)
  const { text, promptTokens, outputTokens } = await geminiCall(apiKey, DESIGN_EXTRACT_PROMPT, designHtml, 2048)
  const parsed = safeJsonParse(text) as CloneResult['design'] | null
  return { design: parsed || undefined, promptTokens, outputTokens }
}

/** Separate Gemini call to extract per-section visual styles from HTML/CSS */
export async function extractSectionStyles(
  apiKey: string,
  html: string,
  sections: Array<{ type: string; order: number; data: Record<string, unknown> }>
): Promise<{ styles: Array<{ index: number } & Record<string, unknown>>; promptTokens: number; outputTokens: number }> {
  const designHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .slice(0, 40_000)
  const sectionList = sections.map((s, i) => {
    const heading = String((s.data as any)?.headline || (s.data as any)?.heading || (s.data as any)?.brandName || (s.data as any)?.text || '')
    return `${i}. ${s.type}${heading ? `: "${heading.slice(0, 50)}"` : ''}`
  }).join('\n')
  const userPrompt = `Sections to analyze:\n${sectionList}\n\nHTML with CSS:\n${designHtml}`
  const { text, promptTokens, outputTokens } = await geminiCall(apiKey, SECTION_STYLES_PROMPT, userPrompt, 4096)
  const parsed = safeJsonParse(text) as { styles?: Array<{ index: number } & Record<string, unknown>> } | null
  return { styles: parsed?.styles || [], promptTokens, outputTokens }
}

/** Build scoped CSS blocks from per-section style overrides — reliable, no AI guessing */
export function buildScopedCssFromStyles(sections: CloneResult['sections']): Array<{ selector: string; css: string }> {
  const blocks: Array<{ selector: string; css: string }> = []
  const typeCounts = new Map<string, number>()

  for (const s of sections) {
    const count = (typeCounts.get(s.type) || 0) + 1
    typeCounts.set(s.type, count)
    const sectionId = count === 1 ? `section-${s.type}` : `section-${s.type}-${count}`
    const style = s.style as Record<string, unknown> | undefined
    if (!style) continue

    const rules: string[] = []
    const textColor = style.textColor as string | undefined
    const isDark = textColor && ['#fff', '#ffffff', '#fafafa', 'white'].includes(textColor.toLowerCase())

    // Dark section — override card/glass backgrounds for visibility
    // Colors come from design variables (--lp-primary etc.), not hardcoded here
    if (isDark) {
      rules.push(`.lp-card-hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); }`)
      rules.push(`.glass-card { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); }`)
      rules.push(`.lp-icon-bg { background: rgba(255,255,255,0.1); }`)
    }

    if (rules.length > 0) {
      blocks.push({ selector: `[data-section="${sectionId}"]`, css: rules.join(' ') })
    }
  }
  return blocks
}
