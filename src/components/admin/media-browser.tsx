/**
 * Media browser — combines upload zone + search + grid + load more pagination
 * Works in page mode (standalone /admin/media) and dialog mode (field picker)
 */
import { useState, useEffect, useCallback } from 'react'
import { api, type MediaItem } from '@/lib/admin/api-client'
import { MediaUploadZone } from './media-upload-zone'
import { MediaGrid } from './media-grid'
import { useToast } from './admin-toast'

interface Props {
  mode: 'page' | 'dialog'
  onSelect?: (url: string) => void
  onClose?: () => void
}

export function MediaBrowser({ mode, onSelect, onClose }: Props) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [configured, setConfigured] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<MediaItem | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const toast = useToast()

  const fetchMedia = useCallback(async () => {
    setLoading(true)
    const res = await api.media.list()
    if (res.ok && res.data) {
      setItems(res.data.items)
      setConfigured(res.data.configured)
      setHasMore(res.data.hasMore || false)
      setNextCursor(res.data.nextCursor || null)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchMedia() }, [fetchMedia])

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    const res = await api.media.list(nextCursor)
    if (res.ok && res.data) {
      setItems((prev) => [...prev, ...res.data!.items])
      setHasMore(res.data.hasMore || false)
      setNextCursor(res.data.nextCursor || null)
    }
    setLoadingMore(false)
  }

  async function handleDelete(item: MediaItem) {
    if (!confirm(`Delete ${item.key.split('/').pop()}?`)) return
    const res = await api.media.remove(item.key)
    if (res.ok) {
      toast.success('Deleted')
      setItems((prev) => prev.filter((i) => i.key !== item.key))
      if (selected?.key === item.key) setSelected(null)
    } else {
      toast.error('Delete failed')
    }
  }

  function handleSelectConfirm() {
    if (selected && onSelect) {
      onSelect(selected.url)
      onClose?.()
    }
  }

  const filtered = search
    ? items.filter((i) => i.key.toLowerCase().includes(search.toLowerCase()))
    : items

  // R2 not configured — show guidance
  if (!loading && !configured) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: '14px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>
          Media storage not configured
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          Set R2_ENDPOINT, R2_BUCKET, and R2_PUBLIC_URL environment variables to enable media uploads.
          You can still paste image URLs manually in content fields.
        </p>
      </div>
    )
  }

  const content = (
    <>
      <MediaUploadZone onUploaded={fetchMedia} />

      {/* Search bar */}
      <div style={{ marginTop: '1rem', marginBottom: '0.75rem' }}>
        <input
          type="text"
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="glass-input admin-field-input"
          style={{ maxWidth: '300px' }}
        />
      </div>

      <MediaGrid
        items={filtered}
        loading={loading}
        selectedKey={selected?.key || null}
        onSelect={setSelected}
        onDelete={handleDelete}
        dialogMode={mode === 'dialog'}
      />

      {/* Load more button */}
      {hasMore && !search && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            type="button"
            className="admin-btn admin-btn-ghost"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </>
  )

  // Dialog mode — overlay with select/cancel buttons
  if (mode === 'dialog') {
    return (
      <div className="media-dialog-backdrop" onClick={onClose}>
        <div className="media-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Select Media</h2>
            <button type="button" className="admin-btn admin-btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>

          {content}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--t-glass-border)' }}>
            <button type="button" className="admin-btn admin-btn-ghost" onClick={onClose}>Cancel</button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={!selected}
              onClick={handleSelectConfirm}
            >
              Select
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Page mode — full content area
  return (
    <div>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.25rem' }}>
        Media Library
      </h1>
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px' }}>
        {content}
      </div>
    </div>
  )
}
