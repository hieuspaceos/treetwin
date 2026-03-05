---
title: "Tree Identity MVP"
description: "Digital Twin content engine — Payload CMS 3.0 + Next.js 14 + Supabase + R2"
status: pending
priority: P1
effort: 32h
branch: main
tags: [mvp, payload-cms, nextjs, supabase, cloudflare-r2]
created: 2026-03-05
---

# Tree Identity MVP — Implementation Plan

## Architecture

Next.js 14 App Router + Payload CMS 3.0 (embedded) + PostgreSQL (Supabase) + Cloudflare R2 storage.
Single deployable artifact on Vercel. Admin at `/admin`, frontend at `/`.

## Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 1 | Project Setup & Infrastructure | 5h | pending | [phase-01](./phase-01-project-setup-infrastructure.md) |
| 2 | Payload Collections & Schema | 5h | pending | [phase-02](./phase-02-payload-collections-schema.md) |
| 3 | `create-tree-id` CLI Tool | 6h | pending | [phase-03](./phase-03-create-tree-id-cli.md) |
| 4 | Frontend — Cortex Interface | 6h | pending | [phase-04](./phase-04-frontend-cortex-interface.md) |
| 5 | SEO Engine | 4h | pending | [phase-05](./phase-05-seo-engine.md) |
| 6 | Video-Factory Manifest Hook | 3h | pending | [phase-06](./phase-06-video-factory-manifest-hook.md) |
| 7 | Deploy Button & Documentation | 3h | pending | [phase-07](./phase-07-deploy-button-documentation.md) |

## Key Dependencies

- Phase 2 depends on Phase 1 (Payload config must exist)
- Phase 3 is independent (separate package)
- Phase 4 depends on Phase 2 (collections must exist for queries)
- Phase 5 depends on Phase 4 (pages must exist for metadata)
- Phase 6 depends on Phase 2 (collections with video fields)
- Phase 7 depends on all other phases

## Research Reports

- [Payload CMS 3.0 + Next.js](../reports/researcher-260305-1704-payload-cms-3-nextjs-integration.md)
- [CLI + Supabase + R2](../reports/researcher-260305-1704-create-tree-id-cli-research.md)
- [Brainstorm](../reports/brainstorm-260305-1643-tree-identity-mvp-architecture.md)

## Notes

- Brainstorm report chose Fumadocs + Decap; this plan follows the **user-locked** stack: Payload CMS 3.0 + Supabase PostgreSQL
- Video-factory contract schema is LOCKED — define as Payload fields, not frontmatter
- Zettelkasten, theme engine, asset dashboard deferred to Phase 2
