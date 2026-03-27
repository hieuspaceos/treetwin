/**
 * POST /api/admin/feature-builder/ai-fill
 * Takes a natural language idea and returns structured FeatureDescription fields.
 * Uses Gemini Flash to extract: label, purpose, dataDescription, uiNeeds, section.
 */
import type { APIRoute } from 'astro'
import { checkFeatureEnabled } from '@/lib/admin/feature-guard'

export const prerender = false

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

const SYSTEM_PROMPT = `You are a feature specification assistant. Given a natural language idea for a software feature, extract structured fields.

Return ONLY valid JSON (no markdown, no explanation):
{
  "label": "Human-readable feature name (2-4 words, Title Case)",
  "purpose": "One paragraph describing what this feature does, who uses it, and why (50-150 words)",
  "dataDescription": "Comma-separated list of data fields this feature needs to store (e.g. 'title, description, rating (1-5), author, status')",
  "uiNeeds": "list-detail" | "form" | "dashboard" | "none",
  "section": "content" | "assets" | "marketing" | "system"
}

Rules for uiNeeds:
- "list-detail": feature manages a collection of items (most common)
- "form": feature is a single form/settings page
- "dashboard": feature shows analytics/stats/overview
- "none": feature is API-only, no admin UI

Rules for section:
- "content": articles, posts, pages, notes, reviews, comments
- "assets": media, files, images, documents
- "marketing": campaigns, emails, social, analytics, distribution
- "system": settings, tools, utilities, infrastructure, dev tools`

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ request }) => {
  const fc = checkFeatureEnabled('feature-builder')
  if (!fc.enabled) return fc.response

  const apiKey = import.meta.env.GEMINI_API_KEY
  if (!apiKey) {
    return json({ ok: false, error: 'GEMINI_API_KEY not configured' }, 400)
  }

  try {
    const body = await request.json()
    const idea = body?.idea
    if (!idea || typeof idea !== 'string' || idea.trim().length < 5) {
      return json({ ok: false, error: 'Please describe your idea (at least 5 characters)' }, 400)
    }

    const prompt = `Feature idea: "${idea.trim()}"\n\nExtract the structured fields as JSON:`

    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
      }),
    })

    if (!res.ok) {
      return json({ ok: false, error: 'Gemini API request failed' }, 502)
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined
    if (!text) {
      return json({ ok: false, error: 'Empty response from Gemini' }, 502)
    }

    // Strip markdown fences if present
    const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    const parsed = JSON.parse(cleaned)

    // Validate and sanitize
    const result = {
      label: String(parsed.label || '').trim(),
      purpose: String(parsed.purpose || '').trim(),
      dataDescription: String(parsed.dataDescription || '').trim(),
      uiNeeds: ['list-detail', 'form', 'dashboard', 'none'].includes(parsed.uiNeeds) ? parsed.uiNeeds : 'list-detail',
      section: ['content', 'assets', 'marketing', 'system'].includes(parsed.section) ? parsed.section : 'content',
    }

    if (!result.label) {
      return json({ ok: false, error: 'AI could not extract a feature name' }, 422)
    }

    return json({ ok: true, data: result })
  } catch {
    return json({ ok: false, error: 'AI Fill failed — try describing your idea differently' }, 500)
  }
}
