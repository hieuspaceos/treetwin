/**
 * Landing page type definitions — shared by Astro components, admin editor, and GoClaw API.
 * Each section type has a typed data interface matching the YAML config schema.
 */

export interface HeroData {
  headline: string
  subheadline?: string
  /** Single CTA (legacy) or array of CTAs — first = primary, rest = secondary/outline */
  cta?: { text: string; url: string; variant?: 'primary' | 'secondary' | 'outline' } | Array<{ text: string; url: string; variant?: 'primary' | 'secondary' | 'outline' }>
  backgroundImage?: string
  embed?: string
  /** Layout variant: centered (default), split (text left + media right), video-bg (full-width bg), minimal (no CTA) */
  variant?: 'centered' | 'split' | 'video-bg' | 'minimal'
}

export interface FeatureItem {
  icon?: string
  title: string
  description: string
  /** Optional price tag displayed at bottom of card */
  price?: string
  /** Price type badge (e.g. "one-time", "ai-addon", "bundled") */
  priceType?: string
}
export interface FeaturesData {
  heading?: string
  subheading?: string
  items: FeatureItem[]
  columns?: 2 | 3 | 4
  /** Layout variant: grid (default), list (icon left + text right), alternating (zigzag rows) */
  variant?: 'grid' | 'list' | 'alternating'
}

export interface PricingPlan {
  name: string
  price: string
  period?: string
  description?: string
  badge?: string
  features: string[]
  cta: { text: string; url: string }
  highlighted?: boolean
}
export interface PricingData {
  heading?: string
  subheading?: string
  plans: PricingPlan[]
  /** Layout variant: cards (default), simple (horizontal row compact), highlight-center (center plan elevated) */
  variant?: 'cards' | 'simple' | 'highlight-center'
}

export interface Testimonial {
  quote: string
  name: string
  role?: string
  company?: string
  avatar?: string
  /** Screenshot image of the original testimonial post — displayed as card image in carousel/cards */
  image?: string
}
export interface TestimonialsData {
  heading?: string
  items: Testimonial[]
  /** Layout variant: cards (default), single (one large quote centered), minimal (text-only, no avatars), carousel (auto-scrolling horizontal) */
  variant?: 'cards' | 'single' | 'minimal' | 'carousel'
}

export interface FaqItem {
  question: string
  answer: string
}
export interface FaqData {
  heading?: string
  items: FaqItem[]
  /** Layout variant: accordion (default, details/summary), two-column (Q left, A right), simple (all expanded) */
  variant?: 'accordion' | 'two-column' | 'simple'
}

export interface CtaData {
  headline: string
  subheadline?: string
  /** Single CTA (legacy) or array of CTAs — first = primary, rest = secondary/outline */
  cta: { text: string; url: string; variant?: 'primary' | 'secondary' | 'outline' } | Array<{ text: string; url: string; variant?: 'primary' | 'secondary' | 'outline' }>
  /** Layout variant: centered (default), split (text left + btn right), banner (full-width gradient), minimal (text link only), with-image (bg image + overlay) */
  variant?: 'default' | 'split' | 'banner' | 'minimal' | 'with-image'
  backgroundImage?: string
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
  /** Layout variant: row (default), cards (each stat in a card), large (big numbers vertical stack) */
  variant?: 'row' | 'cards' | 'large'
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
  /** Layout variant: numbered (default), timeline (vertical with dots/lines), cards (step cards in a grid) */
  variant?: 'numbered' | 'timeline' | 'cards'
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
  /** Layout variant: grid (default), list (horizontal list with small photos), compact (names only, no photos) */
  variant?: 'grid' | 'list' | 'compact'
}

export interface LogoWallData {
  heading?: string
  logos: Array<{ name: string; url?: string; image: string }>
}

export interface NavData {
  brandName?: string
  /** Custom nav links — if empty, auto-generated from enabled sections */
  links?: Array<{ label: string; href: string }>
  /** Layout variant: default (logo left, links right), centered (logo center, links split), transparent (no background overlay) */
  variant?: 'default' | 'centered' | 'transparent'
}

export interface FooterData {
  text?: string
  links?: Array<{ label: string; href: string }>
  /** Layout variant: simple (default, centered text), columns (multi-column with link groups), minimal (just copyright) */
  variant?: 'simple' | 'columns' | 'minimal'
  /** Column groups for columns variant — array of { heading, links[] } */
  columns?: Array<{ heading: string; links: Array<{ label: string; href: string }> }>
}

export interface VideoData {
  url: string
  caption?: string
  autoplay?: boolean
}

export interface ImageData {
  src: string
  alt?: string
  caption?: string
  fullWidth?: boolean
}

export interface ImageTextData {
  image: { src: string; alt?: string }
  heading?: string
  text: string
  imagePosition?: 'left' | 'right'
  cta?: { text: string; url: string }
}

export interface GalleryItem { src: string; alt?: string; caption?: string }
export interface GalleryData {
  heading?: string
  images: GalleryItem[]
}

export interface MapData {
  address?: string
  embedUrl?: string
  height?: number
}

export interface RichTextData {
  content: string
}

export interface DividerData {
  style?: 'line' | 'dots' | 'space'
  height?: number
}

export interface CountdownData {
  targetDate: string
  heading?: string
  expiredText?: string
}

export interface ContactFormField { label: string; type: 'text' | 'email' | 'textarea' }
export interface ContactFormData {
  heading?: string
  fields?: ContactFormField[]
  submitText?: string
  submitUrl?: string
}

export interface BannerData {
  text: string
  cta?: { text: string; url: string }
  variant?: 'info' | 'warning' | 'success'
}

/** Social proof — short trust line, inline or banner style */
export interface SocialProofData {
  text: string
  /** Optional icon/emoji displayed before text */
  icon?: string
  /** Optional link URL — makes the strip clickable */
  link?: string
  variant?: 'inline' | 'banner'
}

export interface LayoutChild {
  column: number
  sections: LandingSection[]
}
export interface LayoutData {
  columns: number[]  // ratio array, e.g. [1, 1] = 50/50, [1, 2] = 33/67
  gap?: string
  children: LayoutChild[]
}

/** Comparison table — side-by-side feature/price comparison */
export interface ComparisonColumn {
  label: string
}
export interface ComparisonRow {
  label: string
  values: string[]
  /** Highlight this row with accent color */
  highlight?: boolean
}
export interface ComparisonData {
  heading?: string
  subheading?: string
  columns: ComparisonColumn[]
  rows: ComparisonRow[]
}

/** AI search input — textarea with hint chips and suggestion results */
export interface AiSearchSuggestion {
  icon?: string
  name: string
  description: string
  price?: string
  priceType?: string
  url?: string
}
export interface AiSearchIntent {
  /** Keywords to match in user input */
  keywords: string[]
  suggestions: AiSearchSuggestion[]
}
export interface AiSearchData {
  placeholder?: string
  thinkingText?: string
  resultsHeader?: string
  hints?: Array<{ icon?: string; label: string; text: string }>
  /** Default suggestions shown when no intent matches */
  defaultSuggestions?: AiSearchSuggestion[]
  /** Intent-based suggestion groups */
  intents?: AiSearchIntent[]
}

/** Per-page design settings — colors, fonts, border radius */
export interface LandingDesign {
  preset?: string
  colors?: {
    primary?: string
    secondary?: string
    accent?: string
    background?: string
    surface?: string
    text?: string
    textMuted?: string
  }
  fonts?: {
    heading?: string
    body?: string
  }
  borderRadius?: string
}

/** All possible section type identifiers */
export type SectionType = 'hero' | 'features' | 'pricing' | 'testimonials' | 'faq' | 'cta' | 'stats' | 'how-it-works' | 'team' | 'logo-wall' | 'nav' | 'footer' | 'video' | 'image' | 'image-text' | 'gallery' | 'map' | 'rich-text' | 'divider' | 'countdown' | 'contact-form' | 'banner' | 'layout' | 'comparison' | 'ai-search' | 'social-proof'

/** Union of all section data types */
export type SectionData = HeroData | FeaturesData | PricingData | TestimonialsData | FaqData | CtaData | StatsData | HowItWorksData | TeamData | LogoWallData | NavData | FooterData | VideoData | ImageData | ImageTextData | GalleryData | MapData | RichTextData | DividerData | CountdownData | ContactFormData | BannerData | LayoutData | ComparisonData | AiSearchData | SocialProofData

export interface LandingSection {
  type: SectionType
  order: number
  enabled: boolean
  data: SectionData
}

export interface LandingPageConfig {
  slug: string
  title: string
  description?: string
  template?: string
  design?: LandingDesign
  sections: LandingSection[]
}
