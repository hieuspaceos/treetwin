/**
 * Checkbox toggle field
 */
import type { FieldProps } from './field-props'

export function CheckboxField({ name, label, value, onChange, disabled }: FieldProps) {
  return (
    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <input
        id={name}
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        style={{ width: '16px', height: '16px', accentColor: 'var(--t-accent)' }}
      />
      <label htmlFor={name} style={{ fontSize: '0.875rem', color: '#475569', cursor: 'pointer' }}>
        {label}
      </label>
    </div>
  )
}
