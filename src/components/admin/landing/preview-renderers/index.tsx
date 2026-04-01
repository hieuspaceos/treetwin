/**
 * Barrel export for preview renderers. Builds and exports the renderSection
 * dispatch function plus all individual preview components and shared helpers.
 */
import type { LandingSection, HeroData, FeaturesData, PricingData, TestimonialsData, FaqData, CtaData, StatsData, HowItWorksData, TeamData, LogoWallData, VideoData, ImageData, ImageTextData, GalleryData, MapData, RichTextData, DividerData, CountdownData, ContactFormData, BannerData, LayoutData, SocialProofData, ComparisonData, AiSearchData } from '@/lib/landing/landing-types'
import { PreviewHero } from './preview-hero'
import { PreviewFeatures } from './preview-features'
import { PreviewPricing } from './preview-pricing'
import { PreviewTestimonials } from './preview-testimonials'
import { PreviewVideo, PreviewImage, PreviewImageText, PreviewGallery } from './preview-media'
import { PreviewStats, PreviewHowItWorks, PreviewTeam, PreviewFaq } from './preview-layout'
import { PreviewCountdown, PreviewContactForm, PreviewPopup, PreviewMap } from './preview-interactive'
import { PreviewCta, PreviewBanner, PreviewDivider, PreviewRichText, PreviewLogoWall, PreviewSocialProof, PreviewComparison, PreviewAiSearch } from './preview-simple'

// Shared types and helpers
export { sectionLabels, sectionInlineStyle, isDarkSection, parseMd } from './preview-types'

// Re-export individual preview renderers
export { PreviewHero } from './preview-hero'
export { PreviewNav, PreviewFooter } from './preview-nav-footer'
export { PreviewFeatures } from './preview-features'
export { PreviewPricing } from './preview-pricing'
export { PreviewTestimonials } from './preview-testimonials'
export { PreviewVideo, PreviewImage, PreviewImageText, PreviewGallery } from './preview-media'
export { PreviewStats, PreviewHowItWorks, PreviewTeam, PreviewFaq } from './preview-layout'
export { PreviewCountdown, PreviewContactForm, PreviewPopup, PreviewMap } from './preview-interactive'
export { PreviewCta, PreviewBanner, PreviewDivider, PreviewRichText, PreviewLogoWall, PreviewSocialProof, PreviewComparison, PreviewAiSearch } from './preview-simple'

/** Render preview from section data, keyed by type */
export function renderSection(section: LandingSection, _allSections: LandingSection[], _pageTitle?: string) {
  const d = (section.data || {}) as Record<string, unknown>
  if (!section.data) return <div style={{ padding: '0.5rem', color: 'var(--lp-text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>[{section.type} — no data]</div>
  switch (section.type) {
    case 'hero': return <PreviewHero data={d as unknown as HeroData} />
    case 'features': return <PreviewFeatures data={d as unknown as FeaturesData} />
    case 'pricing': return <PreviewPricing data={d as unknown as PricingData} />
    case 'cta': return <PreviewCta data={d as unknown as CtaData} />
    case 'stats': return <PreviewStats data={d as unknown as StatsData} />
    case 'testimonials': return <PreviewTestimonials data={d as unknown as TestimonialsData} />
    case 'faq': return <PreviewFaq data={d as unknown as FaqData} />
    case 'how-it-works': return <PreviewHowItWorks data={d as unknown as HowItWorksData} />
    case 'team': return <PreviewTeam data={d as unknown as TeamData} />
    case 'video': return <PreviewVideo data={d as unknown as VideoData} />
    case 'image': return <PreviewImage data={d as unknown as ImageData} />
    case 'image-text': return <PreviewImageText data={d as unknown as ImageTextData} />
    case 'gallery': return <PreviewGallery data={d as unknown as GalleryData} />
    case 'map': return <PreviewMap data={d as unknown as MapData} />
    case 'rich-text': return <PreviewRichText data={d as unknown as RichTextData} />
    case 'divider': return <PreviewDivider data={d as unknown as DividerData} />
    case 'countdown': return <PreviewCountdown data={d as unknown as CountdownData} />
    case 'contact-form': return <PreviewContactForm data={d as unknown as ContactFormData} />
    case 'banner': return <PreviewBanner data={d as unknown as BannerData} />
    case 'social-proof': return <PreviewSocialProof data={d as unknown as SocialProofData} />
    case 'logo-wall': return <PreviewLogoWall data={d as unknown as LogoWallData} />
    case 'comparison': return <PreviewComparison data={d as unknown as ComparisonData} />
    case 'ai-search': return <PreviewAiSearch data={d as unknown as AiSearchData} />
    case 'layout': return <PreviewLayout data={d as unknown as LayoutData} />
    case 'popup': return <PreviewPopup />
    default: return <div style={{ padding: '1rem', color: 'var(--lp-text-muted)', textAlign: 'center' }}>[{section.type}]</div>
  }
}

/**
 * Layout preview — renders columns with nested section previews, respects variant.
 * Defined here because it depends on renderSection (circular dep if in separate file).
 */
function PreviewLayout({ data }: { data: LayoutData }) {
  const columns = data.columns || [1, 1]
  const gap = data.gap || '1rem'
  const children = data.children || []
  const v = data.variant || 'grid'

  const variantGridMap: Record<string, string> = {
    'grid': columns.map(c => `${c}fr`).join(' '),
    'sidebar-left': '280px 1fr',
    'sidebar-right': '1fr 280px',
    'asymmetric': '3fr 2fr',
    'thirds': 'repeat(3, 1fr)',
    'hero-split': '55fr 45fr',
    'stacked': '1fr',
    'masonry': columns.map(c => `${c}fr`).join(' '),
  }
  const gridTemplate = variantGridMap[v] || columns.map(c => `${c}fr`).join(' ')
  const isMasonry = v === 'masonry'

  return (
    <div className={`lp-layout${isMasonry ? ' lp-layout--masonry' : ''}`}
      style={{ display: isMasonry ? 'block' : 'grid', gridTemplateColumns: isMasonry ? undefined : gridTemplate, gap, alignItems: v === 'hero-split' ? 'center' : undefined, columns: isMasonry ? columns.length : undefined }}>
      {columns.map((_, colIdx) => {
        const col = children.find(c => c.column === colIdx)
        const sections = (col?.sections || []).filter(s => s.enabled !== false).sort((a, b) => a.order - b.order)
        return (
          <div key={colIdx} style={{ minHeight: '60px', background: 'rgba(241,245,249,0.5)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem' }}>
            {sections.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--lp-text-muted)', fontSize: '0.65rem', padding: '0.5rem' }}>Column {colIdx + 1} (empty)</div>
            )}
            {sections.map((s, i) => (
              <div key={i} style={{ borderRadius: '6px', overflow: 'hidden', fontSize: '0.85em' }}>
                {renderSection(s, [], undefined)}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
