# Phase 3: Product Templates

## Context Links
- Landing types: `src/lib/landing/landing-types.ts` (Phase 1)
- Landing config renderer: Phase 2
- Content config: `src/content.config.ts`

## Overview
- **Priority:** P2
- **Status:** Pending
- **Effort:** 2h
- **Depends on:** Phase 1
- **Description:** 5 pre-built YAML templates with default section configs + placeholder content. Used by AI Setup Wizard (Phase 6) and manual template selection.

## Key Insights
- Templates are YAML files with complete section configs -- ready to deploy as-is
- Template = starting point, not constraint. User can add/remove/reorder sections after applying
- Each template targets a specific product type with sensible defaults
- Templates stored separately from landing pages (read-only reference, not edited)
- "Apply template" = copy template YAML into `landing-pages/` with user customization

## Requirements

### Functional
- 5 templates: saas, agency, course, ecommerce, portfolio
- Each template has pre-filled placeholder content (headlines, descriptions, pricing)
- Templates define section order and which sections are enabled
- Template metadata: name, description, preview thumbnail path, target audience
- Admin can preview template before applying

### Non-functional
- Templates are static YAML files -- no code generation
- Placeholder text is realistic (not lorem ipsum) for better preview

## Architecture

### Template Storage
```
src/content/templates/
  saas.yaml
  agency.yaml
  course.yaml
  ecommerce.yaml
  portfolio.yaml
```

### Template Schema
```yaml
# src/content/templates/saas.yaml
name: "SaaS Product"
description: "Software-as-a-Service landing page with hero, features, pricing, testimonials, and FAQ"
targetAudience: "B2B/B2C software products"
previewImage: "/images/templates/saas-preview.png"
sections:
  - type: hero
    order: 1
    enabled: true
    data:
      headline: "Your Product Headline"
      subheadline: "One sentence that explains your value proposition clearly"
      cta:
        text: "Start Free Trial"
        url: "/signup"
  - type: features
    order: 2
    enabled: true
    data:
      heading: "Everything you need"
      columns: 3
      items:
        - icon: "zap"
          title: "Lightning Fast"
          description: "Optimized for speed and performance"
        - icon: "shield"
          title: "Secure by Default"
          description: "Enterprise-grade security built-in"
        - icon: "puzzle"
          title: "Easy Integration"
          description: "Works with your existing tools"
  - type: pricing
    order: 3
    enabled: true
    data:
      heading: "Simple, transparent pricing"
      plans:
        - name: "Starter"
          price: "$29"
          period: "/month"
          features: ["1,000 requests/mo", "Email support", "1 project"]
          cta: { text: "Get Started", url: "/signup?plan=starter" }
        - name: "Pro"
          price: "$99"
          period: "/month"
          highlighted: true
          features: ["50,000 requests/mo", "Priority support", "10 projects", "API access"]
          cta: { text: "Go Pro", url: "/signup?plan=pro" }
        - name: "Enterprise"
          price: "Custom"
          features: ["Unlimited requests", "Dedicated support", "Custom SLA", "On-premise option"]
          cta: { text: "Contact Sales", url: "/contact" }
  - type: testimonials
    order: 4
    enabled: true
    data:
      heading: "Trusted by teams worldwide"
      items:
        - quote: "This product transformed how we work. Setup took 5 minutes."
          name: "Jane Smith"
          role: "CTO"
          company: "TechCorp"
        - quote: "Best ROI on any tool we've purchased this year."
          name: "John Doe"
          role: "VP Engineering"
          company: "StartupXYZ"
  - type: faq
    order: 5
    enabled: true
    data:
      heading: "Frequently asked questions"
      items:
        - question: "How do I get started?"
          answer: "Sign up for a free trial. No credit card required."
        - question: "Can I cancel anytime?"
          answer: "Yes, cancel anytime from your dashboard. No lock-in."
        - question: "Do you offer a free plan?"
          answer: "We offer a 14-day free trial on all plans."
  - type: cta
    order: 6
    enabled: true
    data:
      headline: "Ready to get started?"
      subheadline: "Join thousands of teams already using our product"
      cta:
        text: "Start Free Trial"
        url: "/signup"
      variant: accent
```

### Template Section Composition

| Template | Sections |
|----------|----------|
| saas | hero, features, pricing, testimonials, faq, cta |
| agency | hero, features, team, testimonials, logo-wall, cta |
| course | hero, features, pricing, testimonials, faq, cta |
| ecommerce | hero, features, stats, testimonials, logo-wall, cta |
| portfolio | hero, features, stats, how-it-works, cta |

### Content Collection for Templates

```typescript
// Add to src/content.config.ts
const templates = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/templates' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    targetAudience: z.string().optional(),
    previewImage: z.string().optional(),
    sections: z.array(z.object({
      type: z.enum(['hero', 'features', 'pricing', 'testimonials', 'faq', 'cta', 'stats', 'how-it-works', 'team', 'logo-wall']),
      order: z.number(),
      enabled: z.boolean().default(true),
      data: z.record(z.unknown()),
    })),
  }),
})
```

### Template Apply Helper

```typescript
// src/lib/landing/template-apply.ts
import type { LandingPageConfig } from './landing-types'

/**
 * Apply a template to create a new landing page config.
 * Merges template sections with user overrides.
 */
export function applyTemplate(
  templateSections: LandingPageConfig['sections'],
  overrides: {
    title: string
    description?: string
    slug: string
  }
): LandingPageConfig {
  return {
    slug: overrides.slug,
    title: overrides.title,
    description: overrides.description,
    sections: templateSections.map(s => ({ ...s })), // deep copy
  }
}
```

## Related Code Files

### Create
- `src/content/templates/saas.yaml`
- `src/content/templates/agency.yaml`
- `src/content/templates/course.yaml`
- `src/content/templates/ecommerce.yaml`
- `src/content/templates/portfolio.yaml`
- `src/lib/landing/template-apply.ts`

### Modify
- `src/content.config.ts` -- add `templates` collection

## Implementation Steps

1. Create `src/content/templates/` directory
2. Write `saas.yaml` with full section config (hero + features + pricing + testimonials + faq + cta)
3. Write `agency.yaml` (hero + features + team + testimonials + logo-wall + cta)
4. Write `course.yaml` (hero + features + pricing + testimonials + faq + cta -- different defaults than SaaS)
5. Write `ecommerce.yaml` (hero + features + stats + testimonials + logo-wall + cta)
6. Write `portfolio.yaml` (hero + features + stats + how-it-works + cta)
7. Add `templates` collection to `content.config.ts`
8. Create `template-apply.ts` helper for merging template with user overrides
9. Verify `astro build` passes with template collection

## Todo List
- [ ] Create `src/content/templates/` directory
- [ ] Write `saas.yaml` template
- [ ] Write `agency.yaml` template
- [ ] Write `course.yaml` template
- [ ] Write `ecommerce.yaml` template
- [ ] Write `portfolio.yaml` template
- [ ] Add `templates` collection to `content.config.ts`
- [ ] Create `template-apply.ts`
- [ ] Verify build passes

## Success Criteria
- All 5 templates valid YAML, pass schema validation
- Each template renders a complete landing page when copied to `landing-pages/`
- Placeholder content is realistic and professional
- `template-apply.ts` correctly merges overrides

## Risk Assessment
- **Risk:** Templates become stale as components evolve -> **Mitigation:** templates are simple YAML, easy to update
- **Risk:** Placeholder content looks generic -> **Mitigation:** write industry-specific copy, not lorem ipsum

## GoClaw Integration Points
- `GET /api/goclaw/templates` -- list available templates (Phase 7)
- `POST /api/goclaw/setup` uses templates as starting point (Phase 6/7)
- Agents can read template structure to understand available sections
