/**
 * Object field — renders child fields in a collapsible glass-card section
 */
import { useState } from 'react'
import type { FieldSchema } from '@/lib/admin/schema-registry'
import { renderField } from './render-field'

interface ObjectFieldProps {
  name: string
  label: string
  value: unknown
  onChange: (value: unknown) => void
  fields: FieldSchema[]
  disabled?: boolean
}

export function ObjectField({ label, value, onChange, fields, disabled }: ObjectFieldProps) {
  const [open, setOpen] = useState(false)
  const obj = (value as Record<string, unknown>) || {}

  function handleChildChange(childName: string, childValue: unknown) {
    onChange({ ...obj, [childName]: childValue })
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="admin-field-label"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          width: '100%',
        }}
      >
        <span style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 150ms', fontSize: '0.7rem' }}>
          ▶
        </span>
        {label}
      </button>
      {open && (
        <div
          className="glass-panel"
          style={{ padding: '1rem', borderRadius: '10px', marginTop: '0.375rem' }}
        >
          {fields.map((field) =>
            renderField(field, obj[field.name], (v) => handleChildChange(field.name, v), disabled),
          )}
        </div>
      )}
    </div>
  )
}
