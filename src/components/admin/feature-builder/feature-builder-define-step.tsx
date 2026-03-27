/**
 * Feature builder define step — form to capture new feature description.
 * Supports AI Fill: user describes idea → Gemini extracts structured fields.
 */
import { useState } from 'react'
import type { FeatureDescription } from '@/lib/admin/feature-builder-ai'
import { api } from '@/lib/admin/api-client'

interface Props {
  onNext: (description: FeatureDescription) => void
  /** Report partial form state for live preview */
  onChange?: (partial: Partial<FeatureDescription>) => void
}

const fieldStyle = {
  width: '100%', padding: '6px 10px', borderRadius: '6px',
  border: '1px solid #e2e8f0', fontSize: '0.85rem', boxSizing: 'border-box' as const,
}
const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 600 as const, color: '#475569', marginBottom: '0.25rem' }
const hintStyle = { fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.2rem' }

function toKebabCase(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
}

export function FeatureBuilderDefineStep({ onNext, onChange }: Props) {
  const [idea, setIdea] = useState('')
  const [label, setLabel] = useState('')
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [dataDescription, setDataDescription] = useState('')
  const [uiNeeds, setUiNeeds] = useState<FeatureDescription['uiNeeds']>('list-detail')
  const [section, setSection] = useState<FeatureDescription['section']>('content')
  const [error, setError] = useState('')
  const [filling, setFilling] = useState(false)
  const [filled, setFilled] = useState(false)

  function emit(overrides: Partial<FeatureDescription> = {}) {
    onChange?.({ name: overrides.name ?? name, label: overrides.label ?? label, purpose: overrides.purpose ?? purpose, dataDescription: overrides.dataDescription ?? dataDescription, uiNeeds: overrides.uiNeeds ?? uiNeeds, section: overrides.section ?? section, ...overrides })
  }

  function handleLabelChange(val: string) {
    setLabel(val)
    const n = toKebabCase(val)
    setName(n)
    emit({ label: val, name: n })
  }

  async function handleAiFill() {
    if (!idea.trim() || idea.trim().length < 5) {
      setError('Please describe your idea (at least 5 characters)')
      return
    }
    setFilling(true)
    setError('')
    const res = await api.featureBuilder.aiFill(idea.trim())
    setFilling(false)
    if (res.ok && res.data) {
      const d = res.data
      setLabel(d.label)
      setName(toKebabCase(d.label))
      setPurpose(d.purpose)
      setDataDescription(d.dataDescription)
      setUiNeeds(d.uiNeeds as FeatureDescription['uiNeeds'])
      setSection(d.section as FeatureDescription['section'])
      setFilled(true)
      emit({ name: toKebabCase(d.label), label: d.label, purpose: d.purpose, dataDescription: d.dataDescription, uiNeeds: d.uiNeeds as FeatureDescription['uiNeeds'], section: d.section as FeatureDescription['section'] })
    } else {
      setError(res.error || 'AI Fill failed')
    }
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
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>
        Define Feature
      </h2>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.6rem 0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem' }}>
          {error}
        </div>
      )}

      {/* AI Fill section */}
      <div className="glass-card" style={{ padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', background: '#f0f9ff' }}>
        <label style={{ ...labelStyle, color: '#1e40af' }}>Describe your idea</label>
        <textarea
          style={{ ...fieldStyle, minHeight: '60px', resize: 'vertical', borderColor: '#93c5fd' }}
          placeholder="e.g. I want a tool that converts existing features to skill v3 format"
          value={idea}
          onChange={e => setIdea(e.target.value)}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button
            className="admin-btn admin-btn-primary"
            onClick={handleAiFill}
            disabled={filling || !idea.trim()}
            style={{ fontSize: '0.8rem', padding: '5px 14px' }}
          >
            {filling ? 'Thinking…' : '✨ AI Fill'}
          </button>
          <span style={hintStyle}>AI sẽ điền tất cả fields bên dưới từ mô tả của bạn</span>
        </div>
      </div>

      {filled && (
        <div style={{ background: '#dcfce7', color: '#166534', padding: '0.4rem 0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.78rem' }}>
          AI đã điền form. Bạn có thể chỉnh sửa bất kỳ field nào trước khi tiếp tục.
        </div>
      )}

      {/* Form fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={labelStyle}>Label *</label>
          <input style={fieldStyle} placeholder="e.g. Product Reviews" value={label} onChange={e => handleLabelChange(e.target.value)} />
          <div style={hintStyle}>Tên hiển thị trong sidebar admin</div>
        </div>
        <div>
          <label style={labelStyle}>ID (auto)</label>
          <input style={{ ...fieldStyle, background: '#f8fafc', color: '#94a3b8' }} value={name} readOnly />
          <div style={hintStyle}>Tự tạo từ Label, dùng làm folder name</div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Purpose *</label>
        <textarea
          style={{ ...fieldStyle, minHeight: '70px', resize: 'vertical' }}
          placeholder="What does this feature do? Who uses it and why?"
          value={purpose}
          onChange={e => { setPurpose(e.target.value); emit({ purpose: e.target.value }) }}
        />
        <div style={hintStyle}>Mô tả feature làm gì, ai dùng, tại sao cần</div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Data Description *</label>
        <textarea
          style={{ ...fieldStyle, minHeight: '60px', resize: 'vertical' }}
          placeholder="e.g. review text, rating (1-5), author, product reference"
          value={dataDescription}
          onChange={e => { setDataDescription(e.target.value); emit({ dataDescription: e.target.value }) }}
        />
        <div style={hintStyle}>Liệt kê các fields dữ liệu cần lưu, phân cách bằng dấu phẩy</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label style={labelStyle}>UI Type</label>
          <select style={fieldStyle} value={uiNeeds} onChange={e => { const v = e.target.value as FeatureDescription['uiNeeds']; setUiNeeds(v); emit({ uiNeeds: v }) }}>
            <option value="list-detail">List + Detail — quản lý danh sách</option>
            <option value="form">Form — 1 trang form duy nhất</option>
            <option value="dashboard">Dashboard — hiển thị thống kê</option>
            <option value="none">No UI — chỉ có API</option>
          </select>
          <div style={hintStyle}>Kiểu giao diện admin cho feature này</div>
        </div>
        <div>
          <label style={labelStyle}>Section</label>
          <select style={fieldStyle} value={section} onChange={e => { const v = e.target.value as FeatureDescription['section']; setSection(v); emit({ section: v }) }}>
            <option value="content">Content — bài viết, notes, reviews</option>
            <option value="assets">Assets — media, files, images</option>
            <option value="marketing">Marketing — campaigns, email, social</option>
            <option value="system">System — settings, tools, dev utilities</option>
          </select>
          <div style={hintStyle}>Nhóm menu trong admin sidebar</div>
        </div>
      </div>

      <button className="admin-btn admin-btn-primary" onClick={handleSubmit} style={{ width: '100%' }}>
        Next: AI Clarification →
      </button>
    </div>
  )
}
