/**
 * Per-section-type form components for landing page editor.
 * Each form renders inputs for its typed section data.
 * Dynamic array support: items[] with add/remove.
 */
import type { SectionData, HeroData, FeaturesData, PricingData, TestimonialsData, FaqData, CtaData, StatsData, HowItWorksData, TeamData, LogoWallData, NavData, FooterData, VideoData, ImageData, ImageTextData, GalleryData, MapData, RichTextData, DividerData, CountdownData, ContactFormData, BannerData, ContactFormField, LayoutData, LayoutChild, ComparisonData, AiSearchData, SocialProofData, PopupData } from '@/lib/landing/landing-types'
import { IconPicker } from './landing-icon-picker'
import { lazy, Suspense, useState } from 'react'
import { VariantPicker } from './landing-variant-picker'
import { HelpTip } from './landing-help-tip'
import { FIELD_HELP } from './landing-help-text'
import { SECTION_TYPE_LABELS } from './landing-label-maps'
import { getSmartDefault } from './landing-smart-defaults'
import { ImageField } from './landing-image-field'

/** Lazy-load MarkdocEditor (CodeMirror) to avoid bundling in main chunk */
const MarkdocEditor = lazy(() => import('../field-renderers/markdoc-editor'))

type FormProps<T extends SectionData> = { data: T; onChange: (data: T) => void }

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
        {label}
        {help && <HelpTip text={help} />}
      </label>
      {children}
    </div>
  )
}

/** Inline row — puts children side by side */
function InlineRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'flex-end' }}>{children}</div>
}

/** Collapsible items list — shows count when collapsed, expands on click */
function CollapsibleItems({ label, count, children, addButton, defaultOpen = false }: { label: string; count: number; children: React.ReactNode; addButton: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none', marginBottom: open ? '0.5rem' : 0 }}>
        <span style={{ fontSize: '0.6rem', color: '#94a3b8', transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'none' }}>▶</span>
        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>{label}</label>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8', background: '#f1f5f9', padding: '1px 6px', borderRadius: '99px' }}>{count}</span>
      </div>
      {open && <>{children}{addButton}</>}
    </div>
  )
}

/** Auto-detect social platform icon from URL */
function detectSocialIcon(url: string): string {
  const u = url.toLowerCase()
  if (u.includes('facebook.com')) return '📘'
  if (u.includes('x.com') || u.includes('twitter.com')) return '𝕏'
  if (u.includes('instagram.com')) return '📷'
  if (u.includes('youtube.com')) return '▶️'
  if (u.includes('linkedin.com')) return '💼'
  if (u.includes('discord')) return '💬'
  if (u.includes('tiktok.com')) return '🎵'
  if (u.includes('github.com')) return '💻'
  if (u.includes('telegram')) return '✈️'
  if (u.includes('reddit.com')) return '🔴'
  if (u.includes('pinterest.com')) return '📌'
  if (u.includes('whatsapp')) return '📱'
  return '🔗'
}

const inputStyle = { width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', background: 'white' }
const textareaStyle = { ...inputStyle, minHeight: '70px', resize: 'vertical' as const }

function ArrayField({ label, items, onChange }: { label: string; items: string[]; onChange: (items: string[]) => void }) {
  return (
    <Field label={label}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <input style={{ ...inputStyle, flex: 1 }} value={item}
            onChange={(e) => { const n = [...items]; n[i] = e.target.value; onChange(n) }} />
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
            style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            ×
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, ''])}
        style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}>
        + Add
      </button>
    </Field>
  )
}

/** Reusable multi-CTA buttons editor — add/remove/edit buttons with variant */
function CtaListEditor({ cta, onChange }: { cta: unknown; onChange: (v: Array<{ text: string; url: string; variant?: string }>) => void }) {
  const list: Array<{ text: string; url: string; variant?: string }> = Array.isArray(cta) ? cta : cta ? [cta as { text: string; url: string }] : []
  const update = (i: number, patch: Record<string, string>) => { const n = [...list]; n[i] = { ...n[i], ...patch }; onChange(n) }
  return (
    <Field label="Action Buttons">
      {list.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.35rem', alignItems: 'center' }}>
          <input style={{ ...inputStyle, flex: 2, padding: '4px 8px', fontSize: '0.8rem' }} value={item.text} placeholder="Button text" onChange={(e) => update(i, { text: e.target.value })} />
          <select style={{ ...inputStyle, width: '85px', flexShrink: 0, padding: '4px 4px', fontSize: '0.72rem', color: item.url?.startsWith('#') ? '#3b82f6' : '#64748b' }}
            value={item.url?.startsWith('#section-') ? item.url : '_custom'}
            onChange={(e) => {
              const v = e.target.value
              if (v === '_custom') update(i, { url: '' })
              else update(i, { url: v, text: item.text || v.replace('#section-', '').replace(/-/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()) })
            }}>
            <option value="_custom">URL...</option>
            <option value="#section-hero">→ Hero</option>
            <option value="#section-features">→ Features</option>
            <option value="#section-pricing">→ Pricing</option>
            <option value="#section-testimonials">→ Testimonials</option>
            <option value="#section-faq">→ FAQ</option>
            <option value="#section-stats">→ Stats</option>
            <option value="#section-contact-form">→ Contact</option>
          </select>
          {!item.url?.startsWith('#section-') && (
            <input style={{ ...inputStyle, flex: 2, padding: '4px 8px', fontSize: '0.8rem' }} value={item.url} placeholder="https://..." onChange={(e) => update(i, { url: e.target.value })} />
          )}
          <select style={{ ...inputStyle, width: '75px', flexShrink: 0, padding: '4px 4px', fontSize: '0.72rem' }} value={item.variant || (i === 0 ? 'primary' : 'secondary')} onChange={(e) => update(i, { variant: e.target.value })}>
            <option value="primary">Primary</option>
            <option value="secondary">2nd</option>
            <option value="outline">Outline</option>
          </select>
          <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))}
            style={{ padding: '2px 5px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>×</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...list, { text: 'Button', url: '#', variant: list.length === 0 ? 'primary' : 'secondary' }])}
        style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add button</button>
    </Field>
  )
}

export function HeroSectionForm({ data, onChange }: FormProps<HeroData>) {
  const set = (k: keyof HeroData, v: unknown) => onChange({ ...data, [k]: v })
  return (
    <>
      <Field label="Headline" help={FIELD_HELP['hero.headline']}>
        <input style={inputStyle} value={data.headline || ''} onChange={(e) => set('headline', e.target.value)} />
      </Field>
      <Field label="Subtitle" help={FIELD_HELP['hero.subheadline']}>
        <textarea style={textareaStyle} value={data.subheadline || ''} onChange={(e) => set('subheadline', e.target.value)} />
      </Field>
      <VariantPicker sectionType="hero" value={data.variant || 'centered'} onChange={(v) => set('variant', v)} />
      {data.variant !== 'minimal' && (
        <CtaListEditor cta={data.cta} onChange={(v) => set('cta', v)} />
      )}
      {(data.variant === 'video-bg' || data.variant === 'split') && (
        <Field label="Background Photo" help={FIELD_HELP['hero.backgroundImage']}>
          <ImageField value={data.backgroundImage || ''} onChange={(v) => set('backgroundImage', v)} uploadPath="hero" placeholder="https://..." />
        </Field>
      )}
      {(data.variant === 'split' || data.variant === 'centered' || data.variant === 'video-bg') && (
        <Field label="Media URL (video or embed)" help={FIELD_HELP['hero.embed']}>
          <input style={inputStyle} value={data.embed || ''} onChange={(e) => set('embed', e.target.value)} placeholder="https://cdn.example.com/video.mp4 or YouTube embed" />
        </Field>
      )}
    </>
  )
}

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
                <span style={{ fontSize: '0.6rem', color: '#94a3b8', transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'none' }}>▶</span>
                <span style={{ fontSize: '0.85rem' }}>{item.icon || '✦'}</span>
                <span style={{ fontSize: '0.78rem', color: '#1e293b', fontWeight: 600, flex: 1 }}>{item.title || `Feature ${i + 1}`}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); set('items', items.filter((_, j) => j !== i)) }}
                  style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem' }}>×</button>
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

/** Collapsible plan item — shows name + price in header, expands to full form */
function PlanItemAccordion({ plan, index, onUpdate, onRemove }: { plan: any; index: number; onUpdate: (p: any) => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false)
  const up = (k: string, v: unknown) => onUpdate({ ...plan, [k]: v })
  return (
    <div style={{ background: '#f8fafc', borderRadius: '6px', marginBottom: '0.4rem', border: plan.highlighted ? '1.5px solid #3b82f6' : '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.6rem', cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ fontSize: '0.6rem', color: '#94a3b8', transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'none' }}>▶</span>
        <strong style={{ fontSize: '0.8rem', color: '#1e293b', flex: 1 }}>{plan.name || `Plan ${index + 1}`}</strong>
        <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>{plan.price || '—'}</span>
        {plan.highlighted && <span style={{ fontSize: '0.6rem', background: '#dbeafe', color: '#1d4ed8', padding: '1px 5px', borderRadius: '3px' }}>★</span>}
        <button type="button" onClick={(e) => { e.stopPropagation(); onRemove() }}
          style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem' }}>×</button>
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
                  style={{ padding: '2px 5px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.6rem' }}>×</button>
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
                <span style={{ fontSize: '0.6rem', color: '#94a3b8', transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'none' }}>▶</span>
                <span style={{ fontSize: '0.78rem', color: '#1e293b', fontWeight: 600, flex: 1 }}>{item.name || `Testimonial ${i + 1}`}</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.quote?.slice(0, 40)}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); set('items', items.filter((_, j) => j !== i)) }}
                  style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem' }}>×</button>
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

export function CtaSectionForm({ data, onChange }: FormProps<CtaData>) {
  const set = (k: keyof CtaData, v: unknown) => onChange({ ...data, [k]: v })
  return (
    <>
      <Field label="Headline"><input style={inputStyle} value={data.headline || ''} onChange={(e) => set('headline', e.target.value)} /></Field>
      <Field label="Subtitle"><input style={inputStyle} value={data.subheadline || ''} onChange={(e) => set('subheadline', e.target.value)} /></Field>
      <VariantPicker sectionType="cta" value={data.variant || 'default'} onChange={(v) => set('variant', v)} />
      <CtaListEditor cta={data.cta} onChange={(v) => set('cta', v)} />
      {data.variant === 'with-image' && (
        <Field label="Background Photo" help={FIELD_HELP['cta.backgroundImage']}>
          <ImageField value={data.backgroundImage || ''} onChange={(v) => set('backgroundImage', v)} uploadPath="cta" placeholder="https://..." />
        </Field>
      )}
    </>
  )
}

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
              style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>×</button>
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
                style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>×</button>
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
                style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>×</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => set('logos', [...logos, { name: '', image: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Logo</button>
      </Field>
    </>
  )
}

/** Nav section form — brand name and optional custom links */
function NavSectionForm({ data, onChange }: FormProps<NavData>) {
  const set = (k: keyof NavData, v: unknown) => onChange({ ...data, [k]: v })
  const links = data.links || []
  return (
    <>
      <Field label="Brand Name"><input style={inputStyle} value={data.brandName || ''} onChange={(e) => set('brandName', e.target.value)} placeholder="Auto-uses page title if empty" /></Field>
      <VariantPicker sectionType="nav" value={data.variant || 'default'} onChange={(v) => set('variant', v)} />
      <Field label="Logo" help={FIELD_HELP['nav.logo']}>
        <ImageField compact value={data.logo || ''} onChange={(v) => set('logo', v)} uploadPath="nav" placeholder="https://example.com/logo.png" previewSize={32} />
      </Field>
      <CollapsibleItems label="Nav Links" count={links.length} defaultOpen
        addButton={<button type="button" onClick={() => set('links', [...links, { label: '', href: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add link</button>}>
        {links.map((link, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.25rem', alignItems: 'center' }}>
            <input style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: '0.8rem' }} value={link.label} placeholder="Label"
              onChange={(e) => { const n = [...links]; n[i] = { ...n[i], label: e.target.value }; set('links', n) }} />
            <select style={{ ...inputStyle, width: '90px', flexShrink: 0, padding: '4px 4px', fontSize: '0.72rem', color: link.href?.startsWith('#') ? '#3b82f6' : '#64748b' }}
              value={link.href?.startsWith('#section-') ? link.href : '_custom'}
              onChange={(e) => {
                const v = e.target.value
                if (v === '_custom') { const n = [...links]; n[i] = { ...n[i], href: '' }; set('links', n) }
                else { const n = [...links]; n[i] = { ...n[i], href: v, label: n[i].label || v.replace('#section-', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }; set('links', n) }
              }}>
              <option value="_custom">URL...</option>
              <option value="#section-hero">→ Hero</option>
              <option value="#section-features">→ Features</option>
              <option value="#section-pricing">→ Pricing</option>
              <option value="#section-testimonials">→ Testimonials</option>
              <option value="#section-faq">→ FAQ</option>
              <option value="#section-stats">→ Stats</option>
              <option value="#section-how-it-works">→ How It Works</option>
              <option value="#section-team">→ Team</option>
              <option value="#section-cta">→ CTA</option>
              <option value="#section-contact-form">→ Contact</option>
            </select>
            {(!link.href?.startsWith('#section-')) && (
              <>
                <input style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: '0.8rem' }} value={link.href} placeholder="https://..."
                  onChange={(e) => { const n = [...links]; n[i] = { ...n[i], href: e.target.value }; set('links', n) }} />
                <label title="Open in new tab" style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.65rem', color: '#94a3b8', cursor: 'pointer', flexShrink: 0 }}>
                  <input type="checkbox" checked={!!(link as any).target} onChange={(e) => { const n = [...links]; n[i] = { ...n[i], target: e.target.checked ? '_blank' : undefined } as any; set('links', n) }}
                    style={{ width: '12px', height: '12px' }} />↗
                </label>
              </>
            )}
            <button type="button" onClick={() => set('links', links.filter((_, j) => j !== i))}
              style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>×</button>
          </div>
        ))}
      </CollapsibleItems>
      <Field label="Social Links">
        {(data.socialLinks || []).map((sl, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.35rem', alignItems: 'center' }}>
            <IconPicker value={sl.icon || detectSocialIcon(sl.url)} onChange={(v) => { const n = [...(data.socialLinks || [])]; n[i] = { ...n[i], icon: v }; set('socialLinks', n) }} compact />
            <input style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: '0.8rem' }} value={sl.url} placeholder="https://twitter.com/..."
              onChange={(e) => { const n = [...(data.socialLinks || [])]; const autoIcon = detectSocialIcon(e.target.value); n[i] = { ...n[i], url: e.target.value, icon: autoIcon }; set('socialLinks', n) }} />
            <button type="button" onClick={() => set('socialLinks', (data.socialLinks || []).filter((_, j) => j !== i))}
              style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>×</button>
          </div>
        ))}
        <button type="button" onClick={() => set('socialLinks', [...(data.socialLinks || []), { icon: '', url: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add social link</button>
      </Field>
    </>
  )
}

/** Footer section form — text and optional links */
function FooterSectionForm({ data, onChange }: FormProps<FooterData>) {
  const set = (k: keyof FooterData, v: unknown) => onChange({ ...data, [k]: v })
  const links = data.links || []
  const columns = data.columns || []
  const [openCol, setOpenCol] = useState<number | null>(null)
  return (
    <>
      <Field label="Footer Text"><input style={inputStyle} value={data.text || ''} onChange={(e) => set('text', e.target.value)} placeholder="© 2026 Your Brand" /></Field>
      <VariantPicker sectionType="footer" value={data.variant || 'simple'} onChange={(v) => set('variant', v)} />

      {/* Column groups editor — shown when variant is columns */}
      {data.variant === 'columns' && (
        <CollapsibleItems label="Column Groups" count={columns.length} defaultOpen
          addButton={<button type="button" onClick={() => set('columns', [...columns, { heading: '', links: [] }])}
            style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add column group</button>}>
          {columns.map((col, ci) => {
            const isOpen = openCol === ci
            return (
              <div key={ci} style={{ background: '#f8fafc', borderRadius: '6px', marginBottom: '0.4rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div onClick={() => setOpenCol(isOpen ? null : ci)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.6rem', cursor: 'pointer', userSelect: 'none' }}>
                  <span style={{ fontSize: '0.6rem', color: '#94a3b8', transition: 'transform 0.15s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>▶</span>
                  <span style={{ fontSize: '0.78rem', color: '#1e293b', fontWeight: 600, flex: 1 }}>{col.heading || `Column ${ci + 1}`}</span>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{(col.links || []).length} links</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); set('columns', columns.filter((_, j) => j !== ci)) }}
                    style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem' }}>×</button>
                </div>
                {isOpen && (
                  <div style={{ padding: '0 0.6rem 0.5rem' }}>
                    <input style={{ ...inputStyle, marginBottom: '0.4rem', padding: '4px 8px', fontSize: '0.8rem', fontWeight: 600 }} value={col.heading} placeholder="Column heading"
                      onChange={(e) => { const n = [...columns]; n[ci] = { ...n[ci], heading: e.target.value }; set('columns', n) }} />
                    {(col.links || []).map((link, li) => (
                      <div key={li} style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.2rem' }}>
                        <input style={{ ...inputStyle, flex: 1, padding: '3px 6px', fontSize: '0.75rem' }} value={link.label} placeholder="Label"
                          onChange={(e) => { const n = [...columns]; const lks = [...(n[ci].links || [])]; lks[li] = { ...lks[li], label: e.target.value }; n[ci] = { ...n[ci], links: lks }; set('columns', n) }} />
                        <input style={{ ...inputStyle, flex: 1, padding: '3px 6px', fontSize: '0.75rem' }} value={link.href} placeholder="/page"
                          onChange={(e) => { const n = [...columns]; const lks = [...(n[ci].links || [])]; lks[li] = { ...lks[li], href: e.target.value }; n[ci] = { ...n[ci], links: lks }; set('columns', n) }} />
                        <button type="button" onClick={() => { const n = [...columns]; n[ci] = { ...n[ci], links: (n[ci].links || []).filter((_, j) => j !== li) }; set('columns', n) }}
                          style={{ padding: '2px 5px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.6rem' }}>×</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => { const n = [...columns]; n[ci] = { ...n[ci], links: [...(n[ci].links || []), { label: '', href: '' }] }; set('columns', n) }}
                      style={{ fontSize: '0.68rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add link</button>
                  </div>
                )}
              </div>
            )
          })}
        </CollapsibleItems>
      )}

      <CollapsibleItems label={data.variant === 'columns' ? 'Bottom Bar Links' : 'Footer Links'} count={links.length} defaultOpen
        addButton={<button type="button" onClick={() => set('links', [...links, { label: '', href: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add link</button>}>
        {links.map((link, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <input style={{ ...inputStyle, flex: 1 }} value={link.label} placeholder="Label"
              onChange={(e) => { const n = [...links]; n[i] = { ...n[i], label: e.target.value }; set('links', n) }} />
            <input style={{ ...inputStyle, flex: 1 }} value={link.href} placeholder="/privacy"
              onChange={(e) => { const n = [...links]; n[i] = { ...n[i], href: e.target.value }; set('links', n) }} />
            <button type="button" onClick={() => set('links', links.filter((_, j) => j !== i))}
              style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>×</button>
          </div>
        ))}
      </CollapsibleItems>
      <Field label="Social Links">
        {(data.socialLinks || []).map((sl, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.35rem', alignItems: 'center' }}>
            <IconPicker value={sl.icon || detectSocialIcon(sl.url)} onChange={(v) => { const n = [...(data.socialLinks || [])]; n[i] = { ...n[i], icon: v }; set('socialLinks', n) }} compact />
            <input style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: '0.8rem' }} value={sl.url} placeholder="https://twitter.com/..."
              onChange={(e) => { const n = [...(data.socialLinks || [])]; const autoIcon = detectSocialIcon(e.target.value); n[i] = { ...n[i], url: e.target.value, icon: autoIcon }; set('socialLinks', n) }} />
            <button type="button" onClick={() => set('socialLinks', (data.socialLinks || []).filter((_, j) => j !== i))}
              style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>×</button>
          </div>
        ))}
        <button type="button" onClick={() => set('socialLinks', [...(data.socialLinks || []), { icon: '', url: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add social link</button>
      </Field>
    </>
  )
}

export function VideoSectionForm({ data, onChange }: FormProps<VideoData>) {
  const set = (k: keyof VideoData, v: unknown) => onChange({ ...data, [k]: v })
  return (
    <>
      <Field label="Video URL (YouTube, Vimeo, or .mp4)"><input style={inputStyle} value={data.url || ''} onChange={(e) => set('url', e.target.value)} placeholder="https://youtube.com/watch?v=..." /></Field>
      <Field label="Caption"><input style={inputStyle} value={data.caption || ''} onChange={(e) => set('caption', e.target.value)} /></Field>
      <Field label="Autoplay">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <input type="checkbox" checked={!!data.autoplay} onChange={(e) => set('autoplay', e.target.checked)} /> Autoplay (muted)
        </label>
      </Field>
    </>
  )
}

export function ImageSectionForm({ data, onChange }: FormProps<ImageData>) {
  const set = (k: keyof ImageData, v: unknown) => onChange({ ...data, [k]: v })
  return (
    <>
      <Field label="Image">
        <ImageField value={data.src || ''} onChange={(v) => set('src', v)} uploadPath="images" placeholder="https://..." />
      </Field>
      <Field label="Description (for accessibility)" help={FIELD_HELP['image.alt']}>
        <input style={inputStyle} value={data.alt || ''} onChange={(e) => set('alt', e.target.value)} />
      </Field>
      <Field label="Caption"><input style={inputStyle} value={data.caption || ''} onChange={(e) => set('caption', e.target.value)} /></Field>
      <Field label="Full Width">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <input type="checkbox" checked={!!data.fullWidth} onChange={(e) => set('fullWidth', e.target.checked)} /> Full width
        </label>
      </Field>
    </>
  )
}

export function ImageTextSectionForm({ data, onChange }: FormProps<ImageTextData>) {
  const set = (k: keyof ImageTextData, v: unknown) => onChange({ ...data, [k]: v })
  return (
    <>
      <Field label="Image">
        <ImageField value={data.image?.src || ''} onChange={(v) => set('image', { ...data.image, src: v })} uploadPath="images" placeholder="https://..." />
      </Field>
      <Field label="Image Description">
        <input style={inputStyle} value={data.image?.alt || ''} onChange={(e) => set('image', { ...data.image, alt: e.target.value })} />
      </Field>
      <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field>
      <Field label="Text"><textarea style={textareaStyle} value={data.text || ''} onChange={(e) => set('text', e.target.value)} /></Field>
      <Field label="Image Position">
        <select style={inputStyle} value={data.imagePosition || 'left'} onChange={(e) => set('imagePosition', e.target.value)}>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </Field>
      <Field label="CTA Text"><input style={inputStyle} value={data.cta?.text || ''} onChange={(e) => set('cta', { ...data.cta, text: e.target.value, url: data.cta?.url || '#' })} /></Field>
      <Field label="CTA URL"><input style={inputStyle} value={data.cta?.url || ''} onChange={(e) => set('cta', { ...data.cta, url: e.target.value, text: data.cta?.text || 'Learn more' })} /></Field>
    </>
  )
}

export function GallerySectionForm({ data, onChange }: FormProps<GalleryData>) {
  const set = (k: keyof GalleryData, v: unknown) => onChange({ ...data, [k]: v })
  const images = data.images || []
  const [openImg, setOpenImg] = useState<number | null>(null)
  return (
    <>
      <InlineRow>
        <div style={{ flex: 1 }}><Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field></div>
        <div style={{ width: '70px', flexShrink: 0 }}><Field label="Columns" help={FIELD_HELP['gallery.columns']}>
          <select style={inputStyle} value={data.columns || 4} onChange={(e) => set('columns', Number(e.target.value))}>
            <option value={2}>2</option><option value={3}>3</option><option value={4}>4</option><option value={5}>5</option>
          </select>
        </Field></div>
      </InlineRow>
      <VariantPicker sectionType="gallery" value={data.variant || 'grid'} onChange={(v) => set('variant', v)} />
      <CollapsibleItems label="Images" count={images.length} defaultOpen
        addButton={<button type="button" onClick={() => set('images', [...images, { src: '', alt: '' }])}
          style={{ fontSize: '0.7rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Image</button>}>
        {images.map((img, i) => {
          const isOpen = openImg === i
          return (
            <div key={i} style={{ background: '#f8fafc', borderRadius: '6px', marginBottom: '0.3rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div onClick={() => setOpenImg(isOpen ? null : i)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ fontSize: '0.55rem', color: '#94a3b8', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>▶</span>
                {img.src && <img src={img.src} alt="" style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }} />}
                <span style={{ fontSize: '0.72rem', color: '#1e293b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.alt || img.src?.split('/').pop() || `Image ${i + 1}`}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); set('images', images.filter((_, j) => j !== i)) }}
                  style={{ padding: '1px 5px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.6rem' }}>×</button>
              </div>
              {isOpen && (
                <div style={{ padding: '0 0.5rem 0.4rem' }}>
                  <div style={{ marginBottom: '3px' }}>
                    <ImageField compact value={img.src} onChange={(v) => { const n = [...images]; n[i] = { ...n[i], src: v }; set('images', n) }} uploadPath="gallery" placeholder="Image URL" previewSize={32} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <input placeholder="Alt text" style={{ ...inputStyle, flex: 1, padding: '3px 6px', fontSize: '0.75rem' }} value={img.alt || ''} onChange={(e) => { const n = [...images]; n[i] = { ...n[i], alt: e.target.value }; set('images', n) }} />
                    <input placeholder="Caption" style={{ ...inputStyle, flex: 1, padding: '3px 6px', fontSize: '0.75rem' }} value={img.caption || ''} onChange={(e) => { const n = [...images]; n[i] = { ...n[i], caption: e.target.value }; set('images', n) }} />
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

export function MapSectionForm({ data, onChange }: FormProps<MapData>) {
  const set = (k: keyof MapData, v: unknown) => onChange({ ...data, [k]: v })
  return (
    <>
      <Field label="Address (for Google Maps search)"><input style={inputStyle} value={data.address || ''} onChange={(e) => set('address', e.target.value)} placeholder="123 Main St, City, Country" /></Field>
      <Field label="Or direct embed URL"><input style={inputStyle} value={data.embedUrl || ''} onChange={(e) => set('embedUrl', e.target.value)} placeholder="https://maps.google.com/maps?..." /></Field>
      <Field label="Height (px)"><input type="number" style={inputStyle} value={data.height || 400} onChange={(e) => set('height', Number(e.target.value))} /></Field>
    </>
  )
}

type HtmlPart = { type: 'heading' | 'text' | 'button' | 'image' | 'raw'; text: string; href?: string; src?: string; tag?: string; el?: Element }

/** Parse HTML into editable parts using DOMParser (reliable, no regex fragility) */
function parseHtmlParts(html: string): HtmlPart[] {
  if (typeof window === 'undefined') return [{ type: 'text', text: html.replace(/<[^>]+>/g, '') }]
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const parts: HtmlPart[] = []

  // Walk all elements depth-first, extract meaningful leaf content
  function walk(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      const tag = el.tagName.toLowerCase()

      // Headings
      if (/^h[1-6]$/.test(tag)) {
        const text = el.textContent?.trim() || ''
        if (text) parts.push({ type: 'heading', text, tag, el })
        return // don't recurse into heading children
      }
      // Links
      if (tag === 'a' && el.getAttribute('href')) {
        const text = el.textContent?.trim() || ''
        if (text) parts.push({ type: 'button', text, href: el.getAttribute('href') || '#', el })
        return
      }
      // Buttons
      if (tag === 'button') {
        const text = el.textContent?.trim() || ''
        if (text) parts.push({ type: 'button', text, href: '#', el })
        return
      }
      // Images
      if (tag === 'img' && el.getAttribute('src')) {
        parts.push({ type: 'image', text: '', src: el.getAttribute('src') || '', el })
        return
      }
      // Recurse into children
      for (const child of Array.from(node.childNodes)) walk(child)
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim() || ''
      if (text.length > 2) parts.push({ type: 'text', text })
    }
  }
  walk(doc.body)
  return parts.length > 0 ? parts : [{ type: 'text', text: html.replace(/<[^>]+>/g, '') }]
}

export function RichTextSectionForm({ data, onChange }: FormProps<RichTextData>) {
  const [showCode, setShowCode] = useState(false)
  const content = data.content || ''
  const isHtml = content.includes('<') && content.includes('>')
  const parts = isHtml ? parseHtmlParts(content) : []

  /** Update a parsed part — re-parse HTML with DOMParser, modify the element, serialize back */
  function updatePart(idx: number, field: 'text' | 'href' | 'src', value: string) {
    if (typeof window === 'undefined') return
    const doc = new DOMParser().parseFromString(content, 'text/html')
    const reParts: HtmlPart[] = []

    // Re-walk to find matching elements in same order
    function walk(node: Node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element
        const tag = el.tagName.toLowerCase()
        if (/^h[1-6]$/.test(tag) && el.textContent?.trim()) { reParts.push({ type: 'heading', text: el.textContent.trim(), tag, el }); return }
        if (tag === 'a' && el.getAttribute('href') && el.textContent?.trim()) { reParts.push({ type: 'button', text: el.textContent.trim(), href: el.getAttribute('href')!, el }); return }
        if (tag === 'button' && el.textContent?.trim()) { reParts.push({ type: 'button', text: el.textContent.trim(), el }); return }
        if (tag === 'img' && el.getAttribute('src')) { reParts.push({ type: 'image', text: '', src: el.getAttribute('src')!, el }); return }
        for (const child of Array.from(node.childNodes)) walk(child)
      } else if (node.nodeType === Node.TEXT_NODE && (node.textContent?.trim().length || 0) > 2) {
        reParts.push({ type: 'text', text: node.textContent!.trim(), el: node as any })
      }
    }
    walk(doc.body)

    const target = reParts[idx]
    if (!target?.el) return

    if (field === 'text') {
      if (target.el.nodeType === Node.TEXT_NODE) { target.el.textContent = value }
      else { target.el.textContent = value }
    } else if (field === 'href' && target.el instanceof Element) {
      target.el.setAttribute('href', value)
    } else if (field === 'src' && target.el instanceof Element) {
      target.el.setAttribute('src', value)
    }

    onChange({ ...data, content: doc.body.innerHTML })
  }

  const icons: Record<string, string> = { heading: '📝', text: '¶', button: '🔘', image: '🖼', raw: '📄' }

  return (
    <>
      {data.heading !== undefined && <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => onChange({ ...data, heading: e.target.value })} /></Field>}

      {/* Markdown content — default editor */}
      {!isHtml && !showCode && (
        <Suspense fallback={<textarea style={{ ...textareaStyle, minHeight: '100px' }} value={content} onChange={(e) => onChange({ ...data, content: e.target.value })} />}>
          <MarkdocEditor value={content} onChange={(v) => onChange({ ...data, content: v })} />
        </Suspense>
      )}

      {/* HTML content — parsed parts or code editor */}
      {isHtml && !showCode && (
        <>
          {parts.map((part, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.3rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', width: '20px', textAlign: 'center', flexShrink: 0 }}>{icons[part.type]}</span>
              {part.type === 'heading' && (
                <input style={{ ...inputStyle, flex: 1, fontWeight: 700, padding: '4px 8px', fontSize: '0.8rem' }} value={part.text}
                  onChange={(e) => updatePart(i, 'text', e.target.value)} />
              )}
              {part.type === 'text' && (
                <input style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: '0.8rem' }} value={part.text}
                  onChange={(e) => updatePart(i, 'text', e.target.value)} />
              )}
              {part.type === 'button' && (
                <>
                  <input style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: '0.8rem', fontWeight: 600 }} value={part.text}
                    onChange={(e) => updatePart(i, 'text', e.target.value)} placeholder="Button text" />
                  <select style={{ ...inputStyle, width: '80px', flexShrink: 0, padding: '4px 3px', fontSize: '0.68rem', color: part.href?.startsWith('#') ? '#3b82f6' : '#64748b' }}
                    value={part.href?.startsWith('#section-') ? part.href : '_custom'}
                    onChange={(e) => updatePart(i, 'href', e.target.value === '_custom' ? '' : e.target.value)}>
                    <option value="_custom">URL</option>
                    <option value="#section-features">→ Features</option>
                    <option value="#section-pricing">→ Pricing</option>
                    <option value="#section-testimonials">→ Testimonials</option>
                    <option value="#section-faq">→ FAQ</option>
                    <option value="#section-contact-form">→ Contact</option>
                  </select>
                  {!part.href?.startsWith('#section-') && (
                    <input style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: '0.75rem', color: '#3b82f6' }} value={part.href || ''}
                      onChange={(e) => updatePart(i, 'href', e.target.value)} placeholder="https://..." />
                  )}
                </>
              )}
              {part.type === 'image' && (
                <input style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: '0.75rem' }} value={part.src || ''}
                  onChange={(e) => updatePart(i, 'src', e.target.value)} placeholder="Image URL" />
              )}
              {part.type === 'raw' && (
                <input style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: '0.75rem', color: '#64748b' }}
                  value={part.text.replace(/<[^>]+>/g, '')}
                  onChange={(e) => {
                    // Replace plain text content in raw HTML
                    const oldText = part.text.replace(/<[^>]+>/g, '')
                    const escaped = oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                    const newHtml = content.replace(new RegExp(escaped), e.target.value)
                    onChange({ ...data, content: newHtml })
                  }} />
              )}
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
            <button type="button" onClick={() => setShowCode(true)}
              style={{ fontSize: '0.65rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>&lt;/&gt; HTML</button>
          </div>
        </>
      )}
      {isHtml && showCode && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          <Suspense fallback={<textarea style={{ ...textareaStyle, minHeight: '100px', fontFamily: 'monospace', fontSize: '0.75rem' }} value={content} onChange={(e) => onChange({ ...data, content: e.target.value })} />}>
            <MarkdocEditor value={content} onChange={(v) => onChange({ ...data, content: v })} />
          </Suspense>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.3rem 0.6rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <button type="button" onClick={() => setShowCode(false)}
              style={{ fontSize: '0.65rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>Done</button>
          </div>
        </div>
      )}
    </>
  )
}

export function DividerSectionForm({ data, onChange }: FormProps<DividerData>) {
  const set = (k: keyof DividerData, v: unknown) => onChange({ ...data, [k]: v })
  return (
    <>
      <VariantPicker sectionType="divider" value={data.style || 'line'} onChange={(v) => set('style', v)} />
      <Field label="Height (px)" help={FIELD_HELP['divider.height']}>
        <input type="number" style={inputStyle} value={data.height || 40} onChange={(e) => set('height', Number(e.target.value))} />
      </Field>
    </>
  )
}

export function CountdownSectionForm({ data, onChange }: FormProps<CountdownData>) {
  const set = (k: keyof CountdownData, v: unknown) => onChange({ ...data, [k]: v })
  return (
    <>
      <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field>
      <Field label="Target Date"><input type="datetime-local" style={inputStyle} value={data.targetDate || ''} onChange={(e) => set('targetDate', e.target.value)} /></Field>
      <Field label="Expired Text"><input style={inputStyle} value={data.expiredText || ''} onChange={(e) => set('expiredText', e.target.value)} placeholder="This offer has expired." /></Field>
    </>
  )
}

export function ContactFormSectionForm({ data, onChange }: FormProps<ContactFormData>) {
  const set = (k: keyof ContactFormData, v: unknown) => onChange({ ...data, [k]: v })
  const fields = data.fields || []
  return (
    <>
      <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field>
      <Field label="Fields">
        {fields.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem', alignItems: 'center' }}>
            <input placeholder="Label" style={{ ...inputStyle, flex: 2 }} value={f.label} onChange={(e) => { const n = [...fields]; n[i] = { ...n[i], label: e.target.value }; set('fields', n) }} />
            <select style={{ ...inputStyle, flex: 1 }} value={f.type} onChange={(e) => { const n = [...fields]; n[i] = { ...n[i], type: e.target.value as ContactFormField['type'] }; set('fields', n) }}>
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="textarea">Textarea</option>
            </select>
            <button type="button" onClick={() => set('fields', fields.filter((_, j) => j !== i))}
              style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>×</button>
          </div>
        ))}
        <button type="button" onClick={() => set('fields', [...fields, { label: '', type: 'text' as const }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Field</button>
      </Field>
      <Field label="Submit Button Text"><input style={inputStyle} value={data.submitText || ''} onChange={(e) => set('submitText', e.target.value)} placeholder="Send Message" /></Field>
      <Field label="Form Handler URL" help={FIELD_HELP['contact-form.submitUrl']}>
        <input style={inputStyle} value={data.submitUrl || ''} onChange={(e) => set('submitUrl', e.target.value)} placeholder="/api/contact" />
      </Field>
    </>
  )
}

export function BannerSectionForm({ data, onChange }: FormProps<BannerData>) {
  const set = (k: keyof BannerData, v: unknown) => onChange({ ...data, [k]: v })
  return (
    <>
      <Field label="Text"><input style={inputStyle} value={data.text || ''} onChange={(e) => set('text', e.target.value)} placeholder="Announcement text..." /></Field>
      <VariantPicker sectionType="banner" value={data.variant || 'info'} onChange={(v) => set('variant', v)} />
      <InlineRow>
        <div style={{ width: '40px', flexShrink: 0 }}><IconPicker value={data.icon || ''} onChange={(v) => set('icon', v)} compact /></div>
        <div style={{ flex: 1 }}><Field label="Subtext"><input style={inputStyle} value={data.subtext || ''} onChange={(e) => set('subtext', e.target.value)} placeholder="Optional secondary text" /></Field></div>
      </InlineRow>
      <InlineRow>
        <div style={{ flex: 1 }}><Field label="Action Button Text"><input style={inputStyle} value={data.cta?.text || ''} onChange={(e) => set('cta', { ...data.cta, text: e.target.value, url: data.cta?.url || '#' })} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Action Button URL"><input style={inputStyle} value={data.cta?.url || ''} onChange={(e) => set('cta', { ...data.cta, url: e.target.value, text: data.cta?.text || 'Learn more' })} /></Field></div>
        <div style={{ width: '90px', flexShrink: 0 }}><Field label="Closeable" help={FIELD_HELP['banner.dismissible']}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!data.dismissible} onChange={(e) => set('dismissible', e.target.checked)} /> Show ×
          </label>
        </Field></div>
      </InlineRow>
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

export function LayoutSectionForm({ data, onChange }: FormProps<LayoutData>) {
  const columns = data.columns || [1, 1]
  const gap = data.gap || '1rem'
  const children: LayoutChild[] = data.children || []
  const [editingNested, setEditingNested] = useState<string | null>(null) // "colIdx-secIdx"

  function setColumns(cols: number[]) {
    // Preserve existing column children, add empty entries for new columns
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
        // Variants with fixed column layouts — columns preset disabled
        const fixedVariants: Record<string, { cols: number[]; desc: string }> = {
          'sidebar-left': { cols: [1, 3], desc: '280px + fluid' },
          'sidebar-right': { cols: [3, 1], desc: 'fluid + 280px' },
          'asymmetric': { cols: [3, 2], desc: '60% / 40%' },
          'thirds': { cols: [1, 1, 1], desc: '3 equal' },
          'hero-split': { cols: [1, 1], desc: '55% / 45%' },
          'stacked': { cols: [1], desc: 'full width' },
        }
        const isFixed = v in fixedVariants
        // Auto-set columns when switching to a fixed variant
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
                const FormComp = sectionFormMap[s.type]
                return (
                  <div key={si} style={{ marginBottom: '0.3rem', background: 'white', borderRadius: '6px', border: isEditing ? '1px solid #3b82f6' : '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div onClick={() => setEditingNested(isEditing ? null : key)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                      <span style={{ fontSize: '0.55rem', color: '#94a3b8', transform: isEditing ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>▶</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#1e293b', flex: 1 }}>{SECTION_TYPE_LABELS[s.type] || s.type}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeNestedSection(colIdx, si) }}
                        style={{ padding: '2px 5px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.6rem' }}>×</button>
                    </div>
                    {isEditing && FormComp && (
                      <div style={{ padding: '0.5rem', borderTop: '1px solid #e2e8f0', background: '#fafbfc' }}>
                        <FormComp data={s.data as any} onChange={(newData: any) => updateNestedSection(colIdx, si, newData)} />
                      </div>
                    )}
                  </div>
                )
              })}
              {/* Quick-add buttons for common section types */}
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

export function ComparisonSectionForm({ data, onChange }: FormProps<ComparisonData>) {
  const set = (k: keyof ComparisonData, v: unknown) => onChange({ ...data, [k]: v })
  const columns = data.columns || []
  const rows = data.rows || []
  const [openRow, setOpenRow] = useState<number | null>(null)
  return (
    <>
      <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field>
      <CollapsibleItems label="Columns" count={columns.length} defaultOpen
        addButton={<button type="button" onClick={() => set('columns', [...columns, { label: '' }])} style={{ fontSize: '0.7rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Column</button>}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {columns.map((col, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
              <input style={{ ...inputStyle, width: '90px', padding: '3px 6px', fontSize: '0.75rem' }} value={col.label} onChange={(e) => { const c = [...columns]; c[i] = { ...c[i], label: e.target.value }; set('columns', c) }} placeholder={`Col ${i + 1}`} />
              <button type="button" onClick={() => set('columns', columns.filter((_, j) => j !== i))} style={{ padding: '1px 4px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.6rem' }}>×</button>
            </div>
          ))}
        </div>
      </CollapsibleItems>
      <CollapsibleItems label="Rows" count={rows.length} defaultOpen
        addButton={<button type="button" onClick={() => set('rows', [...rows, { label: '', values: columns.map(() => ''), highlight: false }])} style={{ fontSize: '0.7rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Row</button>}>
        {rows.map((row, i) => {
          const isOpen = openRow === i
          return (
            <div key={i} style={{ background: '#f8fafc', borderRadius: '6px', marginBottom: '0.3rem', border: row.highlight ? '1px solid #3b82f6' : '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div onClick={() => setOpenRow(isOpen ? null : i)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ fontSize: '0.55rem', color: '#94a3b8', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>▶</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', flex: 1 }}>{row.label || `Row ${i + 1}`}</span>
                {row.highlight && <span style={{ fontSize: '0.6rem', background: '#dbeafe', color: '#1d4ed8', padding: '1px 4px', borderRadius: '3px' }}>★</span>}
                <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{(row.values || []).filter(Boolean).length}/{columns.length}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); set('rows', rows.filter((_, j) => j !== i)) }}
                  style={{ padding: '1px 5px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.6rem' }}>×</button>
              </div>
              {isOpen && (
                <div style={{ padding: '0 0.5rem 0.4rem' }}>
                  <input style={{ ...inputStyle, marginBottom: '0.3rem', padding: '3px 6px', fontSize: '0.75rem', fontWeight: 600 }} value={row.label} onChange={(e) => { const r = [...rows]; r[i] = { ...r[i], label: e.target.value }; set('rows', r) }} placeholder="Row label" />
                  {(row.values || []).map((val, vi) => (
                    <input key={vi} style={{ ...inputStyle, marginBottom: '0.2rem', padding: '3px 6px', fontSize: '0.75rem' }} value={val} onChange={(e) => { const r = [...rows]; const vals = [...(r[i].values || [])]; vals[vi] = e.target.value; r[i] = { ...r[i], values: vals }; set('rows', r) }} placeholder={columns[vi]?.label || `Col ${vi + 1}`} />
                  ))}
                  <label style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><input type="checkbox" checked={row.highlight || false} onChange={(e) => { const r = [...rows]; r[i] = { ...r[i], highlight: e.target.checked }; set('rows', r) }} style={{ width: '12px', height: '12px' }} /> Highlight</label>
                </div>
              )}
            </div>
          )
        })}
      </CollapsibleItems>
    </>
  )
}

export function AiSearchSectionForm({ data, onChange }: FormProps<AiSearchData>) {
  const set = (k: keyof AiSearchData, v: unknown) => onChange({ ...data, [k]: v })
  const hints = data.hints || []
  return (
    <>
      <Field label="Placeholder"><input style={inputStyle} value={data.placeholder || ''} onChange={(e) => set('placeholder', e.target.value)} placeholder="Describe what you need..." /></Field>
      <Field label="Thinking Text"><input style={inputStyle} value={data.thinkingText || ''} onChange={(e) => set('thinkingText', e.target.value)} /></Field>
      <Field label="Results Header"><input style={inputStyle} value={data.resultsHeader || ''} onChange={(e) => set('resultsHeader', e.target.value)} /></Field>
      <Field label="Hint Chips">
        {hints.map((hint, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input style={{ ...inputStyle, width: '3rem' }} value={hint.icon || ''} onChange={(e) => { const h = [...hints]; h[i] = { ...h[i], icon: e.target.value }; set('hints', h) }} placeholder="🔍" />
            <input style={{ ...inputStyle, flex: 1 }} value={hint.label} onChange={(e) => { const h = [...hints]; h[i] = { ...h[i], label: e.target.value }; set('hints', h) }} placeholder="Label" />
            <input style={{ ...inputStyle, flex: 2 }} value={hint.text} onChange={(e) => { const h = [...hints]; h[i] = { ...h[i], text: e.target.value }; set('hints', h) }} placeholder="Fill text" />
            <button type="button" onClick={() => set('hints', hints.filter((_, j) => j !== i))} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>
        ))}
        <button type="button" onClick={() => set('hints', [...hints, { icon: '', label: '', text: '' }])} style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Hint</button>
      </Field>
      <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>Default suggestions and intents are configured via YAML</p>
    </>
  )
}

export function SocialProofSectionForm({ data, onChange }: FormProps<SocialProofData>) {
  const set = (k: keyof SocialProofData, v: unknown) => onChange({ ...data, [k]: v })
  return (
    <>
      <Field label="Text"><input style={inputStyle} value={data.text || ''} onChange={(e) => set('text', e.target.value)} placeholder="Trusted by 100+ businesses" /></Field>
      <Field label="Icon"><IconPicker value={data.icon || ''} onChange={(v) => set('icon', v)} placeholder="🚀" /></Field>
      <Field label="Link URL (optional)"><input style={inputStyle} value={data.link || ''} onChange={(e) => set('link', e.target.value)} placeholder="https://..." /></Field>
      <VariantPicker sectionType="social-proof" value={data.variant || 'inline'} onChange={(v) => set('variant', v)} />
    </>
  )
}

export function PopupSectionForm({ data, onChange }: FormProps<PopupData>) {
  const set = (k: keyof PopupData, v: unknown) => onChange({ ...data, [k]: v })
  const trigger = data.trigger || { type: 'exit-intent' as const }
  const cta = data.cta || { text: '', url: '' }
  return (
    <>
      <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} placeholder="Wait! Before You Go..." /></Field>
      <Field label="Text"><textarea style={{ ...inputStyle, minHeight: '50px' }} value={data.text || ''} onChange={(e) => set('text', e.target.value)} placeholder="Get 20% off..." /></Field>
      <Field label="Image URL"><ImageField value={data.image || ''} onChange={(v) => set('image', v)} /></Field>
      <InlineRow>
        <Field label="CTA Text"><input style={inputStyle} value={cta.text} onChange={(e) => set('cta', { ...cta, text: e.target.value })} placeholder="Claim Discount" /></Field>
        <Field label="CTA URL"><input style={inputStyle} value={cta.url} onChange={(e) => set('cta', { ...cta, url: e.target.value })} placeholder="#pricing" /></Field>
      </InlineRow>
      <InlineRow>
        <Field label="Trigger">
          <select style={inputStyle} value={trigger.type} onChange={(e) => set('trigger', { ...trigger, type: e.target.value as PopupData['trigger']['type'] })}>
            <option value="exit-intent">Exit Intent</option>
            <option value="scroll">Scroll %</option>
            <option value="time">Time Delay (seconds)</option>
          </select>
        </Field>
        {trigger.type !== 'exit-intent' && (
          <Field label={trigger.type === 'scroll' ? 'Scroll %' : 'Delay (s)'}>
            <input style={inputStyle} type="number" min={0} max={trigger.type === 'scroll' ? 100 : 999} value={trigger.value ?? (trigger.type === 'scroll' ? 50 : 3)} onChange={(e) => set('trigger', { ...trigger, value: Number(e.target.value) })} />
          </Field>
        )}
      </InlineRow>
      <VariantPicker sectionType="popup" value={data.variant || 'centered'} onChange={(v) => set('variant', v)} />
      <Field label="Dismiss Label"><input style={inputStyle} value={data.dismissLabel || ''} onChange={(e) => set('dismissLabel', e.target.value)} placeholder="✕" /></Field>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#475569', cursor: 'pointer' }}>
        <input type="checkbox" checked={data.showOnce !== false} onChange={(e) => set('showOnce', e.target.checked)} />
        Show once per session
      </label>
    </>
  )
}

/** Maps section type to its form component */
export const sectionFormMap: Record<string, React.ComponentType<FormProps<any>>> = {
  nav: NavSectionForm,
  hero: HeroSectionForm,
  features: FeaturesSectionForm,
  pricing: PricingSectionForm,
  testimonials: TestimonialsSectionForm,
  faq: FaqSectionForm,
  cta: CtaSectionForm,
  stats: StatsSectionForm,
  'how-it-works': HowItWorksSectionForm,
  team: TeamSectionForm,
  'logo-wall': LogoWallSectionForm,
  footer: FooterSectionForm,
  video: VideoSectionForm,
  image: ImageSectionForm,
  'image-text': ImageTextSectionForm,
  gallery: GallerySectionForm,
  map: MapSectionForm,
  'rich-text': RichTextSectionForm,
  divider: DividerSectionForm,
  countdown: CountdownSectionForm,
  'contact-form': ContactFormSectionForm,
  banner: BannerSectionForm,
  comparison: ComparisonSectionForm,
  'ai-search': AiSearchSectionForm,
  'social-proof': SocialProofSectionForm,
  layout: LayoutSectionForm,
  popup: PopupSectionForm,
}
