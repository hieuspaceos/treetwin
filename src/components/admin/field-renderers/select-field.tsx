/**
 * Select dropdown field with glass styling
 */
import type { FieldProps } from './field-props'

export function SelectField({ name, label, value, onChange, error, required, disabled, options }: FieldProps) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label htmlFor={name} className="admin-field-label">
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
      </label>
      <select
        id={name}
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        className="glass-input admin-field-input"
        disabled={disabled}
      >
        <option value="">Select...</option>
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="admin-field-error">{error}</p>}
    </div>
  )
}
