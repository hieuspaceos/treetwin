/**
 * Feature builder plan step — renders the generated SkillSpec
 * as scannable section cards. Read-only preview before Review.
 */
import { useMemo } from 'react'
import type { FeatureDescription } from '@/lib/admin/feature-builder-ai'
import type { SkillSpec } from '@/lib/admin/feature-builder-spec-types'
import { buildSkillSpec } from '@/lib/admin/feature-builder-spec-builder'

interface Props {
  description: FeatureDescription
  refinedDescription?: string
  onNext: (spec: SkillSpec) => void
  onBack: () => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card" style={{ padding: '1rem', borderRadius: '10px' }}>
      <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem', margin: '0 0 0.5rem' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

export function FeatureBuilderPlanStep({ description, refinedDescription, onNext, onBack }: Props) {
  const spec = useMemo(() => buildSkillSpec(description, refinedDescription), [description, refinedDescription])

  const bodyPreview = spec.skill.body.split('\n').slice(0, 4).join('\n')

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 1.25rem' }}>
        Generated Skill Spec
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {/* Skill info */}
        <Section title="Skill Info">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ background: '#dbeafe', color: '#2563eb', padding: '2px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>
              {spec.skill.name}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>v{spec.skill.version}</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 0.4rem' }}>{spec.skill.description}</p>
          <pre style={{ fontSize: '0.72rem', color: '#64748b', background: '#f8fafc', padding: '0.5rem', borderRadius: '6px', margin: 0, whiteSpace: 'pre-wrap', overflow: 'hidden' }}>
            {bodyPreview}…
          </pre>
        </Section>

        {/* References */}
        <Section title="References">
          {spec.references.length === 0
            ? <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>No references</p>
            : spec.references.map((r, i) => (
              <div key={i} style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem' }}>
                <code style={{ fontSize: '0.75rem' }}>{r.filename}</code> — {r.purpose}
              </div>
            ))}
        </Section>

        {/* Scripts */}
        <Section title="Scripts">
          {spec.scripts.length === 0
            ? <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>No scripts — Claude Code creates them during Generate.</p>
            : spec.scripts.map((s, i) => (
              <div key={i} style={{ fontSize: '0.8rem', color: '#475569' }}>
                <code style={{ fontSize: '0.75rem' }}>{s.filename}</code> — {s.purpose}
              </div>
            ))}
        </Section>

        {/* Data schema */}
        <Section title="Data Schema">
          {spec.dataSchema.suggestedFields.length === 0
            ? <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>No fields parsed. Edit in Review.</p>
            : (
              <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '0.7rem' }}>
                    <th style={{ padding: '2px 6px' }}>Name</th>
                    <th style={{ padding: '2px 6px' }}>Type</th>
                    <th style={{ padding: '2px 6px' }}>Required</th>
                  </tr>
                </thead>
                <tbody>
                  {spec.dataSchema.suggestedFields.map((f, i) => (
                    <tr key={i} style={{ color: '#475569' }}>
                      <td style={{ padding: '2px 6px' }}>{f.name}</td>
                      <td style={{ padding: '2px 6px' }}>{f.type}</td>
                      <td style={{ padding: '2px 6px' }}>{f.required ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.4rem 0 0' }}>
            Parsed from your description. Edit in Review.
          </p>
        </Section>

        {/* Tree-id integration */}
        <Section title="Tree-id Integration">
          <div style={{ fontSize: '0.8rem', color: '#475569' }}>
            <p style={{ margin: '0 0 0.3rem' }}><strong>Section:</strong> {spec.treeidIntegration.section}</p>
            {spec.treeidIntegration.components.length > 0 && (
              <p style={{ margin: '0 0 0.3rem' }}>
                <strong>Components:</strong> {spec.treeidIntegration.components.map(c => <code key={c} style={{ fontSize: '0.72rem', marginRight: '0.4rem' }}>{c}</code>)}
              </p>
            )}
            <p style={{ margin: '0 0 0.3rem' }}>
              <strong>API:</strong> {spec.treeidIntegration.apiRoutes.map(r => <code key={r} style={{ fontSize: '0.72rem' }}>{r}</code>)}
            </p>
            <p style={{ margin: '0 0 0.3rem' }}>
              <strong>Nav:</strong> {spec.treeidIntegration.navItem.label} → <code style={{ fontSize: '0.72rem' }}>{spec.treeidIntegration.navItem.href}</code>
            </p>
          </div>
        </Section>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="admin-btn" onClick={onBack}>← Back</button>
        <button className="admin-btn admin-btn-primary" onClick={() => onNext(spec)} style={{ flex: 1 }}>
          Looks Good →
        </button>
      </div>
    </div>
  )
}
