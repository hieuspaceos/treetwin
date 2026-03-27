/**
 * Live preview panel — shows real-time preview of what Feature Builder
 * will generate as user fills in the form. Tabs: Structure, SKILL.md, Component, API.
 */
import { useState, useMemo } from 'react'
import type { FeatureDescription } from '@/lib/admin/feature-builder-ai'
import type { SkillSpec } from '@/lib/admin/feature-builder-spec-types'
import { buildSkillSpec } from '@/lib/admin/feature-builder-spec-builder'
import { generateAllFiles } from '@/lib/admin/feature-builder-generate'

interface Props {
  /** Partial form data — may have empty fields */
  partial: Partial<FeatureDescription> | null
  /** Completed description from after Define step */
  description: FeatureDescription | null
  refinedDescription?: string
  /** Current wizard step */
  step: string
}

type Tab = 'structure' | 'skill' | 'component' | 'api'

const TABS: { id: Tab; label: string }[] = [
  { id: 'structure', label: 'Structure' },
  { id: 'skill', label: 'SKILL.md' },
  { id: 'component', label: 'Component' },
  { id: 'api', label: 'API' },
]

/** Build a FeatureDescription from partial data with sensible defaults */
function toFullDesc(p: Partial<FeatureDescription>): FeatureDescription {
  return {
    name: p.name || 'my-feature',
    label: p.label || 'My Feature',
    purpose: p.purpose || 'Feature purpose',
    dataDescription: p.dataDescription || '',
    uiNeeds: p.uiNeeds || 'list-detail',
    section: p.section || 'content',
  }
}

export function FeatureBuilderLivePreview({ partial, description, refinedDescription, step }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('structure')

  // Use completed description if available, otherwise build from partial
  const desc = description || (partial ? toFullDesc(partial) : null)
  const hasInput = desc && desc.name && desc.name !== 'my-feature'

  const spec = useMemo<SkillSpec | null>(() => {
    if (!desc) return null
    return buildSkillSpec(desc, refinedDescription)
  }, [desc, refinedDescription])

  const generated = useMemo(() => {
    if (!spec) return null
    return generateAllFiles(spec)
  }, [spec])

  if (!hasInput) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.4 }}>👁️</div>
        Start typing to see a live preview of what will be generated.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '4px 10px', borderRadius: '6px 6px 0 0', fontSize: '0.72rem', fontWeight: 600, border: 'none', cursor: 'pointer',
              background: activeTab === t.id ? '#3b82f6' : 'transparent',
              color: activeTab === t.id ? 'white' : '#64748b',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', fontSize: '0.76rem' }}>
        {activeTab === 'structure' && spec && generated && (
          <StructureTab spec={spec} files={generated.files.map(f => f.path)} />
        )}
        {activeTab === 'skill' && spec && (
          <CodeTab title="SKILL.md" content={buildSkillMdPreview(spec)} />
        )}
        {activeTab === 'component' && generated && (
          <CodeTab
            title={generated.files.find(f => f.path.includes('components/'))?.path || 'No components'}
            content={generated.files.find(f => f.path.includes('-list.tsx') || f.path.includes('-form.tsx') || f.path.includes('-dashboard.tsx'))?.content || '// No UI components (uiNeeds = none)'}
          />
        )}
        {activeTab === 'api' && generated && (
          <CodeTab
            title={generated.files.find(f => f.path.includes('pages/api/'))?.path || 'API route'}
            content={generated.files.find(f => f.path.includes('pages/api/'))?.content || '// No API route'}
          />
        )}
      </div>

      {/* Step indicator */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.5rem', fontSize: '0.7rem', color: '#94a3b8' }}>
        Step: {step} | Files: {generated?.files.length || 0} | Skill: .claude/skills/{spec?.skill.name}/
      </div>
    </div>
  )
}

/** Structure tab — file tree with icons */
function StructureTab({ spec, files }: { spec: SkillSpec; files: string[] }) {
  const skillFiles = files.filter(f => f.startsWith('.claude/'))
  const componentFiles = files.filter(f => f.startsWith('src/components/'))
  const apiFiles = files.filter(f => f.startsWith('src/pages/'))
  const contentFiles = files.filter(f => f.startsWith('src/content/'))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <FileGroup icon="📚" title="Skill (Knowledge)" desc="Claude reads these when working with this feature" files={skillFiles} />
      {componentFiles.length > 0 && <FileGroup icon="🧩" title="Admin UI" desc="React components in your dashboard" files={componentFiles} />}
      <FileGroup icon="⚡" title="API" desc="CRUD endpoint with feature guard" files={apiFiles} />
      <FileGroup icon="📁" title="Content" desc="YAML data storage + registry config" files={contentFiles} />

      {/* Data schema preview */}
      {spec.dataSchema.suggestedFields.length > 0 && (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.3rem' }}>📊 Data Schema</div>
          <table style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'collapse' }}>
            <thead><tr style={{ color: '#94a3b8' }}><th style={{ textAlign: 'left', padding: '1px 4px' }}>Field</th><th style={{ textAlign: 'left', padding: '1px 4px' }}>Type</th></tr></thead>
            <tbody>
              {spec.dataSchema.suggestedFields.map((f, i) => (
                <tr key={i} style={{ color: '#475569' }}>
                  <td style={{ padding: '1px 4px', fontFamily: 'monospace' }}>{f.name}</td>
                  <td style={{ padding: '1px 4px' }}>{f.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FileGroup({ icon, title, desc, files }: { icon: string; title: string; desc: string; files: string[] }) {
  return (
    <div>
      <div style={{ fontWeight: 600, color: '#1e293b' }}>{icon} {title}</div>
      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '0.2rem' }}>{desc}</div>
      {files.map(f => (
        <div key={f} style={{ fontFamily: 'monospace', color: '#475569', paddingLeft: '1.2rem', fontSize: '0.72rem' }}>{f}</div>
      ))}
    </div>
  )
}

function CodeTab({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.4rem', fontSize: '0.78rem' }}>{title}</div>
      <pre style={{
        background: '#1e293b', color: '#e2e8f0', padding: '0.75rem', borderRadius: '8px',
        fontSize: '0.68rem', lineHeight: 1.5, overflow: 'auto', maxHeight: '400px', whiteSpace: 'pre-wrap', margin: 0,
      }}>
        {content}
      </pre>
    </div>
  )
}

/** Quick SKILL.md preview from spec */
function buildSkillMdPreview(spec: SkillSpec): string {
  return `---
name: ${spec.skill.name}
description: "${spec.skill.description}"
version: ${spec.skill.version}
---

${spec.skill.body}`
}
