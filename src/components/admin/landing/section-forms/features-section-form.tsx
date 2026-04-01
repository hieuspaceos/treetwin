/**
 * Features section form — heading, columns, variant picker, and collapsible feature items
 * with title, description, and icon editing.
 */
import type { FeaturesData } from '@/lib/landing/landing-types'
import { type FormProps, Field, inputStyle, textareaStyle, InlineRow, CollapsibleItems, VariantPicker, FIELD_HELP, useState } from './form-primitives'

export function FeaturesSectionForm({ data, onChange }: FormProps<FeaturesData>) {
  const set = (k: keyof FeaturesData, v: unknown) => onChange({ ...data, [k]: v })
  const items = data.items || []
  const [openItem, setOpenItem] = useState<number | null>(null)
  return (
    <>
      <InlineRow>
        <div style={{ flex: 1 }}><Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field></div>
        <div style={{ width: '70px', flexShrink: 0 }}><Field label="Columns" help={FIELD_HELP['features.columns']}>
          <select style={inputStyle} value={data.columns || 3} onChange={(e) => set('columns', Number(e.target.value))}>
            <option value={2}>2</option><option value={3}>3</option><option value={4}>4</option>
          </select>
        </Field></div>
      </InlineRow>
      <VariantPicker sectionType="features" value={data.variant || 'grid'} onChange={(v) => set('variant', v)} />
      <CollapsibleItems label="Features" count={items.length} defaultOpen
        addButton={<button type="button" onClick={() => set('items', [...items, { title: '', description: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Feature</button>}>
        {items.map((item, i) => {
          const open = openItem === i
          return (
            <div key={i} style={{ background: '#f8fafc', borderRadius: '6px', marginBottom: '0.4rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div onClick={() => setOpenItem(open ? null : i)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.6rem', cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ fontSize: '0.6rem', color: '#94a3b8', transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'none' }}>&#9654;</span>
                <span style={{ fontSize: '0.85rem' }}>{item.icon || '\u2726'}</span>
                <span style={{ fontSize: '0.78rem', color: '#1e293b', fontWeight: 600, flex: 1 }}>{item.title || `Feature ${i + 1}`}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); set('items', items.filter((_, j) => j !== i)) }}
                  style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem' }}>x</button>
              </div>
              {open && (
                <div style={{ padding: '0 0.6rem 0.5rem' }}>
                  <input placeholder="Title" style={{ ...inputStyle, marginBottom: '4px', padding: '4px 8px', fontSize: '0.8rem' }} value={item.title} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], title: e.target.value }; set('items', n) }} />
                  <textarea placeholder="Description" style={{ ...textareaStyle, minHeight: '40px', padding: '4px 8px', fontSize: '0.8rem' }} value={item.description} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], description: e.target.value }; set('items', n) }} />
                </div>
              )}
            </div>
          )
        })}
      </CollapsibleItems>
    </>
  )
}
