/**
 * Landing page editor — metadata form + sortable section list with drag-and-drop.
 * New mode when no slug provided. Loads config from API when slug given.
 */
import { useEffect, useState, useCallback, useRef } from 'react'
// useRef used for configRef (Ctrl+S handler closure)
import { useLocation } from 'wouter'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { api } from '@/lib/admin/api-client'
import type { LandingPageConfig, LandingSection, LandingDesign, LandingSeo, SectionType, SectionData } from '@/lib/landing/landing-types'
import { LandingSectionCard } from './landing-section-card'
import { LandingLivePreview } from './landing-live-preview'
import { LandingDesignPanel } from './landing-design-panel'
import { LandingCloneModal } from './landing-clone-modal'
import { getSmartDefault } from './landing-smart-defaults'

/** Collapsible SEO settings panel for landing pages */
function SeoSettingsPanel({ seo, onChange }: { seo?: LandingSeo; onChange: (seo: LandingSeo) => void }) {
  const [open, setOpen] = useState(false)
  const s = seo || {}
  const set = (patch: Partial<LandingSeo>) => onChange({ ...s, ...patch })
  const inputStyle = { width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem' } as const
  const labelStyle = { display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' } as const

  return (
    <div className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ color: '#94a3b8', fontSize: '0.7rem', marginRight: '0.5rem', transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'none' }}>▶</span>
        <h2 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', flex: 1, margin: 0 }}>SEO Settings</h2>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{s.ogImage ? 'OG image set' : 'optional'}</span>
      </div>
      {open && (
        <div style={{ padding: '0 1rem 1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div>
              <label style={labelStyle}>OG Image URL</label>
              <input style={inputStyle} placeholder="https://..." value={s.ogImage || ''} onChange={e => set({ ogImage: e.target.value || undefined })} />
            </div>
            <div>
              <label style={labelStyle}>Keywords</label>
              <input style={inputStyle} placeholder="keyword1, keyword2" value={s.keywords || ''} onChange={e => set({ keywords: e.target.value || undefined })} />
            </div>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label style={labelStyle}>Canonical URL (override)</label>
            <input style={inputStyle} placeholder="https://..." value={s.canonicalUrl || ''} onChange={e => set({ canonicalUrl: e.target.value || undefined })} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#475569', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!s.noindex} onChange={e => set({ noindex: e.target.checked || undefined })} />
            Noindex (hide from search engines)
          </label>
        </div>
      )}
    </div>
  )
}

interface Props { slug?: string }

/** Section type metadata grouped by category for the picker */
interface SectionCatalogItem { type: SectionType; label: string; icon: string; desc: string }
const SECTION_GROUPS: Array<{ group: string; items: SectionCatalogItem[] }> = [
  { group: 'Building Blocks', items: [
    { type: 'nav', label: 'Menu Bar', icon: '🧭', desc: 'Navigation bar that sticks to the top with your brand name and links.' },
    { type: 'hero', label: 'Hero Banner', icon: '🎯', desc: 'The first thing visitors see — headline, description, and action button.' },
    { type: 'footer', label: 'Page Footer', icon: '📄', desc: 'Bottom of the page with links, copyright, and social icons.' },
    { type: 'divider', label: 'Spacer', icon: '➖', desc: 'Visual separator between sections — a line, dots, or empty space.' },
    { type: 'layout', label: 'Columns', icon: '⬜', desc: 'Create multi-column layouts and nest other sections inside each column.' },
  ]},
  { group: 'Information', items: [
    { type: 'features', label: 'Feature Cards', icon: '✨', desc: 'Show what your product offers using cards with icons and descriptions.' },
    { type: 'how-it-works', label: 'Step-by-Step', icon: '🔄', desc: 'Walk visitors through your process step by step.' },
    { type: 'stats', label: 'Key Numbers', icon: '📊', desc: 'Display impressive numbers — users, uptime, countries, ratings.' },
    { type: 'team', label: 'Team Members', icon: '👥', desc: 'Introduce your team with photos, roles, and short bios.' },
    { type: 'faq', label: 'Questions & Answers', icon: '❓', desc: 'Answer common questions. Visitors can expand each to read the answer.' },
    { type: 'rich-text', label: 'Text Block', icon: '📝', desc: 'Write anything in Markdown — articles, policies, or custom content.' },
  ]},
  { group: 'Engagement', items: [
    { type: 'cta', label: 'Action Banner', icon: '🚀', desc: 'A bold section encouraging visitors to sign up, buy, or contact you.' },
    { type: 'pricing', label: 'Pricing Plans', icon: '💰', desc: 'Display your pricing plans side by side for easy comparison.' },
    { type: 'testimonials', label: 'Customer Reviews', icon: '💬', desc: 'Show what your customers are saying with quotes and names.' },
    { type: 'logo-wall', label: 'Partner Logos', icon: '🏢', desc: 'Show logos of partners, clients, or media that featured you.' },
    { type: 'banner', label: 'Notice Banner', icon: '📣', desc: 'An announcement bar — for sales, news, warnings, or promotions.' },
    { type: 'countdown', label: 'Countdown Timer', icon: '⏱', desc: 'A ticking countdown to a deadline — great for launches and limited offers.' },
    { type: 'contact-form', label: 'Contact Form', icon: '📬', desc: 'A form where visitors can send you a message directly.' },
    { type: 'comparison', label: 'Comparison Table', icon: '⚖️', desc: 'Compare features side by side — you vs competitors.' },
    { type: 'ai-search', label: 'Smart Search', icon: '🔍', desc: 'A search box that suggests products or services as visitors type.' },
    { type: 'social-proof', label: 'Trust Badge', icon: '🏅', desc: 'A short trust line like "Trusted by 100+ businesses" — builds credibility.' },
    { type: 'popup', label: 'Popup', icon: '🪟', desc: 'A popup that appears based on scroll position, time delay, or exit intent.' },
  ]},
  { group: 'Images & Video', items: [
    { type: 'video', label: 'Video', icon: '🎬', desc: 'Embed a YouTube or Vimeo video directly in your page.' },
    { type: 'image', label: 'Image', icon: '🖼', desc: 'A single image, optionally full-width with a caption.' },
    { type: 'image-text', label: 'Image & Text', icon: '📰', desc: 'An image on one side and text on the other — great for storytelling.' },
    { type: 'gallery', label: 'Photo Gallery', icon: '🗃', desc: 'A responsive grid of photos that visitors can click to enlarge.' },
    { type: 'map', label: 'Map', icon: '📍', desc: 'Embed a Google Map showing your location or office address.' },
  ]},
]
const SECTION_CATALOG = SECTION_GROUPS.flatMap(g => g.items)
const SECTION_TYPES: SectionType[] = SECTION_CATALOG.map(s => s.type)

/** Default sections for new landing pages — nav at top, footer at bottom */
const DEFAULT_NEW_SECTIONS: LandingSection[] = [
  { type: 'nav', order: -1, enabled: true, data: getSmartDefault('nav') },
  { type: 'footer', order: 999, enabled: true, data: getSmartDefault('footer') },
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

  const configRef = useRef(config)
  configRef.current = config

  /** Undo/redo history stack — max 20 snapshots */
  const historyRef = useRef<{ past: LandingPageConfig[]; future: LandingPageConfig[] }>({ past: [], future: [] })

  /** Wraps setConfig to push current state onto undo history. Use for user actions only. */
  function updateConfig(updater: (c: LandingPageConfig) => LandingPageConfig) {
    setConfig((current) => {
      const next = updater(current)
      if (JSON.stringify(next) !== JSON.stringify(current)) {
        historyRef.current.past = [...historyRef.current.past.slice(-19), current]
        historyRef.current.future = []
      }
      return next
    })
  }

  function undo() {
    const { past, future } = historyRef.current
    if (past.length === 0) return
    const prev = past[past.length - 1]
    historyRef.current = { past: past.slice(0, -1), future: [configRef.current, ...future].slice(0, 20) }
    setConfig(prev)
  }

  function redo() {
    const { past, future } = historyRef.current
    if (future.length === 0) return
    const next = future[0]
    historyRef.current = { past: [...past, configRef.current].slice(-20), future: future.slice(1) }
    setConfig(next)
  }

  const [editorWidth, setEditorWidth] = useState(40) // percentage
  const resizing = useRef(false)

  useEffect(() => {
    if (!slug) {
      // New page — check for ?template= query param to pre-fill from template
      const templateSlug = new URLSearchParams(window.location.search).get('template')
      if (templateSlug) {
        api.templates.read(templateSlug).then((res) => {
          if (res.ok && res.data) {
            const tpl = res.data as Record<string, unknown>
            setConfig(c => ({
              ...c,
              title: (tpl.name as string) || '',
              template: templateSlug,
              sections: (tpl.sections as LandingSection[]) || [],
            }))
          }
        })
      }
      return
    }
    api.landing.read(slug).then((res) => {
      if (res.ok && res.data) setConfig(res.data as LandingPageConfig)
      else setError('Failed to load page')
      setLoading(false)
    })
  }, [slug])

  /** Keyboard shortcuts: Ctrl+S save, Ctrl+Z undo, Ctrl+Shift+Z/Ctrl+Y redo */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault(); undo()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault(); redo()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault(); redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [slug, isNew, config])

  function updateSection(index: number, data: SectionData) {
    updateConfig((c) => {
      const sections = [...c.sections]
      sections[index] = { ...sections[index], data }
      return { ...c, sections }
    })
  }

  function moveSection(index: number, dir: 'up' | 'down') {
    updateConfig((c) => {
      const sections = [...c.sections]
      const target = dir === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= sections.length) return c;
      [sections[index], sections[target]] = [sections[target], sections[index]]
      return { ...c, sections }
    })
  }

  function removeSection(index: number) {
    updateConfig((c) => ({ ...c, sections: c.sections.filter((_, i) => i !== index) }))
  }

  function toggleSection(index: number, enabled: boolean) {
    updateConfig((c) => {
      const sections = [...c.sections]
      sections[index] = { ...sections[index], enabled }
      return { ...c, sections }
    })
  }

  function addSection(type?: SectionType) {
    const t = type || newType
    const section: LandingSection = { type: t, order: config.sections.length, enabled: true, data: getSmartDefault(t) }
    updateConfig((c) => ({ ...c, sections: [...c.sections, section] }))
  }

  /** Deep-clone a section and insert copy immediately below the original */
  function duplicateSection(index: number) {
    updateConfig((c) => {
      const clone = structuredClone(c.sections[index])
      const sections = [...c.sections]
      sections.splice(index + 1, 0, clone)
      return { ...c, sections }
    })
    setSelectedSectionIdx(index + 1)
  }

  /** Move a section into a layout column — removes from top-level, adds to layout's children */
  function moveToLayout(sectionIndex: number, layoutIndex: number, columnIndex: number) {
    updateConfig((c) => {
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
    updateConfig((c) => ({ ...c, sections: arrayMove(c.sections, oldIndex, newIndex) }))
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
        <button className="admin-btn" onClick={undo} disabled={historyRef.current.past.length === 0}
          title="Undo (Ctrl+Z)" style={{ fontSize: '0.8rem', opacity: historyRef.current.past.length === 0 ? 0.4 : 1 }}>↩</button>
        <button className="admin-btn" onClick={redo} disabled={historyRef.current.future.length === 0}
          title="Redo (Ctrl+Shift+Z)" style={{ fontSize: '0.8rem', opacity: historyRef.current.future.length === 0 ? 0.4 : 1 }}>↪</button>
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
            updateConfig(c => ({
              ...c,
              title: cloned.title || c.title,
              description: cloned.description || c.description,
              design: cloned.design as LandingDesign,
              sections: cloned.sections as LandingSection[],
              scopedCss: (cloned as any).scopedCss,
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
          onChange={(design: LandingDesign) => updateConfig(c => ({ ...c, design }))}
        />
      </div>

      {/* SEO Settings — collapsible */}
      <SeoSettingsPanel seo={config.seo} onChange={(seo) => updateConfig(c => ({ ...c, seo }))} />

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
              <div key={sectionIds[i]} id={`section-card-${i}`}>
              <LandingSectionCard id={sectionIds[i]} section={section} index={i} total={config.sections.length}
                onChange={(data) => updateSection(i, data)}
                onMove={(dir) => moveSection(i, dir)}
                onRemove={() => removeSection(i)}
                onDuplicate={() => duplicateSection(i)}
                onToggle={(enabled) => toggleSection(i, enabled)}
                onSelect={() => setSelectedSectionIdx(prev => prev === i ? null : i)}
                selected={selectedSectionIdx === i}
                layoutTargets={layoutOptions.map(lo => ({
                  layoutIndex: lo.index,
                  layoutLabel: `Layout #${lo.index + 1}`,
                  columns: (lo.section.data as any).columns || [1, 1],
                }))}
                onMoveToLayout={(layoutIdx, colIdx) => moveToLayout(i, layoutIdx, colIdx)} />
              </div>
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
    { label: '📱 Mobile', width: 375, title: 'Mobile (375px)' },
    { label: '🖥 Desktop', width: '100%', title: 'Desktop (full)' },
  ] as const

  // Split view: editor left + live React preview right (real-time, no save needed)
  /** Handle drag to resize editor/preview panels */
  function onResizeStart(e: React.MouseEvent) {
    e.preventDefault()
    resizing.current = true
    const startX = e.clientX
    const startWidth = editorWidth
    const container = (e.target as HTMLElement).parentElement!
    const totalWidth = container.offsetWidth

    function onMouseMove(ev: MouseEvent) {
      if (!resizing.current) return
      const delta = ev.clientX - startX
      const newPct = Math.min(80, Math.max(20, startWidth + (delta / totalWidth) * 100))
      setEditorWidth(newPct)
    }
    function onMouseUp() {
      resizing.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  if (splitView) {
    return (
      <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
        <div id="editor-scroll-container" style={{ width: `${editorWidth}%`, minWidth: 0, overflowY: 'auto', scrollbarWidth: 'thin', flexShrink: 0, scrollPaddingTop: '1rem' }}>
          {editorContent}
        </div>
        {/* Draggable resizer handle */}
        <div
          onMouseDown={onResizeStart}
          style={{ width: '6px', cursor: 'col-resize', background: '#e2e8f0', flexShrink: 0, transition: 'background 0.15s', position: 'relative' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#94a3b8')}
          onMouseLeave={e => { if (!resizing.current) e.currentTarget.style.background = '#e2e8f0' }}
        >
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '2px', height: '24px', borderRadius: '1px', background: '#94a3b8' }} />
        </div>
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
              >{d.label}</button>
            ))}
            <span style={{ flex: 1 }} />
            {!isNew && slug && (
              <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" title="Open full page in new tab"
                style={{ fontSize: '0.7rem', color: '#3b82f6', textDecoration: 'none', padding: '2px 6px' }}>
                View Page ↗
              </a>
            )}
            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Live Preview</span>
          </div>
          {/* Preview container — Full: React preview, Mobile: iframe for accurate media queries */}
          <div style={{ flex: 1, overflow: 'auto', scrollbarWidth: 'thin', display: 'flex', justifyContent: 'center', background: '#e2e8f0', padding: typeof previewWidth === 'number' ? '1rem 0' : 0 }}>
            {typeof previewWidth === 'number' && !isNew && slug ? (
              /* Mobile: iframe at exact width so CSS media queries fire correctly */
              <div style={{ width: `${previewWidth}px`, maxWidth: '100%', height: '100%', margin: '0 auto' }}>
                <iframe
                  key={previewKey}
                  src={`/${slug}`}
                  style={{ width: `${previewWidth}px`, height: '100%', border: '1px solid #cbd5e1', borderRadius: '24px', background: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
                  title="Mobile preview"
                />
              </div>
            ) : (
              /* Full: React preview for realtime editing */
              <div style={{ width: '100%', minHeight: '100%' }}>
                <LandingLivePreview sections={config.sections} pageTitle={config.title} design={config.design} selectedSectionIdx={selectedSectionIdx}
                  onSectionClick={(idx) => {
                    setSelectedSectionIdx(idx)
                    // Wait for card to expand, then scroll header into view
                    requestAnimationFrame(() => {
                      setTimeout(() => {
                        document.getElementById(`section-card-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                      }, 50)
                    })
                  }} />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return editorContent
}
