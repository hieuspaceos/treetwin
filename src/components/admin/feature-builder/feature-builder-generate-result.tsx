/**
 * Generate result panel — shows categorized files with descriptions,
 * skill structure explanation, registry snippet, and next steps.
 */
import { useState } from 'react'

interface Props {
  specName: string
  files: string[]
  registrySnippet: string
  warnings: string[]
  onReset: () => void
  onNavigate: (path: string) => void
}

/** Category metadata: icon, description, purpose explanation */
const CATEGORIES = [
  {
    key: 'skill',
    title: 'Skill Folder',
    icon: '📚',
    match: (f: string) => f.startsWith('.claude/'),
    desc: 'Knowledge layer — Claude reads these files when working with this feature. Contains SKILL.md (instructions) + references (detailed guides).',
  },
  {
    key: 'components',
    title: 'Admin Components',
    icon: '🧩',
    match: (f: string) => f.startsWith('src/components/'),
    desc: 'React UI components for the admin panel — list page, editor/form, or dashboard.',
  },
  {
    key: 'api',
    title: 'API Routes',
    icon: '⚡',
    match: (f: string) => f.startsWith('src/pages/api/'),
    desc: 'Server-side CRUD endpoint — GET (list/read), POST (create), PUT (update), DELETE. Protected by feature guard.',
  },
  {
    key: 'content',
    title: 'Content & Config',
    icon: '📁',
    match: (f: string) => f.startsWith('src/content/'),
    desc: 'Data storage directory (YAML files) + registry fragment JSON for feature registration.',
  },
]

export function FeatureBuilderGenerateResult({ specName, files, registrySnippet, warnings, onReset, onNavigate }: Props) {
  const [copied, setCopied] = useState(false)
  const [expandedCat, setExpandedCat] = useState<string | null>('skill')

  function copySnippet() {
    navigator.clipboard.writeText(registrySnippet).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.2rem' }}>✅</span>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#16a34a', margin: 0 }}>
          Generated {files.length} files for "{specName}"
        </h2>
      </div>

      {/* Architecture overview */}
      <div className="glass-card" style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: '#f0f9ff' }}>
        <p style={{ fontSize: '0.78rem', color: '#1e40af', margin: 0, lineHeight: 1.5 }}>
          <strong>How it works:</strong> Skill folder = Claude's knowledge about this feature.
          Admin components = UI in your dashboard. API route = server-side CRUD.
          Content dir = where data (YAML files) lives.
        </p>
      </div>

      {/* Categorized files with descriptions */}
      {CATEGORIES.map(cat => {
        const catFiles = files.filter(cat.match)
        if (catFiles.length === 0) return null
        const isExpanded = expandedCat === cat.key
        return (
          <div key={cat.key} className="glass-card" style={{ padding: '0.75rem 1rem', borderRadius: '10px' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
              onClick={() => setExpandedCat(isExpanded ? null : cat.key)}
            >
              <span style={{ fontSize: '0.9rem' }}>{cat.icon}</span>
              <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', margin: 0, flex: 1 }}>
                {cat.title} <span style={{ fontWeight: 400, color: '#94a3b8' }}>({catFiles.length})</span>
              </h3>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{isExpanded ? '▼' : '▶'}</span>
            </div>
            {isExpanded && (
              <div style={{ marginTop: '0.5rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.4rem', fontStyle: 'italic' }}>{cat.desc}</p>
                {catFiles.map(f => (
                  <div key={f} style={{ fontSize: '0.76rem', color: '#475569', fontFamily: 'monospace', padding: '2px 0', paddingLeft: '1.4rem' }}>
                    {f}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.6rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem' }}>
          <strong>Warnings:</strong>
          {warnings.map((w, i) => <div key={i} style={{ paddingLeft: '0.5rem' }}>• {w}</div>)}
        </div>
      )}

      {/* Registry snippet */}
      <div className="glass-card" style={{ padding: '0.75rem 1rem', borderRadius: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
            📋 Next: Register Feature
          </h3>
          <button className="admin-btn" onClick={copySnippet} style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.4rem' }}>
          Paste this into <code style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px' }}>src/lib/admin/feature-registry.ts</code> to activate the feature in the admin sidebar.
        </p>
        <pre style={{ fontSize: '0.7rem', color: '#475569', background: '#f8fafc', padding: '0.5rem', borderRadius: '6px', margin: 0, whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: '120px' }}>
          {registrySnippet}
        </pre>
      </div>

      {/* Next steps guide */}
      <div className="glass-card" style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: '#f0fdf4' }}>
        <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#166534', margin: '0 0 0.4rem' }}>What's next?</h3>
        <ol style={{ fontSize: '0.78rem', color: '#166534', margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
          <li>Copy the registry snippet above → paste into feature-registry.ts</li>
          <li>Review generated components in <code>src/components/admin/{specName}/</code></li>
          <li>Customize the generated code as needed (add business logic, validation, etc.)</li>
          <li>The skill at <code>.claude/skills/{specName}/</code> helps Claude understand this feature in future sessions</li>
        </ol>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="admin-btn" onClick={onReset}>Create Another</button>
        <button className="admin-btn admin-btn-primary" onClick={() => onNavigate('/settings')}>Back to Admin</button>
      </div>
    </div>
  )
}
