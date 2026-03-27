/**
 * Feature builder generate step — triggers code generation from approved spec,
 * shows progress, then delegates to result panel for detailed output.
 */
import { useState } from 'react'
import { useLocation } from 'wouter'
import type { SkillSpec } from '@/lib/admin/feature-builder-spec-types'
import { api } from '@/lib/admin/api-client'
import { FeatureBuilderGenerateResult } from './feature-builder-generate-result'

interface Props {
  spec: SkillSpec
  savedPath: string
  onReset: () => void
}

interface GenerateData {
  files: string[]
  registrySnippet: string
  warnings: string[]
}

export function FeatureBuilderGenerateStep({ spec, savedPath, onReset }: Props) {
  const [, navigate] = useLocation()
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<GenerateData | null>(null)
  const [error, setError] = useState('')

  async function handleGenerate() {
    setStatus('generating')
    setError('')
    const res = await api.featureBuilder.generate(spec)
    if (res.ok && res.data) {
      setResult(res.data as GenerateData)
      setStatus('done')
    } else {
      setError(res.error || 'Generation failed')
      setStatus('error')
    }
  }

  // Idle — explain what will happen, then Generate button
  if (status === 'idle') {
    return (
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.75rem' }}>Generate Code</h2>
        <p style={{ fontSize: '0.82rem', color: '#475569', margin: '0 0 0.75rem' }}>
          Spec: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.78rem' }}>{savedPath}</code>
        </p>

        {/* What will be generated */}
        <div className="glass-card" style={{ padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem' }}>This will create:</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem', color: '#475569' }}>
            <div>📚 <strong>Skill folder</strong> — <code>.claude/skills/{spec.skill.name}/</code> — Claude's knowledge base for this feature</div>
            {spec.treeidIntegration.components.length > 0 && (
              <div>🧩 <strong>Admin components</strong> — <code>src/components/admin/{spec.skill.name}/</code> — React UI for the dashboard</div>
            )}
            <div>⚡ <strong>API route</strong> — <code>src/pages/api/admin/{spec.skill.name}.ts</code> — CRUD endpoint with feature guard</div>
            <div>📁 <strong>Content directory</strong> — <code>src/content/{spec.skill.name}/</code> — where data (YAML files) will be stored</div>
            <div>📋 <strong>Registry snippet</strong> — TypeScript code to paste into feature-registry.ts</div>
          </div>
        </div>

        <button className="admin-btn admin-btn-primary" onClick={handleGenerate} style={{ width: '100%', padding: '0.6rem' }}>
          Generate Code
        </button>
      </div>
    )
  }

  // Generating — progress indicator
  if (status === 'generating') {
    return (
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: '14px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚙️</div>
        <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 0.25rem' }}>Generating files…</p>
        <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0 }}>Creating skill folder, components, API route, and content directory</p>
      </div>
    )
  }

  // Error — show message + retry
  if (status === 'error') {
    return (
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px' }}>
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.6rem 0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem' }}>
          {error}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="admin-btn" onClick={onReset}>Start Over</button>
          <button className="admin-btn admin-btn-primary" onClick={handleGenerate}>Retry</button>
        </div>
      </div>
    )
  }

  // Done — delegate to result panel
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px' }}>
      <FeatureBuilderGenerateResult
        specName={spec.skill.name}
        files={result?.files || []}
        registrySnippet={result?.registrySnippet || ''}
        warnings={result?.warnings || []}
        onReset={onReset}
        onNavigate={navigate}
      />
    </div>
  )
}
