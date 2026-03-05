# Brainstorm Report: Tree Identity MVP Architecture
**Date:** 2026-03-05 | **Status:** Decisions Locked

---

## Problem Statement

Design a "Digital Twin" content engine (Tree Identity) that:
- Serves as the personal "Cortex" (website) and primary node in HSpaceOS ecosystem
- Is clonable in <15 minutes by devs; extensible to non-techies via GUI
- Transforms "Seeds" (MDX/JSON content) into SEO-optimized web assets
- Connects to `video-factory` project for automated video production
- Requires zero-DB setup per clone (Phase 1)

---

## Approaches Evaluated

### A. Original Stack (Rejected)
Payload CMS 3.0 + PostgreSQL + Contentlayer

**Problems:**
- PostgreSQL setup per clone breaks "15 min" promise
- Contentlayer is abandoned/unmaintained (2024)
- Payload CMS admin complexity for non-techies without custom onboarding
- Migration runners needed → slow, error-prone clone process

### B. Hybrid Git-based CMS (Chosen)
Fumadocs + Decap CMS + Cloudflare R2

**Why it wins:**
- Clone = `git clone && npm install` — no DB, no migrations
- Decap: Git-commit-on-save, zero external service dependency (for devs)
- Fumadocs: hierarchical navigation, ToC, Orama search — perfect for "Cortex" metaphor
- video-factory reads MDX files directly — no API layer needed

---

## Locked Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Content engine | Fumadocs MDX | Hierarchical docs-style, Orama search built-in |
| CMS GUI | Decap CMS (MVP) | Zero-dependency for devs; TinaCMS upgrade path later |
| Database | None in Phase 1 | Git is the database; defer PostgreSQL to Phase 2 |
| Media | Cloudflare R2 | Zero-egress CDN; MDX references URLs only, no binaries in Git |
| Search | Fumadocs Orama | Built-in, no extra library; Pagefind at 1000+ pages |
| Zettelkasten | Deferred to Phase 2 | Write `[[wikilinks]]` syntax now, build graph later |
| Video contract | Defined in Phase 1 | Frontmatter schema locked; prevents future retrofit |

---

## Final Tech Stack

```
├── Framework:     Next.js 14 (App Router) + TypeScript
├── Content Layer: Fumadocs (MDX + Orama search)
├── CMS GUI:       Decap CMS → TinaCMS upgrade path
│   └── Auth:      decap-server (local) + OAuth proxy (Vercel prod)
├── Styling:       Tailwind CSS + Shadcn/UI + CSS Variables
├── Media:         Cloudflare R2 (CDN URLs in MDX frontmatter)
├── SEO:           JSON-LD + OG meta from site-config.ts
├── Deployment:    Vercel ISR (auto-rebuild on Decap Git push)
└── Config:        src/config/site-config.ts
```

---

## Content File Structure

```
content/
├── articles/          # Long-form, SEO-optimized
│   ├── meta.json
│   └── article-slug.mdx
├── notes/             # Atomic notes (Zettelkasten Phase 2)
│   ├── meta.json
│   └── note-slug.mdx
└── records/           # Structured data (projects, products)
    ├── projects/
    └── products/
```

---

## Video-Factory Frontmatter Contract (Phase 1 — LOCKED)

```yaml
---
# Core Identity
title: "Seed Title"
description: "Max 155 chars"
slug: "unique-seed-slug"
type: "article" | "note" | "record"
status: "draft" | "published" | "archived"
publishedAt: 2026-03-05
updatedAt: 2026-03-05
tags: []
category: ""

# SEO
seo:
  title: ""        # optional override
  og_image: ""     # R2 CDN URL
  noindex: false

# Media (R2 URLs only)
cover:
  url: ""
  alt: ""

# Video-Factory Contract (Phase 2 activation, Phase 1 schema)
video:
  enabled: false
  style: null      # "cinematic" | "tutorial" | "vlog"
  sections:
    - id: "intro"
      timestamp: "0:00"
      narration: ""
      b_roll_query: ""
      on_screen_text: ""
      media_refs: []

# Zettelkasten (Phase 2 graph, write now)
links:
  outbound: []     # ["note-slug-1", "note-slug-2"]
---
```

**Contract rule:** video-factory reads `content/**/*.mdx`, filters `video.enabled: true`, processes `video.sections`. No API needed.

---

## Phase 2 Evolution Path

| Feature | Mechanism |
|---|---|
| Zettelkasten backlinks | Build-time remark plugin parsing `[[wikilinks]]` → generates `backlinks.json` |
| TinaCMS upgrade | Replace Decap `config.yml` with `tina/config.ts`; Tina Cloud for non-techies |
| Theme engine | Theme Provider switching CSS Variables via `theme_id` in site-config.ts |
| PostgreSQL | Add only when: user auth, comments, or relational data needed |
| Pagefind | Drop-in when content > 1000 pages |

---

## Operational Risks

1. **Decap CMS OAuth on Vercel**: Requires OAuth proxy setup. Not hard, but must be in Phase 1 scope. Use `decap-server` locally; configure `git-gateway` or custom proxy for prod.
2. **Fumadocs learning curve**: Opinionated file structure (`source.config.ts`, `lib/source.ts`). Read their docs first before scaffolding.
3. **R2 CORS config**: Must be set up before MDX files reference R2 URLs — easy to overlook until images break.
4. **Frontmatter schema drift**: If video-factory evolves independently, schemas can diverge. Treat this contract as a versioned interface.

---

## Success Criteria (Phase 1)

- [ ] `git clone && npm install && npm run dev` works in < 5 min
- [ ] Decap CMS saves content via Git commit (no manual file edits needed)
- [ ] All Seeds render with proper SEO meta, JSON-LD, OG image
- [ ] Search returns results in < 100ms (Orama)
- [ ] All media referenced from R2 CDN (no local binaries)
- [ ] video-factory can parse any `video.enabled: true` seed without API calls
- [ ] `site-config.ts` change propagates to all UI (name, colors, social links)

---

## Unresolved Questions

1. **Decap OAuth proxy**: Which OAuth proxy approach for Vercel production? (`git-gateway` via Netlify Identity pointed at Vercel, or custom proxy)?
2. **Record types**: How polymorphic are `record` seeds? Projects vs Products may need different frontmatter shapes — use subfolder convention or a `record_type` discriminator field?
3. **`site-config.ts` scope**: Should theme color tokens live here or in a separate `theme.config.ts`? Relevant for Phase 2 theme switching.
