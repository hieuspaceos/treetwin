/**
 * Feature builder review step — full editable form for the SkillSpec.
 * Last human checkpoint before spec is saved to disk.
 */
import { useState } from 'react'
import type { SkillSpec, DataSchemaField } from '@/lib/admin/feature-builder-spec-types'
import { FeatureBuilderEditableList } from './feature-builder-editable-list'

interface Props {
  spec: SkillSpec
  onApprove: (spec: SkillSpec) => void
  onBack: () => void
}

const FIELD_TYPES: DataSchemaField['type'][] = ['text', 'number', 'boolean', 'date', 'rich-text']

export function FeatureBuilderReviewStep({ spec, onApprove, onBack }: Props) {
  const [edited, setEdited] = useState<SkillSpec>(() => JSON.parse(JSON.stringify(spec)))
  const [error, setError] = useState('')

  function updateSkill<K extends keyof SkillSpec['skill']>(field: K, value: SkillSpec['skill'][K]) {
    setEdited((prev) => ({ ...prev, skill: { ...prev.skill, [field]: value } }))
  }

  function updateField(index: number, key: keyof DataSchemaField, value: string | boolean) {
    setEdited((prev) => {
      const fields = prev.dataSchema.suggestedFields.map((f, i) =>
        i === index ? { ...f, [key]: value } : f,
      )
      return { ...prev, dataSchema: { ...prev.dataSchema, suggestedFields: fields } }
    })
  }

  function removeField(index: number) {
    setEdited((prev) => ({
      ...prev,
      dataSchema: {
        ...prev.dataSchema,
        suggestedFields: prev.dataSchema.suggestedFields.filter((_, i) => i !== index),
      },
    }))
  }

  function addField() {
    setEdited((prev) => ({
      ...prev,
      dataSchema: {
        ...prev.dataSchema,
        suggestedFields: [...prev.dataSchema.suggestedFields, { name: '', type: 'text' as const, required: false }],
      },
    }))
  }

  function handleApprove() {
    if (!edited.skill.description.trim()) {
      setError('Skill description is required.')
      return
    }
    if (edited.references.length === 0) {
      setError('At least one reference file is required.')
      return
    }
    const emptyField = edited.dataSchema.suggestedFields.find((f) => !f.name.trim())
    if (emptyField) {
      setError('All schema field names must be non-empty.')
      return
    }
    setError('')
    onApprove(edited)
  }

  const inputStyle = {
    width: '100%',
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    fontSize: '0.82rem',
    boxSizing: 'border-box' as const,
  }

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 1.25rem' }}>
        Review & Edit Spec
      </h2>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.6rem 0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Skill metadata */}
        <div className="glass-card" style={{ padding: '1rem', borderRadius: '10px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem' }}>Skill Metadata</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ background: '#dbeafe', color: '#2563eb', padding: '2px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>
              {edited.skill.name}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>v{edited.skill.version}</span>
          </div>
          <label style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Description</label>
          <textarea style={{ ...inputStyle, minHeight: '48px', resize: 'vertical' }} value={edited.skill.description} onChange={(e) => updateSkill('description', e.target.value)} />
          <label style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', margin: '0.5rem 0 0.25rem' }}>SKILL.md Body</label>
          <textarea style={{ ...inputStyle, minHeight: '140px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.78rem' }} value={edited.skill.body} onChange={(e) => updateSkill('body', e.target.value)} />
        </div>

        {/* References */}
        <div className="glass-card" style={{ padding: '1rem', borderRadius: '10px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem' }}>References</h3>
          <FeatureBuilderEditableList
            items={edited.references}
            onChange={(refs) => setEdited((prev) => ({ ...prev, references: refs }))}
            addLabel="Add Reference"
          />
        </div>

        {/* Scripts */}
        <div className="glass-card" style={{ padding: '1rem', borderRadius: '10px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem' }}>Scripts</h3>
          <FeatureBuilderEditableList
            items={edited.scripts}
            onChange={(scripts) => setEdited((prev) => ({ ...prev, scripts }))}
            addLabel="Add Script"
          />
        </div>

        {/* Data schema */}
        <div className="glass-card" style={{ padding: '1rem', borderRadius: '10px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem' }}>Data Schema</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {edited.dataSchema.suggestedFields.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <input style={{ ...inputStyle, flex: 2 }} placeholder="field name" value={f.name} onChange={(e) => updateField(i, 'name', e.target.value)} />
                <select style={{ ...inputStyle, flex: 1 }} value={f.type} onChange={(e) => updateField(i, 'type', e.target.value)}>
                  {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={f.required} onChange={(e) => updateField(i, 'required', e.target.checked)} /> Req
                </label>
                <button className="admin-btn" onClick={() => removeField(i)} style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#ef4444' }} title="Remove">×</button>
              </div>
            ))}
          </div>
          <button className="admin-btn" onClick={addField} style={{ fontSize: '0.78rem', marginTop: '0.5rem' }}>+ Add Field</button>
        </div>

        {/* Tree-id integration (read-only) */}
        <div className="glass-card" style={{ padding: '1rem', borderRadius: '10px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem' }}>Tree-id Integration</h3>
          <div style={{ fontSize: '0.8rem', color: '#475569' }}>
            <p style={{ margin: '0 0 0.25rem' }}><strong>Section:</strong> {edited.treeidIntegration.section}</p>
            <p style={{ margin: '0 0 0.25rem' }}><strong>Components:</strong> {edited.treeidIntegration.components.join(', ') || 'None'}</p>
            <p style={{ margin: '0 0 0.25rem' }}><strong>API Routes:</strong> {edited.treeidIntegration.apiRoutes.join(', ')}</p>
            <p style={{ margin: '0 0 0.25rem' }}><strong>Nav:</strong> {edited.treeidIntegration.navItem.label} → {edited.treeidIntegration.navItem.href}</p>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.4rem 0 0' }}>Auto-generated. Modify the Define step to change.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="admin-btn" onClick={onBack}>← Back</button>
        <button className="admin-btn admin-btn-primary" onClick={handleApprove} style={{ flex: 1 }}>
          Approve & Save
        </button>
      </div>
    </div>
  )
}
