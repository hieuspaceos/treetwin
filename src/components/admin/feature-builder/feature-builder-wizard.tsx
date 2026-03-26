/**
 * Feature builder wizard — multi-step shell for defining and planning a new feature module.
 * Phase 1: define + clarify. Phase 2-3 (plan/review/generate) are placeholders.
 */
import { useState } from 'react'
import { useLocation } from 'wouter'
import type { FeatureDescription } from '@/lib/admin/feature-builder-ai'
import { FeatureBuilderDefineStep } from './feature-builder-define-step'
import { FeatureBuilderClarifyStep } from './feature-builder-clarify-step'

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
  const [refinedDescription, setRefinedDescription] = useState<string | undefined>()

  function handleDefined(desc: FeatureDescription) {
    setDescription(desc)
    setStep('clarify')
  }

  function handleClarified(refined?: string) {
    setRefinedDescription(refined)
    setStep('plan')
  }

  const activeIndex = STEPS.findIndex(s => s.id === step)

  return (
    <div style={{ maxWidth: '680px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="admin-btn" onClick={() => navigate('/feature-builder')} style={{ fontSize: '0.8rem' }}>
          ← Back
        </button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
          Feature Builder
        </h1>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {STEPS.map((s, i) => {
          const isActive = s.id === step
          const isDone = i < activeIndex
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {i > 0 && <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>→</span>}
              <span style={{
                padding: '4px 12px',
                borderRadius: '99px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: isActive ? '#3b82f6' : isDone ? '#dcfce7' : '#f1f5f9',
                color: isActive ? 'white' : isDone ? '#16a34a' : '#94a3b8',
              }}>
                {i + 1}. {s.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Active step */}
      {step === 'define' && (
        <FeatureBuilderDefineStep onNext={handleDefined} />
      )}

      {step === 'clarify' && description && (
        <FeatureBuilderClarifyStep
          description={description}
          onReady={handleClarified}
          onBack={() => setStep('define')}
        />
      )}

      {(step === 'plan' || step === 'review' || step === 'generate') && (
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '14px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>
            {step.charAt(0).toUpperCase() + step.slice(1)} — Coming in Phase 2
          </p>
          {refinedDescription && (
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem', textAlign: 'left', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
              {refinedDescription}
            </p>
          )}
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            AI plan generation will be implemented in Phase 2.
          </p>
          <button className="admin-btn" onClick={() => setStep('clarify')} style={{ marginTop: '1rem' }}>
            ← Back to Clarify
          </button>
        </div>
      )}
    </div>
  )
}
