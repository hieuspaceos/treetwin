---
title: "Landing Builder UX Polish for Non-Technical Users"
description: "Make admin landing page editor friendly for users with zero web development experience"
status: in-progress
priority: P1
effort: 12h
branch: main
tags: [admin, ux, landing-builder, accessibility]
created: 2026-03-30
---

# Landing Builder UX Polish

## Goal
Transform the admin landing page editor from developer-oriented to approachable for non-technical users who have never used a web app builder before.

## Pre-Plan Work (completed 2026-03-30)

Significant UX improvements done before plan phases, addressing core usability:

| Feature | Impact |
|---------|--------|
| Compact accordion forms (all 11 sections) | High — 70% space reduction |
| Rich Text DOMParser visual editor | High — edit HTML as structured fields |
| Layout nested section inline editing | High — edit content inside columns |
| Layout variant-aware columns (fixed/custom) | Medium |
| Nav/CTA/Rich Text scroll-to-section dropdowns | Medium |
| Social link auto-detect icons + compact picker | Medium |
| Footer column groups accordion | Medium |
| Icon picker fixed-position popup | Medium |
| Resizable split panels (40/60, draggable) | Medium |
| Bidirectional preview-builder sync | Medium |
| Gallery 5 variants + carousel with dots/arrows | Medium |
| Banner 7 variants (promo, countdown, etc.) | Medium |
| Testimonial image field | Low |

## Remaining Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 1 | Friendly Labels | 2h | pending | [phase-01](phase-01-friendly-labels.md) |
| 2 | Visual Variant Picker | 3h | pending | [phase-02](phase-02-visual-variant-picker.md) |
| 3 | Tooltips & Help Text | 2h | pending | [phase-03](phase-03-tooltips-help.md) |
| 4 | Smart Defaults | 2h | pending | [phase-04](phase-04-smart-defaults.md) |
| 5 | Image Handling | 3h | pending | [phase-05](phase-05-image-handling.md) |

## Key Constraints
- No new npm dependencies
- Existing inline styles pattern (no CSS modules)
- Must work on mobile admin
- Keep all existing functionality intact — purely additive UX layer

## Dependencies
- Phase 2 depends on Phase 1 (labels feed into variant cards)
- Phase 5 depends on existing upload API (`/api/admin/upload`)
- All other phases are independent
