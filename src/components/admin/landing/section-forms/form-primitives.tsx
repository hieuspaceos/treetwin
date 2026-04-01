/**
 * Shared types, styles, and helper components for landing section forms.
 * All section form files import their primitives from here.
 */
import type { SectionData } from '@/lib/landing/landing-types'
import { HelpTip } from '../landing-help-tip'
import { lazy, Suspense, useState } from 'react'
import { ImageField } from '../landing-image-field'

/** Lazy-load MarkdocEditor (CodeMirror) to avoid bundling in main chunk */
export const MarkdocEditor = lazy(() => import('../../field-renderers/markdoc-editor'))

/** Props shared by all section form components */
export type SectionFormProps<T extends SectionData = SectionData> = { data: T; onChange: (data: T) => void }

/** Alias kept for internal use within section form files */
export type FormProps<T extends SectionData> = SectionFormProps<T>

export const inputStyle = { width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', background: 'white' }
export const textareaStyle = { ...inputStyle, minHeight: '70px', resize: 'vertical' as const }

export function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
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
export function InlineRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'flex-end' }}>{children}</div>
}

/** Collapsible items list — shows count when collapsed, expands on click */
export function CollapsibleItems({ label, count, children, addButton, defaultOpen = false }: { label: string; count: number; children: React.ReactNode; addButton: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none', marginBottom: open ? '0.5rem' : 0 }}>
        <span style={{ fontSize: '0.6rem', color: '#94a3b8', transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'none' }}>&#9654;</span>
        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>{label}</label>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8', background: '#f1f5f9', padding: '1px 6px', borderRadius: '99px' }}>{count}</span>
      </div>
      {open && <>{children}{addButton}</>}
    </div>
  )
}

/** Auto-detect social platform icon from URL */
export function detectSocialIcon(url: string): string {
  const u = url.toLowerCase()
  if (u.includes('facebook.com')) return '\u{1F4D8}'
  if (u.includes('x.com') || u.includes('twitter.com')) return '\u{1D54F}'
  if (u.includes('instagram.com')) return '\u{1F4F7}'
  if (u.includes('youtube.com')) return '\u25B6\uFE0F'
  if (u.includes('linkedin.com')) return '\u{1F4BC}'
  if (u.includes('discord')) return '\u{1F4AC}'
  if (u.includes('tiktok.com')) return '\u{1F3B5}'
  if (u.includes('github.com')) return '\u{1F4BB}'
  if (u.includes('telegram')) return '\u2708\uFE0F'
  if (u.includes('reddit.com')) return '\u{1F534}'
  if (u.includes('pinterest.com')) return '\u{1F4CC}'
  if (u.includes('whatsapp')) return '\u{1F4F1}'
  return '\u{1F517}'
}

export function ArrayField({ label, items, onChange }: { label: string; items: string[]; onChange: (items: string[]) => void }) {
  return (
    <Field label={label}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <input style={{ ...inputStyle, flex: 1 }} value={item}
            onChange={(e) => { const n = [...items]; n[i] = e.target.value; onChange(n) }} />
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
            style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            x
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
export function CtaListEditor({ cta, onChange }: { cta: unknown; onChange: (v: Array<{ text: string; url: string; variant?: string }>) => void }) {
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
            <option value="#section-hero">&rarr; Hero</option>
            <option value="#section-features">&rarr; Features</option>
            <option value="#section-pricing">&rarr; Pricing</option>
            <option value="#section-testimonials">&rarr; Testimonials</option>
            <option value="#section-faq">&rarr; FAQ</option>
            <option value="#section-stats">&rarr; Stats</option>
            <option value="#section-contact-form">&rarr; Contact</option>
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
            style={{ padding: '2px 5px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>x</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...list, { text: 'Button', url: '#', variant: list.length === 0 ? 'primary' : 'secondary' }])}
        style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add button</button>
    </Field>
  )
}

// Re-export dependencies that section forms commonly need
export { ImageField } from '../landing-image-field'
export { IconPicker } from '../landing-icon-picker'
export { VariantPicker } from '../landing-variant-picker'
export { FIELD_HELP } from '../landing-help-text'
export { SECTION_TYPE_LABELS } from '../landing-label-maps'
export { getSmartDefault } from '../landing-smart-defaults'
export { Suspense, useState } from 'react'
