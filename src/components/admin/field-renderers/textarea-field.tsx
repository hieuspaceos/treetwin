/**
 * Multi-line textarea field with glass styling
 */
import type { FieldProps } from './field-props'

export function TextareaField({ name, label, value, onChange, error, required, disabled }: FieldProps) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label htmlFor={name} className="admin-field-label">
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
      </label>
      <textarea
        id={name}
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        className="glass-input admin-field-input"
        rows={4}
        disabled={disabled}
        style={{ resize: 'vertical', minHeight: '80px' }}
      />
      {error && <p className="admin-field-error">{error}</p>}
    </div>
  )
}
