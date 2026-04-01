# Phase 4 — File Size Violations + Code Deduplication

**Priority:** P1
**Effort:** Large (6-8 hours)
**Status:** Planned

## Context

- [Architecture Review](../reports/architecture-260331-2057-codebase-architecture-review.md)

## 4.1 Extract Shared `json()` Helper (69 files)

**Problem:** Same 3-line `json()` function copy-pasted in 69 API route files.

**Fix:**
- [ ] Create `src/lib/api-response.ts` with `json()`, `apiError()` exports
- [ ] Replace all 69 local `json()` definitions with import
- [ ] Incremental — can do 10-15 files at a time

## 4.2 Split `landing-section-forms.tsx` (1319 LOC → ~27 files)

**Problem:** 27 form components + shared helpers in one file.

**Fix:**
- [ ] Create `src/components/admin/landing/section-forms/` directory
- [ ] Extract shared helpers to `section-forms/form-primitives.tsx` (Field, InlineRow, CollapsibleItems, ArrayField, detectSocialIcon)
- [ ] One file per section form: `hero-form.tsx`, `pricing-form.tsx`, etc.
- [ ] Barrel `section-forms/index.ts` re-exports `sectionFormMap`

## 4.3 Split `landing-live-preview.tsx` (1167 LOC → ~26 files)

**Problem:** 26 preview renderers in one file.

**Fix:**
- [ ] Create `src/components/admin/landing/preview-renderers/` directory
- [ ] One file per section preview: `preview-hero.tsx`, `preview-nav.tsx`, etc.
- [ ] Main file keeps wiring/scroll/highlight logic only

## 4.4 Split `landing-page-editor.tsx` (657 LOC)

**Fix:**
- [ ] Extract `SeoSettingsPanel` (~60 LOC) to own file
- [ ] Extract `SECTION_CATALOG` + add-section UI to `section-catalog.ts`
- [ ] Extract clone integration to `useLandingClone.ts` hook

## 4.5 GoClaw Handler Factories (26 → 13 files)

**Problem:** Root-level and product-scoped GoClaw endpoints share ~80% identical code.

**Fix:**
- [ ] Create `src/lib/goclaw/handlers/` with shared handler factories
- [ ] Each API route becomes 5-line wrapper calling factory
- [ ] Collapse 26 files into 13 wrappers + shared handlers

## 4.6 Other File Splits (300-500 LOC)

- [ ] `clone-post-processor.ts` (512) → extract `clone-color-utils.ts`, `clone-quality-assessment.ts`
- [ ] `admin-sidebar.tsx` (387) → extract 152 LOC of SVG icons to `admin-icons.tsx`
- [ ] `voice-score-panel.tsx` (381) → extract scoring to `lib/admin/voice-score-calculator.ts`
- [ ] `admin-translations-page.tsx` (360) → extract utils to `lib/i18n/translation-utils.ts`
- [ ] `local-database.ts` (336) → extract schema/seeds to `local-database-schema.ts`

## Success Criteria

- [ ] No production file exceeds 500 LOC (test files exempt)
- [ ] `json()` imported from single source
- [ ] GoClaw endpoints deduplicated
- [ ] All existing tests pass after refactor
