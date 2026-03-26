---
title: "Landing Page + Admin Builder"
description: "AI-powered landing page system with modular sections, templates, custom entities, and GoClaw Hub skill integration"
status: complete
priority: P1
effort: 35h
branch: kai/feat/landing-admin-builder
tags: [landing-page, admin, goclaw, ai-wizard, templates]
created: 2026-03-26
---

# Landing Page + Admin Builder

## Vision
User describes product -> AI parses intent -> selects template -> generates landing page config -> user customizes in admin -> deploy as static HTML.

**Core principle:** AI is intent parser. Real work = pre-built Astro components + YAML config + feature-registry integration.

## Architecture
- **Data:** YAML files in `src/content/landing-pages/`, `src/content/templates/`, `src/content/custom-entities/`
- **Rendering:** `src/pages/[landing].astro` reads YAML -> renders Astro components in order -> static HTML
- **Admin:** React pages in admin SPA (lazy-loaded, gated by feature-registry)
- **API:** GoClaw endpoints per module for AI agent orchestration
- **Toggle:** Every module registered in feature-registry, controllable from admin Settings

## GoClaw Hub Integration Strategy

**Approach A (skill-based, no GoClaw core changes):**
- Create a GoClaw skill "tree-id-manager" that agents use via `use_skill` tool
- Skill uses `web_fetch` to call tree-id API endpoints
- Hub dispatches agents → each agent calls skill → skill calls tree-id REST API
- Validate flow end-to-end before considering native Go tool (Approach B)

```
GoClaw Hub
  └─ Agent (with skill "tree-id-manager")
       └─ web_fetch → https://tree-id.dev/api/goclaw/landing/sections/hero
       └─ web_fetch → https://tree-id.dev/api/goclaw/landing/sections/pricing
```

**Why A first:** Zero changes to GoClaw Hub Go code. Skill = YAML + prompt. Fast to iterate.
**When to upgrade to B:** After validating flow works, if latency/reliability needs native tool.

## Phases

| # | Phase | Effort | Status | Depends On |
|---|-------|--------|--------|------------|
| 1 | [Landing Section Components](./phase-01-landing-section-components.md) | 5h | complete | -- |
| 2 | [Landing Config & Renderer](./phase-02-landing-config-renderer.md) | 3h | complete | Phase 1 |
| 3 | [Product Templates](./phase-03-product-templates.md) | 2h | complete | Phase 1 |
| 4 | [Admin Landing Editor](./phase-04-admin-landing-editor.md) | 5h | complete | Phase 2 |
| 5 | [Custom Entities](./phase-05-custom-entities.md) | 5h | complete | Phase 2 |
| 6 | [AI Setup Wizard](./phase-06-ai-setup-wizard.md) | 4h | complete | Phase 3, 4 |
| 7 | [GoClaw Landing API](./phase-07-goclaw-landing-api.md) | 4h | complete | Phase 2, 5 |
| 8 | [Feature Registry Integration](./phase-08-feature-registry-integration.md) | 4h | complete | Phase 1-7 |
| 9 | [GoClaw Hub Skill](./phase-09-goclaw-hub-skill.md) | 3h | complete | Phase 7 |

## Key Dependencies
- `src/lib/admin/feature-registry.ts` -- register all new modules
- `src/lib/admin/feature-guard.ts` -- API route guards
- `src/lib/admin/content-io.ts` -- YAML read/write
- `src/lib/goclaw/api-auth.ts` -- Bearer token auth
- `src/lib/admin/schema-registry.ts` -- field schemas for admin forms
- `src/lib/admin/validation.ts` -- extend ALLOWED_COLLECTIONS/SINGLETONS
- `goclaw-hub/skills/` -- GoClaw skill directory (Approach A)

## New Dependencies
- None required (all built on existing Astro + React + YAML stack)
- Optional: `@dnd-kit/core` for drag-drop reorder in admin (Phase 4)

## Constraints
- All data in YAML/git -- no database
- Landing sections = pure Astro components (zero client JS)
- Every module toggleable + GoClaw-accessible
- Reuse existing admin CRUD patterns (ContentList, ContentEditor, schema-registry)
- GoClaw Hub integration via skill (Approach A) — no Go code changes
