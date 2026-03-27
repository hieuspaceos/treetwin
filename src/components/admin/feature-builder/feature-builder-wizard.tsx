/**
 * Feature builder wizard — split-panel layout with live preview.
 * Left: multi-step form. Right: real-time preview of generated output.
 */
import { useState } from 'react'
import { useLocation } from 'wouter'
import type { FeatureDescription } from '@/lib/admin/feature-builder-ai'
import type { SkillSpec } from '@/lib/admin/feature-builder-spec-types'
import { api } from '@/lib/admin/api-client'
import { FeatureBuilderDefineStep } from './feature-builder-define-step'
import { FeatureBuilderClarifyStep } from './feature-builder-clarify-step'
import { FeatureBuilderPlanStep } from './feature-builder-plan-step'
import { FeatureBuilderReviewStep } from './feature-builder-review-step'
import { FeatureBuilderGenerateStep } from './feature-builder-generate-step'
import { FeatureBuilderLivePreview } from './feature-builder-live-preview'

type Step = 'define' | 'clarify' | 'plan' | 'review' | 'generate'

const STEPS: { id: Step; label: string }[] = [
  { id: 'define', label: 'Define' },
  { id: 'clarify', label: 'Clarify' },
  { id: 'plan', label: 'Plan' },
  { id: 'review', label: 'Review' },
  { id: 'generate', label: 'Generate' },
]

export function FeatureBuilderWizard() {
  const [, navigate] = useLocation()
  const [step, setStep] = useState<Step>('define')
  const [description, setDescription] = useState<FeatureDescription | null>(null)
  const [partialDesc, setPartialDesc] = useState<Partial<FeatureDescription> | null>(null)
  const [refinedDescription, setRefinedDescription] = useState<string | undefined>()
  const [spec, setSpec] = useState<SkillSpec | null>(null)
  const [savedPath, setSavedPath] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showPreview, setShowPreview] = useState(true)

  function handleDefined(desc: FeatureDescription) {
    setDescription(desc)
    setStep('clarify')
  }

  function handleClarified(refined?: string) {
    setRefinedDescription(refined)
    setStep('plan')
  }

  function handlePlanned(s: SkillSpec) {
    setSpec(s)
    setStep('review')
  }

  async function handleApproved(s: SkillSpec) {
    setSaving(true)
    setSaveError('')
    const res = await api.featureBuilder.saveSpec(s)
    setSaving(false)
    if (res.ok && res.data) {
      setSavedPath(res.data.path)
      setStep('generate')
    } else {
      setSaveError(res.error || 'Failed to save spec')
    }
  }

  function handleReset() {
    setDescription(null)
    setPartialDesc(null)
    setRefinedDescription(undefined)
    setSpec(null)
    setSavedPath(null)
    setStep('define')
  }

  const activeIndex = STEPS.findIndex(s => s.id === step)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button className="admin-btn" onClick={() => navigate('/feature-builder')} style={{ fontSize: '0.8rem' }}>
          ← Back
        </button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
          Feature Builder
        </h1>
        <div style={{ flex: 1 }} />
        <button
          className="admin-btn"
          onClick={() => setShowPreview(p => !p)}
          style={{ fontSize: '0.72rem', padding: '3px 10px' }}
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {STEPS.map((s, i) => {
          const isActive = s.id === step
          const isDone = i < activeIndex
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {i > 0 && <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>→</span>}
              <span style={{
                padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600,
                background: isActive ? '#3b82f6' : isDone ? '#dcfce7' : '#f1f5f9',
                color: isActive ? 'white' : isDone ? '#16a34a' : '#94a3b8',
              }}>
                {i + 1}. {s.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Split panel: form + preview */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Left: form steps */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: showPreview ? '55%' : '680px' }}>
          {step === 'define' && (
            <FeatureBuilderDefineStep onNext={handleDefined} onChange={setPartialDesc} />
          )}

          {step === 'clarify' && description && (
            <FeatureBuilderClarifyStep description={description} onReady={handleClarified} onBack={() => setStep('define')} />
          )}

          {step === 'plan' && description && (
            <FeatureBuilderPlanStep description={description} refinedDescription={refinedDescription} onNext={handlePlanned} onBack={() => setStep('clarify')} />
          )}

          {saveError && (
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.6rem 0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem' }}>
              {saveError}
            </div>
          )}

          {step === 'review' && spec && !saving && (
            <FeatureBuilderReviewStep spec={spec} onApprove={handleApproved} onBack={() => setStep('plan')} />
          )}

          {saving && (
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: '14px', textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Saving spec…</p>
            </div>
          )}

          {step === 'generate' && spec && savedPath && (
            <FeatureBuilderGenerateStep spec={spec} savedPath={savedPath} onReset={handleReset} />
          )}
        </div>

        {/* Right: live preview */}
        {showPreview && (
          <div
            className="glass-panel"
            style={{
              flex: 1, minWidth: 0, maxWidth: '45%', padding: '1rem', borderRadius: '14px',
              position: 'sticky', top: '1rem', maxHeight: 'calc(100vh - 120px)', overflow: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem' }}>👁️</span>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Live Preview</h2>
            </div>
            <FeatureBuilderLivePreview
              partial={partialDesc}
              description={description}
              refinedDescription={refinedDescription}
              step={step}
            />
          </div>
        )}
      </div>
    </div>
  )
}
