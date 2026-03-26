# Tree Identity (TreeID) — Project Overview

## Core Essence

Tree Identity is a **Digital Entity** serving as the "Root" in the HSpaceOS ecosystem. It bridges human thinking with AI processing capabilities.

- **For humans:** A professional Portfolio/Blog/Wiki with tree-structure navigation
- **For AI/LLMs:** A structured Knowledge Graph providing clean data (Structured Data) so chatbots and AI Agents can read, understand, and reproduce the owner's style and knowledge

## Architecture

### A. The Root (Foundation Data)

- **Identity Profile:** Unique identifiers — Name (HieuSpace), Domain (Full-stack Dev, Trading), Philosophy (A-Mastery)
- **Data Sources:** Cloudflare R2 (images/video), git-tracked Markdown files (content)

### B. The Trunk (Orchestration Layer — Starter Kit)

- **Config-Driven:** All identity parameters controlled by `site-config.ts`. Enables "cloning" the digital entity to different domains while preserving core "DNA"
- **Universal Schema:** AI-readable standards — JSON-LD, Schema.org, Markdown

### C. The Branches & Leaves (Content & Distribution)

- **Seeds:** Articles, trading journals (DAC 7.0), project notes written in Markdown
- **Manifests:** Auto-exported JSON files containing scripts, timestamps, and media directives for Video Factory

## AI-Ready Specs

Standards applied so LLMs (Claude, GPT, Gemini) can crawl and accurately "recognize" the digital entity:

- **Semantic HTML & Markdown:** Logical heading structure (H1-H6) so AI understands the article's mindmap
- **JSON-LD Entity Mapping:** Structured data embedded in page headers (Schema.org Person, Article, etc.)
- **Prompt-Friendly Content:** Seed-based writing — small concepts for clean AI extraction and summarization without context confusion

## Use Cases

1. **Digital Authority:** Establish presence via a single domain (hieuspace.com)
2. **Knowledge Digitization:** Convert personal knowledge into a digital asset both humans and AI can interact with, learn from, and build upon
3. **AI Agent Integration:** External orchestration systems (GoClaw) use Tree Identity as a content API — agents draft, humans approve, then auto-publish

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Astro 5.x | SSG, content-first, zero JS by default |
| CMS | Keystatic | Git-based admin UI, Markdown content |
| Search | Pagefind | Static search index, zero runtime cost |
| Storage | Cloudflare R2 | Media files (optional) |
| Deploy | Vercel | Hosting, serverless functions |
| Styling | Tailwind CSS 4.0 | Theme-aware CSS variables |

## Theme System

- CSS variable-driven (`--t-*` tokens) defined in `src/themes/`
- Theme selection via `site-config.ts` (`theme.id` field)
- Built-in theme: `liquid-glass` (glass morphism)
- Adding themes: create theme file in `src/themes/`, register in `theme-resolver.ts`, set id in `site-config.ts`

## Key Design Decisions

- **No database** — content is git-tracked Markdown/YAML files in `src/content/`
- **No shadcn/ui** — plain Tailwind CSS 4
- **Zero JS by default** — Astro islands only where needed (ToC, search)
- **Static by default** — `output: 'static'`, per-page `prerender = false` for SSR endpoints
- **Config-driven identity** — `site-config.ts` as single source of truth for site metadata
- **AI-first content structure** — Markdown seeds, JSON-LD, semantic HTML
- **Custom admin dashboard** — full-featured at `/admin` (not Keystatic UI)
- **Multi-tenant support** — Per-product admin, API scoping, feature toggles per product
- **Self-hosted fonts** — Removed Google Fonts CDN, fonts in `public/fonts/`
- **Shared head component** — `base-head.astro` for OG/Twitter meta, aria-labels, form labels, section IDs
