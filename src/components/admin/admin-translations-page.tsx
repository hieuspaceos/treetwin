/**
 * Translations management page — edit i18n strings organized by sections
 * Reads/writes JSON translation files via admin API
 */
import { useState, useEffect } from 'react'
import { getAvailableLocales, getDictionary, type Locale } from '@/lib/i18n'
import { useToast } from './admin-toast'

/** Flatten nested object to dot-path keys: { a: { b: "c" } } → { "a.b": "c" } */
function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flatten(value as Record<string, unknown>, path))
    } else if (typeof value === 'string') {
      result[path] = value
    }
  }
  return result
}

/** Subgroup within a section */
interface SubGroup {
  key: string // raw key segment (e.g. "tone")
  label: string
  sectionKey: string // parent section key (e.g. "voice")
  entries: [string, string][] // [flatKey, value]
}

/** Section with optional subgroups */
interface Section {
  name: string
  subgroups: SubGroup[]
  directEntries: [string, string][] // keys without a subgroup (2-part keys)
}

/** Humanize a key segment: "junior-dev" → "Junior Dev" */
function humanize(s: string): string {
  return s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Build hierarchical sections from flat key-value map */
function buildSections(flat: Record<string, string>): Record<string, Section> {
  const sections: Record<string, Section> = {}

  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.')
    const sectionKey = parts[0]

    // Initialize section
    if (!sections[sectionKey]) {
      sections[sectionKey] = { name: sectionKey, subgroups: [], directEntries: [] }
    }
    const section = sections[sectionKey]

    // _section key → section display name
    if (parts.length === 2 && parts[1] === '_section') {
      section.name = value
      continue
    }

    // 2-part key (e.g. settings.theme) → direct entry
    if (parts.length === 2) {
      section.directEntries.push([key, value])
      continue
    }

    // 3-part key (e.g. voice.tone.casual) → subgroup
    if (parts.length >= 3) {
      const subKey = parts[1]
      // Skip _label keys (used as subgroup headers below)
      if (parts[2] === '_label') {
        // Find or create subgroup, set its label
        let sg = section.subgroups.find((g) => g.key === subKey)
        if (!sg) { sg = { key: subKey, label: subKey, sectionKey, entries: [] }; section.subgroups.push(sg) }
        sg.label = value // overwrite with human label
        continue
      }
      let sg = section.subgroups.find((g) => g.key === subKey)
      if (!sg) {
        // _label not yet seen — use humanized key as label, will be overwritten if _label exists
        sg = { key: subKey, label: subKey, sectionKey, entries: [] }
        section.subgroups.push(sg)
      }
      sg.entries.push([key, value])
    }
  }

  // Humanize subgroup labels that weren't set by _label
  for (const section of Object.values(sections)) {
    for (const sg of section.subgroups) {
      // If label is still a raw key (no spaces, no uppercase), humanize it
      if (sg.label === sg.label.toLowerCase() && !sg.label.includes(' ')) {
        sg.label = humanize(sg.label)
      }
    }
  }

  return sections
}


/** Single translation row — shows EN reference on left, editable value on right */
function TranslationRow({ flatKey, value, enRef, isChanged, onChange }: {
  flatKey: string; value: string; enRef?: string; isChanged: boolean
  onChange: (key: string, value: string) => void
}) {
  // Show EN reference value if available, otherwise humanized key
  const label = enRef ?? humanize(flatKey.split('.').pop()!)
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', alignItems: 'center',
      padding: '0.4rem 0.6rem', borderRadius: '8px',
      background: isChanged ? 'rgba(99,102,241,0.04)' : 'transparent',
      border: isChanged ? '1px solid rgba(99,102,241,0.15)' : '1px solid transparent',
    }}>
      <div>
        <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 500, display: 'block' }}>
          {label}
        </span>
        <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontFamily: 'monospace', display: 'block' }}>
          {flatKey}
        </span>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(flatKey, e.target.value)}
        className="glass-input"
        style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(255,255,255,0.04)' }}
      />
    </div>
  )
}

/** Inline add-key row for subgroups */
function AddKeyRow({ onAdd }: { onAdd: (key: string) => void }) {
  const [draft, setDraft] = useState('')
  function submit() {
    if (!draft.trim()) return
    onAdd(draft)
    setDraft('')
  }
  return (
    <div style={{ display: 'flex', gap: '0.5rem', padding: '0.3rem 0.6rem', opacity: 0.7 }}>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), submit())}
        className="glass-input"
        placeholder="Add new option..."
        style={{ flex: 1, fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px dashed rgba(148,163,184,0.3)' }}
      />
      <button type="button" onClick={submit} className="admin-btn admin-btn-ghost" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
        + Add
      </button>
    </div>
  )
}

export function AdminTranslationsPage() {
  const toast = useToast()
  const locales = getAvailableLocales()
  const [activeLocale, setActiveLocale] = useState<Locale>(locales[0])
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [original, setOriginal] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  // EN reference for showing original English text when editing other locales
  const [enRef, setEnRef] = useState<Record<string, string>>({})

  // Load translations for selected locale + EN reference
  useEffect(() => {
    const dict = getDictionary(activeLocale)
    const flat = flatten(dict)
    setTranslations({ ...flat })
    setOriginal({ ...flat })
    // Load EN as reference when editing non-EN locale
    if (activeLocale !== 'en') {
      setEnRef(flatten(getDictionary('en')))
    } else {
      setEnRef({})
    }
  }, [activeLocale])

  const sections = buildSections(translations)
  const isTranslating = activeLocale !== 'en'

  function handleChange(key: string, value: string) {
    setTranslations((prev) => ({ ...prev, [key]: value }))
  }

  /** Add a new translation key to a subgroup (e.g. voice.tone.witty = "Witty") */
  function handleAddKey(sectionKey: string, subgroupKey: string, newKey: string) {
    const slug = newKey.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    if (!slug) return
    const flatKey = `${sectionKey}.${subgroupKey}.${slug}`
    if (translations[flatKey]) return // already exists
    setTranslations((prev) => ({ ...prev, [flatKey]: humanize(slug) }))
  }

  const hasChanges = JSON.stringify(translations) !== JSON.stringify(original)

  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/translations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: activeLocale, translations }),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success('Translations saved')
        setOriginal({ ...translations })
      } else {
        toast.error(data.error || 'Save failed')
      }
    } catch {
      toast.error('Network error')
    }
    setSaving(false)
  }

  /** Filter translations by search term (key or value) */
  function matchesSearch(key: string, value: string): boolean {
    if (!search) return true
    const q = search.toLowerCase()
    return key.toLowerCase().includes(q) || value.toLowerCase().includes(q)
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.25rem' }}>
        Translations
      </h1>

      {/* Locale tabs + search */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {locales.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => setActiveLocale(loc)}
            className={`admin-btn ${activeLocale === loc ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
            style={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.8rem' }}
          >
            {loc}
          </button>
        ))}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search keys or values..."
          className="glass-input admin-field-input"
          style={{ flex: 1, minWidth: '200px' }}
        />
        {hasChanges && (
          <button onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary">
            {saving ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      {/* Column headers */}
      {isTranslating && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem',
          padding: '0.4rem 0.6rem', marginBottom: '0.5rem',
        }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            English
          </span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {activeLocale === 'vi' ? 'Tiếng Việt' : String(activeLocale).toUpperCase()}
          </span>
        </div>
      )}

      {/* Sections */}
      {Object.entries(sections).map(([sectionKey, section]) => {
        // Count total visible entries for this section
        const allEntries = [
          ...section.directEntries,
          ...section.subgroups.flatMap((sg) => sg.entries),
        ].filter(([k, v]) => matchesSearch(k, v))
        if (allEntries.length === 0) return null

        return (
          <div key={sectionKey} className="glass-panel" style={{ padding: '1rem', borderRadius: '14px', marginBottom: '1rem' }}>
            {/* Section header */}
            <button
              type="button"
              onClick={() => setCollapsed((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }))}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: collapsed[sectionKey] ? 0 : '0.75rem',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: collapsed[sectionKey] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                {section.name}
              </h2>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: 'auto' }}>
                {allEntries.length}
              </span>
            </button>
            {!collapsed[sectionKey] && <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Direct entries (no subgroup) */}
              {section.directEntries.filter(([k, v]) => matchesSearch(k, v)).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {section.directEntries.filter(([k, v]) => matchesSearch(k, v)).map(([key, value]) => (
                    <TranslationRow key={key} flatKey={key} value={value} enRef={isTranslating ? enRef[key] : undefined} isChanged={value !== original[key]} onChange={handleChange} />
                  ))}
                </div>
              )}
              {/* Subgroups */}
              {section.subgroups.map((sg) => {
                const filtered = sg.entries.filter(([k, v]) => matchesSearch(k, v))
                if (filtered.length === 0 && !search) return null
                return (
                  <div key={sg.key} style={{ marginTop: '0.25rem' }}>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.375rem 0.25rem' }}>
                      {sg.label}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {filtered.map(([key, value]) => (
                        <TranslationRow key={key} flatKey={key} value={value} enRef={isTranslating ? enRef[key] : undefined} isChanged={value !== original[key]} onChange={handleChange} />
                      ))}
                      <AddKeyRow onAdd={(newKey) => handleAddKey(sg.sectionKey, sg.key, newKey)} />
                    </div>
                  </div>
                )
              })}
            </div>}
          </div>
        )
      })}

      {hasChanges && (
        <div style={{ position: 'sticky', bottom: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#f59e0b', alignSelf: 'center' }}>Unsaved changes</span>
          <button onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary">
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      )}
    </div>
  )
}
