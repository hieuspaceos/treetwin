/**
 * Product editor page — form to create or edit a product config.
 * Fields: name, slug, description, landingPage, icon, features (checkboxes), coreCollections (checkboxes).
 * Only accessible in core admin (not product admin).
 */
import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { api } from '@/lib/admin/api-client'
import { FEATURE_MODULES } from '@/lib/admin/feature-registry'

const ICON_OPTIONS = ['layout', 'fileText', 'stickyNote', 'database', 'folder', 'image', 'mail', 'chart', 'megaphone', 'globe', 'userPen', 'sparkles']
const CORE_COLLECTIONS = ['articles', 'notes', 'records', 'categories', 'voices']

interface Props {
  slug?: string
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '')
}

export function ProductEditorPage({ slug: editSlug }: Props) {
  const [, navigate] = useLocation()
  const isNew = !editSlug

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [landingPage, setLandingPage] = useState('')
  const [icon, setIcon] = useState('sparkles')
  const [features, setFeatures] = useState<string[]>([])
  const [coreCollections, setCoreCollections] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!editSlug) return
    api.products.read(editSlug).then((res) => {
      if (!res.ok || !res.data) return
      const d = res.data as any
      setName(d.name || '')
      setSlug(d.slug || editSlug)
      setDescription(d.description || '')
      setLandingPage(d.landingPage || '')
      setIcon(d.icon || 'sparkles')
      setFeatures(d.features || [])
      setCoreCollections(d.coreCollections || [])
    })
  }, [editSlug])

  function handleNameChange(val: string) {
    setName(val)
    if (isNew) setSlug(slugify(val))
  }

  function toggleFeature(id: string) {
    setFeatures((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id])
  }

  function toggleCollection(id: string) {
    setCoreCollections((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id])
  }

  async function handleSave() {
    setError('')
    if (!name.trim()) { setError('Name is required'); return }
    if (!slug) { setError('Slug is required'); return }
    setSaving(true)
    const data = { name: name.trim(), slug, description, landingPage, icon, features, coreCollections }
    const res = isNew
      ? await api.products.create(data)
      : await api.products.update(editSlug!, data)
    setSaving(false)
    if (res.ok) {
      navigate('/products')
    } else {
      setError((res as any).error || 'Save failed')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px',
    border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#1e293b',
    background: '#fff', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.8rem', fontWeight: 600,
    color: '#475569', marginBottom: '0.35rem',
  }
  const fieldStyle: React.CSSProperties = { marginBottom: '1.25rem' }

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
          {isNew ? 'New Product' : 'Edit Product'}
        </h1>
        <button className="admin-btn" onClick={() => navigate('/products')}>Cancel</button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px' }}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <div style={fieldStyle}>
          <label style={labelStyle}>Name</label>
          <input style={inputStyle} value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="My Product" />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Slug</label>
          <input style={inputStyle} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-product" disabled={!isNew} />
          {!isNew && <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Slug cannot be changed after creation.</p>}
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Description</label>
          <input style={inputStyle} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Landing Page (slug)</label>
          <input style={inputStyle} value={landingPage} onChange={(e) => setLandingPage(e.target.value)} placeholder="my-landing-page" />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Icon</label>
          <select style={inputStyle} value={icon} onChange={(e) => setIcon(e.target.value)}>
            {ICON_OPTIONS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Features</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
            {FEATURE_MODULES.map((f) => (
              <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                <input type="checkbox" checked={features.includes(f.id)} onChange={() => toggleFeature(f.id)} />
                {f.label}
              </label>
            ))}
          </div>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Core Collections</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {CORE_COLLECTIONS.map((col) => (
              <label key={col} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                <input type="checkbox" checked={coreCollections.includes(col)} onChange={() => toggleCollection(col)} />
                {col}
              </label>
            ))}
          </div>
        </div>

        <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : isNew ? 'Create Product' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
