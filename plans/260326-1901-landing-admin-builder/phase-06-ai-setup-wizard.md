# Phase 6: AI Setup Wizard

## Context Links
- Templates: `src/content/templates/` (Phase 3)
- Template apply: `src/lib/landing/template-apply.ts` (Phase 3)
- Landing editor: Phase 4
- GoClaw auth: `src/lib/goclaw/api-auth.ts`
- Existing Gemini usage: `scripts/distribute-content.py` (uses GEMINI_API_KEY)

## Overview
- **Priority:** P2
- **Status:** Pending
- **Effort:** 4h
- **Depends on:** Phase 3, Phase 4
- **Description:** Chat-like interface in admin where user describes their product. Gemini parses intent -> selects template -> generates landing page config -> user reviews/customizes -> save.

## Key Insights
- AI is the intent parser, not the engine. Output = structured JSON matching existing template/section format
- Use Gemini Flash (free tier, already in project via `GEMINI_API_KEY`) -- not OpenAI
- Single prompt with structured output schema, not multi-turn conversation
- Wizard is a React page in admin at `/admin/setup`
- Fallback: if no `GEMINI_API_KEY`, show template picker without AI (manual selection)
- GoClaw endpoint allows external agents to trigger same flow programmatically

## Requirements

### Functional
- Chat-like input: user types product description in natural language
- AI extracts: product type, features list, pricing plans, target audience, brand tone
- Maps extracted data to closest template
- Generates section content (headlines, descriptions, feature text, FAQ)
- Shows preview with generated config
- User can edit any section before saving
- Save creates a new landing page in `src/content/landing-pages/`
- Non-AI fallback: template picker with blank/placeholder content

### Non-functional
- Single API call to Gemini (no streaming needed for structured output)
- Response time < 5s for generation
- No new dependencies (use `fetch` to Gemini REST API directly)
- Graceful error handling (Gemini quota, network errors)

## Architecture

### Wizard Flow
```
1. User opens /admin/setup
2. User types: "I'm building an AI chatbot SaaS for e-commerce businesses"
3. Frontend sends to: POST /api/admin/setup/generate
4. Backend calls Gemini Flash with structured output schema
5. Gemini returns: { template: "saas", sections: [...] }
6. Frontend shows preview of generated landing page
7. User edits sections (inline forms from Phase 4)
8. User clicks "Create Landing Page"
9. Frontend calls POST /api/admin/landing with generated config
10. Redirect to /admin/landing/[slug]
```

### Gemini Prompt Strategy

```typescript
// src/lib/landing/ai-setup-generator.ts

const SYSTEM_PROMPT = `You are a landing page copywriter. Given a product description, generate a complete landing page configuration.

Output a JSON object matching this schema:
{
  "template": "saas" | "agency" | "course" | "ecommerce" | "portfolio",
  "title": "Page title",
  "slug": "url-slug",
  "sections": [
    {
      "type": "hero",
      "order": 1,
      "enabled": true,
      "data": {
        "headline": "...",
        "subheadline": "...",
        "cta": { "text": "...", "url": "/signup" }
      }
    },
    // ... more sections based on template
  ]
}

Rules:
- Choose template that best matches the product type
- Write compelling, specific copy (not generic placeholder)
- Include 3-6 features that align with the product description
- If pricing is mentioned, create realistic pricing tiers
- Generate 3-5 FAQ items relevant to the product
- Keep all text concise and action-oriented
- CTA URLs should be simple paths like /signup, /contact, /demo`

export interface SetupGeneratorInput {
  productDescription: string
  language?: 'en' | 'vi'
}

export interface SetupGeneratorOutput {
  template: string
  title: string
  slug: string
  sections: Array<{
    type: string
    order: number
    enabled: boolean
    data: Record<string, unknown>
  }>
}

export async function generateLandingConfig(
  input: SetupGeneratorInput
): Promise<SetupGeneratorOutput | null> {
  const apiKey = import.meta.env.GEMINI_API_KEY
  if (!apiKey) return null

  const userPrompt = input.language === 'vi'
    ? `Product description (Vietnamese): ${input.productDescription}\nGenerate landing page in Vietnamese.`
    : `Product description: ${input.productDescription}`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        }),
      }
    )

    const result = await response.json()
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return null

    return JSON.parse(text) as SetupGeneratorOutput
  } catch (error) {
    console.error('Gemini setup generation failed:', error)
    return null
  }
}
```

### Admin API Endpoint

```typescript
// src/pages/api/admin/setup/generate.ts
import type { APIRoute } from 'astro'
import { verifySession } from '@/lib/admin/auth'
import { generateLandingConfig } from '@/lib/landing/ai-setup-generator'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const auth = verifySession(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  if (!body.productDescription || typeof body.productDescription !== 'string') {
    return json({ ok: false, error: 'productDescription is required' }, 400)
  }

  const config = await generateLandingConfig({
    productDescription: body.productDescription,
    language: body.language || 'en',
  })

  if (!config) {
    return json({ ok: false, error: 'AI generation failed. Check GEMINI_API_KEY.' }, 500)
  }

  return json({ ok: true, data: config })
}
```

### Wizard React Component

```typescript
// src/components/admin/landing/landing-setup-wizard.tsx
// Simplified structure:

export function LandingSetupWizard() {
  const [step, setStep] = useState<'describe' | 'preview' | 'saved'>('describe')
  const [description, setDescription] = useState('')
  const [config, setConfig] = useState<SetupGeneratorOutput | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    const result = await api.setup.generate({ productDescription: description })
    if (result.ok && result.data) {
      setConfig(result.data)
      setStep('preview')
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!config) return
    await api.landing.create(config)
    setStep('saved')
    // redirect to editor
  }

  // Step 1: Description input
  // Step 2: Preview with editable sections
  // Step 3: Saved confirmation + redirect
}
```

### Non-AI Fallback

When `GEMINI_API_KEY` is not set:
- Show template picker grid (5 template cards with previews)
- User picks template -> applies with placeholder content
- User manually edits all sections
- Same save flow as AI path

```typescript
// In wizard component
const hasAI = !!import.meta.env.PUBLIC_HAS_GEMINI // set in astro config from server

if (!hasAI) {
  // Render TemplatePicker instead of chat input
  return <TemplatePicker onSelect={handleTemplateSelect} />
}
```

## Related Code Files

### Create
- `src/lib/landing/ai-setup-generator.ts` -- Gemini API call + prompt
- `src/pages/api/admin/setup/generate.ts` -- admin endpoint for AI generation
- `src/components/admin/landing/landing-setup-wizard.tsx` -- React wizard page
- `src/components/admin/landing/template-picker.tsx` -- non-AI template selection grid

### Modify
- `src/components/admin/admin-layout.tsx` -- add `/setup` route
- `src/lib/admin/api-client.ts` -- add `setup.generate()` method

## Implementation Steps

1. Create `ai-setup-generator.ts` with Gemini Flash integration:
   - System prompt with structured JSON output schema
   - Language support (en/vi)
   - Error handling + null return on failure
2. Create `POST /api/admin/setup/generate.ts` endpoint:
   - Auth check
   - Input validation
   - Call generator, return result
3. Create `template-picker.tsx`:
   - Fetch templates from API
   - Grid of template cards with name, description, preview
   - Click to select -> callback with template sections
4. Create `landing-setup-wizard.tsx`:
   - Step 1: Textarea for product description + "Generate" button (or template picker if no AI)
   - Step 2: Preview of generated/selected config + section edit forms (reuse from Phase 4)
   - Step 3: "Create Landing Page" button -> save + redirect
   - Loading state with spinner during AI generation
5. Add `setup.generate()` to api-client
6. Add `/setup` route to admin-layout (lazy-loaded)
7. Test with sample product descriptions:
   - "AI chatbot for e-commerce" -> should pick saas template
   - "Freelance web design agency" -> should pick agency template
   - "Online Python programming course" -> should pick course template
8. Test fallback without `GEMINI_API_KEY`

## Todo List
- [ ] Create `ai-setup-generator.ts` with Gemini integration
- [ ] Create `POST /api/admin/setup/generate.ts` endpoint
- [ ] Create `template-picker.tsx` component
- [ ] Create `landing-setup-wizard.tsx` component
- [ ] Add API client method for setup
- [ ] Add route to admin-layout
- [ ] Test AI generation with sample inputs
- [ ] Test non-AI fallback path

## Success Criteria
- User types product description -> gets complete landing page config in < 5s
- Generated copy is specific to the product (not generic)
- Correct template selected for product type
- User can edit all sections before saving
- Non-AI fallback works (template picker)
- Saved config renders correctly as landing page

## Risk Assessment
- **Risk:** Gemini output doesn't match expected JSON schema -> **Mitigation:** validate output against Zod schema, show error + manual template fallback
- **Risk:** Gemini free tier quota hit -> **Mitigation:** show clear error message, fallback to template picker
- **Risk:** Generated copy is low quality -> **Mitigation:** detailed system prompt with rules; user can edit everything before saving

## Security Considerations
- Gemini API key never exposed to client (server-side only)
- User input sanitized before sending to Gemini (strip HTML, limit length)
- Generated content treated as user-provided (no special trust)
- Admin auth required for setup endpoint

## GoClaw Integration Points
- `POST /api/goclaw/setup` endpoint (Phase 7) mirrors admin setup:
  - Accepts product description
  - Returns generated config
  - External agents can trigger landing page creation programmatically
- GoClaw setup endpoint uses same `ai-setup-generator.ts` module
