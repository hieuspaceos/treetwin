# Feature Builder System (v2.6.0 Phase 3)

AI-assisted feature module generator with hybrid code generation engine.

## Overview

**Phase 1 (2026-03-27):** Define + clarify steps for feature specification
**Phase 2-3:** Hybrid code generation + skill spec generation + plan/review steps
**Phase 4:** Module installation + feature registry integration

## Phase 1: Define + AI Clarify

**Wizard Page:** `/admin/feature-builder` (requires `GEMINI_API_KEY`)

### Steps

1. **Define Step** — User enters feature description + domain (text input)
2. **AI Clarify Step** — Gemini Flash asks clarification questions (max 3-5 follow-ups)
3. **Result:** Structured feature spec ready for implementation

### Files Created

**Lib:**
- `src/lib/admin/feature-builder-ai.ts` — Gemini Flash integration for clarification generation

**Components:**
- `src/components/admin/feature-builder/feature-builder-wizard.tsx` — Multi-step wizard shell
- `src/components/admin/feature-builder/feature-builder-define-step.tsx` — Description input
- `src/components/admin/feature-builder/feature-builder-clarify-step.tsx` — Q&A interface

**API:**
- `POST /api/admin/feature-builder/clarify` — Calls Gemini to generate follow-up questions

## Phase 2-3: Hybrid Code Generation (v2.6.0)

Combines AI with template-based scaffolding for faster component generation.

### Features

**New in Phase 3:**
- **Hybrid code generation:** AI + template combination for faster scaffolding
- **Categorized output:** Code organized by:
  - Data models (Zod schemas)
  - API routes (REST endpoints)
  - React components (UI islands)
  - Tests (unit + integration)
- **Generation guides:** In-app help text for each artifact type
- **AI Fill:** Auto-populate field descriptions using Gemini
- **Code review step:** Edit generated code before applying
- **Live preview:** Split panel showing code + live preview

### Components

- `src/components/admin/feature-builder/feature-builder-plan-step.tsx` — Plan generation + review
- `src/components/admin/feature-builder/feature-builder-generate-step.tsx` — Categorized code output
- `src/components/admin/feature-builder/feature-builder-live-preview.tsx` — Split preview panel
- `src/components/admin/feature-builder/feature-builder-generate-result.tsx` — Code display + edit
- `src/components/admin/feature-builder/feature-builder-review-step.tsx` — Final review before apply
- `src/components/admin/feature-builder/feature-builder-editable-list.tsx` — Edit generated artifacts

### API Routes

- `POST /api/admin/feature-builder/generate` — Hybrid code generation (Gemini + templates)

## Architecture

```
User describes feature
  ↓
AI clarification (Gemini 2.5)
  ↓
Skill spec generation
  ↓
Code generation:
  ├─ AI: Analyzes spec → generates context + sample code
  ├─ Templates: Combine context with predefined patterns
  └─ Output: Structured code by category (models, routes, components, tests)
  ↓
User review + edit (before applying)
  ↓
Module installed into feature registry
```

## Generated Code Structure

### Data Models (Zod Schema)

```typescript
// Generated from user spec
export const myFeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  // ... fields based on user spec
})
```

### API Routes

```typescript
// Generated REST endpoints
export async function GET(context) { ... }
export async function POST(context) { ... }
export async function PUT(context) { ... }
export async function DELETE(context) { ... }
```

### React Components

```typescript
// Generated UI components (React islands)
export function MyFeatureComponent() {
  // Auto-generated form/list/detail views
}
```

### Tests

```typescript
// Generated unit + integration tests
describe('MyFeature', () => {
  test('should create', () => { ... })
  test('should read', () => { ... })
  test('should update', () => { ... })
  test('should delete', () => { ... })
})
```

## Registration

Feature registered as optional system section:
- Module: `feature-builder`
- Requires: `GEMINI_API_KEY`
- AI: Gemini 2.5 Flash for spec generation + code generation
- Status: Opt-in via feature registry (disabled by default)

## Future Phases

**Phase 4:** Integration + Testing
- Module installation into feature registry
- Feature toggle UI wiring
- End-to-end testing in admin

---

**Last updated:** 2026-03-27
**Version:** v2.6.0
