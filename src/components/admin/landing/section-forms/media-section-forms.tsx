/**
 * Media section forms — Video, Image, ImageText, and Gallery section editors
 * for managing media-heavy landing page sections.
 */
import type { VideoData, ImageData, ImageTextData, GalleryData } from '@/lib/landing/landing-types'
import { type FormProps, Field, inputStyle, textareaStyle, InlineRow, CollapsibleItems, ImageField, VariantPicker, FIELD_HELP, useState } from './form-primitives'

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
                <span style={{ fontSize: '0.55rem', color: '#94a3b8', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>&#9654;</span>
                {img.src && <img src={img.src} alt="" style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }} />}
                <span style={{ fontSize: '0.72rem', color: '#1e293b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.alt || img.src?.split('/').pop() || `Image ${i + 1}`}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); set('images', images.filter((_, j) => j !== i)) }}
                  style={{ padding: '1px 5px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.6rem' }}>x</button>
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
