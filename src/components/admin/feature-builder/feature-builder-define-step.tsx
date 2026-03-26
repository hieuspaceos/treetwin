/**
 * Feature builder define step — form to capture new feature description.
 * Auto-generates kebab-case name from label input.
 */
import { useState } from 'react'
import type { FeatureDescription } from '@/lib/admin/feature-builder-ai'

interface Props {
  onNext: (description: FeatureDescription) => void
}

const fieldStyle = {
  width: '100%',
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid #e2e8f0',
  fontSize: '0.85rem',
  boxSizing: 'border-box' as const,
}

const labelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600 as const,
  color: '#475569',
  marginBottom: '0.25rem',
}

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
}

export function FeatureBuilderDefineStep({ onNext }: Props) {
  const [label, setLabel] = useState('')
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [dataDescription, setDataDescription] = useState('')
  const [uiNeeds, setUiNeeds] = useState<FeatureDescription['uiNeeds']>('list-detail')
  const [section, setSection] = useState<FeatureDescription['section']>('content')
  const [error, setError] = useState('')

  function handleLabelChange(val: string) {
    setLabel(val)
    setName(toKebabCase(val))
  }

  function handleSubmit() {
    if (!label.trim()) { setError('Label is required'); return }
    if (!purpose.trim() || purpose.trim().length < 10) { setError('Purpose must be at least 10 characters'); return }
    if (!dataDescription.trim()) { setError('Data description is required'); return }
    setError('')
    onNext({ name, label: label.trim(), purpose: purpose.trim(), dataDescription: dataDescription.trim(), uiNeeds, section })
  }

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.25rem' }}>
        Define Feature
      </h2>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.6rem 0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={labelStyle}>Label *</label>
          <input style={fieldStyle} placeholder="e.g. Product Reviews" value={label} onChange={e => handleLabelChange(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>ID (auto-generated)</label>
          <input style={{ ...fieldStyle, background: '#f8fafc', color: '#94a3b8' }} value={name} readOnly />
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Purpose *</label>
        <textarea
          style={{ ...fieldStyle, minHeight: '80px', resize: 'vertical' }}
          placeholder="What does this feature do? Who uses it and why?"
          value={purpose}
          onChange={e => setPurpose(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Data Description *</label>
        <textarea
          style={{ ...fieldStyle, minHeight: '80px', resize: 'vertical' }}
          placeholder="What data does it store? e.g. review text, rating (1-5), author, product reference"
          value={dataDescription}
          onChange={e => setDataDescription(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label style={labelStyle}>UI Type</label>
          <select style={fieldStyle} value={uiNeeds} onChange={e => setUiNeeds(e.target.value as FeatureDescription['uiNeeds'])}>
            <option value="list-detail">List + Detail</option>
            <option value="form">Form only</option>
            <option value="dashboard">Dashboard</option>
            <option value="none">No UI (API only)</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Section</label>
          <select style={fieldStyle} value={section} onChange={e => setSection(e.target.value as FeatureDescription['section'])}>
            <option value="content">Content</option>
            <option value="assets">Assets</option>
            <option value="marketing">Marketing</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      <button className="admin-btn admin-btn-primary" onClick={handleSubmit} style={{ width: '100%' }}>
        Next: AI Clarification →
      </button>
    </div>
  )
}
