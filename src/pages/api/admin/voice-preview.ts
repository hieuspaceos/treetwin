/**
 * Voice preview endpoint — generates 1-2 short paragraphs using a voice profile
 * POST /api/admin/voice-preview
 * Minimal token usage: only sends voice metadata + article title (no full content)
 */
import type { APIRoute } from 'astro'

export const prerender = false

const GEMINI_MODEL = import.meta.env.GEMINI_MODEL || 'gemini-2.5-flash'

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.GEMINI_API_KEY
  if (!apiKey) {
    return json({ ok: false, error: 'GEMINI_API_KEY not configured' }, 400)
  }

  try {
    const { voice, articleTitle, articleDescription } = await request.json()
    if (!voice || !articleTitle) return json({ ok: false, error: 'Missing data' }, 400)

    const preview = await generatePreview(apiKey, voice, articleTitle, articleDescription || '')
    return json({ ok: true, preview })
  } catch (err) {
    console.error('Voice preview error:', err)
    return json({ ok: false, error: 'Preview generation failed' }, 500)
  }
}

async function generatePreview(
  apiKey: string,
  voice: Record<string, unknown>,
  title: string,
  description: string,
): Promise<string> {
  const tone = Array.isArray(voice.tone) ? voice.tone.join(', ') : 'casual'
  const audience = Array.isArray(voice.audience) ? voice.audience.join(', ') : 'general'
  const language = voice.language === 'vi' ? 'Vietnamese' : 'English'
  const pronoun = voice.pronoun || 'I'

  // Extract first sample for style reference (minimal tokens)
  let sampleRef = ''
  if (Array.isArray(voice.samples) && voice.samples.length > 0) {
    const s = voice.samples[0]
    const text = typeof s === 'object' && s !== null && 'text' in s
      ? String((s as Record<string, unknown>).text)
      : String(s)
    // Only send first 150 chars of sample to save tokens
    sampleRef = `\nStyle reference (mimic this): "${text.slice(0, 150)}..."`
  }

  const avoid = Array.isArray(voice.avoid) ? voice.avoid.slice(0, 5).join(', ') : ''

  // Very concise prompt — minimal tokens
  const prompt = `You are a content writer. Write the opening section of a blog article.

Article title: "${title}"${description ? `\nTopic: ${description.slice(0, 100)}` : ''}

Voice settings:
- Tone: ${tone}
- Audience: ${audience}
- Language: ${language}
- First person pronoun: "${pronoun}"${sampleRef}${avoid ? `\n- Never use these phrases: ${avoid}` : ''}

Requirements:
- Write EXACTLY 4 paragraphs
- Total length: 200-300 words (this is important — do not write less)
- Paragraph 1: Strong hook — a personal story, surprising fact, or bold statement
- Paragraph 2: Set up the problem or context
- Paragraph 3: Hint at what the reader will learn
- Paragraph 4: Transition into the main content
- Write ONLY the 4 paragraphs, nothing else
- No title, no headings, no markdown, no meta commentary`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: 'You are a professional content writer. You ALWAYS write at least 200 words. Never write less than 4 paragraphs. Each paragraph must be at least 40 words long.' }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
    }),
  })

  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response')

  return text.trim()
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
