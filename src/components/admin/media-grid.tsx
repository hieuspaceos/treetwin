/**
 * Media grid — responsive thumbnail gallery of R2 media files
 * Shows image thumbnails or file type icons for non-images
 */
import type { MediaItem } from '@/lib/admin/api-client'

interface Props {
  items: MediaItem[]
  loading: boolean
  selectedKey: string | null
  onSelect: (item: MediaItem) => void
  onDelete: (item: MediaItem) => void
  dialogMode?: boolean
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(key: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg|avif|ico)$/i.test(key)
}

function fileName(key: string) {
  return key.split('/').pop() || key
}

export function MediaGrid({ items, loading, selectedKey, onSelect, onDelete, dialogMode }: Props) {
  if (loading) {
    return (
      <div className="media-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="media-card skeleton" style={{ height: '140px' }} />
        ))}
      </div>
    )
  }

  if (!items.length) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 0.75rem', opacity: 0.4, display: 'block' }}>
          <polyline points="16 16 12 12 8 16" />
          <line x1="12" y1="12" x2="12" y2="21" />
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
          <polyline points="16 16 12 12 8 16" />
        </svg>
        <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>No media files yet</p>
        <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Upload images above to get started</p>
      </div>
    )
  }

  return (
    <div className="media-grid">
      {items.map((item) => {
        const selected = item.key === selectedKey
        return (
          <div
            key={item.key}
            className={`media-card ${selected ? 'selected' : ''}`}
            onClick={() => onSelect(item)}
          >
            {/* Thumbnail or file icon */}
            <div className="media-card-preview">
              {isImage(item.key) ? (
                <img src={item.url} alt={fileName(item.key)} loading="lazy" />
              ) : (
                <div className="media-card-icon">
                  {item.key.endsWith('.pdf') ? 'PDF' : 'FILE'}
                </div>
              )}
            </div>

            {/* Info bar */}
            <div className="media-card-info">
              <span className="media-card-name" title={fileName(item.key)}>
                {fileName(item.key)}
              </span>
              <span className="media-card-size">{formatSize(item.size)}</span>
            </div>

            {/* Action overlay */}
            <div className="media-card-actions">
              {!dialogMode && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(item.url) }}
                  title="Copy URL"
                >
                  Copy
                </button>
              )}
              <button
                type="button"
                className="danger"
                onClick={(e) => { e.stopPropagation(); onDelete(item) }}
                title="Delete"
              >
                Del
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
