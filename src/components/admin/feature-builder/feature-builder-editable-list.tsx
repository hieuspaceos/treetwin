/**
 * Editable list — reusable add/remove list for filename+purpose pairs.
 * Used by Review step for References and Scripts sections.
 */

interface Item {
  filename: string
  purpose: string
}

interface Props {
  items: Item[]
  onChange: (items: Item[]) => void
  addLabel: string
}

export function FeatureBuilderEditableList({ items, onChange, addLabel }: Props) {
  function update(index: number, field: keyof Item, value: string) {
    const next = items.map((it, i) => (i === index ? { ...it, [field]: value } : it))
    onChange(next)
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  function add() {
    onChange([...items, { filename: '', purpose: '' }])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <input
            style={{ flex: 1, padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}
            placeholder="filename"
            value={item.filename}
            onChange={(e) => update(i, 'filename', e.target.value)}
          />
          <input
            style={{ flex: 2, padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}
            placeholder="purpose"
            value={item.purpose}
            onChange={(e) => update(i, 'purpose', e.target.value)}
          />
          <button
            className="admin-btn"
            onClick={() => remove(i)}
            style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#ef4444' }}
            title="Remove"
          >
            ×
          </button>
        </div>
      ))}
      <button className="admin-btn" onClick={add} style={{ fontSize: '0.78rem', alignSelf: 'flex-start' }}>
        + {addLabel}
      </button>
    </div>
  )
}
