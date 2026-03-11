/**
 * Distribution post generator modal — generates social posts via Gemini,
 * displays editable textareas per platform with copy-to-clipboard and Postiz scheduling
 */
import { useState, useEffect } from 'react'
import { api } from '@/lib/admin/api-client'
import { DistributionPostCard } from './distribution-post-card'
import { DistributionPlatformSelector } from './distribution-platform-selector'

const DEFAULT_PLATFORMS = [
  'Twitter/X', 'LinkedIn', 'Facebook', 'Reddit', 'Threads',
  'Hacker News', 'Dev.to', 'Hashnode', 'Medium', 'Viblo', 'Substack',
]

interface SocialPost {
  platform: string
  content: string
}

interface PostizState {
  configured: boolean
  platforms: string[]
  integrationMap: Record<string, string>
  /** Per-platform schedule status: 'idle' | 'scheduling' | 'scheduled' | 'error' */
  status: Record<string, string>
}

interface Props {
  collection: string
  slug: string
  title: string
  onClose: () => void
}

type LanguageOption = 'auto' | 'vi' | 'en'

export function DistributionPostGenerator({ collection, slug, title, onClose }: Props) {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [language, setLanguage] = useState<LanguageOption>('auto')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([...DEFAULT_PLATFORMS])
  const [postiz, setPostiz] = useState<PostizState>({
    configured: false, platforms: [], integrationMap: {}, status: {},
  })

  // Check Postiz connected platforms on mount
  useEffect(() => {
    api.distribution.connectedPlatforms().then((res) => {
      if (res.ok && res.data) {
        setPostiz((prev) => ({
          ...prev,
          configured: res.data!.configured,
          platforms: res.data!.platforms,
          integrationMap: res.data!.integrationMap || {},
        }))
      }
    }).catch(() => {})
  }, [])

  async function handleSchedule(index: number) {
    const post = posts[index]
    const integrationId = postiz.integrationMap[post.platform]
    if (!integrationId) return
    setPostiz((prev) => ({
      ...prev, status: { ...prev.status, [post.platform]: 'scheduling' },
    }))
    try {
      const res = await api.distribution.schedule(post.platform, post.content, integrationId)
      const newStatus = res.ok ? 'scheduled' : 'error'
      setPostiz((prev) => ({
        ...prev, status: { ...prev.status, [post.platform]: newStatus },
      }))
    } catch {
      setPostiz((prev) => ({
        ...prev, status: { ...prev.status, [post.platform]: 'error' },
      }))
    }
  }

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const platforms = selectedPlatforms.length < DEFAULT_PLATFORMS.length ? selectedPlatforms : undefined
      const res = await api.distribution.generate(collection, slug, language, platforms)
      if (res.ok && res.data?.posts) {
        setPosts(res.data.posts)
      } else {
        setError(res.error || 'Failed to generate posts')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy(index: number) {
    try {
      await navigator.clipboard.writeText(posts[index].content)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = posts[index].content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopiedIdx(index)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className="media-dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="media-dialog glass-panel" style={{ maxWidth: '900px', maxHeight: '85vh', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px) saturate(1.8)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
              Generate Social Posts
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>{title}</p>
          </div>
          <button className="admin-btn admin-btn-ghost" onClick={onClose} style={{ padding: '0.375rem 0.75rem' }}>Close</button>
        </div>

        {/* Initial state — language picker + generate button */}
        {posts.length === 0 && !loading && !error && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Generate social media posts for this content using AI.
              <br /><span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Requires GEMINI_API_KEY environment variable</span>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Language:</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value as LanguageOption)} className="admin-input" style={{ width: 'auto', padding: '0.375rem 0.625rem', fontSize: '0.8rem' }}>
                <option value="auto">Auto-detect</option>
                <option value="vi">Vietnamese</option>
                <option value="en">English</option>
              </select>
            </div>
            <DistributionPlatformSelector
              selected={selectedPlatforms}
              onChange={setSelectedPlatforms}
              language={language}
            />
            <button
              className="admin-btn admin-btn-primary"
              onClick={handleGenerate}
              disabled={selectedPlatforms.length === 0}
            >
              Generate Posts{selectedPlatforms.length < DEFAULT_PLATFORMS.length ? ` (${selectedPlatforms.length})` : ''}
            </button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div className="admin-loading-spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Generating posts via Gemini Flash...</p>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <p style={{ color: '#ef4444', marginBottom: '0.75rem' }}>{error}</p>
            <button className="admin-btn admin-btn-ghost" onClick={handleGenerate}>Retry</button>
          </div>
        )}

        {/* Generated posts list */}
        {posts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="admin-btn admin-btn-ghost" onClick={handleGenerate} disabled={loading} style={{ fontSize: '0.8rem' }}>Regenerate All</button>
            </div>
            {posts.map((post, i) => (
              <DistributionPostCard
                key={i}
                platform={post.platform}
                content={post.content}
                isCopied={copiedIdx === i}
                onEdit={(content) => setPosts((prev) => prev.map((p, j) => (j === i ? { ...p, content } : p)))}
                onCopy={() => handleCopy(i)}
                canSchedule={postiz.configured && postiz.platforms.includes(post.platform)}
                scheduleStatus={postiz.status[post.platform]}
                onSchedule={() => handleSchedule(i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
