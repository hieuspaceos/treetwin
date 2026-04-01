/**
 * Barrel export for all landing section form components.
 * Builds the sectionFormMap registry and re-exports SectionFormProps type.
 */
import type { SectionFormProps } from './form-primitives'

import { HeroSectionForm } from './hero-section-form'
import { NavSectionForm, FooterSectionForm } from './nav-footer-section-forms'
import { FeaturesSectionForm } from './features-section-form'
import { PricingSectionForm } from './pricing-section-form'
import { TestimonialsSectionForm } from './testimonials-section-form'
import { VideoSectionForm, ImageSectionForm, ImageTextSectionForm, GallerySectionForm } from './media-section-forms'
import { StatsSectionForm, HowItWorksSectionForm, TeamSectionForm, FaqSectionForm, LogoWallSectionForm, LayoutSectionForm } from './layout-section-forms'
import { CountdownSectionForm, ContactFormSectionForm, PopupSectionForm, MapSectionForm } from './interactive-section-forms'
import { CtaSectionForm, BannerSectionForm, DividerSectionForm, RichTextSectionForm, ComparisonSectionForm, AiSearchSectionForm, SocialProofSectionForm } from './simple-section-forms'

/** Maps section type string to its form component */
export const sectionFormMap: Record<string, React.ComponentType<SectionFormProps<any>>> = {
  nav: NavSectionForm,
  hero: HeroSectionForm,
  features: FeaturesSectionForm,
  pricing: PricingSectionForm,
  testimonials: TestimonialsSectionForm,
  faq: FaqSectionForm,
  cta: CtaSectionForm,
  stats: StatsSectionForm,
  'how-it-works': HowItWorksSectionForm,
  team: TeamSectionForm,
  'logo-wall': LogoWallSectionForm,
  footer: FooterSectionForm,
  video: VideoSectionForm,
  image: ImageSectionForm,
  'image-text': ImageTextSectionForm,
  gallery: GallerySectionForm,
  map: MapSectionForm,
  'rich-text': RichTextSectionForm,
  divider: DividerSectionForm,
  countdown: CountdownSectionForm,
  'contact-form': ContactFormSectionForm,
  banner: BannerSectionForm,
  comparison: ComparisonSectionForm,
  'ai-search': AiSearchSectionForm,
  'social-proof': SocialProofSectionForm,
  layout: LayoutSectionForm,
  popup: PopupSectionForm,
}

export type { SectionFormProps } from './form-primitives'
