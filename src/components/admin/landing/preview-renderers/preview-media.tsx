/**
 * Media section preview renderers: video, image, image-text, and gallery.
 * Gallery supports grid, masonry, carousel, filmstrip, and lightbox variants.
 */
import type { VideoData, ImageData, ImageTextData, GalleryData } from '@/lib/landing/landing-types'

export function PreviewVideo({ data }: { data: VideoData }) {
  return (
    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem' }}>{'\u25B6'}</div>
      <p style={{ fontSize: '0.8rem', color: '#475569', wordBreak: 'break-all' }}>{data.url}</p>
      {data.caption && <p style={{ fontSize: '0.75rem', color: 'var(--lp-text-muted)' }}>{data.caption}</p>}
    </div>
  )
}

export function PreviewImage({ data }: { data: ImageData }) {
  return (
    <div style={{ padding: '0.5rem', textAlign: 'center' }}>
      <div style={{ background: 'var(--lp-text-muted, #94a3b8)', borderRadius: '8px', padding: '2rem', fontSize: '0.75rem', color: 'var(--lp-text-muted)' }}>
        [Image] {data.alt || data.src}
      </div>
      {data.caption && <p style={{ fontSize: '0.75rem', color: 'var(--lp-text-muted)', marginTop: '4px' }}>{data.caption}</p>}
    </div>
  )
}

export function PreviewImageText({ data }: { data: ImageTextData }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '1rem', flexDirection: data.imagePosition === 'right' ? 'row-reverse' : 'row' }}>
      <div style={{ flex: 1, background: 'var(--lp-text-muted, #94a3b8)', borderRadius: '8px', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--lp-text-muted)' }}>Image</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
        {data.heading && <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--lp-text)' }}>{data.heading}</p>}
        <p style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted)' }}>{data.text}</p>
        {data.cta && <span style={{ fontSize: '0.75rem', color: 'var(--lp-accent, #16a34a)', fontWeight: 600 }}>{data.cta.text} {'\u2192'}</span>}
      </div>
    </div>
  )
}

export function PreviewGallery({ data }: { data: GalleryData }) {
  const v = data.variant || 'grid'
  const cols = data.columns || 4
  const images = data.images || []
  const imgEl = (img: { src: string; alt?: string; caption?: string }, i: number) => (
    <div key={i} className="lp-card-hover" style={{ overflow: 'hidden', borderRadius: 'var(--lp-radius, 8px)' }}>
      {img.src ? <img src={img.src} alt={img.alt || ''} style={{ width: '100%', aspectRatio: v === 'masonry' ? undefined : '4/3', objectFit: 'cover', display: 'block' }} /> :
        <div style={{ background: '#e2e8f0', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#94a3b8' }}>No image</div>}
      {img.caption && <p style={{ padding: '0.4rem', textAlign: 'center', fontSize: '0.7rem', color: 'var(--lp-text-muted)' }}>{img.caption}</p>}
    </div>
  )
  return (
    <div className="landing-section">
      {data.heading && (
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2>{data.heading}</h2>
          {data.subheading && <p style={{ color: 'var(--lp-text-muted)', marginTop: '0.5rem' }}>{data.subheading}</p>}
        </div>
      )}
      {v === 'grid' && <div className={`landing-grid-${Math.min(cols, 5)}`} style={{ gap: '0.75rem' }}>{images.map((img, i) => imgEl(img, i))}</div>}
      {v === 'masonry' && <div className="lp-gallery-masonry">{images.map((img, i) => imgEl(img, i))}</div>}
      {(v === 'carousel' || v === 'filmstrip') && (
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto' }}>
          {images.map((img, i) => (
            <div key={i} style={{ flexShrink: 0, width: v === 'carousel' ? '200px' : '180px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
              {img.src ? <img src={img.src} alt={img.alt || ''} style={{ width: '100%', height: v === 'carousel' ? '150px' : '130px', objectFit: 'cover', display: 'block' }} />
                : <div style={{ background: '#e2e8f0', height: v === 'carousel' ? '150px' : '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#94a3b8' }}>No image</div>}
              {img.caption && <p style={{ padding: '0.35rem 0.5rem', fontSize: '0.65rem', color: 'var(--lp-text-muted)', textAlign: 'center', margin: 0 }}>{img.caption}</p>}
            </div>
          ))}
        </div>
      )}
      {v === 'lightbox' && <div className={`landing-grid-${Math.min(cols, 5)}`} style={{ gap: '0.75rem' }}>{images.map((img, i) => <div key={i} style={{ position: 'relative' }}>{imgEl(img, i)}<div style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: '4px', padding: '1px 5px', fontSize: '0.6rem' }}>{'\uD83D\uDD0D'}</div></div>)}</div>}
      {images.length === 0 && <p style={{ textAlign: 'center', color: 'var(--lp-text-muted)', fontSize: '0.8rem' }}>No images added</p>}
    </div>
  )
}
