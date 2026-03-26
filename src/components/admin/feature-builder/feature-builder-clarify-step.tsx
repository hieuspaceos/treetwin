/**
 * Feature builder clarify step — displays AI questions as cards,
 * collects user answers, re-submits up to 2 rounds, then advances.
 */
import { useState, useEffect } from 'react'
import { api } from '@/lib/admin/api-client'
import type { FeatureDescription, ClarifyMessage, ClarifyResponse } from '@/lib/admin/feature-builder-ai'

interface Props {
  description: FeatureDescription
  onReady: (refinedDescription?: string) => void
  onBack: () => void
}

const MAX_ROUNDS = 2

export function FeatureBuilderClarifyStep({ description, onReady, onBack }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [history, setHistory] = useState<ClarifyMessage[]>([])
  const [round, setRound] = useState(0)
  const [noApiKey, setNoApiKey] = useState(false)

  useEffect(() => {
    void runClarify([])
  }, [])

  async function runClarify(currentHistory: ClarifyMessage[]) {
    setLoading(true)
    setError('')

    const res = await api.featureBuilder.clarify({ description, history: currentHistory })

    setLoading(false)

    if (!res.ok) {
      setError(res.error || 'Clarification failed')
      return
    }

    const data = res.data as ClarifyResponse

    if (data.readyToPlan || round >= MAX_ROUNDS) {
      onReady(data.refinedDescription)
      return
    }

    if (!data.questions || data.questions.length === 0) {
      onReady(data.refinedDescription)
      return
    }

    setQuestions(data.questions)
    setAnswers(new Array(data.questions.length).fill(''))

    // Store AI questions in history
    const aiMsg: ClarifyMessage = { role: 'ai', content: data.questions.join('\n') }
    setHistory([...currentHistory, aiMsg])
  }

  async function handleContinue() {
    const unanswered = answers.findIndex(a => !a.trim())
    if (unanswered !== -1) {
      setError(`Please answer question ${unanswered + 1}`)
      return
    }

    const userAnswerText = questions
      .map((q, i) => `Q: ${q}\nA: ${answers[i]}`)
      .join('\n\n')

    const userMsg: ClarifyMessage = { role: 'user', content: userAnswerText }
    const nextHistory = [...history, userMsg]
    setHistory(nextHistory)
    setRound(r => r + 1)
    await runClarify(nextHistory)
  }

  if (noApiKey) {
    return (
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px' }}>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
          Configure <code>GEMINI_API_KEY</code> to enable AI clarification.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="admin-btn" onClick={onBack}>← Back</button>
          <button className="admin-btn admin-btn-primary" onClick={() => onReady()}>
            Skip & Continue →
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: '14px', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>AI is analyzing your feature description…</p>
      </div>
    )
  }

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
          AI Clarification
        </h2>
        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
          Round {round + 1} of {MAX_ROUNDS}
        </span>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.6rem 0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {questions.map((q, i) => (
          <div key={i} className="glass-card" style={{ padding: '1rem', borderRadius: '10px' }}>
            <p style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 500, marginBottom: '0.5rem' }}>
              {i + 1}. {q}
            </p>
            <textarea
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '0.82rem',
                minHeight: '64px',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
              placeholder="Your answer…"
              value={answers[i] || ''}
              onChange={e => {
                const next = [...answers]
                next[i] = e.target.value
                setAnswers(next)
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="admin-btn" onClick={onBack}>← Back</button>
        <button className="admin-btn admin-btn-primary" onClick={handleContinue} style={{ flex: 1 }}>
          Continue →
        </button>
      </div>
    </div>
  )
}
