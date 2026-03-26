# Planner Report: Landing Page + Admin Builder

**Date:** 2026-03-26
**Plan:** `plans/260326-1901-landing-admin-builder/plan.md`

## Summary

Created 8-phase implementation plan for modular landing page system with AI setup wizard, custom entities, GoClaw API, and feature-registry integration. Total effort: **32h**.

## Phases

| # | Phase | Effort | New Files | Key Pattern |
|---|-------|--------|-----------|-------------|
| 1 | Landing Section Components | 5h | 12 | 10 Astro components, zero JS, typed props |
| 2 | Landing Config & Renderer | 3h | 4 | YAML -> Astro content collection -> section renderer |
| 3 | Product Templates | 2h | 7 | 5 YAML templates (saas/agency/course/ecommerce/portfolio) |
| 4 | Admin Landing Editor | 5h | 8+ | React lazy-loaded pages, section forms, up/down reorder |
| 5 | Custom Entities | 5h | 10+ | YAML schema defines entity -> auto CRUD in admin |
| 6 | AI Setup Wizard | 4h | 4 | Gemini Flash structured output, template picker fallback |
| 7 | GoClaw Landing API | 4h | 9 | 17 REST endpoints for parallel agent orchestration |
| 8 | Feature Registry Integration | 4h | 0 (modify only) | 3 new feature modules, all toggleable from Settings |

## Key Architecture Decisions

1. **No drag-drop** -- up/down buttons for section reorder (KISS, avoid `@dnd-kit` dep)
2. **Section ID = array index** -- simpler than UUID generation for YAML items
3. **Entity system reuses content-io pattern** -- separate from Astro content collections (too dynamic for static collection registration)
4. **Gemini Flash for AI** -- already in project, free tier, structured JSON output
5. **Non-AI fallback** -- template picker when `GEMINI_API_KEY` missing
6. **GoClaw endpoints under existing `goclaw` feature toggle** -- no separate `landing-api` toggle needed
7. **No new npm dependencies** -- everything built on existing stack
8. **Route conflict mitigation** -- `[landing].astro` excludes known slugs (about, search, 404) in `getStaticPaths`

## File Count Summary

- **New files:** ~54 (components, types, API endpoints, YAML configs)
- **Modified files:** ~8 (feature-registry, admin-layout, sidebar, validation, schema-registry, content.config, api-client, site-settings)

## Critical Path

Phase 1 -> Phase 2 -> Phase 4 (admin) + Phase 7 (GoClaw) in parallel -> Phase 8

Phase 3 (templates) can start alongside Phase 2.
Phase 5 (entities) can start alongside Phase 2.
Phase 6 (wizard) needs Phase 3 + Phase 4.

## Unresolved Questions

1. **Route conflict strategy:** Should landing pages use a prefix like `/l/[slug]` to avoid conflicts with future pages? Current plan excludes known slugs in `getStaticPaths`, but new pages added later could conflict.
2. **Section concurrency:** GoClaw Hub dispatching parallel agents to same page -- index-based section IDs could shift if one agent adds/deletes while another edits. Should we add a `sectionId` field to YAML for stable references?
3. **Entity limits:** Capped at 20 entity definitions -- is this sufficient? Should there be an instance-count limit per entity?
4. **Landing page in production:** Content-IO uses GitHub API for prod writes -- landing pages follow same pattern, but YAML structure is more complex than flat collection entries. Verify GitHubContentIO handles nested section arrays correctly.
