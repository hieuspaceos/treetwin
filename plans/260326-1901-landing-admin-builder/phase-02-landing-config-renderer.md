# Phase 2: Landing Config & Renderer

## Context Links
- Landing types: `src/lib/landing/landing-types.ts` (Phase 1)
- Content IO: `src/lib/admin/content-io.ts`
- Content config: `src/content.config.ts`
- Existing index: `src/pages/index.astro`

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 3h
- **Depends on:** Phase 1
- **Description:** YAML config reader for landing pages + dynamic Astro page that renders sections in order.

## Key Insights
- Landing page config = YAML file in `src/content/landing-pages/`
- Astro glob loader reads YAML at build time -> static HTML
- Section renderer maps `type` string to Astro component
- Multiple landing pages supported (home, product-a, product-b)
- `[landing].astro` dynamic route catches all landing page slugs

## Requirements

### Functional
- Read YAML config files from `src/content/landing-pages/*.yaml`
- Render sections in `order` sequence, skip `enabled: false`
- Support multiple landing pages with unique slugs
- Home page (`slug: home`) renders at `/` (override default index)
- Other pages render at `/[slug]`

### Non-functional
- Static generation (prerender = true)
- Type-safe section data validation via Zod
- Build fails on invalid YAML (catches errors early)

## Architecture

### Data Flow
```
src/content/landing-pages/home.yaml
  -> Astro content collection (glob loader)
    -> [landing].astro reads config
      -> SectionRenderer maps type -> component
        -> Static HTML output
```

### YAML Config Example
```yaml
# src/content/landing-pages/home.yaml
title: "AI Chatbot that sells"
description: "Landing page for chatbot SaaS product"
template: saas
sections:
  - type: hero
    order: 1
    enabled: true
    data:
      headline: "AI Chatbot that sells"
      subheadline: "Turn every visitor into a customer with AI-powered conversations"
      cta:
        text: "Start Free"
        url: "/signup"
  - type: features
    order: 2
    enabled: true
    data:
      heading: "Why choose us"
      items:
        - icon: "brain"
          title: "Smart Conversations"
          description: "AI understands context and intent"
        - icon: "zap"
          title: "Instant Setup"
          description: "Copy-paste one script tag"
        - icon: "chart"
          title: "Analytics Built-in"
          description: "Track every conversation"
  - type: pricing
    order: 3
    enabled: true
    data:
      plans:
        - name: "Starter"
          price: "$29"
          period: "/month"
          features: ["1,000 conversations", "1 chatbot", "Email support"]
          cta: { text: "Get Started", url: "/signup?plan=starter" }
        - name: "Pro"
          price: "$99"
          period: "/month"
          highlighted: true
          features: ["10,000 conversations", "5 chatbots", "Priority support", "Custom branding"]
          cta: { text: "Go Pro", url: "/signup?plan=pro" }
```

### Content Collection Registration

```typescript
// Add to src/content.config.ts
const landingPages = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/landing-pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    template: z.string().optional(),
    sections: z.array(z.object({
      type: z.enum(['hero', 'features', 'pricing', 'testimonials', 'faq', 'cta', 'stats', 'how-it-works', 'team', 'logo-wall']),
      order: z.number(),
      enabled: z.boolean().default(true),
      data: z.record(z.unknown()), // validated per-type at render time
    })),
  }),
})
```

### Section Renderer Pattern

```astro
---
// src/components/landing/landing-section-renderer.astro
import LandingHero from './landing-hero.astro'
import LandingFeatures from './landing-features.astro'
import LandingPricing from './landing-pricing.astro'
import LandingTestimonials from './landing-testimonials.astro'
import LandingFaq from './landing-faq.astro'
import LandingCta from './landing-cta.astro'
import LandingStats from './landing-stats.astro'
import LandingHowItWorks from './landing-how-it-works.astro'
import LandingTeam from './landing-team.astro'
import LandingLogoWall from './landing-logo-wall.astro'
import type { LandingSection } from '@/lib/landing/landing-types'

interface Props {
  sections: LandingSection[]
}

const { sections } = Astro.props
const sorted = sections
  .filter(s => s.enabled)
  .sort((a, b) => a.order - b.order)

const componentMap = {
  hero: LandingHero,
  features: LandingFeatures,
  pricing: LandingPricing,
  testimonials: LandingTestimonials,
  faq: LandingFaq,
  cta: LandingCta,
  stats: LandingStats,
  'how-it-works': LandingHowItWorks,
  team: LandingTeam,
  'logo-wall': LandingLogoWall,
} as const
---

<div class="landing-sections space-y-8">
  {sorted.map(section => {
    const Component = componentMap[section.type]
    return Component ? <Component {...section.data as any} /> : null
  })}
</div>
```

### Dynamic Landing Page Route

```astro
---
// src/pages/[landing].astro
import { getCollection } from 'astro:content'
import BaseLayout from '@/layouts/base-layout.astro'
import LandingSectionRenderer from '@/components/landing/landing-section-renderer.astro'

export async function getStaticPaths() {
  const pages = await getCollection('landingPages')
  return pages
    .filter(p => p.id !== 'home') // home handled by index.astro override
    .map(p => ({ params: { landing: p.id }, props: { page: p } }))
}

const { page } = Astro.props
---

<BaseLayout title={page.data.title} description={page.data.description}>
  <LandingSectionRenderer sections={page.data.sections} />
</BaseLayout>
```

## Related Code Files

### Create
- `src/components/landing/landing-section-renderer.astro` -- maps section type to component
- `src/content/landing-pages/` -- directory for YAML configs
- `src/pages/[landing].astro` -- dynamic route for landing pages
- `src/lib/landing/landing-config-reader.ts` -- helper to read/validate landing YAML (for admin API)

### Modify
- `src/content.config.ts` -- add `landingPages` collection
- `src/pages/index.astro` -- conditionally use landing page config if `home.yaml` exists
- `src/lib/admin/validation.ts` -- add `'landing-pages'` to allowed collections

## Implementation Steps

1. Create `src/content/landing-pages/` directory
2. Add `landingPages` collection to `src/content.config.ts` with Zod schema
3. Create `landing-section-renderer.astro` with component map + sort + filter
4. Create `src/pages/[landing].astro` with `getStaticPaths` from collection
5. Create `landing-config-reader.ts` -- server-side helper for reading/writing landing YAML (used by admin API + GoClaw)
6. Update `src/pages/index.astro` to check for `home` landing page and render sections if it exists, fallback to current content
7. Add `'landing-pages'` to `ALLOWED_COLLECTIONS` in validation.ts (if using content-io for writes)
8. Create a sample `src/content/landing-pages/home.yaml` with hero + features + cta for testing
9. Run `astro check` and verify build passes

## Todo List
- [ ] Create `src/content/landing-pages/` directory
- [ ] Add `landingPages` collection to `content.config.ts`
- [ ] Create `landing-section-renderer.astro`
- [ ] Create `[landing].astro` dynamic route
- [ ] Create `landing-config-reader.ts`
- [ ] Update `index.astro` with landing page support
- [ ] Add sample `home.yaml`
- [ ] Verify `astro build` passes

## Success Criteria
- Landing pages rendered from YAML config
- Sections appear in correct order
- Disabled sections hidden
- Multiple landing pages work via `[landing].astro`
- Home landing page overrides default index
- `astro build` produces correct static HTML

## Risk Assessment
- **Risk:** Route conflict between `[landing].astro` and existing pages -> **Mitigation:** exclude known slugs (about, search, 404) in `getStaticPaths`, or use a prefix like `/l/[landing]`
- **Risk:** YAML data type mismatches at render -> **Mitigation:** Zod validation in content collection schema

## GoClaw Integration Points
- `landing-config-reader.ts` is the shared module used by both:
  - Phase 4 (Admin editor) to read/write configs
  - Phase 7 (GoClaw API) to expose sections via REST
