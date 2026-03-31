/**
 * Voice AI analysis endpoint — sends voice profile to Gemini for qualitative evaluation
 * POST /api/admin/voice-analyze
 * Body: { voice: { name, description, tone, industry, audience, targetReader, pronoun, language, samples, avoid } }
 * Returns: { ok: true, analysis: { overall, dimensions[], summary, suggestions[] } }
 */
import type { APIRoute } from 'astro'
import { checkFeatureEnabled } from '@/lib/admin/feature-guard'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'

export const prerender = false

const GEMINI_MODEL = import.meta.env.GEMINI_MODEL || 'gemini-2.5-flash'

export const POST: APIRoute = async ({ request }) => {
  const ip = getClientIp(request)
  const rl = checkRateLimit(`ai:${ip}`, 10, 60_000)
  if (rl.limited) return rl.response

  const fc = checkFeatureEnabled('voices')
  if (!fc.enabled) return fc.response
  const apiKey = import.meta.env.GEMINI_API_KEY
  if (!apiKey) {
    return json({ ok: false, error: 'GEMINI_API_KEY not configured' }, 400)
  }

  try {
    const { voice } = (await request.json()) as { voice: Record<string, unknown> }
    if (!voice) return json({ ok: false, error: 'Missing voice data' }, 400)

    const prompt = buildPrompt(voice)
    const result = await callGemini(apiKey, prompt)

    return json({ ok: true, analysis: result })
  } catch (err) {
    console.error('Voice analysis error:', err)
    return json({ ok: false, error: 'Analysis failed' }, 500)
  }
}

/** Build the analysis prompt from voice profile data */
function buildPrompt(voice: Record<string, unknown>): string {
  const samples = Array.isArray(voice.samples)
    ? voice.samples.map((s: unknown) => {
        if (typeof s === 'object' && s !== null && 'text' in s) {
          const obj = s as Record<string, unknown>
          return `[${obj.context || 'general'}]: ${obj.text}`
        }
        return String(s)
      }).join('\n\n')
    : 'No samples provided'

  const avoid = Array.isArray(voice.avoid) ? voice.avoid.join(', ') : 'None'
  const tone = Array.isArray(voice.tone) ? voice.tone.join(', ') : String(voice.tone || 'not set')
  const audience = Array.isArray(voice.audience) ? voice.audience.join(', ') : String(voice.audience || 'not set')
  const industry = Array.isArray(voice.industry) ? voice.industry.join(', ') : String(voice.industry || 'not set')

  return `Analyze this writing voice profile and evaluate its effectiveness for content creation.

## Voice Profile
- **Name**: ${voice.name || 'unnamed'}
- **Description**: ${voice.description || 'none'}
- **Tone**: ${tone}
- **Industry**: ${industry}
- **Target Audience**: ${audience}
- **Target Reader**: ${voice.targetReader || 'not described'}
- **Pronoun**: ${voice.pronoun || 'not set'}
- **Language**: ${voice.language || 'not set'}
- **Phrases to Avoid**: ${avoid}

## Sample Paragraphs
${samples}

## Evaluation Instructions
Evaluate this voice profile on these 6 dimensions (score 0-100 each):

1. **Consistency** — Can AI produce uniform output? Are samples coherent in style? Is tone consistent across contexts?
2. **Audience Fit** — Does the voice match the target reader? Is vocabulary appropriate? Will readers relate?
3. **Clarity** — Is the voice positioning clear and focused? Or too broad/vague?
4. **Distinctiveness** — Does this voice stand out? What makes it unique vs generic AI writing?
5. **Emotional Tone** — Does the voice have personality and emotional resonance?
6. **Completeness** — Are all necessary components present for AI to effectively use this voice?

IMPORTANT: Respond ONLY in valid JSON. No markdown, no code blocks, no extra text.

Provide TWO evaluations: one in English ("en") and one in Vietnamese ("vi").

For suggestions: each suggestion MUST be tied to a specific field the user can edit. Format: "[field] action".
Available fields: tone, industry, audience, targetReader, description, samples, avoid, pronoun, language.
Example suggestions:
- "[samples] Add a tutorial-style sample paragraph to show instructional voice"
- "[avoid] Add 3-5 more phrases like 'needless to say' or 'it goes without saying'"
- "[targetReader] Describe reader's pain points and what motivates them"
- "[tone] Remove 'academic' — conflicts with casual style in samples"
- "[description] Explain when NOT to use this voice (boundaries)"

Make suggestions SPECIFIC and ACTIONABLE — user should know exactly what to type/change.

JSON schema:
{"en": {"overall": number, "dimensions": [{"name": string, "score": number, "note": string}], "summary": string, "suggestions": [string]}, "vi": {"overall": number, "dimensions": [{"name": string, "score": number, "note": string}], "summary": string, "suggestions": [string]}}

Dimension names in EN: "Consistency", "Audience Fit", "Clarity", "Distinctiveness", "Emotional Tone", "Completeness"
Dimension names in VI: "Nhất quán", "Phù hợp đối tượng", "Rõ ràng", "Khác biệt", "Cảm xúc", "Đầy đủ"

Both evaluations must have the SAME scores. Only text (notes, summary, suggestions) differs by language.
All scores are integers 0-100. Keep notes under 80 chars, summary under 150 chars. Provide 3-5 suggestions.`
}

/** Call Gemini API directly via REST (no SDK dependency in server) */
async function callGemini(apiKey: string, userPrompt: string): Promise<Record<string, unknown>> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error: ${res.status} ${err}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty Gemini response')

  // Try parsing JSON — multiple strategies for robustness
  try {
    return JSON.parse(text)
  } catch {
    // Strip markdown fences, control chars, and retry
    const cleaned = text
      .replace(/```json\n?/g, '').replace(/```\n?/g, '')
      .replace(/[\x00-\x1f\x7f]/g, ' ') // strip control characters
      .trim()
    try {
      return JSON.parse(cleaned)
    } catch {
      // Last resort: extract JSON object from text
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0])
      console.error('Gemini raw response (full):', text)
      throw new Error('Failed to parse Gemini response as JSON')
    }
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
