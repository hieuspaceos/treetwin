/**
 * Entity field schema editor — inline editor for adding/editing/removing fields on an entity definition.
 * Used in entity definitions page to configure fields after creating a type.
 */
import { useState } from 'react'
import type { EntityFieldDef } from '@/lib/admin/entity-io'

const FIELD_TYPES: EntityFieldDef['type'][] = ['text', 'textarea', 'number', 'boolean', 'select', 'date', 'array']

const inputStyle: React.CSSProperties = {
  padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem', width: '100%',
}

interface Props {
  fields: EntityFieldDef[]
  onChange: (fields: EntityFieldDef[]) => void
}

export function EntityFieldEditor({ fields, onChange }: Props) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<EntityFieldDef>({ name: '', type: 'text', label: '', required: false })

  function addField() {
    if (!draft.name || !draft.label) return
    const clean = { ...draft, name: draft.name.toLowerCase().replace(/\s+/g, '_') }
    onChange([...fields, clean])
    setDraft({ name: '', type: 'text', label: '', required: false })
    setAdding(false)
  }

  function removeField(idx: number) {
    onChange(fields.filter((_, i) => i !== idx))
  }

  function moveField(idx: number, dir: -1 | 1) {
    const next = [...fields]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }

  return (
    <div>
      {/* Field list */}
      {fields.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          {fields.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', minWidth: '80px' }}>{f.label}</span>
              <code style={{ fontSize: '0.7rem', color: '#64748b', background: 'rgba(0,0,0,0.04)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{f.name}</code>
              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>{f.type}</span>
              {f.required && <span style={{ fontSize: '0.6rem', color: '#dc2626', fontWeight: 600 }}>required</span>}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }}>
                <button onClick={() => moveField(i, -1)} className="admin-btn admin-btn-ghost" style={{ padding: '2px 6px', fontSize: '0.7rem' }} disabled={i === 0}>↑</button>
                <button onClick={() => moveField(i, 1)} className="admin-btn admin-btn-ghost" style={{ padding: '2px 6px', fontSize: '0.7rem' }} disabled={i === fields.length - 1}>↓</button>
                <button onClick={() => removeField(i)} className="admin-btn admin-btn-ghost" style={{ padding: '2px 6px', fontSize: '0.7rem', color: '#dc2626' }}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add field form */}
      {adding ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '0.5rem', alignItems: 'end', marginBottom: '0.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', marginBottom: '2px' }}>Label</label>
            <input style={inputStyle} placeholder="e.g. Email" value={draft.label}
              onChange={e => setDraft({ ...draft, label: e.target.value, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', marginBottom: '2px' }}>Type</label>
            <select style={inputStyle} value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value as EntityFieldDef['type'] })}>
              {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#64748b', cursor: 'pointer' }}>
            <input type="checkbox" checked={draft.required || false} onChange={e => setDraft({ ...draft, required: e.target.checked })} />
            Req
          </label>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button className="admin-btn admin-btn-primary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={addField}>Add</button>
            <button className="admin-btn" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="admin-btn admin-btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => setAdding(true)}>
          + Add Field
        </button>
      )}
    </div>
  )
}
