# Phase 1: Landing Section Components

## Context Links
- Feature registry: `src/lib/admin/feature-registry.ts`
- Existing index page: `src/pages/index.astro`
- Base layout: `src/layouts/base-layout.astro`
- Glass CSS: `src/styles/globals.css` (`.glass-panel`, `.glass-card`)

## Overview
- **Priority:** P1 (foundation for all other phases)
- **Status:** Pending
- **Effort:** 5h
- **Description:** Create 10 Astro section components for landing pages. Pure HTML/CSS, zero client JS. Each component receives typed props from YAML config.

## Key Insights
- Astro components are server-rendered -- zero JS shipped to client
- Reuse existing glass morphism CSS classes (`.glass-panel`, `.glass-card`)
- Each section = self-contained component with typed `Props` interface
- Sections must work standalone (no inter-section dependencies)
- Use Tailwind CSS 4 utility classes + existing design tokens (`--t-*` vars)

## Requirements

### Functional
- 10 section types: hero, features, pricing, testimonials, faq, cta, stats, how-it-works, team, logo-wall
- Each accepts structured props matching YAML schema
- Responsive design (mobile-first)
- Support `enabled: boolean` flag (renderer skips disabled sections)

### Non-functional
- Zero client-side JavaScript
- Accessible (semantic HTML, ARIA where needed)
- < 50 lines per component (KISS)

## Architecture

```
src/components/landing/
  landing-hero.astro
  landing-features.astro
  landing-pricing.astro
  landing-testimonials.astro
  landing-faq.astro
  landing-cta.astro
  landing-stats.astro
  landing-how-it-works.astro
  landing-team.astro
  landing-logo-wall.astro
```

Each component follows this pattern:
```astro
---
// landing-hero.astro
interface Props {
  headline: string
  subheadline?: string
  cta?: { text: string; url: string }
  backgroundImage?: string
  embed?: string
}
const { headline, subheadline, cta, backgroundImage, embed } = Astro.props
---

<section class="landing-hero glass-panel rounded-2xl px-8 py-16 text-center">
  <h1 class="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
    {headline}
  </h1>
  {subheadline && (
    <p class="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
      {subheadline}
    </p>
  )}
  {cta && (
    <a href={cta.url} class="mt-6 inline-block rounded-xl bg-green-600 px-6 py-3 text-white font-semibold hover:bg-green-700 transition-colors">
      {cta.text}
    </a>
  )}
  {embed && <div class="mt-8" set:html={embed} />}
</section>
```

### Props Type Definitions

Create shared types file consumed by both components and YAML reader:

```typescript
// src/lib/landing/landing-types.ts

export interface HeroData {
  headline: string
  subheadline?: string
  cta?: { text: string; url: string }
  backgroundImage?: string
  embed?: string
}

export interface FeatureItem {
  icon?: string  // emoji or SVG reference
  title: string
  description: string
}
export interface FeaturesData {
  heading?: string
  subheading?: string
  items: FeatureItem[]
  columns?: 2 | 3 | 4
}

export interface PricingPlan {
  name: string
  price: string
  period?: string
  description?: string
  features: string[]
  cta: { text: string; url: string }
  highlighted?: boolean
}
export interface PricingData {
  heading?: string
  subheading?: string
  plans: PricingPlan[]
}

export interface Testimonial {
  quote: string
  name: string
  role?: string
  company?: string
  avatar?: string
}
export interface TestimonialsData {
  heading?: string
  items: Testimonial[]
}

export interface FaqItem {
  question: string
  answer: string
}
export interface FaqData {
  heading?: string
  items: FaqItem[]
}

export interface CtaData {
  headline: string
  subheadline?: string
  cta: { text: string; url: string }
  variant?: 'default' | 'accent' | 'dark'
}

export interface StatItem {
  value: string
  label: string
  prefix?: string
  suffix?: string
}
export interface StatsData {
  heading?: string
  items: StatItem[]
}

export interface StepItem {
  number?: number
  title: string
  description: string
  icon?: string
}
export interface HowItWorksData {
  heading?: string
  subheading?: string
  items: StepItem[]
}

export interface TeamMember {
  name: string
  role: string
  photo?: string
  bio?: string
  social?: { twitter?: string; linkedin?: string; github?: string }
}
export interface TeamData {
  heading?: string
  subheading?: string
  members: TeamMember[]
}

export interface LogoWallData {
  heading?: string
  logos: Array<{ name: string; url?: string; image: string }>
}

export interface LandingSection {
  type: 'hero' | 'features' | 'pricing' | 'testimonials' | 'faq' | 'cta' | 'stats' | 'how-it-works' | 'team' | 'logo-wall'
  order: number
  enabled: boolean
  data: HeroData | FeaturesData | PricingData | TestimonialsData | FaqData | CtaData | StatsData | HowItWorksData | TeamData | LogoWallData
}

export interface LandingPageConfig {
  slug: string
  title: string
  description?: string
  template?: string
  theme?: string
  sections: LandingSection[]
}
```

## Related Code Files

### Create
- `src/lib/landing/landing-types.ts` -- shared TypeScript types
- `src/components/landing/landing-hero.astro`
- `src/components/landing/landing-features.astro`
- `src/components/landing/landing-pricing.astro`
- `src/components/landing/landing-testimonials.astro`
- `src/components/landing/landing-faq.astro`
- `src/components/landing/landing-cta.astro`
- `src/components/landing/landing-stats.astro`
- `src/components/landing/landing-how-it-works.astro`
- `src/components/landing/landing-team.astro`
- `src/components/landing/landing-logo-wall.astro`
- `src/styles/landing.css` -- landing-specific styles

### Modify
- None (standalone creation)

## Implementation Steps

1. Create `src/lib/landing/landing-types.ts` with all section data interfaces
2. Create `src/styles/landing.css` with section base styles (spacing, responsive grid helpers)
3. Create `landing-hero.astro` -- headline, subheadline, CTA button, optional background image
4. Create `landing-features.astro` -- configurable grid (2-4 cols) of icon + title + description cards
5. Create `landing-pricing.astro` -- plan cards with feature lists, highlighted plan support
6. Create `landing-testimonials.astro` -- quote cards with avatar, name, company
7. Create `landing-faq.astro` -- `<details>/<summary>` accordion (native HTML, zero JS)
8. Create `landing-cta.astro` -- banner with headline + button, variant support
9. Create `landing-stats.astro` -- number grid with labels
10. Create `landing-how-it-works.astro` -- numbered step cards
11. Create `landing-team.astro` -- member cards with photo, role, social links
12. Create `landing-logo-wall.astro` -- responsive logo grid with optional links
13. Verify all components render correctly in isolation with hardcoded test props

## Todo List
- [ ] Create `landing-types.ts` with all interfaces
- [ ] Create `landing.css` with section styles
- [ ] Create `landing-hero.astro`
- [ ] Create `landing-features.astro`
- [ ] Create `landing-pricing.astro`
- [ ] Create `landing-testimonials.astro`
- [ ] Create `landing-faq.astro`
- [ ] Create `landing-cta.astro`
- [ ] Create `landing-stats.astro`
- [ ] Create `landing-how-it-works.astro`
- [ ] Create `landing-team.astro`
- [ ] Create `landing-logo-wall.astro`
- [ ] Verify `astro check` passes with new components

## Success Criteria
- All 10 components created with typed props
- Each component < 50 lines
- Zero client-side JavaScript
- Responsive on mobile/tablet/desktop
- `astro check` passes with 0 errors
- Glass morphism design consistent with existing site

## Risk Assessment
- **Risk:** Component complexity creep -> **Mitigation:** strict < 50 lines rule, extract CSS to landing.css
- **Risk:** FAQ accordion needs JS -> **Mitigation:** use native `<details>/<summary>` (supported in all modern browsers)

## GoClaw Integration Points
- Components are pure rendering -- no direct GoClaw integration
- GoClaw endpoints (Phase 7) modify the YAML data that these components consume
- Each section type maps 1:1 to a GoClaw section endpoint
