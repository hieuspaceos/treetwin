/**
 * Per-section-type form components for landing page editor.
 * Each form renders inputs for its typed section data.
 * Dynamic array support: items[] with add/remove.
 */
import type { SectionData, HeroData, FeaturesData, PricingData, TestimonialsData, FaqData, CtaData, StatsData, HowItWorksData, TeamData, LogoWallData, NavData, FooterData, VideoData, ImageData, ImageTextData, GalleryData, MapData, RichTextData, DividerData, CountdownData, ContactFormData, BannerData, ContactFormField, LayoutData, LayoutChild, ComparisonData, AiSearchData, SocialProofData } from '@/lib/landing/landing-types'

type FormProps<T extends SectionData> = { data: T; onChange: (data: T) => void }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>{label}</label>
      {children}
    </div>
  )
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
    <Field label="CTA Buttons">
      {list.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.35rem', alignItems: 'center' }}>
          <input style={{ ...inputStyle, flex: 2 }} value={item.text} placeholder="Button text" onChange={(e) => update(i, { text: e.target.value })} />
          <input style={{ ...inputStyle, flex: 2 }} value={item.url} placeholder="/page or #section" onChange={(e) => update(i, { url: e.target.value })} />
          <select style={{ ...inputStyle, flex: 1 }} value={item.variant || (i === 0 ? 'primary' : 'secondary')} onChange={(e) => update(i, { variant: e.target.value })}>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="outline">Outline</option>
          </select>
          <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))}
            style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>×</button>
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
      <Field label="Layout Variant">
        <select style={inputStyle} value={data.variant || 'centered'} onChange={(e) => set('variant', e.target.value)}>
          <option value="centered">Centered (default)</option>
          <option value="split">Split (text left + media right)</option>
          <option value="video-bg">Video/Image Background</option>
          <option value="minimal">Minimal (no CTA button)</option>
        </select>
      </Field>
      <Field label="Headline"><input style={inputStyle} value={data.headline || ''} onChange={(e) => set('headline', e.target.value)} /></Field>
      <Field label="Subheadline"><textarea style={textareaStyle} value={data.subheadline || ''} onChange={(e) => set('subheadline', e.target.value)} /></Field>
      {data.variant !== 'minimal' && (
        <CtaListEditor cta={data.cta} onChange={(v) => set('cta', v)} />
      )}
      {(data.variant === 'video-bg' || data.variant === 'split') && (
        <Field label="Background Image URL"><input style={inputStyle} value={data.backgroundImage || ''} onChange={(e) => set('backgroundImage', e.target.value)} placeholder="https://..." /></Field>
      )}
      {(data.variant === 'split' || data.variant === 'centered' || data.variant === 'video-bg') && (
        <Field label="Embed URL (video/iframe)"><input style={inputStyle} value={data.embed || ''} onChange={(e) => set('embed', e.target.value)} placeholder="https://cdn.example.com/video.mp4 or YouTube embed" /></Field>
      )}
    </>
  )
}

export function FeaturesSectionForm({ data, onChange }: FormProps<FeaturesData>) {
  const set = (k: keyof FeaturesData, v: unknown) => onChange({ ...data, [k]: v })
  const items = data.items || []
  return (
    <>
      <Field label="Layout Variant">
        <select style={inputStyle} value={data.variant || 'grid'} onChange={(e) => set('variant', e.target.value)}>
          <option value="grid">Grid (default)</option>
          <option value="list">List (icon left, text right)</option>
          <option value="alternating">Alternating (zigzag rows)</option>
        </select>
      </Field>
      <Field label="Columns">
        <select style={inputStyle} value={data.columns || 3} onChange={(e) => set('columns', Number(e.target.value))}>
          <option value={2}>2</option>
          <option value={3}>3 (default)</option>
          <option value={4}>4</option>
        </select>
      </Field>
      <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field>
      <Field label="Subheading"><input style={inputStyle} value={data.subheading || ''} onChange={(e) => set('subheading', e.target.value)} /></Field>
      <Field label="Feature Items">
        {items.map((item, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem' }}>
            <input placeholder="Icon (emoji or text)" style={{ ...inputStyle, marginBottom: '4px' }} value={item.icon || ''} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], icon: e.target.value }; set('items', n) }} />
            <input placeholder="Title" style={{ ...inputStyle, marginBottom: '4px' }} value={item.title} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], title: e.target.value }; set('items', n) }} />
            <textarea placeholder="Description" style={{ ...textareaStyle, minHeight: '50px' }} value={item.description} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], description: e.target.value }; set('items', n) }} />
            <button type="button" onClick={() => set('items', items.filter((_, j) => j !== i))}
              style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => set('items', [...items, { title: '', description: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Feature</button>
      </Field>
    </>
  )
}

export function PricingSectionForm({ data, onChange }: FormProps<PricingData>) {
  const set = (k: keyof PricingData, v: unknown) => onChange({ ...data, [k]: v })
  const plans = data.plans || []
  return (
    <>
      <Field label="Layout Variant">
        <select style={inputStyle} value={data.variant || 'cards'} onChange={(e) => set('variant', e.target.value)}>
          <option value="cards">Cards (default)</option>
          <option value="simple">Simple (horizontal compact)</option>
          <option value="highlight-center">Highlight Center (elevated middle plan)</option>
        </select>
      </Field>
      <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field>
      <Field label="Subheading"><input style={inputStyle} value={data.subheading || ''} onChange={(e) => set('subheading', e.target.value)} /></Field>
      <Field label="Plans">
        {plans.map((plan, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem', border: plan.highlighted ? '1.5px solid #3b82f6' : '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <strong style={{ fontSize: '0.8rem', color: '#1e293b' }}>{plan.name || `Plan ${i + 1}`}</strong>
              <button type="button" onClick={() => set('plans', plans.filter((_, j) => j !== i))}
                style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
            </div>
            <input placeholder="Plan name" style={{ ...inputStyle, marginBottom: '4px' }} value={plan.name} onChange={(e) => { const n = [...plans]; n[i] = { ...n[i], name: e.target.value }; set('plans', n) }} />
            <input placeholder="Price (e.g. $29)" style={{ ...inputStyle, marginBottom: '4px' }} value={plan.price} onChange={(e) => { const n = [...plans]; n[i] = { ...n[i], price: e.target.value }; set('plans', n) }} />
            <input placeholder="Period (e.g. /month)" style={{ ...inputStyle, marginBottom: '4px' }} value={plan.period || ''} onChange={(e) => { const n = [...plans]; n[i] = { ...n[i], period: e.target.value }; set('plans', n) }} />
            <textarea placeholder="Description" style={{ ...textareaStyle, minHeight: '50px', marginBottom: '4px' }} value={plan.description || ''} onChange={(e) => { const n = [...plans]; n[i] = { ...n[i], description: e.target.value }; set('plans', n) }} />
            <input placeholder="Badge (e.g. Most Popular)" style={{ ...inputStyle, marginBottom: '4px' }} value={plan.badge || ''} onChange={(e) => { const n = [...plans]; n[i] = { ...n[i], badge: e.target.value }; set('plans', n) }} />
            <input placeholder="CTA Button Text" style={{ ...inputStyle, marginBottom: '4px' }} value={plan.cta?.text || ''} onChange={(e) => { const n = [...plans]; n[i] = { ...n[i], cta: { ...n[i].cta, text: e.target.value, url: n[i].cta?.url || '#' } }; set('plans', n) }} />
            <input placeholder="CTA Button URL" style={{ ...inputStyle, marginBottom: '4px' }} value={plan.cta?.url || ''} onChange={(e) => { const n = [...plans]; n[i] = { ...n[i], cta: { ...n[i].cta, url: e.target.value, text: n[i].cta?.text || 'Get started' } }; set('plans', n) }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem' }}>
              <input type="checkbox" checked={!!plan.highlighted} onChange={(e) => { const n = [...plans]; n[i] = { ...n[i], highlighted: e.target.checked }; set('plans', n) }} />
              Highlighted (featured plan)
            </label>
            <div style={{ marginTop: '0.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Features</label>
              {(plan.features || []).map((feat, fi) => (
                <div key={fi} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <input style={{ ...inputStyle, flex: 1 }} value={feat} onChange={(e) => { const n = [...plans]; const feats = [...(n[i].features || [])]; feats[fi] = e.target.value; n[i] = { ...n[i], features: feats }; set('plans', n) }} />
                  <button type="button" onClick={() => { const n = [...plans]; n[i] = { ...n[i], features: (n[i].features || []).filter((_, fj) => fj !== fi) }; set('plans', n) }}
                    style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>×</button>
                </div>
              ))}
              <button type="button" onClick={() => { const n = [...plans]; n[i] = { ...n[i], features: [...(n[i].features || []), ''] }; set('plans', n) }}
                style={{ fontSize: '0.72rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Feature</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => set('plans', [...plans, { name: '', price: '', features: [], cta: { text: 'Get started', url: '#' } }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Plan</button>
      </Field>
    </>
  )
}

export function TestimonialsSectionForm({ data, onChange }: FormProps<TestimonialsData>) {
  const set = (k: keyof TestimonialsData, v: unknown) => onChange({ ...data, [k]: v })
  const items = data.items || []
  return (
    <>
      <Field label="Layout Variant">
        <select style={inputStyle} value={data.variant || 'cards'} onChange={(e) => set('variant', e.target.value)}>
          <option value="cards">Cards (default)</option>
          <option value="carousel">Carousel (auto-scrolling horizontal)</option>
          <option value="single">Single (one large centered quote)</option>
          <option value="minimal">Minimal (text-only, no avatars)</option>
        </select>
      </Field>
      <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field>
      <Field label="Testimonials">
        {items.map((item, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem' }}>
            <textarea placeholder="Quote" style={{ ...textareaStyle, minHeight: '50px', marginBottom: '4px' }} value={item.quote} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], quote: e.target.value }; set('items', n) }} />
            <input placeholder="Name" style={{ ...inputStyle, marginBottom: '4px' }} value={item.name} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], name: e.target.value }; set('items', n) }} />
            <input placeholder="Role" style={{ ...inputStyle, marginBottom: '4px' }} value={item.role || ''} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], role: e.target.value }; set('items', n) }} />
            <input placeholder="Avatar URL (profile pic)" style={{ ...inputStyle, marginBottom: '4px' }} value={item.avatar || ''} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], avatar: e.target.value }; set('items', n) }} />
            <input placeholder="Company" style={{ ...inputStyle, marginBottom: '4px' }} value={item.company || ''} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], company: e.target.value }; set('items', n) }} />
            <input placeholder="Image URL (screenshot)" style={inputStyle} value={item.image || ''} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], image: e.target.value }; set('items', n) }} />
            <button type="button" onClick={() => set('items', items.filter((_, j) => j !== i))}
              style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => set('items', [...items, { quote: '', name: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Testimonial</button>
      </Field>
    </>
  )
}

export function FaqSectionForm({ data, onChange }: FormProps<FaqData>) {
  const set = (k: keyof FaqData, v: unknown) => onChange({ ...data, [k]: v })
  const items = data.items || []
  return (
    <>
      <Field label="Layout Variant">
        <select style={inputStyle} value={data.variant || 'accordion'} onChange={(e) => set('variant', e.target.value)}>
          <option value="accordion">Accordion (default, expandable)</option>
          <option value="two-column">Two Column (Q left, A right)</option>
          <option value="simple">Simple (all expanded)</option>
        </select>
      </Field>
      <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field>
      <Field label="FAQ Items">
        {items.map((item, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem' }}>
            <input placeholder="Question" style={{ ...inputStyle, marginBottom: '4px' }} value={item.question} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], question: e.target.value }; set('items', n) }} />
            <textarea placeholder="Answer" style={{ ...textareaStyle, minHeight: '60px' }} value={item.answer} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], answer: e.target.value }; set('items', n) }} />
            <button type="button" onClick={() => set('items', items.filter((_, j) => j !== i))}
              style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => set('items', [...items, { question: '', answer: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add FAQ</button>
      </Field>
    </>
  )
}

export function CtaSectionForm({ data, onChange }: FormProps<CtaData>) {
  const set = (k: keyof CtaData, v: unknown) => onChange({ ...data, [k]: v })
  return (
    <>
      <Field label="Layout Variant">
        <select style={inputStyle} value={data.variant || 'default'} onChange={(e) => set('variant', e.target.value)}>
          <option value="default">Centered (default)</option>
          <option value="split">Split (text left, button right)</option>
          <option value="banner">Banner (full-width gradient)</option>
          <option value="minimal">Minimal (text link only)</option>
          <option value="with-image">With Image (background + overlay)</option>
        </select>
      </Field>
      <Field label="Headline"><input style={inputStyle} value={data.headline || ''} onChange={(e) => set('headline', e.target.value)} /></Field>
      <Field label="Subheadline"><input style={inputStyle} value={data.subheadline || ''} onChange={(e) => set('subheadline', e.target.value)} /></Field>
      <CtaListEditor cta={data.cta} onChange={(v) => set('cta', v)} />
      {data.variant === 'with-image' && (
        <Field label="Background Image URL"><input style={inputStyle} value={data.backgroundImage || ''} onChange={(e) => set('backgroundImage', e.target.value)} placeholder="https://..." /></Field>
      )}
    </>
  )
}

export function StatsSectionForm({ data, onChange }: FormProps<StatsData>) {
  const set = (k: keyof StatsData, v: unknown) => onChange({ ...data, [k]: v })
  const items = data.items || []
  return (
    <>
      <Field label="Layout Variant">
        <select style={inputStyle} value={data.variant || 'row'} onChange={(e) => set('variant', e.target.value)}>
          <option value="row">Row (default, horizontal)</option>
          <option value="cards">Cards (each stat in a card)</option>
          <option value="large">Large (big numbers, vertical)</option>
        </select>
      </Field>
      <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field>
      <Field label="Stats">
        {items.map((item, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.6rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '4px' }}>
              <input placeholder="Prefix (e.g. $)" style={{ ...inputStyle, flex: 1 }} value={item.prefix || ''} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], prefix: e.target.value }; set('items', n) }} />
              <input placeholder="Value (e.g. 10k)" style={{ ...inputStyle, flex: 2 }} value={item.value} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], value: e.target.value }; set('items', n) }} />
              <input placeholder="Suffix (e.g. +)" style={{ ...inputStyle, flex: 1 }} value={item.suffix || ''} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], suffix: e.target.value }; set('items', n) }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input placeholder="Label" style={{ ...inputStyle, flex: 1 }} value={item.label} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], label: e.target.value }; set('items', n) }} />
              <button type="button" onClick={() => set('items', items.filter((_, j) => j !== i))}
                style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>×</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => set('items', [...items, { value: '', label: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Stat</button>
      </Field>
    </>
  )
}

export function HowItWorksSectionForm({ data, onChange }: FormProps<HowItWorksData>) {
  const set = (k: keyof HowItWorksData, v: unknown) => onChange({ ...data, [k]: v })
  const items = data.items || []
  return (
    <>
      <Field label="Layout Variant">
        <select style={inputStyle} value={data.variant || 'numbered'} onChange={(e) => set('variant', e.target.value)}>
          <option value="numbered">Numbered (default)</option>
          <option value="timeline">Timeline (vertical with dots)</option>
          <option value="cards">Cards (icon-forward grid)</option>
        </select>
      </Field>
      <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field>
      <Field label="Steps">
        {items.map((item, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem' }}>
            <input placeholder="Step title" style={{ ...inputStyle, marginBottom: '4px' }} value={item.title} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], title: e.target.value }; set('items', n) }} />
            <textarea placeholder="Description" style={{ ...textareaStyle, minHeight: '50px' }} value={item.description} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], description: e.target.value }; set('items', n) }} />
            <button type="button" onClick={() => set('items', items.filter((_, j) => j !== i))}
              style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => set('items', [...items, { title: '', description: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Step</button>
      </Field>
    </>
  )
}

export function TeamSectionForm({ data, onChange }: FormProps<TeamData>) {
  const set = (k: keyof TeamData, v: unknown) => onChange({ ...data, [k]: v })
  const members = data.members || []
  return (
    <>
      <Field label="Layout Variant">
        <select style={inputStyle} value={data.variant || 'grid'} onChange={(e) => set('variant', e.target.value)}>
          <option value="grid">Grid (default, photo cards)</option>
          <option value="list">List (horizontal rows with photos)</option>
          <option value="compact">Compact (names only, no photos)</option>
        </select>
      </Field>
      <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field>
      <Field label="Subheading"><input style={inputStyle} value={data.subheading || ''} onChange={(e) => set('subheading', e.target.value)} /></Field>
      <Field label="Team Members">
        {members.map((m, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem' }}>
            <input placeholder="Name" style={{ ...inputStyle, marginBottom: '4px' }} value={m.name} onChange={(e) => { const n = [...members]; n[i] = { ...n[i], name: e.target.value }; set('members', n) }} />
            <input placeholder="Role" style={{ ...inputStyle, marginBottom: '4px' }} value={m.role} onChange={(e) => { const n = [...members]; n[i] = { ...n[i], role: e.target.value }; set('members', n) }} />
            <input placeholder="Photo URL" style={{ ...inputStyle, marginBottom: '4px' }} value={m.photo || ''} onChange={(e) => { const n = [...members]; n[i] = { ...n[i], photo: e.target.value }; set('members', n) }} />
            <textarea placeholder="Bio" style={{ ...textareaStyle, minHeight: '50px' }} value={m.bio || ''} onChange={(e) => { const n = [...members]; n[i] = { ...n[i], bio: e.target.value }; set('members', n) }} />
            <button type="button" onClick={() => set('members', members.filter((_, j) => j !== i))}
              style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => set('members', [...members, { name: '', role: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Member</button>
      </Field>
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
            <input placeholder="Image URL" style={{ ...inputStyle, marginBottom: '4px' }} value={logo.image || ''} onChange={(e) => { const n = [...logos]; n[i] = { ...n[i], image: e.target.value }; set('logos', n) }} />
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
      <Field label="Layout Variant">
        <select style={inputStyle} value={data.variant || 'default'} onChange={(e) => set('variant', e.target.value)}>
          <option value="default">Default (logo left, links right)</option>
          <option value="centered">Centered (logo center, links split)</option>
          <option value="transparent">Transparent (no background, overlay)</option>
        </select>
      </Field>
      <Field label="Brand Name"><input style={inputStyle} value={data.brandName || ''} onChange={(e) => set('brandName', e.target.value)} placeholder="Auto-uses page title if empty" /></Field>
      <Field label="Nav Links (leave empty to auto-generate from sections)">
        {links.map((link, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <input style={{ ...inputStyle, flex: 1 }} value={link.label} placeholder="Label"
              onChange={(e) => { const n = [...links]; n[i] = { ...n[i], label: e.target.value }; set('links', n) }} />
            <input style={{ ...inputStyle, flex: 1 }} value={link.href} placeholder="#section-features"
              onChange={(e) => { const n = [...links]; n[i] = { ...n[i], href: e.target.value }; set('links', n) }} />
            <button type="button" onClick={() => set('links', links.filter((_, j) => j !== i))}
              style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>×</button>
          </div>
        ))}
        <button type="button" onClick={() => set('links', [...links, { label: '', href: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add link</button>
      </Field>
    </>
  )
}

/** Footer section form — text and optional links */
function FooterSectionForm({ data, onChange }: FormProps<FooterData>) {
  const set = (k: keyof FooterData, v: unknown) => onChange({ ...data, [k]: v })
  const links = data.links || []
  const columns = data.columns || []
  return (
    <>
      <Field label="Layout Variant">
        <select style={inputStyle} value={data.variant || 'simple'} onChange={(e) => set('variant', e.target.value)}>
          <option value="simple">Simple (default, centered text)</option>
          <option value="columns">Columns (multi-column link groups)</option>
          <option value="minimal">Minimal (copyright only)</option>
        </select>
      </Field>
      <Field label="Footer Text"><input style={inputStyle} value={data.text || ''} onChange={(e) => set('text', e.target.value)} placeholder="© 2026 Your Brand" /></Field>

      {/* Column groups editor — shown when variant is columns */}
      {data.variant === 'columns' && (
        <Field label="Column Groups">
          {columns.map((col, ci) => (
            <div key={ci} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input style={{ ...inputStyle, flex: 1, fontWeight: 600 }} value={col.heading} placeholder="Column heading"
                  onChange={(e) => { const n = [...columns]; n[ci] = { ...n[ci], heading: e.target.value }; set('columns', n) }} />
                <button type="button" onClick={() => set('columns', columns.filter((_, j) => j !== ci))}
                  style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Remove</button>
              </div>
              {(col.links || []).map((link, li) => (
                <div key={li} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem', paddingLeft: '0.5rem' }}>
                  <input style={{ ...inputStyle, flex: 1 }} value={link.label} placeholder="Label"
                    onChange={(e) => { const n = [...columns]; const lks = [...(n[ci].links || [])]; lks[li] = { ...lks[li], label: e.target.value }; n[ci] = { ...n[ci], links: lks }; set('columns', n) }} />
                  <input style={{ ...inputStyle, flex: 1 }} value={link.href} placeholder="/page"
                    onChange={(e) => { const n = [...columns]; const lks = [...(n[ci].links || [])]; lks[li] = { ...lks[li], href: e.target.value }; n[ci] = { ...n[ci], links: lks }; set('columns', n) }} />
                  <button type="button" onClick={() => { const n = [...columns]; n[ci] = { ...n[ci], links: (n[ci].links || []).filter((_, j) => j !== li) }; set('columns', n) }}
                    style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>×</button>
                </div>
              ))}
              <button type="button" onClick={() => { const n = [...columns]; n[ci] = { ...n[ci], links: [...(n[ci].links || []), { label: '', href: '' }] }; set('columns', n) }}
                style={{ fontSize: '0.7rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', paddingLeft: '0.5rem' }}>+ Add link</button>
            </div>
          ))}
          <button type="button" onClick={() => set('columns', [...columns, { heading: '', links: [] }])}
            style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add column group</button>
        </Field>
      )}

      <Field label={data.variant === 'columns' ? 'Bottom Bar Links (e.g. Privacy, Terms)' : 'Footer Links'}>
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
        <button type="button" onClick={() => set('links', [...links, { label: '', href: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add link</button>
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
      <Field label="Image URL"><input style={inputStyle} value={data.src || ''} onChange={(e) => set('src', e.target.value)} placeholder="https://..." /></Field>
      <Field label="Alt Text"><input style={inputStyle} value={data.alt || ''} onChange={(e) => set('alt', e.target.value)} /></Field>
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
      <Field label="Image URL"><input style={inputStyle} value={data.image?.src || ''} onChange={(e) => set('image', { ...data.image, src: e.target.value })} placeholder="https://..." /></Field>
      <Field label="Image Alt"><input style={inputStyle} value={data.image?.alt || ''} onChange={(e) => set('image', { ...data.image, alt: e.target.value })} /></Field>
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
  return (
    <>
      <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field>
      <Field label="Images">
        {images.map((img, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.5rem', marginBottom: '0.5rem' }}>
            <input placeholder="Image URL" style={{ ...inputStyle, marginBottom: '4px' }} value={img.src} onChange={(e) => { const n = [...images]; n[i] = { ...n[i], src: e.target.value }; set('images', n) }} />
            <input placeholder="Alt text" style={inputStyle} value={img.alt || ''} onChange={(e) => { const n = [...images]; n[i] = { ...n[i], alt: e.target.value }; set('images', n) }} />
            <button type="button" onClick={() => set('images', images.filter((_, j) => j !== i))}
              style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => set('images', [...images, { src: '', alt: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Image</button>
      </Field>
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

export function RichTextSectionForm({ data, onChange }: FormProps<RichTextData>) {
  return (
    <Field label="HTML Content">
      <textarea style={{ ...textareaStyle, minHeight: '120px', fontFamily: 'monospace' }} value={data.content || ''} onChange={(e) => onChange({ ...data, content: e.target.value }) } placeholder="<p>Your content here...</p>" />
    </Field>
  )
}

export function DividerSectionForm({ data, onChange }: FormProps<DividerData>) {
  const set = (k: keyof DividerData, v: unknown) => onChange({ ...data, [k]: v })
  return (
    <>
      <Field label="Style">
        <select style={inputStyle} value={data.style || 'line'} onChange={(e) => set('style', e.target.value)}>
          <option value="line">Line</option>
          <option value="dots">Dots</option>
          <option value="space">Space only</option>
        </select>
      </Field>
      <Field label="Height (px)"><input type="number" style={inputStyle} value={data.height || 40} onChange={(e) => set('height', Number(e.target.value))} /></Field>
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
      <Field label="Submit URL"><input style={inputStyle} value={data.submitUrl || ''} onChange={(e) => set('submitUrl', e.target.value)} placeholder="/api/contact" /></Field>
    </>
  )
}

export function BannerSectionForm({ data, onChange }: FormProps<BannerData>) {
  const set = (k: keyof BannerData, v: unknown) => onChange({ ...data, [k]: v })
  return (
    <>
      <Field label="Text"><input style={inputStyle} value={data.text || ''} onChange={(e) => set('text', e.target.value)} placeholder="Announcement text..." /></Field>
      <Field label="Variant">
        <select style={inputStyle} value={data.variant || 'info'} onChange={(e) => set('variant', e.target.value)}>
          <option value="info">Info (blue)</option>
          <option value="warning">Warning (amber)</option>
          <option value="success">Success (green)</option>
        </select>
      </Field>
      <Field label="CTA Text"><input style={inputStyle} value={data.cta?.text || ''} onChange={(e) => set('cta', { ...data.cta, text: e.target.value, url: data.cta?.url || '#' })} /></Field>
      <Field label="CTA URL"><input style={inputStyle} value={data.cta?.url || ''} onChange={(e) => set('cta', { ...data.cta, url: e.target.value, text: data.cta?.text || 'Learn more' })} /></Field>
    </>
  )
}

/** Column layout presets — ratio arrays */
const LAYOUT_PRESETS: Array<{ label: string; cols: number[] }> = [
  { label: '1:1', cols: [1, 1] },
  { label: '1:2', cols: [1, 2] },
  { label: '2:1', cols: [2, 1] },
  { label: '1:1:1', cols: [1, 1, 1] },
  { label: '1:1:1:1', cols: [1, 1, 1, 1] },
  { label: '1:2:1', cols: [1, 2, 1] },
]

/** Nested section types available inside a layout column (excludes nav, footer, layout) */
const NESTED_SECTION_TYPES = [
  'hero', 'features', 'pricing', 'testimonials', 'faq', 'cta', 'stats',
  'how-it-works', 'team', 'logo-wall', 'video', 'image', 'image-text',
  'gallery', 'map', 'rich-text', 'divider', 'countdown', 'contact-form', 'banner',
  'comparison', 'ai-search', 'social-proof',
] as const

/** Minimal defaults for nested sections added via layout column */
function nestedSectionDefault(type: string): SectionData {
  const map: Record<string, SectionData> = {
    hero: { headline: 'Headline', subheadline: '', cta: { text: 'Get Started', url: '#' } },
    features: { heading: 'Features', items: [{ title: 'Feature', description: '' }] },
    pricing: { heading: 'Pricing', plans: [] },
    testimonials: { heading: '', items: [] },
    faq: { heading: '', items: [] },
    cta: { headline: 'Call to action', cta: { text: 'Get Started', url: '#' } },
    stats: { items: [{ value: '', label: '' }] },
    'how-it-works': { heading: '', items: [] },
    team: { heading: '', members: [] },
    'logo-wall': { logos: [] },
    video: { url: '' },
    image: { src: '', alt: '' },
    'image-text': { image: { src: '' }, text: '', imagePosition: 'left' },
    gallery: { images: [] },
    map: { address: '' },
    'rich-text': { content: '<p></p>' },
    divider: { style: 'line', height: 40 },
    countdown: { targetDate: '', heading: '' },
    'contact-form': { heading: '', fields: [], submitText: 'Send' },
    banner: { text: '', variant: 'info' },
    comparison: { heading: '', columns: [{ label: '' }], rows: [] },
    'ai-search': { placeholder: '', thinkingText: '', resultsHeader: '', hints: [], defaultSuggestions: [], intents: [] },
    'social-proof': { text: '', variant: 'inline' },
  }
  return map[type] || ({} as SectionData)
}

/** Section type labels for display in layout column list */
const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero', features: 'Features', pricing: 'Pricing', testimonials: 'Testimonials',
  faq: 'FAQ', cta: 'CTA', stats: 'Stats', 'how-it-works': 'How It Works',
  team: 'Team', 'logo-wall': 'Logo Wall', video: 'Video', image: 'Image',
  'image-text': 'Image+Text', gallery: 'Gallery', map: 'Map', 'rich-text': 'Rich Text',
  divider: 'Divider', countdown: 'Countdown', 'contact-form': 'Contact Form', banner: 'Banner',
  comparison: 'Comparison', 'ai-search': 'AI Search', 'social-proof': 'Social Proof',
}

export function LayoutSectionForm({ data, onChange }: FormProps<LayoutData>) {
  const columns = data.columns || [1, 1]
  const gap = data.gap || '1rem'
  const children: LayoutChild[] = data.children || []

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
      <Field label="Column Preset">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {LAYOUT_PRESETS.map(p => {
            const active = p.cols.join(',') === columns.join(',')
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => setColumns(p.cols)}
                style={{
                  padding: '4px 10px', borderRadius: '6px', border: `1px solid ${active ? '#3b82f6' : '#e2e8f0'}`,
                  background: active ? '#eff6ff' : 'white', color: active ? '#1d4ed8' : '#475569',
                  fontSize: '0.75rem', cursor: 'pointer', fontWeight: active ? 600 : 400,
                }}
              >{p.label}</button>
            )
          })}
        </div>
      </Field>
      <Field label="Gap">
        <input style={inputStyle} value={gap} onChange={(e) => onChange({ ...data, gap: e.target.value })} placeholder="1rem" />
      </Field>
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
              {col.sections.map((s, si) => (
                <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', background: 'white', borderRadius: '6px', padding: '6px 8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#1e293b', flex: 1 }}>{SECTION_LABELS[s.type] || s.type}</span>
                  <button type="button" onClick={() => removeNestedSection(colIdx, si)}
                    style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>×</button>
                </div>
              ))}
              {/* Quick-add buttons for common section types */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.5rem' }}>
                {NESTED_SECTION_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => addNestedSection(colIdx, t)}
                    style={{ padding: '2px 6px', fontSize: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '4px', background: 'white', cursor: 'pointer', color: '#475569' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white' }}
                  >{SECTION_LABELS[t] || t}</button>
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
  return (
    <>
      <Field label="Heading"><input style={inputStyle} value={data.heading || ''} onChange={(e) => set('heading', e.target.value)} /></Field>
      <Field label="Subheading"><input style={inputStyle} value={data.subheading || ''} onChange={(e) => set('subheading', e.target.value)} /></Field>
      <Field label="Columns">
        {columns.map((col, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input style={{ ...inputStyle, flex: 1 }} value={col.label} onChange={(e) => { const c = [...columns]; c[i] = { ...c[i], label: e.target.value }; set('columns', c) }} placeholder="Column label" />
            <button type="button" onClick={() => set('columns', columns.filter((_, j) => j !== i))} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>
        ))}
        <button type="button" onClick={() => set('columns', [...columns, { label: '' }])} style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Column</button>
      </Field>
      <Field label="Rows">
        {rows.map((row, i) => (
          <div key={i} style={{ marginBottom: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px' }}>
            <input style={{ ...inputStyle, marginBottom: '0.25rem' }} value={row.label} onChange={(e) => { const r = [...rows]; r[i] = { ...r[i], label: e.target.value }; set('rows', r) }} placeholder="Row label" />
            {(row.values || []).map((val, vi) => (
              <input key={vi} style={{ ...inputStyle, marginBottom: '0.25rem' }} value={val} onChange={(e) => { const r = [...rows]; const vals = [...(r[i].values || [])]; vals[vi] = e.target.value; r[i] = { ...r[i], values: vals }; set('rows', r) }} placeholder={`Value for ${columns[vi]?.label || `col ${vi + 1}`}`} />
            ))}
            <label style={{ fontSize: '0.7rem', color: '#64748b' }}><input type="checkbox" checked={row.highlight || false} onChange={(e) => { const r = [...rows]; r[i] = { ...r[i], highlight: e.target.checked }; set('rows', r) }} /> Highlight</label>
            <button type="button" onClick={() => set('rows', rows.filter((_, j) => j !== i))} style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => set('rows', [...rows, { label: '', values: columns.map(() => ''), highlight: false }])} style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Row</button>
      </Field>
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
      <Field label="Icon (emoji or text)"><input style={inputStyle} value={data.icon || ''} onChange={(e) => set('icon', e.target.value)} placeholder="🚀" /></Field>
      <Field label="Link URL (optional)"><input style={inputStyle} value={data.link || ''} onChange={(e) => set('link', e.target.value)} placeholder="https://..." /></Field>
      <Field label="Variant">
        <select style={inputStyle} value={data.variant || 'inline'} onChange={(e) => set('variant', e.target.value)}>
          <option value="inline">Inline</option>
          <option value="banner">Banner</option>
        </select>
      </Field>
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
}
