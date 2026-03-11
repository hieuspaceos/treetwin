/**
 * Admin API client — typed fetch wrapper for admin React SPA
 * Auto-handles JSON, 401 redirects, and base path
 */

interface ApiResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: string
}

/** Core fetch wrapper for admin API calls */
async function adminFetch<T>(
  path: string,
  opts: RequestInit & { skipAuthRedirect?: boolean } = {},
): Promise<ApiResponse<T>> {
  const url = path.startsWith('/') ? path : `/api/admin/${path}`
  const { skipAuthRedirect, ...fetchOpts } = opts

  try {
    const res = await fetch(url, {
      ...fetchOpts,
      headers: {
        'Content-Type': 'application/json',
        ...(fetchOpts.headers || {}),
      },
    })

    // Session expired — redirect to login (skip for auth check to avoid infinite loop)
    if (res.status === 401 && !skipAuthRedirect) {
      window.location.href = '/admin'
      return { ok: false, error: 'Unauthorized' }
    }

    return (await res.json()) as ApiResponse<T>
  } catch (err) {
    return { ok: false, error: 'Network error' }
  }
}

// ── Typed API helpers ──

export interface EntryMeta {
  slug: string
  title: string
  status: string
  description: string
  publishedAt?: string | null
  tags?: string[]
  category?: string | null
}

export interface ListResponse {
  entries: EntryMeta[]
  total: number
}

export interface MediaItem {
  key: string
  url: string
  size: number
  lastModified: string | null
}

export interface MediaListResponse {
  items: MediaItem[]
  configured: boolean
  hasMore?: boolean
  nextCursor?: string | null
}

export const api = {
  auth: {
    login: (password: string) =>
      adminFetch('/api/admin/auth', {
        method: 'POST',
        body: JSON.stringify({ password }),
      }),
    logout: () => adminFetch('/api/admin/auth', { method: 'DELETE' }),
    check: () => adminFetch('/api/admin/auth', { skipAuthRedirect: true }),
  },

  collections: {
    list: (name: string, params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return adminFetch<ListResponse>(`collections/${name}${qs}`)
    },
    read: (name: string, slug: string) =>
      adminFetch<Record<string, unknown>>(`collections/${name}/${slug}`),
    create: (name: string, data: Record<string, unknown>) =>
      adminFetch<{ slug: string }>(`collections/${name}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (name: string, slug: string, data: Record<string, unknown>) =>
      adminFetch(`collections/${name}/${slug}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (name: string, slug: string) =>
      adminFetch(`collections/${name}/${slug}`, { method: 'DELETE' }),
  },

  singletons: {
    read: (name: string) => adminFetch<Record<string, unknown>>(`singletons/${name}`),
    update: (name: string, data: Record<string, unknown>) =>
      adminFetch(`singletons/${name}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  upload: async (file: File, path?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (path) formData.append('path', path)

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
      // Do NOT set Content-Type — browser sets multipart boundary
    })
    return res.json() as Promise<ApiResponse<{ url: string; key: string }>>
  },

  distribution: {
    stats: () => adminFetch<unknown>('/api/admin/distribution'),
    generate: (collection: string, slug: string, language: 'auto' | 'vi' | 'en' = 'auto', platforms?: string[]) =>
      adminFetch<{ posts: Array<{ platform: string; content: string }> }>(
        '/api/admin/distribution/generate',
        { method: 'POST', body: JSON.stringify({ collection, slug, language, platforms }) },
      ),
    connectedPlatforms: () =>
      adminFetch<{ platforms: string[]; integrationMap: Record<string, string>; configured: boolean }>(
        '/api/admin/distribution/platforms',
      ),
    schedule: (platform: string, content: string, integrationId: string, scheduledAt?: string) =>
      adminFetch<{ postId: string; integration: string }>(
        '/api/admin/distribution/schedule',
        { method: 'POST', body: JSON.stringify({ platform, content, integrationId, scheduledAt }) },
      ),
  },

  media: {
    list: (cursor?: string) => {
      const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
      return adminFetch<MediaListResponse>(`/api/admin/media${qs}`)
    },
    remove: (key: string) =>
      adminFetch('/api/admin/media', {
        method: 'DELETE',
        body: JSON.stringify({ key }),
      }),
  },
}
