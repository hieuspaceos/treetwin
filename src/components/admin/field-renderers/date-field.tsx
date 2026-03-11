/**
 * Date picker field with glass styling
 */
import type { FieldProps } from './field-props'

export function DateField({ name, label, value, onChange, error, required, disabled }: FieldProps) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label htmlFor={name} className="admin-field-label">
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
      </label>
      <input
        id={name}
        type="date"
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        className="glass-input admin-field-input"
        disabled={disabled}
      />
      {error && <p className="admin-field-error">{error}</p>}
    </div>
  )
}
