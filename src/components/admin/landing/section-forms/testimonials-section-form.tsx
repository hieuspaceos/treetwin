/**
 * Testimonials section form — heading, variant picker, and collapsible testimonial items
 * with quote, name, role, company, avatar, and image fields.
 */
import type { TestimonialsData } from '@/lib/landing/landing-types'
import { type FormProps, Field, inputStyle, textareaStyle, CollapsibleItems, ImageField, VariantPicker, useState } from './form-primitives'

export function TestimonialsSectionForm({ data, onChange }: FormProps<TestimonialsData>) {
  const set = (k: keyof TestimonialsData, v: unknown) => onChange({ ...data, [k]: v })
  const items = data.items || []
  const [openItem, setOpenItem] = useState<number | null>(null)
  return (
    <>
      <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field>
      <VariantPicker sectionType="testimonials" value={data.variant || 'cards'} onChange={(v) => set('variant', v)} />
      <CollapsibleItems label="Testimonials" count={items.length} defaultOpen
        addButton={<button type="button" onClick={() => set('items', [...items, { quote: '', name: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Testimonial</button>}>
        {items.map((item, i) => {
          const open = openItem === i
          return (
            <div key={i} style={{ background: '#f8fafc', borderRadius: '6px', marginBottom: '0.4rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div onClick={() => setOpenItem(open ? null : i)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.6rem', cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ fontSize: '0.6rem', color: '#94a3b8', transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'none' }}>&#9654;</span>
                <span style={{ fontSize: '0.78rem', color: '#1e293b', fontWeight: 600, flex: 1 }}>{item.name || `Testimonial ${i + 1}`}</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.quote?.slice(0, 40)}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); set('items', items.filter((_, j) => j !== i)) }}
                  style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem' }}>x</button>
              </div>
              {open && (
                <div style={{ padding: '0 0.6rem 0.5rem' }}>
                  <textarea placeholder="Quote" style={{ ...textareaStyle, minHeight: '40px', padding: '4px 8px', fontSize: '0.8rem', marginBottom: '4px' }} value={item.quote} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], quote: e.target.value }; set('items', n) }} />
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '4px' }}>
                    <input placeholder="Name" style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: '0.8rem' }} value={item.name} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], name: e.target.value }; set('items', n) }} />
                    <input placeholder="Role" style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: '0.8rem' }} value={item.role || ''} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], role: e.target.value }; set('items', n) }} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '4px' }}>
                    <input placeholder="Company" style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: '0.8rem' }} value={item.company || ''} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], company: e.target.value }; set('items', n) }} />
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginBottom: '2px' }}>Photo (avatar)</label>
                    <ImageField compact value={item.avatar || ''} onChange={(v) => { const n = [...items]; n[i] = { ...n[i], avatar: v }; set('items', n) }} uploadPath="testimonials" placeholder="Avatar URL" previewSize={32} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginBottom: '2px' }}>Screenshot / Photo</label>
                    <ImageField value={item.image || ''} onChange={(v) => { const n = [...items]; n[i] = { ...n[i], image: v }; set('items', n) }} uploadPath="testimonials" placeholder="Image URL" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </CollapsibleItems>
    </>
  )
}
