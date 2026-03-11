/**
 * Markdoc content field — placeholder textarea (replaced by Milkdown in Phase 05)
 */
import type { FieldProps } from './field-props'

export function MarkdocField({ name, label, value, onChange, disabled }: FieldProps) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label htmlFor={name} className="admin-field-label">
        {label}
        <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: '0.5rem' }}>
          (Markdown)
        </span>
      </label>
      <textarea
        id={name}
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        className="glass-input admin-field-input"
        rows={16}
        disabled={disabled}
        style={{
          resize: 'vertical',
          minHeight: '200px',
          fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
          fontSize: '0.8125rem',
          lineHeight: 1.6,
        }}
      />
    </div>
  )
}
