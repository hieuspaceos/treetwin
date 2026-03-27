/**
 * Landing page design panel — compact preset + color + font picker.
 * Layout: presets row → color swatches row → fonts + radius row.
 */
import { useState } from 'react'
import type { LandingDesign } from '@/lib/landing/landing-types'
import { LANDING_DESIGN_PRESETS } from '@/lib/landing/landing-design-presets'

interface Props {
  design: LandingDesign
  onChange: (design: LandingDesign) => void
}

const FONT_OPTIONS = [
  'system-ui', 'Inter', 'Plus Jakarta Sans', 'Poppins', 'DM Sans',
  'Space Grotesk', 'Outfit', 'Nunito', 'Playfair Display', 'Source Sans 3',
  'Lora', 'Merriweather', 'Fira Code', 'JetBrains Mono',
]

const COLOR_KEYS = [
  ['primary', 'Pri'],
  ['secondary', 'Sec'],
  ['accent', 'Acc'],
  ['background', 'Bg'],
  ['surface', 'Srf'],
  ['text', 'Txt'],
  ['textMuted', 'Mut'],
] as const

const lbl = { fontSize: '0.55rem', color: '#64748b', display: 'block', textAlign: 'center' } as const
const sel = { width: '100%', padding: '3px 4px', borderRadius: '5px', border: '1px solid #e2e8f0', fontSize: '0.7rem' } as const

export function LandingDesignPanel({ design, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const colors = design.colors || {}
  const fonts = design.fonts || {}

  function setColor(key: string, value: string) {
    onChange({ ...design, colors: { ...colors, [key]: value } })
  }
  function setFont(key: 'heading' | 'body', value: string) {
    onChange({ ...design, fonts: { ...fonts, [key]: value } })
  }
  function applyPreset(presetId: string) {
    const preset = LANDING_DESIGN_PRESETS.find(p => p.id === presetId)
    if (!preset) return
    onChange({ preset: presetId, colors: { ...preset.design.colors }, fonts: { ...preset.design.fonts }, borderRadius: preset.design.borderRadius })
  }

  return (
    <div className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ color: '#94a3b8', fontSize: '0.7rem', marginRight: '0.5rem', transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'none' }}>▶</span>
        <h2 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', flex: 1, margin: 0 }}>Design</h2>
        {/* Collapsed summary: active preset swatches */}
        {!open && design.preset && (() => {
          const p = LANDING_DESIGN_PRESETS.find(x => x.id === design.preset)
          if (!p) return <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{design.preset}</span>
          return (
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
              {[p.design.colors.primary, p.design.colors.secondary, p.design.colors.accent].map((c, i) => (
                <div key={i} style={{ width: '10px', height: '10px', borderRadius: '2px', background: c }} />
              ))}
              <span style={{ fontSize: '0.6rem', color: '#94a3b8', marginLeft: '4px' }}>{p.name}</span>
            </div>
          )
        })()}
        {!open && !design.preset && <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Default</span>}
      </div>

      {open && (
        <div style={{ padding: '0 0.75rem 0.75rem' }}>
          {/* Preset dropdown + Color pickers — single row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <div>
              <label style={lbl}>Preset</label>
              <select
                value={design.preset || ''}
                onChange={e => e.target.value && applyPreset(e.target.value)}
                style={{ ...sel, paddingRight: '16px' }}
              >
                <option value="">Custom</option>
                {LANDING_DESIGN_PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {COLOR_KEYS.map(([key, label]) => (
              <div key={key} style={{ textAlign: 'center' }}>
                <label style={lbl}>{label}</label>
                <input
                  type="color"
                  value={(colors as Record<string, string>)[key] || '#3b82f6'}
                  onChange={e => setColor(key, e.target.value)}
                  title={label}
                  style={{ width: '26px', height: '26px', padding: 0, border: '1px solid #e2e8f0', cursor: 'pointer', borderRadius: '4px', display: 'block' }}
                />
              </div>
            ))}
          </div>

          {/* Row 2: Fonts + Radius — all inline */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Heading</label>
              <select value={fonts.heading || 'system-ui'} onChange={e => setFont('heading', e.target.value)} style={sel}>
                {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Body</label>
              <select value={fonts.body || 'system-ui'} onChange={e => setFont('body', e.target.value)} style={sel}>
                {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div style={{ width: '60px', flexShrink: 0 }}>
              <label style={lbl}>Radius</label>
              <input
                type="text"
                value={design.borderRadius || '12px'}
                onChange={e => onChange({ ...design, borderRadius: e.target.value })}
                style={{ ...sel, textAlign: 'center' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
