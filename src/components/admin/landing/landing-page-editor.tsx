/**
 * Landing page editor — metadata form + section list with add/reorder/remove.
 * New mode when no slug provided. Loads config from API when slug given.
 */
import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { api } from '@/lib/admin/api-client'
import type { LandingPageConfig, LandingSection, SectionType, SectionData } from '@/lib/landing/landing-types'
import { LandingSectionCard } from './landing-section-card'

interface Props { slug?: string }

const SECTION_TYPES: SectionType[] = ['hero', 'features', 'pricing', 'testimonials', 'faq', 'cta', 'stats', 'how-it-works', 'team', 'logo-wall']

function defaultSectionData(type: SectionType): SectionData {
  const defaults: Record<string, SectionData> = {
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
  }
  return defaults[type] || {} as SectionData
}

export function LandingPageEditor({ slug }: Props) {
  const [, navigate] = useLocation()
  const [config, setConfig] = useState<LandingPageConfig>({ slug: '', title: '', sections: [] })
  const [loading, setLoading] = useState(!!slug)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newType, setNewType] = useState<SectionType>('hero')
  const isNew = !slug

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

  function addSection() {
    const section: LandingSection = { type: newType, order: config.sections.length, enabled: true, data: defaultSectionData(newType) }
    setConfig((c) => ({ ...c, sections: [...c.sections, section] }))
  }

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

  return (
    <div style={{ maxWidth: '760px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="admin-btn" onClick={() => navigate('/landing')} style={{ fontSize: '0.8rem' }}>← Back</button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', flex: 1 }}>
          {isNew ? 'New Landing Page' : `Edit: ${config.title}`}
        </h1>
        {!isNew && <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" className="admin-btn" style={{ fontSize: '0.8rem' }}>Preview</a>}
        <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
      {success && <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{success}</div>}

      {/* Metadata */}
      <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '1rem' }}>Page Settings</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Title *</label>
            <input style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
              value={config.title} onChange={(e) => setConfig((c) => ({ ...c, title: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
              Slug {!isNew && <span style={{ color: '#94a3b8' }}>(readonly)</span>}
            </label>
            <input style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', background: !isNew ? '#f8fafc' : 'white' }}
              value={config.slug} readOnly={!isNew}
              onChange={(e) => isNew && setConfig((c) => ({ ...c, slug: e.target.value }))} />
          </div>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Description</label>
          <textarea style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', minHeight: '60px', resize: 'vertical' }}
            value={config.description || ''} onChange={(e) => setConfig((c) => ({ ...c, description: e.target.value }))} />
        </div>
      </div>

      {/* Sections */}
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '0.75rem' }}>
          Sections ({config.sections.length})
        </h2>
        {config.sections.map((section, i) => (
          <LandingSectionCard key={`${section.type}-${i}`} section={section} index={i} total={config.sections.length}
            onChange={(data) => updateSection(i, data)}
            onMove={(dir) => moveSection(i, dir)}
            onRemove={() => removeSection(i)}
            onToggle={(enabled) => toggleSection(i, enabled)} />
        ))}
      </div>

      {/* Add section */}
      <div className="glass-card" style={{ padding: '1rem', borderRadius: '10px', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <select value={newType} onChange={(e) => setNewType(e.target.value as SectionType)}
          style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
          {SECTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="admin-btn admin-btn-primary" onClick={addSection}>+ Add Section</button>
      </div>
    </div>
  )
}
