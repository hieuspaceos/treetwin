/**
 * Landing page editor — metadata form + sortable section list with drag-and-drop.
 * New mode when no slug provided. Loads config from API when slug given.
 */
import { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'wouter'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { api } from '@/lib/admin/api-client'
import type { LandingPageConfig, LandingSection, LandingDesign, SectionType, SectionData } from '@/lib/landing/landing-types'
import { LandingSectionCard } from './landing-section-card'
import { LandingLivePreview } from './landing-live-preview'
import { LandingDesignPanel } from './landing-design-panel'
import { LandingCloneModal } from './landing-clone-modal'

interface Props { slug?: string }

/** Section type metadata grouped by category for the picker */
interface SectionCatalogItem { type: SectionType; label: string; icon: string; desc: string }
const SECTION_GROUPS: Array<{ group: string; items: SectionCatalogItem[] }> = [
  { group: 'Structure', items: [
    { type: 'nav', label: 'Nav', icon: '🧭', desc: 'Sticky navigation bar' },
    { type: 'hero', label: 'Hero', icon: '🎯', desc: 'Main headline + CTA' },
    { type: 'footer', label: 'Footer', icon: '📄', desc: 'Page footer' },
    { type: 'divider', label: 'Divider', icon: '➖', desc: 'Section separator' },
    { type: 'layout', label: 'Layout', icon: '⬜', desc: 'Column grid with nested sections' },
  ]},
  { group: 'Content', items: [
    { type: 'features', label: 'Features', icon: '✨', desc: 'Feature grid cards' },
    { type: 'how-it-works', label: 'How It Works', icon: '🔄', desc: 'Step-by-step process' },
    { type: 'stats', label: 'Stats', icon: '📊', desc: 'Key numbers' },
    { type: 'team', label: 'Team', icon: '👥', desc: 'Team members' },
    { type: 'faq', label: 'FAQ', icon: '❓', desc: 'Questions & answers' },
    { type: 'rich-text', label: 'Rich Text', icon: '📝', desc: 'Free-form Markdown or HTML content' },
  ]},
  { group: 'Conversion', items: [
    { type: 'cta', label: 'CTA', icon: '🚀', desc: 'Call to action banner' },
    { type: 'pricing', label: 'Pricing', icon: '💰', desc: 'Pricing plans' },
    { type: 'testimonials', label: 'Testimonials', icon: '💬', desc: 'Customer quotes' },
    { type: 'logo-wall', label: 'Logo Wall', icon: '🏢', desc: 'Partner/client logos' },
    { type: 'banner', label: 'Banner', icon: '📣', desc: 'Announcement banner' },
    { type: 'countdown', label: 'Countdown', icon: '⏱', desc: 'Countdown timer' },
    { type: 'contact-form', label: 'Contact', icon: '📬', desc: 'Contact form with fields' },
    { type: 'comparison', label: 'Comparison', icon: '⚖️', desc: 'Side-by-side comparison table' },
    { type: 'ai-search', label: 'AI Search', icon: '🔍', desc: 'AI-powered product search input' },
    { type: 'social-proof', label: 'Social Proof', icon: '🏅', desc: 'Short trust/proof line' },
  ]},
  { group: 'Media', items: [
    { type: 'video', label: 'Video', icon: '🎬', desc: 'YouTube/Vimeo embed' },
    { type: 'image', label: 'Image', icon: '🖼', desc: 'Single image block' },
    { type: 'image-text', label: 'Img+Text', icon: '📰', desc: '50/50 image and text split' },
    { type: 'gallery', label: 'Gallery', icon: '🗃', desc: 'Responsive image grid' },
    { type: 'map', label: 'Map', icon: '📍', desc: 'Embedded Google Maps' },
  ]},
]
const SECTION_CATALOG = SECTION_GROUPS.flatMap(g => g.items)
const SECTION_TYPES: SectionType[] = SECTION_CATALOG.map(s => s.type)

function defaultSectionData(type: SectionType): SectionData {
  const defaults: Record<string, SectionData> = {
    nav: { brandName: '', links: [] },
    hero: { headline: 'Your Headline Here', subheadline: 'A short description', cta: { text: 'Get Started', url: '#' } },
    features: { heading: 'Features', items: [{ title: 'Feature 1', description: 'Description' }] },
    pricing: { heading: 'Pricing', plans: [] },
    testimonials: { heading: 'What customers say', items: [] },
    faq: { heading: 'Frequently Asked Questions', items: [] },
    cta: { headline: 'Ready to get started?', cta: { text: 'Sign up free', url: '#' } },
    stats: { items: [{ value: '10k+', label: 'Users' }] },
    'how-it-works': { heading: 'How It Works', items: [] },
    team: { heading: 'Meet the team', members: [] },
    'logo-wall': { logos: [] },
    footer: { text: '', links: [] },
    video: { url: '' },
    image: { src: '', alt: '' },
    'image-text': { image: { src: '' }, text: '', imagePosition: 'left' },
    gallery: { images: [] },
    map: { address: '' },
    'rich-text': { content: '## Your content here\n\nStart writing in Markdown...' },
    divider: { style: 'line', height: 40 },
    countdown: { targetDate: '', heading: 'Offer ends in' },
    'contact-form': { heading: 'Contact Us', fields: [{ label: 'Name', type: 'text' }, { label: 'Email', type: 'email' }, { label: 'Message', type: 'textarea' }], submitText: 'Send Message' },
    banner: { text: 'Announcement goes here', variant: 'info' },
    comparison: { heading: 'Comparison', columns: [{ label: 'Us' }, { label: 'Others' }], rows: [{ label: 'Price', values: ['Free', 'Paid'], highlight: true }] },
    'ai-search': { placeholder: 'Describe what you need...', thinkingText: 'Analyzing...', resultsHeader: 'Suggestions', hints: [], defaultSuggestions: [], intents: [] },
    'social-proof': { text: 'Trusted by 100+ businesses', variant: 'inline' },
    layout: { columns: [1, 1], gap: '1rem', children: [] },
  }
  return defaults[type] || {} as SectionData
}

/** Default sections for new landing pages — nav at top, footer at bottom */
const DEFAULT_NEW_SECTIONS: LandingSection[] = [
  { type: 'nav', order: -1, enabled: true, data: defaultSectionData('nav') },
  { type: 'footer', order: 999, enabled: true, data: defaultSectionData('footer') },
]

export function LandingPageEditor({ slug }: Props) {
  const isNew = !slug
  const [, navigate] = useLocation()
  const [config, setConfig] = useState<LandingPageConfig>({ slug: '', title: '', sections: isNew ? [...DEFAULT_NEW_SECTIONS] : [] })
  const [loading, setLoading] = useState(!!slug)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newType, setNewType] = useState<SectionType>('hero')
  const [splitView, setSplitView] = useState(true)
  const [previewKey, setPreviewKey] = useState(0)
  const [previewWidth, setPreviewWidth] = useState<string | number>('100%')
  const [settingsOpen, setSettingsOpen] = useState(true)
  const [pickerGroup, setPickerGroup] = useState(-1)
  const [cloneOpen, setCloneOpen] = useState(false)
  const [selectedSectionIdx, setSelectedSectionIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!slug) return
    api.landing.read(slug).then((res) => {
      if (res.ok && res.data) setConfig(res.data as LandingPageConfig)
      else setError('Failed to load page')
      setLoading(false)
    })
  }, [slug])

  function updateSection(index: number, data: SectionData) {
    setConfig((c) => {
      const sections = [...c.sections]
      sections[index] = { ...sections[index], data }
      return { ...c, sections }
    })
  }

  function moveSection(index: number, dir: 'up' | 'down') {
    setConfig((c) => {
      const sections = [...c.sections]
      const target = dir === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= sections.length) return c;
      [sections[index], sections[target]] = [sections[target], sections[index]]
      return { ...c, sections }
    })
  }

  function removeSection(index: number) {
    setConfig((c) => ({ ...c, sections: c.sections.filter((_, i) => i !== index) }))
  }

  function toggleSection(index: number, enabled: boolean) {
    setConfig((c) => {
      const sections = [...c.sections]
      sections[index] = { ...sections[index], enabled }
      return { ...c, sections }
    })
  }

  function addSection(type?: SectionType) {
    const t = type || newType
    const section: LandingSection = { type: t, order: config.sections.length, enabled: true, data: defaultSectionData(t) }
    setConfig((c) => ({ ...c, sections: [...c.sections, section] }))
  }

  /** Move a section into a layout column — removes from top-level, adds to layout's children */
  function moveToLayout(sectionIndex: number, layoutIndex: number, columnIndex: number) {
    setConfig((c) => {
      const sections = [...c.sections]
      const section = sections[sectionIndex]
      const layout = sections[layoutIndex]
      if (!layout || layout.type !== 'layout') return c
      // Remove from top-level
      sections.splice(sectionIndex, 1)
      // Add to layout column children
      const layoutData = { ...(layout.data as any) }
      const children = [...(layoutData.children || [])]
      const existing = children.find((ch: any) => ch.column === columnIndex)
      if (existing) {
        existing.sections = [...existing.sections, { ...section, order: existing.sections.length }]
      } else {
        children.push({ column: columnIndex, sections: [{ ...section, order: 0 }] })
      }
      layoutData.children = children
      // Update layout in array (adjust index if section was before layout)
      const newLayoutIdx = sectionIndex < layoutIndex ? layoutIndex - 1 : layoutIndex
      sections[newLayoutIdx] = { ...sections[newLayoutIdx], data: layoutData }
      return { ...c, sections }
    })
  }

  // Collect layout sections for "Move to Column" options
  const layoutOptions = config.sections
    .map((s, i) => ({ index: i, section: s }))
    .filter(({ section }) => section.type === 'layout')

  // Drag-and-drop reordering
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const sectionIds = config.sections.map((s, i) => `${s.type}-${i}`)

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sectionIds.indexOf(active.id as string)
    const newIndex = sectionIds.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    setConfig((c) => ({ ...c, sections: arrayMove(c.sections, oldIndex, newIndex) }))
  }, [sectionIds])

  async function handleSave() {
    setSaving(true); setError(''); setSuccess('')
    const res = isNew
      ? await api.landing.create(config as unknown as Record<string, unknown>)
      : await api.landing.update(slug!, config as unknown as Record<string, unknown>)
    setSaving(false)
    if (res.ok) {
      setSuccess('Saved!')
      if (isNew) navigate(`/landing/${(res.data as any)?.slug || config.slug}`)
    } else {
      setError(res.error || 'Save failed')
    }
  }

  if (loading) return <p style={{ color: '#94a3b8' }}>Loading...</p>

  const editorContent = (
    <div style={{ maxWidth: splitView ? '100%' : '760px', padding: splitView ? '0 0.75rem 2rem 0' : undefined }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className="admin-btn" onClick={() => navigate('/landing')} style={{ fontSize: '0.8rem' }}>← Back</button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', flex: 1 }}>
          {isNew ? 'New Landing Page' : `Edit: ${config.title}`}
        </h1>
        <button
          className={`admin-btn ${splitView ? 'admin-btn-primary' : ''}`}
          onClick={() => setSplitView((v) => !v)}
          style={{ fontSize: '0.8rem' }}
          title="Toggle split preview"
        >{splitView ? '✕ Close Preview' : '⊞ Split Preview'}</button>
        {!isNew && slug && <a href={`/${slug}`} target="_blank" rel="noopener" className="admin-btn" style={{ fontSize: '0.8rem' }}>View Page ↗</a>}
        <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Clone modal */}
      {cloneOpen && (
        <LandingCloneModal
          onClose={() => setCloneOpen(false)}
          onCloned={(cloned) => {
            setConfig(c => ({
              ...c,
              title: cloned.title || c.title,
              description: cloned.description || c.description,
              design: cloned.design as LandingDesign,
              sections: cloned.sections as LandingSection[],
            }))
            setCloneOpen(false)
          }}
        />
      )}

      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
      {success && <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{success}</div>}

      {/* AI Wizard banner */}
      <div onClick={() => setCloneOpen(true)} style={{
        display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem',
        borderRadius: '14px', marginBottom: '1rem', cursor: 'pointer',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))',
        border: '1px solid rgba(99,102,241,0.15)', transition: 'all 0.15s',
      }}>
        <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>✨</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.15rem' }}>AI Wizard</p>
          <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
            Don't know where to start? Provide a URL, paste code, or upload a file — AI builds your landing page instantly.
          </p>
        </div>
        <div style={{ padding: '0.4rem 1rem', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', fontSize: '0.78rem', fontWeight: 600, flexShrink: 0, boxShadow: '0 2px 8px rgba(99,102,241,0.25)' }}>
          Launch →
        </div>
      </div>

      {/* Page Settings + Design — side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', alignItems: 'start' }}>
        {/* Page Settings */}
        <div className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setSettingsOpen((o) => !o)}
          >
            <span style={{ color: '#94a3b8', fontSize: '0.7rem', marginRight: '0.5rem', transition: 'transform 0.15s', transform: settingsOpen ? 'rotate(90deg)' : 'none' }}>▶</span>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', flex: 1, margin: 0 }}>Page Settings</h2>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{config.title || 'Untitled'}</span>
          </div>
          {settingsOpen && (
            <div style={{ padding: '0 1rem 1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Title *</label>
                  <input style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}
                    value={config.title} onChange={(e) => setConfig((c) => ({ ...c, title: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>
                    Slug {!isNew && <span style={{ color: '#94a3b8' }}>(readonly)</span>}
                  </label>
                  <input style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem', background: !isNew ? '#f8fafc' : 'white' }}
                    value={config.slug} readOnly={!isNew}
                    onChange={(e) => isNew && setConfig((c) => ({ ...c, slug: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Description</label>
                <textarea style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem', minHeight: '40px', resize: 'vertical' }}
                  value={config.description || ''} onChange={(e) => setConfig((c) => ({ ...c, description: e.target.value }))} />
              </div>
            </div>
          )}
        </div>

        {/* Design panel */}
        <LandingDesignPanel
          design={config.design || {}}
          onChange={(design: LandingDesign) => setConfig(c => ({ ...c, design }))}
        />
      </div>

      {/* Section picker — tab groups, sticky */}
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--t-bg-base, #f8fafc)', paddingBottom: '0.3rem' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #e2e8f0', marginBottom: '0.4rem' }}>
          <button
            onClick={() => setPickerGroup(-1)}
            style={{
              padding: '0.35rem 0.6rem', border: 'none', borderBottom: pickerGroup === -1 ? '2px solid #3b82f6' : '2px solid transparent',
              background: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600,
              color: pickerGroup === -1 ? '#1e293b' : '#94a3b8',
            }}
          >All</button>
          {SECTION_GROUPS.map((g, i) => (
            <button
              key={g.group}
              onClick={() => setPickerGroup(i)}
              style={{
                padding: '0.35rem 0.6rem', border: 'none', borderBottom: pickerGroup === i ? '2px solid #3b82f6' : '2px solid transparent',
                background: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600,
                color: pickerGroup === i ? '#1e293b' : '#94a3b8',
              }}
            >{g.group}</button>
          ))}
        </div>
        {/* Active group buttons */}
        {pickerGroup === -1 ? (
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            {SECTION_CATALOG.map(s => (
              <button
                key={s.type}
                onClick={() => addSection(s.type)}
                title={s.desc}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.2rem',
                  padding: '0.25rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px',
                  background: 'white', cursor: 'pointer', fontSize: '0.65rem', color: '#475569',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white' }}
              >
                <span style={{ fontSize: '0.75rem' }}>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            {SECTION_GROUPS[pickerGroup].items.map(s => (
              <button
                key={s.type}
                onClick={() => addSection(s.type)}
                title={s.desc}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.2rem',
                  padding: '0.25rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px',
                  background: 'white', cursor: 'pointer', fontSize: '0.65rem', color: '#475569',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white' }}
              >
                <span style={{ fontSize: '0.75rem' }}>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* AI Wizard intro — shown when no sections exist */}
      {config.sections.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', margin: '0.5rem 0 1rem', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.06))', border: '1px dashed rgba(99,102,241,0.2)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✨</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>Start with AI Wizard</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '360px', margin: '0 auto 1.25rem', lineHeight: 1.5 }}>
            Don't know where to start? Just provide a URL and AI will build your landing page automatically.
          </p>
          <button onClick={() => setCloneOpen(true)} style={{ fontSize: '0.9rem', padding: '0.6rem 2rem', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
            ✨ Launch AI Wizard
          </button>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.75rem' }}>Or add sections manually using the picker above</p>
        </div>
      )}

      {/* Sections — drag-and-drop sortable */}
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>
          Sections ({config.sections.length})
        </h2>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
            {config.sections.map((section, i) => (
              <LandingSectionCard key={sectionIds[i]} id={sectionIds[i]} section={section} index={i} total={config.sections.length}
                onChange={(data) => updateSection(i, data)}
                onMove={(dir) => moveSection(i, dir)}
                onRemove={() => removeSection(i)}
                onToggle={(enabled) => toggleSection(i, enabled)}
                onSelect={() => setSelectedSectionIdx(i)}
                layoutTargets={layoutOptions.map(lo => ({
                  layoutIndex: lo.index,
                  layoutLabel: `Layout #${lo.index + 1}`,
                  columns: (lo.section.data as any).columns || [1, 1],
                }))}
                onMoveToLayout={(layoutIdx, colIdx) => moveToLayout(i, layoutIdx, colIdx)} />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Spacer for scroll room */}
      <div style={{ height: '2rem' }} />
    </div>
  )

  // Preview device width presets
  const DEVICE_PRESETS = [
    { label: '📱', width: 375, title: 'Mobile (375px)' },
    { label: '📱', width: 768, title: 'Tablet (768px)' },
    { label: '🖥', width: '100%', title: 'Desktop (full)' },
  ] as const

  // Split view: editor left + live React preview right (real-time, no save needed)
  if (splitView) {
    return (
      <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', scrollbarWidth: 'thin' }}>
          {editorContent}
        </div>
        <div style={{ width: '1px', background: '#e2e8f0', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {/* Device toggle bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '6px 12px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            {DEVICE_PRESETS.map((d) => (
              <button
                key={String(d.width)}
                onClick={() => setPreviewWidth(d.width)}
                title={d.title}
                style={{
                  padding: '2px 8px', fontSize: '0.75rem', border: 'none', borderRadius: '4px', cursor: 'pointer',
                  background: previewWidth === d.width ? '#1e293b' : 'transparent',
                  color: previewWidth === d.width ? 'white' : '#64748b',
                }}
              >{d.label} {typeof d.width === 'number' ? `${d.width}` : 'Full'}</button>
            ))}
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Live Preview</span>
          </div>
          {/* Preview container with device width */}
          <div style={{ flex: 1, overflow: 'auto', scrollbarWidth: 'thin', display: 'flex', justifyContent: 'center', background: '#e2e8f0', padding: typeof previewWidth === 'number' ? '1rem' : 0 }}>
            <div style={{ width: typeof previewWidth === 'number' ? `${previewWidth}px` : '100%', maxWidth: '100%', background: 'white', height: 'fit-content', minHeight: '100%' }}>
              <LandingLivePreview sections={config.sections} pageTitle={config.title} design={config.design} selectedSectionIdx={selectedSectionIdx} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return editorContent
}
