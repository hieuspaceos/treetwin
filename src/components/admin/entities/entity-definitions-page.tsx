/**
 * Entity definitions page — list entity types, create new, edit fields, delete
 */
import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { api } from '@/lib/admin/api-client'
import type { EntityDefinition, EntityFieldDef } from '@/lib/admin/entity-io'
import { EntityFieldEditor } from './entity-field-editor'

export function EntityDefinitionsPage() {
  const [, navigate] = useLocation()
  const [defs, setDefs] = useState<EntityDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [editingFields, setEditingFields] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.entities.listDefinitions().then((res) => {
      setDefs((res.data as any)?.entries || [])
      setLoading(false)
    })
  }, [])

  async function handleCreate() {
    if (!newName || !newLabel) { setError('Name and label required'); return }
    setCreating(true); setError('')
    const res = await api.entities.createDefinition({ name: newName, label: newLabel, fields: [] })
    setCreating(false)
    if (res.ok) {
      setDefs((prev) => [...prev, { name: newName, label: newLabel, fields: [] }])
      setShowForm(false); setNewName(''); setNewLabel('')
      setEditingFields(newName) // auto-open field editor for new entity
    } else {
      setError(res.error || 'Failed to create')
    }
  }

  async function handleSaveFields(name: string, fields: EntityFieldDef[]) {
    setSaving(true)
    const def = defs.find(d => d.name === name)
    if (!def) return
    const res = await api.entities.updateDefinition(name, { ...def, fields })
    setSaving(false)
    if (res.ok) {
      setDefs(prev => prev.map(d => d.name === name ? { ...d, fields } : d))
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Entity Types</h1>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowForm((s) => !s)}>
          + New Entity Type
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '1rem' }}>Create Entity Type</h2>
          {error && <p style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{error}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Name (kebab-case)</label>
              <input style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                placeholder="e.g. customers" value={newName} onChange={(e) => setNewName(e.target.value.toLowerCase().replace(/\s+/g, '-'))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Label</label>
              <input style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                placeholder="e.g. Customers" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="admin-btn admin-btn-primary" onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating…' : 'Create'}
            </button>
            <button className="admin-btn" onClick={() => { setShowForm(false); setError('') }}>Cancel</button>
          </div>
        </div>
      )}

      {loading && <p style={{ color: '#94a3b8' }}>Loading...</p>}

      {!loading && defs.length === 0 && (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: '14px' }}>
          <p style={{ color: '#64748b' }}>No entity types yet. Create one to get started.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {defs.map((def) => (
          <div key={def.name} className="glass-card" style={{ padding: '1.25rem', borderRadius: '12px' }}>
            <h3 style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>{def.label}</h3>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace', marginBottom: '0.5rem' }}>{def.name}</p>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>{def.fields?.length || 0} fields</p>

            {/* Field editor — toggleable */}
            {editingFields === def.name && (
              <div style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                <EntityFieldEditor
                  fields={def.fields || []}
                  onChange={(fields) => handleSaveFields(def.name, fields)}
                />
                {saving && <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.5rem' }}>Saving...</p>}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="admin-btn admin-btn-primary" style={{ flex: 1, fontSize: '0.8rem' }}
                onClick={() => navigate(`/entities/${def.name}`)}>
                View Entries
              </button>
              <button
                className="admin-btn"
                style={{ fontSize: '0.8rem' }}
                onClick={() => setEditingFields(editingFields === def.name ? null : def.name)}
              >
                {editingFields === def.name ? 'Close Fields' : 'Edit Fields'}
              </button>
              <button
                className="admin-btn"
                style={{ fontSize: '0.8rem', color: '#dc2626' }}
                onClick={async () => {
                  if (!confirm(`Delete entity type "${def.label}"? This will also delete all its instances.`)) return
                  const res = await api.entities.deleteDefinition(def.name)
                  if (res.ok) setDefs((prev) => prev.filter((d) => d.name !== def.name))
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
