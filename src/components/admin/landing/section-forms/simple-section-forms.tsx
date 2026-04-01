/**
 * Simple/lightweight section forms — CTA, Banner, Divider, RichText (with HTML parser),
 * Comparison table, AiSearch, and SocialProof section editors.
 */
import type { CtaData, BannerData, DividerData, RichTextData, ComparisonData, AiSearchData, SocialProofData } from '@/lib/landing/landing-types'
import { type FormProps, Field, inputStyle, textareaStyle, InlineRow, CollapsibleItems, CtaListEditor, ImageField, IconPicker, VariantPicker, FIELD_HELP, MarkdocEditor, Suspense, useState } from './form-primitives'

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
            <input type="checkbox" checked={!!data.dismissible} onChange={(e) => set('dismissible', e.target.checked)} /> Show x
          </label>
        </Field></div>
      </InlineRow>
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

type HtmlPart = { type: 'heading' | 'text' | 'button' | 'image' | 'raw'; text: string; href?: string; src?: string; tag?: string; el?: Element }

/** Parse HTML into editable parts using DOMParser (reliable, no regex fragility) */
function parseHtmlParts(html: string): HtmlPart[] {
  if (typeof window === 'undefined') return [{ type: 'text', text: html.replace(/<[^>]+>/g, '') }]
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const parts: HtmlPart[] = []

  function walk(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      const tag = el.tagName.toLowerCase()
      if (/^h[1-6]$/.test(tag)) {
        const text = el.textContent?.trim() || ''
        if (text) parts.push({ type: 'heading', text, tag, el })
        return
      }
      if (tag === 'a' && el.getAttribute('href')) {
        const text = el.textContent?.trim() || ''
        if (text) parts.push({ type: 'button', text, href: el.getAttribute('href') || '#', el })
        return
      }
      if (tag === 'button') {
        const text = el.textContent?.trim() || ''
        if (text) parts.push({ type: 'button', text, href: '#', el })
        return
      }
      if (tag === 'img' && el.getAttribute('src')) {
        parts.push({ type: 'image', text: '', src: el.getAttribute('src') || '', el })
        return
      }
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

  const icons: Record<string, string> = { heading: '\u{1F4DD}', text: '\u00B6', button: '\u{1F518}', image: '\u{1F5BC}', raw: '\u{1F4C4}' }

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
                    <option value="#section-features">&rarr; Features</option>
                    <option value="#section-pricing">&rarr; Pricing</option>
                    <option value="#section-testimonials">&rarr; Testimonials</option>
                    <option value="#section-faq">&rarr; FAQ</option>
                    <option value="#section-contact-form">&rarr; Contact</option>
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
              <button type="button" onClick={() => set('columns', columns.filter((_, j) => j !== i))} style={{ padding: '1px 4px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.6rem' }}>x</button>
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
                <span style={{ fontSize: '0.55rem', color: '#94a3b8', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>&#9654;</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', flex: 1 }}>{row.label || `Row ${i + 1}`}</span>
                {row.highlight && <span style={{ fontSize: '0.6rem', background: '#dbeafe', color: '#1d4ed8', padding: '1px 4px', borderRadius: '3px' }}>\u2605</span>}
                <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{(row.values || []).filter(Boolean).length}/{columns.length}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); set('rows', rows.filter((_, j) => j !== i)) }}
                  style={{ padding: '1px 5px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.6rem' }}>x</button>
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
            <input style={{ ...inputStyle, width: '3rem' }} value={hint.icon || ''} onChange={(e) => { const h = [...hints]; h[i] = { ...h[i], icon: e.target.value }; set('hints', h) }} placeholder="\u{1F50D}" />
            <input style={{ ...inputStyle, flex: 1 }} value={hint.label} onChange={(e) => { const h = [...hints]; h[i] = { ...h[i], label: e.target.value }; set('hints', h) }} placeholder="Label" />
            <input style={{ ...inputStyle, flex: 2 }} value={hint.text} onChange={(e) => { const h = [...hints]; h[i] = { ...h[i], text: e.target.value }; set('hints', h) }} placeholder="Fill text" />
            <button type="button" onClick={() => set('hints', hints.filter((_, j) => j !== i))} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>x</button>
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
      <Field label="Icon"><IconPicker value={data.icon || ''} onChange={(v) => set('icon', v)} placeholder="\u{1F680}" /></Field>
      <Field label="Link URL (optional)"><input style={inputStyle} value={data.link || ''} onChange={(e) => set('link', e.target.value)} placeholder="https://..." /></Field>
      <VariantPicker sectionType="social-proof" value={data.variant || 'inline'} onChange={(v) => set('variant', v)} />
    </>
  )
}
