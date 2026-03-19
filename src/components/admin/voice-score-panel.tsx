/**
 * Voice effectiveness panel — two modes:
 * 1. Heuristic: fast programmatic scoring from profile data (always visible)
 * 2. AI Analysis: Gemini-powered deep evaluation (on-demand via button)
 * Based on NN/G + Acrolinx voice evaluation frameworks
 */
import { useState } from 'react'

interface Props {
  values: Record<string, unknown>
}

/** Safely get array length */
function arrLen(v: unknown): number {
  return Array.isArray(v) ? v.length : 0
}

/** Safely get trimmed string length */
function strLen(v: unknown): number {
  return typeof v === 'string' ? v.trim().length : 0
}

/** Count unique context labels in samples */
function uniqueContexts(v: unknown): number {
  if (!Array.isArray(v)) return 0
  const set = new Set<string>()
  for (const s of v) {
    if (typeof s === 'object' && s !== null && 'context' in s) {
      set.add(String((s as Record<string, unknown>).context))
    }
  }
  return set.size
}

/** Count total word count across all samples */
function sampleWordCount(v: unknown): number {
  if (!Array.isArray(v)) return 0
  let total = 0
  for (const s of v) {
    if (typeof s === 'object' && s !== null && 'text' in s) {
      total += String((s as Record<string, unknown>).text).split(/\s+/).length
    } else if (typeof s === 'string') {
      total += s.split(/\s+/).length
    }
  }
  return total
}

interface Dimension {
  name: string
  description: string
  score: number // 0-100
  impact: string // what this means for readers
}

/** Evaluate voice on 6 research-backed dimensions */
function evaluate(v: Record<string, unknown>): Dimension[] {
  // --- 1. Completeness (7 components: name, desc, tone, industry, audience, targetReader, samples) ---
  const components = [
    strLen(v.name) > 0,
    strLen(v.description) > 0,
    arrLen(v.tone) > 0,
    arrLen(v.industry) > 0,
    arrLen(v.audience) > 0,
    strLen(v.targetReader) > 0,
    arrLen(v.samples) > 0,
  ]
  const filledCount = components.filter(Boolean).length
  const hasAvoid = arrLen(v.avoid) > 0
  const hasPronoun = strLen(v.pronoun) > 0
  const hasLanguage = strLen(v.language) > 0
  let completeness = Math.round((filledCount / 7) * 70)
  if (hasAvoid) completeness += 10
  if (hasPronoun) completeness += 10
  if (hasLanguage) completeness += 10
  completeness = Math.min(completeness, 100)

  // --- 2. Clarity: is the voice positioning clear? ---
  // Fewer tones = clearer positioning (1 tone = crystal clear, 4+ = confused)
  const toneCount = arrLen(v.tone)
  let clarity = 0
  if (toneCount === 1) clarity += 40
  else if (toneCount === 2) clarity += 30
  else if (toneCount >= 3) clarity += 15
  if (strLen(v.description) > 50) clarity += 30
  else if (strLen(v.description) > 20) clarity += 20
  else if (strLen(v.description) > 0) clarity += 10
  if (strLen(v.targetReader) > 50) clarity += 30
  else if (strLen(v.targetReader) > 20) clarity += 20
  else if (strLen(v.targetReader) > 0) clarity += 10

  // --- 3. Audience Fit: does the profile deeply understand the reader? ---
  let audienceFit = 0
  const audCount = arrLen(v.audience)
  if (audCount >= 1 && audCount <= 2) audienceFit += 30
  else if (audCount >= 3) audienceFit += 15
  // Target reader depth is the most important signal
  if (strLen(v.targetReader) > 100) audienceFit += 40
  else if (strLen(v.targetReader) > 50) audienceFit += 30
  else if (strLen(v.targetReader) > 20) audienceFit += 15
  // Industry alignment gives context
  if (arrLen(v.industry) >= 1 && arrLen(v.industry) <= 3) audienceFit += 20
  else if (arrLen(v.industry) > 3) audienceFit += 10
  // Language set = knows audience's language
  if (hasLanguage) audienceFit += 10
  audienceFit = Math.min(audienceFit, 100)

  // --- 4. Consistency: can AI produce uniform output? ---
  // More samples with diverse contexts + avoid list = more consistent output
  const sampleCount = arrLen(v.samples)
  const words = sampleWordCount(v.samples)
  const avoidCount = arrLen(v.avoid)
  let consistency = 0
  // Samples are the #1 consistency driver (target: 3+ samples, 150+ words total)
  if (sampleCount >= 3) consistency += 35
  else if (sampleCount >= 2) consistency += 25
  else if (sampleCount >= 1) consistency += 15
  if (words >= 150) consistency += 25
  else if (words >= 80) consistency += 15
  else if (words > 0) consistency += 5
  // Avoid list defines boundaries (target: 3+)
  if (avoidCount >= 5) consistency += 25
  else if (avoidCount >= 3) consistency += 20
  else if (avoidCount >= 1) consistency += 10
  // Pronoun consistency
  if (hasPronoun) consistency += 15
  consistency = Math.min(consistency, 100)

  // --- 5. Distinctiveness: what makes this voice unique? ---
  let distinct = 0
  // Avoid phrases show what NOT to do = defines uniqueness
  if (avoidCount >= 5) distinct += 30
  else if (avoidCount >= 3) distinct += 20
  else if (avoidCount >= 1) distinct += 10
  // Specific pronoun (not generic "I") adds personality
  if (hasPronoun && strLen(v.pronoun) > 0) distinct += 15
  // Sample diversity (different contexts = more defined voice)
  const contexts = uniqueContexts(v.samples)
  if (contexts >= 3) distinct += 30
  else if (contexts >= 2) distinct += 20
  else if (contexts >= 1) distinct += 10
  // Description explains uniqueness
  if (strLen(v.description) > 50) distinct += 25
  else if (strLen(v.description) > 20) distinct += 15
  distinct = Math.min(distinct, 100)

  // --- 6. Emotional Tone: does the voice have personality? ---
  let emotional = 0
  // Having a tone at all
  if (toneCount >= 1) emotional += 25
  // Samples show emotional range through different contexts
  if (contexts >= 3) emotional += 30
  else if (contexts >= 2) emotional += 20
  else if (contexts >= 1) emotional += 10
  // Long, detailed samples carry more personality
  if (words >= 150) emotional += 25
  else if (words >= 80) emotional += 15
  // Target reader with emotional detail (long = more empathetic)
  if (strLen(v.targetReader) > 80) emotional += 20
  else if (strLen(v.targetReader) > 30) emotional += 10
  emotional = Math.min(emotional, 100)

  return [
    {
      name: 'Completeness', score: completeness,
      description: `${filledCount}/7 core fields`,
      impact: completeness >= 70 ? 'Profile has enough data for content generation' : 'Missing fields will cause AI to guess — fill more',
    },
    {
      name: 'Clarity', score: clarity,
      description: toneCount <= 2 ? 'Clear positioning' : 'Too many tones may dilute focus',
      impact: clarity >= 60 ? 'Readers will feel a consistent personality' : 'Content may feel unfocused or generic',
    },
    {
      name: 'Audience Fit', score: audienceFit,
      description: strLen(v.targetReader) > 50 ? 'Deep reader understanding' : 'Needs more reader detail',
      impact: audienceFit >= 60 ? 'Content will resonate with target readers' : 'May miss the mark on reader expectations',
    },
    {
      name: 'Consistency', score: consistency,
      description: `${sampleCount} samples, ${words} words, ${avoidCount} avoid rules`,
      impact: consistency >= 60 ? 'AI can produce uniform tone across articles' : 'Output may vary significantly between pieces',
    },
    {
      name: 'Distinctiveness', score: distinct,
      description: contexts >= 2 ? `${contexts} context types covered` : 'Needs more sample variety',
      impact: distinct >= 60 ? 'Voice stands out from generic AI writing' : 'Content may sound like any other AI output',
    },
    {
      name: 'Emotional Tone', score: emotional,
      description: toneCount > 0 ? 'Has defined personality' : 'No tone selected',
      impact: emotional >= 60 ? 'Readers will connect emotionally with content' : 'Content may feel flat or impersonal',
    },
  ]
}

function barColor(score: number): string {
  if (score >= 70) return '#22c55e'
  if (score >= 40) return '#eab308'
  return '#ef4444'
}

/** AI analysis result shape (from Gemini) */
interface AIAnalysis {
  overall: number
  dimensions: { name: string; score: number; note: string }[]
  summary: string
  suggestions: string[]
}

export function VoiceScorePanel({ values }: Props) {
  const dimensions = evaluate(values)
  const [aiResult, setAiResult] = useState<AIAnalysis | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // Weighted average: Consistency 30%, Audience 25%, Clarity 20%, rest 25% split
  const weights = [10, 20, 25, 30, 8, 7]
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  const overall = Math.round(
    dimensions.reduce((sum, d, i) => sum + d.score * weights[i], 0) / totalWeight
  )
  const overallColor = barColor(overall)

  const label = overall >= 70 ? 'Ready to use'
    : overall >= 40 ? 'Needs improvement' : 'Not ready'

  const summary = overall >= 70
    ? 'This voice can produce consistent, targeted content that resonates with readers'
    : overall >= 40
    ? 'Some dimensions need strengthening for best results'
    : 'Profile needs more data before AI can effectively use this voice'

  async function runAIAnalysis() {
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch('/api/admin/voice-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice: values }),
      })
      const data = await res.json()
      if (data.ok) {
        setAiResult(data.analysis as AIAnalysis)
      } else {
        setAiError(data.error || 'Analysis failed')
      }
    } catch {
      setAiError('Network error')
    }
    setAiLoading(false)
  }

  return (
    <div className="editor-panel-box">
      <div className="editor-panel-box-title">Voice Effectiveness</div>

      {/* Overall heuristic score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: `3px solid ${overallColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.85rem', fontWeight: 700, color: overallColor,
        }}>
          {overall}
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>{label}</div>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', lineHeight: 1.4 }}>{summary}</div>
        </div>
      </div>

      {/* Heuristic dimension bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {dimensions.map((d) => (
          <div key={d.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569' }}>{d.name}</span>
              <span style={{ fontSize: '0.6rem', color: barColor(d.score), fontWeight: 600 }}>{d.score}</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.06)' }}>
              <div style={{
                height: '100%', borderRadius: 2, width: `${d.score}%`,
                background: barColor(d.score), transition: 'width 300ms ease',
              }} />
            </div>
            <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '0.1rem' }}>{d.description}</div>
            <div style={{ fontSize: '0.55rem', color: '#94a3b8', fontStyle: 'italic' }}>{d.impact}</div>
          </div>
        ))}
      </div>

      {/* AI Analysis section */}
      <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '0.75rem' }}>
        <button
          type="button"
          onClick={runAIAnalysis}
          disabled={aiLoading}
          className="admin-btn admin-btn-ghost"
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', padding: '0.4rem' }}
        >
          {aiLoading ? 'Analyzing...' : aiResult ? 'Re-analyze with AI' : 'Analyze with AI'}
        </button>

        {aiError && (
          <div style={{ fontSize: '0.65rem', color: '#dc2626', marginTop: '0.375rem' }}>{aiError}</div>
        )}

        {aiResult && (
          <div style={{ marginTop: '0.5rem' }}>
            {/* AI overall score */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8' }}>AI Score:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: barColor(aiResult.overall) }}>
                {aiResult.overall}
              </span>
            </div>

            {/* AI summary */}
            <div style={{ fontSize: '0.65rem', color: '#475569', lineHeight: 1.5, marginBottom: '0.5rem' }}>
              {aiResult.summary}
            </div>

            {/* AI dimension scores */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.5rem' }}>
              {aiResult.dimensions.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 600, color: barColor(d.score), width: '1.5rem', textAlign: 'right' }}>
                    {d.score}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: '#475569', fontWeight: 500 }}>{d.name}</span>
                  <span style={{ fontSize: '0.55rem', color: '#94a3b8', marginLeft: 'auto', maxWidth: '60%', textAlign: 'right' }}>
                    {d.note}
                  </span>
                </div>
              ))}
            </div>

            {/* AI suggestions */}
            {aiResult.suggestions.length > 0 && (
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.25rem' }}>Suggestions:</div>
                <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.6rem', color: '#475569', lineHeight: 1.6 }}>
                  {aiResult.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
