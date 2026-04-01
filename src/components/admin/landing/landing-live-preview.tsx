/**
 * Live preview renderer for landing page editor.
 * Renders sections from React state directly — no server round-trip needed.
 * Mirrors the Astro section components but as simple React divs.
 * Uses actual CSS classes from landing.css for visual accuracy.
 *
 * Individual section renderers are in ./preview-renderers/ for modularity.
 */
import { useEffect } from 'react'
import '@/styles/landing.css'
import type { LandingSection, LandingDesign, NavData, FooterData } from '@/lib/landing/landing-types'
import { designToCssVars, designFontsUrl } from '@/lib/landing/landing-design-presets'
import { renderSection, sectionInlineStyle, isDarkSection, PreviewNav, PreviewFooter } from './preview-renderers'

interface Props {
  sections: LandingSection[]
  pageTitle?: string
  design?: LandingDesign
  /** Index of section being edited — preview scrolls to and highlights it */
  selectedSectionIdx?: number | null
  /** Called when user clicks a section in preview — passes original section index */
  onSectionClick?: (sectionIdx: number) => void
}

export function LandingLivePreview({ sections, pageTitle, design, selectedSectionIdx, onSectionClick }: Props) {
  const enabled = sections.filter(s => s.enabled !== false)
  const navSection = enabled.find(s => s.type === 'nav')
  const footerSection = enabled.find(s => s.type === 'footer')
  const body = enabled.filter(s => s.type !== 'nav' && s.type !== 'footer' && s.type !== 'popup').sort((a, b) => a.order - b.order)
  const popups = enabled.filter(s => s.type === 'popup')

  // Map original section index for highlight matching
  const sectionOriginalIndices = body.map(s => sections.indexOf(s))

  // Parse design CSS vars into a React style object
  const designVarsStr = designToCssVars(design)
  const designStyle: Record<string, string> = {}
  designVarsStr.split(';').forEach(pair => {
    const [k, ...v] = pair.split(':')
    if (k && v.length) designStyle[k] = v.join(':')
  })

  // Load Google Fonts dynamically when design fonts change
  const fontsUrl = designFontsUrl(design)
  useEffect(() => {
    if (!fontsUrl) return
    const id = 'lp-preview-fonts'
    let link = document.getElementById(id) as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    link.href = fontsUrl
  }, [fontsUrl])

  // Scroll to selected section in preview when it changes
  useEffect(() => {
    if (selectedSectionIdx == null) return
    const sel = sections[selectedSectionIdx]
    if (!sel) return
    let targetId = ''
    if (sel.type === 'nav') targetId = 'lp-preview-nav'
    else if (sel.type === 'footer') targetId = 'lp-preview-footer'
    else targetId = `section-${sel.type}-prev-${selectedSectionIdx}`
    const el = document.getElementById(targetId)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [selectedSectionIdx])

  // Is this section currently selected?
  const isSelected = (originalIdx: number) => selectedSectionIdx != null && originalIdx === selectedSectionIdx

  const highlightStyle = {
    outline: '2px solid var(--lp-primary, #3b82f6)',
    outlineOffset: '2px',
    borderRadius: '8px',
    transition: 'outline 0.2s ease',
  }

  return (
    <div className="landing-page-root" style={{
      ...designStyle,
      background: 'var(--lp-bg, #f8fafc)',
      color: 'var(--lp-text, #0f172a)',
      fontFamily: 'var(--lp-font-body, system-ui), system-ui, sans-serif',
      overflow: 'hidden', height: '100%', overflowY: 'auto',
    }}>
      <style>{`
        .landing-page-root h1,.landing-page-root h2,.landing-page-root h3{font-family:var(--lp-font-heading,system-ui),system-ui,sans-serif}
        .landing-page-root .lp-fade-up{opacity:1!important;transform:none!important}
      `}</style>
      {navSection && (
        <div id="lp-preview-nav" onClick={() => onSectionClick?.(sections.indexOf(navSection))} style={{ cursor: 'pointer', ...(isSelected(sections.indexOf(navSection)) ? highlightStyle : {}) }}>
          <PreviewNav data={navSection.data as NavData} sections={enabled} pageTitle={pageTitle} />
        </div>
      )}
      <div className="landing-sections">
        {body.map((section, i) => {
          const origIdx = sectionOriginalIndices[i]
          const s = (section.style || {}) as Record<string, unknown>
          const hasBgImage = !!s.backgroundImage
          const dark = isDarkSection(section)
          const classes = ['lp-full-width', 'lp-fade-up', hasBgImage ? 'lp-section-bg' : '', dark ? 'lp-dark-section' : ''].filter(Boolean).join(' ')
          return (
            <div key={`${section.type}-${i}`} id={`section-${section.type}-prev-${origIdx}`}
              data-section={`section-${section.type}`}
              className={classes}
              onClick={() => onSectionClick?.(origIdx)}
              style={{ cursor: 'pointer', ...sectionInlineStyle(section), ...(isSelected(origIdx) ? highlightStyle : {}) }}>
              {/* Background image layer — matches Astro lp-section-bg-img */}
              {hasBgImage && (
                <div className="lp-section-bg-img" style={{ backgroundImage: `url(${s.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              )}
              {hasBgImage && s.backgroundOverlay && (
                <div className="lp-section-bg-overlay" style={{ background: String(s.backgroundOverlay) }} />
              )}
              <div className={hasBgImage ? 'lp-section-content' : ''}>
                {renderSection(section, enabled, pageTitle)}
              </div>
            </div>
          )
        })}
      </div>
      {footerSection && (
        <div id="lp-preview-footer"
          data-section="section-footer"
          className={`lp-full-width ${isDarkSection(footerSection) ? 'lp-dark-section' : ''}`}
          onClick={() => onSectionClick?.(sections.indexOf(footerSection))}
          style={{ cursor: 'pointer', ...sectionInlineStyle(footerSection), ...(isSelected(sections.indexOf(footerSection)) ? highlightStyle : {}) }}>
          <PreviewFooter data={footerSection.data as FooterData} pageTitle={pageTitle} />
        </div>
      )}
      {/* Popup sections — show as placeholder cards in preview */}
      {popups.map((s) => {
        const origIdx = sections.indexOf(s)
        return (
          <div key={`popup-${origIdx}`} onClick={() => onSectionClick?.(origIdx)}
            style={{ cursor: 'pointer', margin: '0.5rem 1rem', ...(isSelected(origIdx) ? highlightStyle : {}) }}>
            {renderSection(s, enabled, pageTitle)}
          </div>
        )
      })}
    </div>
  )
}
