/**
 * Feature builder AI — Gemini Flash clarification for new feature definitions.
 * Asks follow-up questions to refine scope before generating a plan.
 * Returns null / fallback if GEMINI_API_KEY not configured.
 */

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

const SYSTEM_PROMPT = `You are a senior software architect helping a developer clarify a new feature module specification.

Given a feature description and optional conversation history, either:
1. Ask 2-4 targeted clarifying questions to refine scope (when more info needed)
2. Declare the feature ready to plan (when you have enough info)

Focus your questions on:
- Data schema: what fields/types need to be stored?
- Relationships: does this relate to articles, notes, products, or other existing entities?
- UI complexity: is it a simple list-detail, a dashboard, a form, or no UI?
- Access control: admin-only, public API, or both?

Return ONLY valid JSON (no markdown, no explanation):
{
  "readyToPlan": false,
  "questions": ["Question 1?", "Question 2?"]
}

OR when ready:
{
  "readyToPlan": true,
  "questions": [],
  "refinedDescription": "One-paragraph summary of the refined feature scope"
}`

export interface FeatureDescription {
  name: string
  label: string
  purpose: string
  dataDescription: string
  uiNeeds: 'list-detail' | 'form' | 'dashboard' | 'none'
  section: 'content' | 'assets' | 'marketing' | 'system'
}

export interface ClarifyMessage {
  role: 'ai' | 'user'
  content: string
}

export interface ClarifyResponse {
  questions: string[]
  readyToPlan: boolean
  refinedDescription?: string
}

export async function clarifyFeature(
  description: FeatureDescription,
  history: ClarifyMessage[],
): Promise<ClarifyResponse> {
  const apiKey = import.meta.env.GEMINI_API_KEY
  if (!apiKey) {
    // Graceful fallback — skip AI, mark ready
    return { questions: [], readyToPlan: true }
  }

  const descriptionText = [
    `Feature name: ${description.label} (${description.name})`,
    `Section: ${description.section}`,
    `Purpose: ${description.purpose}`,
    `Data: ${description.dataDescription}`,
    `UI type: ${description.uiNeeds}`,
  ].join('\n')

  const historyText =
    history.length > 0
      ? '\n\nConversation so far:\n' +
        history.map((m) => `${m.role === 'ai' ? 'AI' : 'Developer'}: ${m.content}`).join('\n')
      : ''

  const prompt = `Feature description:\n${descriptionText}${historyText}\n\nRespond with JSON:`

  const body = {
    contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
  }

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) return { questions: [], readyToPlan: true }

    const json = await res.json()
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined
    if (!text) return { questions: [], readyToPlan: true }

    // Strip markdown fences if present
    const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    const parsed = JSON.parse(cleaned) as Partial<ClarifyResponse>

    return {
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      readyToPlan: parsed.readyToPlan === true,
      refinedDescription: parsed.refinedDescription,
    }
  } catch {
    return { questions: [], readyToPlan: true }
  }
}
