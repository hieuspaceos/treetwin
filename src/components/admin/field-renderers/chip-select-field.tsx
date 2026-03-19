/**
 * Chip/grid multi-select field — clickable preset chips + custom input
 * Stores value as string[] (multiple selections allowed)
 * Used for voice tone, industry, audience fields
 */
import { useState } from 'react'
import type { FieldProps } from './field-props'
import { t, getSection } from '@/lib/i18n'

export function ChipSelectField({ name, label, value, onChange, disabled, options, i18nPrefix }: FieldProps) {
  const selected = (value as string[]) || []
  const [customDraft, setCustomDraft] = useState('')

  /** Build preset options: from translations (if i18nPrefix set) merged with schema options */
  const resolvedOptions = (() => {
    if (!i18nPrefix) return options || []
    // Get all keys from translation section (e.g. voice.tone → { casual: "Casual", ... })
    const translated = getSection(i18nPrefix)
    const schemaValues = new Set(options?.map((o) => o.value) || [])
    // Start with schema options (preserves order), use translated labels
    const result = (options || []).map((o) => ({
      value: o.value,
      label: translated[o.value] || o.label,
    }))
    // Add translation-only keys (added via translations page, not in schema)
    for (const [key, translatedLabel] of Object.entries(translated)) {
      if (!schemaValues.has(key)) {
        result.push({ value: key, label: translatedLabel })
      }
    }
    return result
  })()

  /** Preset option values for quick lookup */
  const presetValues = new Set(resolvedOptions.map((o) => o.value))

  /** Custom values = selected items not in presets */
  const customValues = selected.filter((v) => !presetValues.has(v))

  function toggle(val: string) {
    if (disabled) return
    if (selected.includes(val)) {
      onChange(selected.filter((v) => v !== val))
    } else {
      onChange([...selected, val])
    }
  }

  function addCustom() {
    const trimmed = customDraft.trim().toLowerCase().replace(/\s+/g, '-')
    if (!trimmed || selected.includes(trimmed)) return
    onChange([...selected, trimmed])
    setCustomDraft('')
  }

  function removeCustom(val: string) {
    onChange(selected.filter((v) => v !== val))
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label className="admin-field-label">{label}</label>

      {/* Preset chips grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.5rem' }}>
        {resolvedOptions.map((opt) => {
          const isActive = selected.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              disabled={disabled}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: isActive ? 600 : 400,
                cursor: disabled ? 'default' : 'pointer',
                border: `1.5px solid ${isActive ? 'rgba(99,102,241,0.5)' : 'rgba(148,163,184,0.2)'}`,
                background: isActive ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                color: isActive ? '#6366f1' : '#64748b',
                transition: 'all 0.15s ease',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Custom values as removable tags */}
      {customValues.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.5rem' }}>
          {customValues.map((val) => (
            <span
              key={val}
              className="glass-tag"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {val}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeCustom(val)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '0.875rem', lineHeight: 1, padding: 0 }}
                >
                  x
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Add custom input */}
      {!disabled && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={customDraft}
            onChange={(e) => setCustomDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
            className="glass-input admin-field-input"
            placeholder="Add custom..."
            style={{ flex: 1 }}
          />
          <button type="button" onClick={addCustom} className="admin-btn admin-btn-ghost" style={{ flexShrink: 0 }}>
            Add
          </button>
        </div>
      )}
    </div>
  )
}
