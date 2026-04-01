/**
 * Nav and Footer section forms — brand name, nav links, social links,
 * footer text, column groups, and bottom bar links.
 */
import type { NavData, FooterData } from '@/lib/landing/landing-types'
import { type FormProps, Field, inputStyle, CollapsibleItems, InlineRow, detectSocialIcon, ImageField, IconPicker, VariantPicker, FIELD_HELP, useState } from './form-primitives'

export function NavSectionForm({ data, onChange }: FormProps<NavData>) {
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
              <option value="#section-hero">&rarr; Hero</option>
              <option value="#section-features">&rarr; Features</option>
              <option value="#section-pricing">&rarr; Pricing</option>
              <option value="#section-testimonials">&rarr; Testimonials</option>
              <option value="#section-faq">&rarr; FAQ</option>
              <option value="#section-stats">&rarr; Stats</option>
              <option value="#section-how-it-works">&rarr; How It Works</option>
              <option value="#section-team">&rarr; Team</option>
              <option value="#section-cta">&rarr; CTA</option>
              <option value="#section-contact-form">&rarr; Contact</option>
            </select>
            {(!link.href?.startsWith('#section-')) && (
              <>
                <input style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: '0.8rem' }} value={link.href} placeholder="https://..."
                  onChange={(e) => { const n = [...links]; n[i] = { ...n[i], href: e.target.value }; set('links', n) }} />
                <label title="Open in new tab" style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.65rem', color: '#94a3b8', cursor: 'pointer', flexShrink: 0 }}>
                  <input type="checkbox" checked={!!(link as any).target} onChange={(e) => { const n = [...links]; n[i] = { ...n[i], target: e.target.checked ? '_blank' : undefined } as any; set('links', n) }}
                    style={{ width: '12px', height: '12px' }} />&uarr;
                </label>
              </>
            )}
            <button type="button" onClick={() => set('links', links.filter((_, j) => j !== i))}
              style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>x</button>
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
              style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>x</button>
          </div>
        ))}
        <button type="button" onClick={() => set('socialLinks', [...(data.socialLinks || []), { icon: '', url: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add social link</button>
      </Field>
    </>
  )
}

export function FooterSectionForm({ data, onChange }: FormProps<FooterData>) {
  const set = (k: keyof FooterData, v: unknown) => onChange({ ...data, [k]: v })
  const links = data.links || []
  const columns = data.columns || []
  const [openCol, setOpenCol] = useState<number | null>(null)
  return (
    <>
      <Field label="Footer Text"><input style={inputStyle} value={data.text || ''} onChange={(e) => set('text', e.target.value)} placeholder="&copy; 2026 Your Brand" /></Field>
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
                  <span style={{ fontSize: '0.6rem', color: '#94a3b8', transition: 'transform 0.15s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>&#9654;</span>
                  <span style={{ fontSize: '0.78rem', color: '#1e293b', fontWeight: 600, flex: 1 }}>{col.heading || `Column ${ci + 1}`}</span>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{(col.links || []).length} links</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); set('columns', columns.filter((_, j) => j !== ci)) }}
                    style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem' }}>x</button>
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
                          style={{ padding: '2px 5px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.6rem' }}>x</button>
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
              style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>x</button>
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
              style={{ padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>x</button>
          </div>
        ))}
        <button type="button" onClick={() => set('socialLinks', [...(data.socialLinks || []), { icon: '', url: '' }])}
          style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add social link</button>
      </Field>
    </>
  )
}
