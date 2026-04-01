/**
 * Pricing section form — heading, subtitle, variant picker, and collapsible plan items
 * with name, price, period, badge, CTA, featured flag, and feature list.
 */
import type { PricingData } from '@/lib/landing/landing-types'
import { type FormProps, Field, inputStyle, CollapsibleItems, VariantPicker, useState } from './form-primitives'

/** Collapsible plan item — shows name + price in header, expands to full form */
function PlanItemAccordion({ plan, index, onUpdate, onRemove }: { plan: any; index: number; onUpdate: (p: any) => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false)
  const up = (k: string, v: unknown) => onUpdate({ ...plan, [k]: v })
  return (
    <div style={{ background: '#f8fafc', borderRadius: '6px', marginBottom: '0.4rem', border: plan.highlighted ? '1.5px solid #3b82f6' : '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.6rem', cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ fontSize: '0.6rem', color: '#94a3b8', transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'none' }}>&#9654;</span>
        <strong style={{ fontSize: '0.8rem', color: '#1e293b', flex: 1 }}>{plan.name || `Plan ${index + 1}`}</strong>
        <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>{plan.price || '\u2014'}</span>
        {plan.highlighted && <span style={{ fontSize: '0.6rem', background: '#dbeafe', color: '#1d4ed8', padding: '1px 5px', borderRadius: '3px' }}>\u2605</span>}
        <button type="button" onClick={(e) => { e.stopPropagation(); onRemove() }}
          style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem' }}>x</button>
      </div>
      {open && (
        <div style={{ padding: '0 0.6rem 0.6rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '4px' }}>
            <input placeholder="Name" style={{ ...inputStyle, flex: 2, padding: '4px 8px', fontSize: '0.8rem' }} value={plan.name} onChange={(e) => up('name', e.target.value)} />
            <input placeholder="$29" style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: '0.8rem' }} value={plan.price} onChange={(e) => up('price', e.target.value)} />
            <input placeholder="/mo" style={{ ...inputStyle, width: '50px', flexShrink: 0, padding: '4px 8px', fontSize: '0.8rem' }} value={plan.period || ''} onChange={(e) => up('period', e.target.value)} />
          </div>
          <input placeholder="Description" style={{ ...inputStyle, marginBottom: '4px', padding: '4px 8px', fontSize: '0.8rem' }} value={plan.description || ''} onChange={(e) => up('description', e.target.value)} />
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '4px' }}>
            <input placeholder="Badge" style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: '0.8rem' }} value={plan.badge || ''} onChange={(e) => up('badge', e.target.value)} />
            <input placeholder="CTA text" style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: '0.8rem' }} value={plan.cta?.text || ''} onChange={(e) => up('cta', { ...plan.cta, text: e.target.value, url: plan.cta?.url || '#' })} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#475569', marginBottom: '0.4rem' }}>
            <input type="checkbox" checked={!!plan.highlighted} onChange={(e) => up('highlighted', e.target.checked)} /> Featured
          </label>
          <CollapsibleItems label="Features" count={(plan.features || []).length}
            addButton={<button type="button" onClick={() => up('features', [...(plan.features || []), ''])}
              style={{ fontSize: '0.7rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Feature</button>}>
            {(plan.features || []).map((feat: string, fi: number) => (
              <div key={fi} style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.2rem' }}>
                <input style={{ ...inputStyle, flex: 1, padding: '3px 6px', fontSize: '0.75rem' }} value={feat} onChange={(e) => { const f = [...(plan.features || [])]; f[fi] = e.target.value; up('features', f) }} />
                <button type="button" onClick={() => up('features', (plan.features || []).filter((_: unknown, j: number) => j !== fi))}
                  style={{ padding: '2px 5px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.6rem' }}>x</button>
              </div>
            ))}
          </CollapsibleItems>
        </div>
      )}
    </div>
  )
}

export function PricingSectionForm({ data, onChange }: FormProps<PricingData>) {
  const set = (k: keyof PricingData, v: unknown) => onChange({ ...data, [k]: v })
  const plans = data.plans || []
  return (
    <>
      <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field>
      <Field label="Subtitle"><input style={inputStyle} value={data.subheading || ''} onChange={(e) => set('subheading', e.target.value)} /></Field>
      <VariantPicker sectionType="pricing" value={data.variant || 'cards'} onChange={(v) => set('variant', v)} />
      <CollapsibleItems label="Plans" count={plans.length} defaultOpen
        addButton={<button type="button" onClick={() => set('plans', [...plans, { name: '', price: '', features: [], cta: { text: 'Get started', url: '#' } }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Plan</button>}>
        {plans.map((plan, i) => (
          <PlanItemAccordion key={i} plan={plan} index={i} onUpdate={(updated) => { const n = [...plans]; n[i] = updated; set('plans', n) }} onRemove={() => set('plans', plans.filter((_, j) => j !== i))} />
        ))}
      </CollapsibleItems>
    </>
  )
}
