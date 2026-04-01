/**
 * Interactive section forms — Countdown timer, Contact form builder,
 * Popup modal editor, and Map embed section forms.
 */
import type { CountdownData, ContactFormData, ContactFormField, PopupData, MapData } from '@/lib/landing/landing-types'
import { type FormProps, Field, inputStyle, InlineRow, ImageField, VariantPicker, useState } from './form-primitives'
import { FIELD_HELP } from './form-primitives'

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
              style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>x</button>
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
      <Field label="Dismiss Label"><input style={inputStyle} value={data.dismissLabel || ''} onChange={(e) => set('dismissLabel', e.target.value)} placeholder="\u2715" /></Field>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#475569', cursor: 'pointer' }}>
        <input type="checkbox" checked={data.showOnce !== false} onChange={(e) => set('showOnce', e.target.checked)} />
        Show once per session
      </label>
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
