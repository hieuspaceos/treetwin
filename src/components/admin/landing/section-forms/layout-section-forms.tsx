/**
 * Layout-oriented section forms — Stats, HowItWorks, Team, FAQ, LogoWall,
 * and the nested Layout (column grid) section form.
 */
import type { SectionData, StatsData, HowItWorksData, TeamData, FaqData, LogoWallData, LayoutData, LayoutChild } from '@/lib/landing/landing-types'
import { type FormProps, Field, inputStyle, textareaStyle, InlineRow, CollapsibleItems, ImageField, VariantPicker, FIELD_HELP, SECTION_TYPE_LABELS, getSmartDefault, useState } from './form-primitives'

export function StatsSectionForm({ data, onChange }: FormProps<StatsData>) {
  const set = (k: keyof StatsData, v: unknown) => onChange({ ...data, [k]: v })
  const items = data.items || []
  return (
    <>
      <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field>
      <VariantPicker sectionType="stats" value={data.variant || 'row'} onChange={(v) => set('variant', v)} />
      <CollapsibleItems label="Stats" count={items.length} defaultOpen
        addButton={<button type="button" onClick={() => set('items', [...items, { value: '', label: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Stat</button>}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.4rem', background: '#f8fafc', borderRadius: '6px', padding: '0.4rem' }}>
            <input placeholder="Value" style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: '0.8rem' }} value={item.value} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], value: e.target.value }; set('items', n) }} />
            <input placeholder="Label" style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: '0.8rem' }} value={item.label} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], label: e.target.value }; set('items', n) }} />
            <button type="button" onClick={() => set('items', items.filter((_, j) => j !== i))}
              style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>x</button>
          </div>
        ))}
      </CollapsibleItems>
    </>
  )
}

export function HowItWorksSectionForm({ data, onChange }: FormProps<HowItWorksData>) {
  const set = (k: keyof HowItWorksData, v: unknown) => onChange({ ...data, [k]: v })
  const items = data.items || []
  return (
    <>
      <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field>
      <VariantPicker sectionType="how-it-works" value={data.variant || 'numbered'} onChange={(v) => set('variant', v)} />
      <CollapsibleItems label="Steps" count={items.length}
        addButton={<button type="button" onClick={() => set('items', [...items, { title: '', description: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Step</button>}>
        {items.map((item, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: '6px', padding: '0.5rem', marginBottom: '0.4rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '4px' }}>
              <input placeholder="Title" style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: '0.8rem' }} value={item.title} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], title: e.target.value }; set('items', n) }} />
              <button type="button" onClick={() => set('items', items.filter((_, j) => j !== i))}
                style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>x</button>
            </div>
            <textarea placeholder="Description" style={{ ...textareaStyle, minHeight: '40px', padding: '4px 8px', fontSize: '0.8rem' }} value={item.description} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], description: e.target.value }; set('items', n) }} />
          </div>
        ))}
      </CollapsibleItems>
    </>
  )
}

export function TeamSectionForm({ data, onChange }: FormProps<TeamData>) {
  const set = (k: keyof TeamData, v: unknown) => onChange({ ...data, [k]: v })
  const members = data.members || []
  return (
    <>
      <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field>
      <Field label="Subtitle"><input style={inputStyle} value={data.subheading || ''} onChange={(e) => set('subheading', e.target.value)} /></Field>
      <VariantPicker sectionType="team" value={data.variant || 'grid'} onChange={(v) => set('variant', v)} />
      <CollapsibleItems label="Members" count={members.length} defaultOpen
        addButton={<button type="button" onClick={() => set('members', [...members, { name: '', role: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Member</button>}>
        {members.map((m, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem' }}>
            <input placeholder="Name" style={{ ...inputStyle, marginBottom: '4px' }} value={m.name} onChange={(e) => { const n = [...members]; n[i] = { ...n[i], name: e.target.value }; set('members', n) }} />
            <input placeholder="Role" style={{ ...inputStyle, marginBottom: '4px' }} value={m.role} onChange={(e) => { const n = [...members]; n[i] = { ...n[i], role: e.target.value }; set('members', n) }} />
            <div style={{ marginBottom: '4px' }}>
              <ImageField compact value={m.photo || ''} onChange={(v) => { const n = [...members]; n[i] = { ...n[i], photo: v }; set('members', n) }} uploadPath="team" placeholder="Photo URL" previewSize={32} />
            </div>
            <textarea placeholder="Bio" style={{ ...textareaStyle, minHeight: '50px' }} value={m.bio || ''} onChange={(e) => { const n = [...members]; n[i] = { ...n[i], bio: e.target.value }; set('members', n) }} />
            <button type="button" onClick={() => set('members', members.filter((_, j) => j !== i))}
              style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}>Remove</button>
          </div>
        ))}
      </CollapsibleItems>
    </>
  )
}

export function FaqSectionForm({ data, onChange }: FormProps<FaqData>) {
  const set = (k: keyof FaqData, v: unknown) => onChange({ ...data, [k]: v })
  const items = data.items || []
  return (
    <>
      <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field>
      <VariantPicker sectionType="faq" value={data.variant || 'accordion'} onChange={(v) => set('variant', v)} />
      <CollapsibleItems label="FAQ Items" count={items.length} defaultOpen
        addButton={<button type="button" onClick={() => set('items', [...items, { question: '', answer: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add FAQ</button>}>
        {items.map((item, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem' }}>
            <input placeholder="Question" style={{ ...inputStyle, marginBottom: '4px' }} value={item.question} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], question: e.target.value }; set('items', n) }} />
            <textarea placeholder="Answer" style={{ ...textareaStyle, minHeight: '60px' }} value={item.answer} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], answer: e.target.value }; set('items', n) }} />
            <button type="button" onClick={() => set('items', items.filter((_, j) => j !== i))}
              style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
          </div>
        ))}
      </CollapsibleItems>
    </>
  )
}

export function LogoWallSectionForm({ data, onChange }: FormProps<LogoWallData>) {
  const set = (k: keyof LogoWallData, v: unknown) => onChange({ ...data, [k]: v })
  const logos = data.logos || []
  return (
    <>
      <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field>
      <Field label="Logos">
        {logos.map((logo, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.6rem', marginBottom: '0.5rem' }}>
            <input placeholder="Name" style={{ ...inputStyle, marginBottom: '4px' }} value={logo.name} onChange={(e) => { const n = [...logos]; n[i] = { ...n[i], name: e.target.value }; set('logos', n) }} />
            <div style={{ marginBottom: '4px' }}>
              <ImageField compact value={logo.image || ''} onChange={(v) => { const n = [...logos]; n[i] = { ...n[i], image: v }; set('logos', n) }} uploadPath="logos" placeholder="Image URL" previewSize={32} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input placeholder="Link URL" style={{ ...inputStyle, flex: 1 }} value={logo.url || ''} onChange={(e) => { const n = [...logos]; n[i] = { ...n[i], url: e.target.value }; set('logos', n) }} />
              <button type="button" onClick={() => set('logos', logos.filter((_, j) => j !== i))}
                style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>x</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => set('logos', [...logos, { name: '', image: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Logo</button>
      </Field>
    </>
  )
}

/** Column layout presets — ratio arrays */
const LAYOUT_PRESETS: Array<{ label: string; cols: number[] }> = [
  { label: '1:1', cols: [1, 1] },
  { label: '1:2', cols: [1, 2] },
  { label: '2:1', cols: [2, 1] },
  { label: '3:1', cols: [3, 1] },
  { label: '1:3', cols: [1, 3] },
  { label: '2:3', cols: [2, 3] },
  { label: '3:2', cols: [3, 2] },
  { label: '1:1:1', cols: [1, 1, 1] },
  { label: '1:2:1', cols: [1, 2, 1] },
  { label: '1:1:1:1', cols: [1, 1, 1, 1] },
  { label: 'Full', cols: [1] },
]

/** Nested section types available inside a layout column (excludes nav, footer, layout) */
const NESTED_SECTION_TYPES = [
  'hero', 'features', 'pricing', 'testimonials', 'faq', 'cta', 'stats',
  'how-it-works', 'team', 'logo-wall', 'video', 'image', 'image-text',
  'gallery', 'map', 'rich-text', 'divider', 'countdown', 'contact-form', 'banner',
  'comparison', 'ai-search', 'social-proof',
] as const

/** Nested section default — delegates to smart defaults for rich placeholders */
function nestedSectionDefault(type: string): SectionData {
  return getSmartDefault(type as any)
}

/**
 * Layout section form — nested column grid with configurable column ratios,
 * variant presets (sidebar, asymmetric, etc.), and nested section editors.
 * NOTE: imports sectionFormMap lazily to avoid circular dependency.
 */
export function LayoutSectionForm({ data, onChange }: FormProps<LayoutData>) {
  const columns = data.columns || [1, 1]
  const gap = data.gap || '1rem'
  const children: LayoutChild[] = data.children || []
  const [editingNested, setEditingNested] = useState<string | null>(null)

  // Lazy import to break circular dependency (layout form uses sectionFormMap which includes layout)
  const [sectionFormMap, setSectionFormMap] = useState<Record<string, React.ComponentType<FormProps<any>>> | null>(null)
  if (!sectionFormMap) {
    import('./index').then(m => setSectionFormMap(m.sectionFormMap))
  }

  function setColumns(cols: number[]) {
    const newChildren: LayoutChild[] = cols.map((_, i) => {
      const existing = children.find(c => c.column === i)
      return existing || { column: i, sections: [] }
    })
    onChange({ ...data, columns: cols, children: newChildren })
  }

  function addNestedSection(colIdx: number, type: string) {
    const newChildren = columns.map((_, i) => {
      const col = children.find(c => c.column === i) || { column: i, sections: [] }
      if (i !== colIdx) return col
      const newSection = { type: type as any, order: col.sections.length, enabled: true, data: nestedSectionDefault(type) }
      return { ...col, sections: [...col.sections, newSection] }
    })
    onChange({ ...data, children: newChildren })
  }

  function updateNestedSection(colIdx: number, secIdx: number, newData: SectionData) {
    const newChildren = columns.map((_, i) => {
      const col = children.find(c => c.column === i) || { column: i, sections: [] }
      if (i !== colIdx) return col
      const secs = [...col.sections]
      secs[secIdx] = { ...secs[secIdx], data: newData }
      return { ...col, sections: secs }
    })
    onChange({ ...data, children: newChildren })
  }

  function removeNestedSection(colIdx: number, secIdx: number) {
    const newChildren = columns.map((_, i) => {
      const col = children.find(c => c.column === i) || { column: i, sections: [] }
      if (i !== colIdx) return col
      return { ...col, sections: col.sections.filter((_, j) => j !== secIdx) }
    })
    onChange({ ...data, children: newChildren })
  }

  return (
    <>
      {(() => {
        const v = data.variant || 'grid'
        const fixedVariants: Record<string, { cols: number[]; desc: string }> = {
          'sidebar-left': { cols: [1, 3], desc: '280px + fluid' },
          'sidebar-right': { cols: [3, 1], desc: 'fluid + 280px' },
          'asymmetric': { cols: [3, 2], desc: '60% / 40%' },
          'thirds': { cols: [1, 1, 1], desc: '3 equal' },
          'hero-split': { cols: [1, 1], desc: '55% / 45%' },
          'stacked': { cols: [1], desc: 'full width' },
        }
        const isFixed = v in fixedVariants
        function handleVariantChange(newVariant: string) {
          const fixed = fixedVariants[newVariant]
          if (fixed) {
            setColumns(fixed.cols)
            onChange({ ...data, variant: newVariant as any, columns: fixed.cols })
          } else {
            onChange({ ...data, variant: newVariant as any })
          }
        }
        return (
          <>
            <VariantPicker sectionType="layout" value={v} onChange={handleVariantChange} />
            <InlineRow>
              <div style={{ flex: 1 }}>
                {isFixed ? (
                  <Field label="Columns" help={FIELD_HELP['layout.columns']}>
                    <div style={{ padding: '5px 10px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.78rem', color: '#64748b' }}>
                      {fixedVariants[v].desc} <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>(fixed by style)</span>
                    </div>
                  </Field>
                ) : (
                  <Field label="Columns" help={FIELD_HELP['layout.columns']}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {LAYOUT_PRESETS.map(p => {
                        const active = p.cols.join(',') === columns.join(',')
                        return (
                          <button key={p.label} type="button" onClick={() => setColumns(p.cols)}
                            style={{ padding: '2px 7px', borderRadius: '4px', border: `1px solid ${active ? '#3b82f6' : '#e2e8f0'}`, background: active ? '#eff6ff' : 'white', color: active ? '#1d4ed8' : '#64748b', fontSize: '0.68rem', cursor: 'pointer', fontWeight: active ? 600 : 400 }}
                          >{p.label}</button>
                        )
                      })}
                    </div>
                  </Field>
                )}
              </div>
              <div style={{ width: '70px', flexShrink: 0 }}><Field label="Spacing" help={FIELD_HELP['layout.gap']}>
                <input style={inputStyle} value={gap} onChange={(e) => onChange({ ...data, gap: e.target.value })} placeholder="1rem" />
              </Field></div>
            </InlineRow>
          </>
        )
      })()}
      {columns.map((_, colIdx) => {
        const col = children.find(c => c.column === colIdx) || { column: colIdx, sections: [] }
        return (
          <Field key={colIdx} label={`Column ${colIdx + 1} (${columns[colIdx]}fr)`}>
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.5rem' }}>
              {col.sections.length === 0 && (
                <div style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.7rem', border: '1px dashed #cbd5e1', borderRadius: '6px' }}>
                  Empty — add sections below
                </div>
              )}
              {col.sections.map((s, si) => {
                const key = `${colIdx}-${si}`
                const isEditing = editingNested === key
                const FormComp = sectionFormMap?.[s.type]
                return (
                  <div key={si} style={{ marginBottom: '0.3rem', background: 'white', borderRadius: '6px', border: isEditing ? '1px solid #3b82f6' : '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div onClick={() => setEditingNested(isEditing ? null : key)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                      <span style={{ fontSize: '0.55rem', color: '#94a3b8', transform: isEditing ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>&#9654;</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#1e293b', flex: 1 }}>{SECTION_TYPE_LABELS[s.type] || s.type}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeNestedSection(colIdx, si) }}
                        style={{ padding: '2px 5px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.6rem' }}>x</button>
                    </div>
                    {isEditing && FormComp && (
                      <div style={{ padding: '0.5rem', borderTop: '1px solid #e2e8f0', background: '#fafbfc' }}>
                        <FormComp data={s.data as any} onChange={(newData: any) => updateNestedSection(colIdx, si, newData)} />
                      </div>
                    )}
                  </div>
                )
              })}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.5rem' }}>
                {NESTED_SECTION_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => addNestedSection(colIdx, t)}
                    style={{ padding: '2px 6px', fontSize: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '4px', background: 'white', cursor: 'pointer', color: '#475569' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white' }}
                  >{SECTION_TYPE_LABELS[t] || t}</button>
                ))}
              </div>
            </div>
          </Field>
        )
      })}
    </>
  )
}
