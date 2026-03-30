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
  /** Layout variant: centered (default), split (text left + media right), video-bg (full-width bg), minimal (no CTA), fullscreen (100vh + ken-burns), slider (multi-slide auto-rotate) */
  variant?: 'centered' | 'split' | 'video-bg' | 'minimal' | 'fullscreen' | 'slider'
  /** Multiple slides for slider variant */
  items?: Array<{ headline: string; subheadline?: string; backgroundImage?: string }>
}

export interface FeatureItem {
  icon?: string
  title: string
  description: string
  /** Cover image URL for image-card style features */
  image?: string
  /** Link URL — makes the card clickable */
  url?: string
  /** Optional price tag displayed at bottom of card */
  price?: string
  /** Price type badge (e.g. "one-time", "ai-addon", "bundled") */
  priceType?: string
}
export interface FeaturesData {
  heading?: string
  subheading?: string
  items: FeatureItem[]
  columns?: 2 | 3 | 4 | 5
  /** Layout variant: grid (default), list (icon left + text right), alternating (zigzag rows), masonry (CSS columns), icon-strip (horizontal scrollable icon bar), bento (CSS grid first item 2-row span) */
  variant?: 'grid' | 'list' | 'alternating' | 'masonry' | 'icon-strip' | 'bento'
}

export interface PricingPlan {
  name: string
  price: string
  period?: string
  description?: string
  badge?: string
  /** Cover image URL for travel/product cards */
  image?: string
  features: string[]
  cta: { text: string; url: string }
  highlighted?: boolean
}
export interface PricingData {
  heading?: string
  subheading?: string
  plans: PricingPlan[]
  /** Layout variant: cards (default), simple (horizontal row compact), highlight-center (center plan elevated), comparison (table: features as rows/plans as columns), toggle (monthly/annual switch) */
  variant?: 'cards' | 'simple' | 'highlight-center' | 'comparison' | 'toggle'
  /** Annual plans for toggle variant — swapped in when annual billing selected */
  annualPlans?: PricingPlan[]
  /** Feature rows for comparison variant — array of { label, values[] } */
  comparisonRows?: Array<{ label: string; values: string[]; highlight?: boolean }>
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
  /** Layout variant: cards (default), single (one large quote centered), minimal (text-only, no avatars), carousel (auto-scrolling horizontal), quote-wall (masonry grid, text only), logo-strip (horizontal logos + featured quote) */
  variant?: 'cards' | 'single' | 'minimal' | 'carousel' | 'quote-wall' | 'logo-strip'
  /** Company logos for logo-strip variant */
  logos?: Array<{ name: string; image?: string; url?: string }>
}

export interface FaqItem {
  question: string
  answer: string
}
export interface FaqData {
  heading?: string
  items: FaqItem[]
  /** Layout variant: accordion (default, details/summary), two-column (Q left, A right), simple (all expanded), searchable (client-side filter input) */
  variant?: 'accordion' | 'two-column' | 'simple' | 'searchable'
}

export interface CtaData {
  headline: string
  subheadline?: string
  /** Single CTA (legacy) or array of CTAs — first = primary, rest = secondary/outline */
  cta: { text: string; url: string; variant?: 'primary' | 'secondary' | 'outline' } | Array<{ text: string; url: string; variant?: 'primary' | 'secondary' | 'outline' }>
  /** Layout variant: centered (default), split (text left + btn right), banner (full-width gradient), minimal (text link only), with-image (bg image + overlay), floating (fixed bottom bar dismissible) */
  variant?: 'default' | 'split' | 'banner' | 'minimal' | 'with-image' | 'floating'
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
  /** Layout variant: row (default), cards (each stat in a card), large (big numbers vertical stack), counter (animated count-up on scroll) */
  variant?: 'row' | 'cards' | 'large' | 'counter'
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
  /** Logo image URL — displayed instead of brandName text when provided */
  logo?: string
  /** Top info bar items (phone, email, etc.) — rendered above main nav */
  topBar?: Array<{ icon?: string; text: string; href?: string }>
  /** Custom nav links — if empty, auto-generated from enabled sections */
  links?: Array<{ label: string; href: string }>
  /** Layout variant: default (logo left, links right), centered (logo center, links split), transparent (no background overlay), hamburger (always icon, full-screen overlay), mega (dropdown panels with groups) */
  variant?: 'default' | 'centered' | 'transparent' | 'hamburger' | 'mega'
  /** Social media links shown in nav */
  socialLinks?: Array<{ icon: string; url: string; label?: string }>
  /** Link groups for mega dropdown variant — array of { label, links[] } */
  groups?: Array<{ label: string; links: Array<{ label: string; href: string; description?: string }> }>
}

export interface FooterData {
  text?: string
  links?: Array<{ label: string; href: string }>
  /** Layout variant: simple (default, centered text), columns (multi-column with link groups), minimal (just copyright), mega (4-5 cols + newsletter + social), centered-social (centered text + large social icons) */
  variant?: 'simple' | 'columns' | 'minimal' | 'mega' | 'centered-social'
  /** Column groups for columns/mega variant — array of { heading, links[] } */
  columns?: Array<{ heading: string; links: Array<{ label: string; href: string }> }>
  /** Social media links shown in footer */
  socialLinks?: Array<{ icon: string; url: string; label?: string }>
  /** Newsletter signup for mega variant */
  newsletter?: { heading?: string; placeholder?: string; buttonText?: string; action?: string }
}

export interface VideoData {
  url: string
  caption?: string
  autoplay?: boolean
  heading?: string
  subheading?: string
  cta?: { text: string; url: string }
  /** Additional videos for multi-video grid layout */
  items?: Array<{ url: string; caption?: string }>
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
  subheading?: string
  images: GalleryItem[]
  variant?: 'grid' | 'masonry' | 'carousel' | 'lightbox' | 'filmstrip'
  columns?: number
}

export interface MapData {
  address?: string
  embedUrl?: string
  height?: number
}

export interface RichTextData {
  content: string
  heading?: string
  subheading?: string
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
  subtext?: string
  icon?: string
  cta?: { text: string; url: string }
  variant?: 'info' | 'warning' | 'success' | 'promo' | 'announcement' | 'countdown' | 'minimal'
  dismissible?: boolean
  /** Background color override */
  background?: string
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

/** Layout variant — determines grid template at desktop breakpoint */
export type LayoutVariant = 'grid' | 'sidebar-left' | 'sidebar-right' | 'asymmetric' | 'thirds' | 'hero-split' | 'stacked' | 'masonry'

export interface LayoutData {
  columns: number[]  // ratio array, e.g. [1, 1] = 50/50, [1, 2] = 33/67
  gap?: string
  children: LayoutChild[]
  /** Layout variant — determines CSS grid behavior (default: grid) */
  variant?: LayoutVariant
  /** Reverse column order on mobile — useful when image should appear before text on small screens */
  mobileReverse?: boolean
  /** Vertical alignment of columns */
  alignItems?: 'start' | 'center' | 'end' | 'stretch'
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

/** Popup/modal overlay — triggered by scroll %, time delay, or exit intent */
export interface PopupData {
  heading?: string
  text?: string
  image?: string
  cta?: { text: string; url: string }
  trigger: {
    type: 'scroll' | 'time' | 'exit-intent'
    /** Scroll %: 0-100. Time: delay in seconds */
    value?: number
  }
  /** Show once per session (sessionStorage) vs every page load */
  showOnce?: boolean
  /** Dismiss button label (default: "✕") */
  dismissLabel?: string
  variant?: 'centered' | 'bottom-bar' | 'slide-in-right'
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
export type SectionType = 'hero' | 'features' | 'pricing' | 'testimonials' | 'faq' | 'cta' | 'stats' | 'how-it-works' | 'team' | 'logo-wall' | 'nav' | 'footer' | 'video' | 'image' | 'image-text' | 'gallery' | 'map' | 'rich-text' | 'divider' | 'countdown' | 'contact-form' | 'banner' | 'layout' | 'comparison' | 'ai-search' | 'social-proof' | 'popup'

/** Union of all section data types */
export type SectionData = HeroData | FeaturesData | PricingData | TestimonialsData | FaqData | CtaData | StatsData | HowItWorksData | TeamData | LogoWallData | NavData | FooterData | VideoData | ImageData | ImageTextData | GalleryData | MapData | RichTextData | DividerData | CountdownData | ContactFormData | BannerData | LayoutData | ComparisonData | AiSearchData | SocialProofData | PopupData

/** Per-section visual style overrides — extracted by AI or set manually in editor */
export interface SectionStyle {
  /** Section spans full viewport width (breaks out of container) */
  fullWidth?: boolean
  /** Background color or CSS gradient */
  background?: string
  /** Background image URL */
  backgroundImage?: string
  /** Gradient overlay on background image (e.g. for dark hero sections) */
  backgroundOverlay?: string
  /** Custom padding (e.g. "5rem 2rem") */
  padding?: string
  /** Override text color for this section (e.g. "#fff" for dark backgrounds) */
  textColor?: string
  /** Override muted text color */
  textMutedColor?: string
  /** Override accent color (stats numbers, stars, icons) */
  accentColor?: string
}

export interface LandingSection {
  type: SectionType
  order: number
  enabled: boolean
  data: SectionData
  /** Per-section visual style overrides */
  style?: SectionStyle
}

/** SEO settings for landing pages */
export interface LandingSeo {
  ogImage?: string
  keywords?: string
  canonicalUrl?: string
  noindex?: boolean
}

export interface LandingPageConfig {
  slug: string
  title: string
  description?: string
  template?: string
  design?: LandingDesign
  seo?: LandingSeo
  sections: LandingSection[]
  /** AI-generated scoped CSS for visual fidelity — injected as <style> block */
  scopedCss?: Array<{ selector: string; css: string }>
}
