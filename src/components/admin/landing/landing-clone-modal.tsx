/**
 * AI Wizard — multi-step clone with 3 source modes, intent clarification,
 * section picker with category colors, and polished UI.
 *
 * Steps: Input (source + intent) → Analyzing → Review (section picker) → Apply
 * Sources: URL | Paste Code | Upload File (.html/.htm/.jsx/.tsx/.vue/.svelte)
 */
import { useState, useRef, useEffect } from 'react'
import { api } from '@/lib/admin/api-client'
import type { LandingPageConfig } from '@/lib/landing/landing-types'

interface Props {
  onClose: () => void
  onCloned: (config: LandingPageConfig) => void
}

/* Section labels + category colors for review cards */
const SECTION_META: Record<string, { label: string; color: string }> = {
  nav: { label: '🧭 Navigation', color: '#3b82f6' },
  hero: { label: '🎯 Hero', color: '#3b82f6' },
  footer: { label: '📄 Footer', color: '#3b82f6' },
  divider: { label: '➖ Divider', color: '#3b82f6' },
  layout: { label: '⬜ Layout', color: '#3b82f6' },
  features: { label: '✨ Features', color: '#22c55e' },
  'how-it-works': { label: '🔄 How It Works', color: '#22c55e' },
  stats: { label: '📊 Stats', color: '#22c55e' },
  team: { label: '👥 Team', color: '#22c55e' },
  faq: { label: '❓ FAQ', color: '#22c55e' },
  'rich-text': { label: '📝 Rich Text', color: '#22c55e' },
  cta: { label: '🚀 CTA', color: '#f59e0b' },
  pricing: { label: '💰 Pricing', color: '#f59e0b' },
  testimonials: { label: '💬 Testimonials', color: '#f59e0b' },
  'logo-wall': { label: '🏢 Logo Wall', color: '#f59e0b' },
  banner: { label: '📣 Banner', color: '#f59e0b' },
  countdown: { label: '⏱ Countdown', color: '#f59e0b' },
  'contact-form': { label: '📬 Contact', color: '#f59e0b' },
  comparison: { label: '⚖️ Comparison', color: '#f59e0b' },
  'ai-search': { label: '🔍 AI Search', color: '#f59e0b' },
  'social-proof': { label: '🏅 Social Proof', color: '#f59e0b' },
  video: { label: '🎬 Video', color: '#a855f7' },
  image: { label: '🖼 Image', color: '#a855f7' },
  'image-text': { label: '📰 Image+Text', color: '#a855f7' },
  gallery: { label: '🗃 Gallery', color: '#a855f7' },
  map: { label: '📍 Map', color: '#a855f7' },
}

type Step = 'input' | 'analyzing' | 'review' | 'error'
type SourceMode = 'url' | 'code' | 'file'
const ACCEPT_EXTS = '.html,.htm,.jsx,.tsx,.vue,.svelte'

const stepNames = ['Source & Intent', 'Analyzing', 'Review & Select']
const stepNumber = (s: Step) => s === 'input' ? 0 : s === 'analyzing' ? 1 : s === 'review' ? 2 : 0

export function LandingCloneModal({ onClose, onCloned }: Props) {
  const [sourceMode, setSourceMode] = useState<SourceMode>(() =>
    (typeof localStorage !== 'undefined' && localStorage.getItem('ai-wizard-source') as SourceMode) || 'url'
  )
  const [url, setUrl] = useState('')
  const [code, setCode] = useState('')
  const [fileName, setFileName] = useState('')
  const [intent, setIntent] = useState('')
  const [step, setStep] = useState<Step>('input')
  const [error, setError] = useState('')
  const [result, setResult] = useState<LandingPageConfig | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  /* Remember source mode preference */
  useEffect(() => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('ai-wizard-source', sourceMode)
  }, [sourceMode])

  const hasSource = sourceMode === 'url' ? !!url.trim() : !!(code.trim())

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => { setCode(reader.result as string); setFileName(file.name) }
    reader.readAsText(file)
  }

  async function handleAnalyze() {
    if (!hasSource || !intent.trim()) return
    setStep('analyzing')
    setError('')
    const source = sourceMode === 'url' ? url.trim() : `data:text/html,${encodeURIComponent(code.trim())}`
    const res = await api.landing.clone(source, intent.trim())
    if (res.ok && res.data) {
      const data = res.data as LandingPageConfig
      setResult(data)
      setSelected(new Set(data.sections.map((_, i) => i)))
      setStep('review')
    } else {
      setError(res.error || 'Failed to analyze page')
      setStep('error')
    }
  }

  function toggle(i: number) {
    setSelected(p => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n })
  }

  function handleApply() {
    if (!result) return
    onCloned({ ...result, sections: result.sections.filter((_, i) => selected.has(i)) })
  }

  const canAnalyze = hasSource && !!intent.trim()
  const currentStep = stepNumber(step)

  /* Pill tab style helper */
  const pill = (active: boolean) => ({
    padding: '0.35rem 0.85rem', fontSize: '0.78rem', fontWeight: 500 as const, border: 'none',
    borderRadius: '999px', cursor: 'pointer' as const, transition: 'all 0.15s',
    background: active ? '#1e293b' : '#f1f5f9', color: active ? '#fff' : '#64748b',
  })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget && step !== 'analyzing') onClose() }}>
      <div style={{
        background: 'white', borderRadius: '20px', overflow: 'hidden',
        maxWidth: step === 'review' ? '680px' : '500px', width: '92%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)', maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        animation: 'wzIn 0.2s ease-out',
      }}>
        {/* Gradient header bar */}
        <div style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', padding: '1.25rem 1.75rem 1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>AI Wizard</h2>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', margin: '0.2rem 0 0' }}>
            {step === 'review' ? 'Pick sections to create' : 'Analyze a page and build your landing'}
          </p>
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            {stepNames.map((name, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', fontSize: '0.65rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i <= currentStep ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.2)',
                  color: i <= currentStep ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                }}>{i + 1}</div>
                <span style={{ fontSize: '0.68rem', color: i <= currentStep ? '#fff' : 'rgba(255,255,255,0.4)' }}>{name}</span>
                {i < stepNames.length - 1 && <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0.15rem' }}>→</span>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '1.25rem 1.75rem 1.5rem', flex: 1, overflowY: 'auto' }}>

          {/* STEP 1: Input */}
          {step === 'input' && (<>
            {/* Source mode pills */}
            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem', background: '#f8fafc', padding: '0.3rem', borderRadius: '999px', width: 'fit-content' }}>
              <button onClick={() => setSourceMode('url')} style={pill(sourceMode === 'url')}>🔗 URL</button>
              <button onClick={() => setSourceMode('code')} style={pill(sourceMode === 'code')}>📋 Code</button>
              <button onClick={() => setSourceMode('file')} style={pill(sourceMode === 'file')}>📁 File</button>
            </div>

            {/* URL input */}
            {sourceMode === 'url' && (
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com"
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.88rem', marginBottom: '0.85rem', boxSizing: 'border-box' }} autoFocus />
            )}

            {/* Code textarea */}
            {sourceMode === 'code' && (
              <textarea value={code} onChange={(e) => { setCode(e.target.value); setFileName('') }} placeholder="Paste HTML, JSX, or page source..."
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.82rem', fontFamily: 'monospace', minHeight: '90px', resize: 'vertical', marginBottom: '0.85rem', boxSizing: 'border-box' }} autoFocus />
            )}

            {/* File upload — drag-drop zone */}
            {sourceMode === 'file' && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? '#3b82f6' : '#d1d5db'}`, borderRadius: '12px',
                  padding: '1.5rem', textAlign: 'center', cursor: 'pointer', marginBottom: '0.85rem',
                  background: dragOver ? '#eff6ff' : '#fafafa', transition: 'all 0.15s',
                }}>
                <input ref={fileRef} type="file" accept={ACCEPT_EXTS} style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                {fileName ? (
                  <div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>📄 {fileName}</p>
                    <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' }}>Click to replace</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📁</p>
                    <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Drop file here or click to browse</p>
                    <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>.html, .htm, .jsx, .tsx, .vue, .svelte</p>
                  </div>
                )}
              </div>
            )}

            {/* Intent */}
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem', display: 'block' }}>What is this site about? *</label>
            <textarea value={intent} onChange={(e) => setIntent(e.target.value)}
              placeholder="e.g. A SaaS selling AI development kits for developers. Has pricing, testimonials, and a CTA section..."
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canAnalyze) handleAnalyze() }}
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', minHeight: '70px', resize: 'vertical', marginBottom: '1rem', boxSizing: 'border-box', background: '#fafafa' }} />

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '0.5rem 1.1rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.82rem' }}>Cancel</button>
              <button onClick={handleAnalyze} disabled={!canAnalyze}
                style={{ padding: '0.5rem 1.5rem', borderRadius: '10px', border: 'none', background: canAnalyze ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : '#cbd5e1', color: 'white', cursor: canAnalyze ? 'pointer' : 'not-allowed', fontSize: '0.82rem', fontWeight: 600 }}>
                Analyze →
              </button>
            </div>
          </>)}

          {/* STEP 2: Analyzing */}
          {step === 'analyzing' && (
            <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
              <div className="wz-shimmer" style={{ width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 1rem', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>⚡</div>
              <p style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.3rem' }}>Analyzing page structure...</p>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Extracting content, design tokens, and sections</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.3rem', marginTop: '1rem' }}>
                {[0, 1, 2].map(i => <div key={i} className="wz-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', animationDelay: `${i * 0.2}s` }} />)}
              </div>
            </div>
          )}

          {/* STEP 3: Review */}
          {step === 'review' && result && (<>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <p style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>
                <strong style={{ color: '#1e293b' }}>{selected.size}</strong> of {result.sections.length} sections selected
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setSelected(new Set(result.sections.map((_, i) => i)))} style={{ fontSize: '0.72rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>All</button>
                <button onClick={() => setSelected(new Set())} style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>None</button>
              </div>
            </div>

            {/* Design preview */}
            {result.design?.colors && (
              <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.6rem', padding: '0.6rem 0.85rem', background: '#f8fafc', borderRadius: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>Design</span>
                {Object.entries(result.design.colors).filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: v as string, border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }} />
                    <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{k}</span>
                  </div>
                ))}
                {result.design?.fonts?.heading && <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginLeft: '0.5rem' }}>Font: {result.design.fonts.heading}</span>}
              </div>
            )}

            {/* Section cards */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '380px', marginBottom: '0.75rem' }}>
              {result.sections.map((section, i) => {
                const meta = SECTION_META[section.type] || { label: section.type, color: '#94a3b8' }
                const data = section.data as Record<string, unknown>
                const preview = String(data.headline || data.heading || data.text || data.brandName || data.content || '').slice(0, 80)
                const isSelected = selected.has(i)
                return (
                  <label key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    padding: '0.55rem 0.75rem', borderRadius: '10px', cursor: 'pointer',
                    background: isSelected ? '#f0f9ff' : 'transparent',
                    borderLeft: `3px solid ${isSelected ? meta.color : 'transparent'}`,
                    marginBottom: '0.2rem', transition: 'all 0.12s',
                  }}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggle(i)} style={{ flexShrink: 0, accentColor: meta.color }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.83rem', fontWeight: 500, color: isSelected ? '#1e293b' : '#94a3b8' }}>{meta.label}</span>
                        {data.variant ? <span style={{ fontSize: '0.62rem', color: '#94a3b8', background: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{String(data.variant)}</span> : null}
                      </div>
                      {preview && <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '0.1rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview}</p>}
                    </div>
                  </label>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setStep('input')} style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.82rem' }}>← Back</button>
              <button onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.82rem' }}>Cancel</button>
              <button onClick={handleApply} disabled={selected.size === 0}
                style={{ padding: '0.5rem 1.5rem', borderRadius: '10px', border: 'none', background: selected.size ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : '#cbd5e1', color: 'white', cursor: selected.size ? 'pointer' : 'not-allowed', fontSize: '0.82rem', fontWeight: 600 }}>
                Apply {selected.size} Sections
              </button>
            </div>
          </>)}

          {/* ERROR */}
          {step === 'error' && (<>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>😔</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Analysis Failed</h3>
              <p style={{ fontSize: '0.82rem', color: '#dc2626', background: '#fee2e2', padding: '0.6rem 0.85rem', borderRadius: '8px', textAlign: 'left' }}>{error}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.82rem' }}>Cancel</button>
              <button onClick={() => setStep('input')} style={{ padding: '0.5rem 1.5rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>← Try Again</button>
            </div>
          </>)}
        </div>

        {/* CSS animations */}
        <style>{`
          @keyframes wzIn { from { opacity: 0; transform: scale(0.95) } to { opacity: 1; transform: scale(1) } }
          @keyframes wzPulse { 0%, 80% { opacity: 0.3; transform: scale(0.8) } 40% { opacity: 1; transform: scale(1) } }
          .wz-dot { animation: wzPulse 1.2s ease-in-out infinite }
          .wz-shimmer { animation: wzSpin 3s linear infinite }
          @keyframes wzSpin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        `}</style>
      </div>
    </div>
  )
}
