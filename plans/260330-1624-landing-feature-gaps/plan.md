---
title: "Landing Page Feature Gaps — Quick Wins"
description: "5 quick-win features to close landing builder coverage gaps"
status: pending
priority: P2
effort: 8h
branch: main
tags: [landing, admin, ux, quick-wins]
created: 2026-03-30
---

# Landing Page Feature Gaps — Quick Wins

5 targeted improvements to close the most visible gaps in the landing page builder.

## Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 1 | Section Duplicate | 30min | pending | [phase-01](phase-01-section-duplicate.md) |
| 2 | Undo/Redo | 1h | pending | [phase-02](phase-02-undo-redo.md) |
| 3 | Template Library UI | 2h | pending | [phase-03](phase-03-template-library.md) |
| 4 | SEO Fields | 1h | pending | [phase-04](phase-04-seo-fields.md) |
| 5 | Popup/Modal Section | 3h | pending | [phase-05](phase-05-popup-section.md) |

## Key Dependencies

- All 5 phases are independent — can be implemented in any order or in parallel
- No new npm packages required
- Templates API already exists (`api.templates.list()`, `api.templates.read()`)
- `base-head.astro` currently lacks `og:image` — Phase 4 adds it via landing-layout slot

## Files Touched (Summary)

- `src/components/admin/landing/landing-section-card.tsx` — duplicate button (P1)
- `src/components/admin/landing/landing-page-editor.tsx` — undo/redo state (P2), template picker (P3)
- `src/components/admin/landing/landing-pages-list.tsx` — "Use Template" button (P3)
- `src/lib/landing/landing-types.ts` — `PopupData`, SEO fields on `LandingPageConfig` (P4, P5)
- `src/layouts/landing-layout.astro` — SEO meta tags (P4)
- `src/pages/[landing].astro` — pass SEO props (P4)
- `src/components/landing/landing-popup.astro` — new Astro component (P5)
- `src/components/landing/landing-section-renderer.astro` — register popup (P5)
- `src/components/admin/landing/landing-section-forms.tsx` — popup form (P5)
- `src/components/admin/landing/landing-smart-defaults.ts` — popup defaults (P5)
