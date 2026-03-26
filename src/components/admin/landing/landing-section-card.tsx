/**
 * Collapsible section card for landing page editor.
 * Supports drag-and-drop reordering via @dnd-kit/sortable.
 * Collapsed: drag handle + type label + enabled toggle + remove.
 * Expanded: inline form fields based on section type.
 */
import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { LandingSection, SectionData } from '@/lib/landing/landing-types'
import { sectionFormMap } from './landing-section-forms'

interface Props {
  section: LandingSection
  index: number
  total: number
  /** Unique ID for dnd-kit sortable — typically `${type}-${index}` */
  id: string
  onChange: (data: SectionData) => void
  onMove: (direction: 'up' | 'down') => void
  onRemove: () => void
  onToggle: (enabled: boolean) => void
}

const TYPE_LABELS: Record<string, string> = {
  nav: 'Navigation',
  hero: 'Hero',
  features: 'Features',
  pricing: 'Pricing',
  testimonials: 'Testimonials',
  faq: 'FAQ',
  cta: 'Call to Action',
  stats: 'Stats',
  'how-it-works': 'How It Works',
  team: 'Team',
  'logo-wall': 'Logo Wall',
  footer: 'Footer',
}

export function LandingSectionCard({ section, index, total, id, onChange, onMove, onRemove, onToggle }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const FormComponent = sectionFormMap[section.type]
  const label = TYPE_LABELS[section.type] || section.type

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : section.enabled ? 1 : 0.6,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="glass-card"
      {...attributes}
    >
      <div
        style={{
          borderRadius: '10px',
          marginBottom: '0.75rem',
          overflow: 'hidden',
          border: expanded ? '1px solid #3b82f6' : '1px solid transparent',
        }}
      >
      {/* Collapsed header — always visible */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Drag handle */}
        <span
          {...listeners}
          style={{ cursor: 'grab', color: '#94a3b8', fontSize: '1rem', touchAction: 'none' }}
          onClick={(e) => e.stopPropagation()}
          title="Drag to reorder"
        >⠿</span>

        {/* Expand/collapse chevron */}
        <span style={{ color: '#94a3b8', fontSize: '0.8rem', transition: 'transform 0.15s', transform: expanded ? 'rotate(90deg)' : 'none' }}>▶</span>

        <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>{label}</span>

        {/* Enabled toggle */}
        <label
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.75rem', color: '#64748b' }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={section.enabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
          Enabled
        </label>

        {/* Move buttons (kept as fallback) */}
        <button
          type="button"
          disabled={index === 0}
          onClick={(e) => { e.stopPropagation(); onMove('up') }}
          style={{ padding: '2px 6px', fontSize: '0.7rem', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.4 : 1 }}
        >↑</button>
        <button
          type="button"
          disabled={index === total - 1}
          onClick={(e) => { e.stopPropagation(); onMove('down') }}
          style={{ padding: '2px 6px', fontSize: '0.7rem', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: index === total - 1 ? 'not-allowed' : 'pointer', opacity: index === total - 1 ? 0.4 : 1 }}
        >↓</button>

        {/* Remove */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (confirm(`Remove ${label} section?`)) onRemove() }}
          style={{ padding: '2px 6px', fontSize: '0.7rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >✕</button>
      </div>

      {/* Expanded form area */}
      {expanded && FormComponent && (
        <div style={{ padding: '0 1rem 1rem 1rem', borderTop: '1px solid #f1f5f9' }}>
          <FormComponent data={section.data as any} onChange={onChange} />
        </div>
      )}

      {expanded && !FormComponent && (
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f1f5f9', color: '#94a3b8', fontSize: '0.8rem' }}>
          No editor available for this section type.
        </div>
      )}
      </div>
    </div>
  )
}
