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
  seoScore?: number | null
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
    login: (password: string, username?: string, product?: string) =>
      adminFetch<{ username: string; role: string }>('/api/admin/auth', {
        method: 'POST',
        body: JSON.stringify({ password, username, product }),
      }),
    logout: () => adminFetch('/api/admin/auth', { method: 'DELETE' }),
    check: () => adminFetch<{ username: string; role: string }>('/api/admin/auth', { skipAuthRedirect: true }),
    checkMode: () => adminFetch<{ multiUser: boolean }>('/api/admin/auth?check=mode', { skipAuthRedirect: true }),
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

  landing: {
    list: () => adminFetch<unknown>('/api/admin/landing'),
    read: (slug: string) => adminFetch<unknown>(`/api/admin/landing/${slug}`),
    create: (data: Record<string, unknown>) =>
      adminFetch<{ slug: string }>('/api/admin/landing', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (slug: string, data: Record<string, unknown>) =>
      adminFetch('/api/admin/landing/' + slug, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (slug: string) =>
      adminFetch('/api/admin/landing/' + slug, { method: 'DELETE' }),
  },

  templates: {
    list: () => adminFetch<unknown>('/api/admin/templates'),
    read: (name: string) => adminFetch<unknown>(`/api/admin/templates?name=${encodeURIComponent(name)}`),
  },

  entities: {
    listDefinitions: () => adminFetch<unknown>('/api/admin/entity-definitions'),
    createDefinition: (data: Record<string, unknown>) =>
      adminFetch<{ name: string }>('/api/admin/entity-definitions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateDefinition: (name: string, data: Record<string, unknown>) =>
      adminFetch(`/api/admin/entity-definitions/${name}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteDefinition: (name: string) =>
      adminFetch(`/api/admin/entity-definitions/${name}`, { method: 'DELETE' }),
    listInstances: (name: string) =>
      adminFetch<unknown>(`/api/admin/entities/${name}`),
    readInstance: (name: string, slug: string) =>
      adminFetch<unknown>(`/api/admin/entities/${name}/${slug}`),
    createInstance: (name: string, data: Record<string, unknown>) =>
      adminFetch<{ slug: string }>(`/api/admin/entities/${name}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateInstance: (name: string, slug: string, data: Record<string, unknown>) =>
      adminFetch(`/api/admin/entities/${name}/${slug}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteInstance: (name: string, slug: string) =>
      adminFetch(`/api/admin/entities/${name}/${slug}`, { method: 'DELETE' }),
  },

  setup: {
    generate: (description: string, slug: string) =>
      adminFetch<unknown>('/api/admin/setup/generate', {
        method: 'POST',
        body: JSON.stringify({ description, slug }),
      }),
  },

  featureBuilder: {
    clarify: (data: { description: unknown; history: unknown[] }) =>
      adminFetch<unknown>('/api/admin/feature-builder/clarify', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  products: {
    list: () => adminFetch<unknown>('/api/admin/products'),
    read: (slug: string) => adminFetch<unknown>(`/api/admin/products/${slug}`),
    create: (data: Record<string, unknown>) =>
      adminFetch<{ slug: string }>('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (slug: string, data: Record<string, unknown>) =>
      adminFetch('/api/admin/products/' + slug, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (slug: string) =>
      adminFetch('/api/admin/products/' + slug, { method: 'DELETE' }),
  },
}

// ── Product-scoped API client ──

/** Create a product-scoped API client for the admin SPA when operating in product context */
export function createProductApi(productSlug: string) {
  const base = `/api/products/${productSlug}`

  async function fetchJson<T>(path: string, opts: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(path, {
        ...opts,
        headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      })
      if (res.status === 401) {
        window.location.href = '/admin'
        return { ok: false, error: 'Unauthorized' }
      }
      return (await res.json()) as ApiResponse<T>
    } catch {
      return { ok: false, error: 'Network error' }
    }
  }

  return {
    collections: {
      list: (collection: string, params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : ''
        return fetchJson<ListResponse>(`${base}/collections/${collection}${qs}`)
      },
      read: (collection: string, id: string) =>
        fetchJson<Record<string, unknown>>(`${base}/collections/${collection}/${id}`),
      create: (collection: string, data: Record<string, unknown>) =>
        fetchJson<{ slug: string }>(`${base}/collections/${collection}`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (collection: string, id: string, data: Record<string, unknown>) =>
        fetchJson(`${base}/collections/${collection}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (collection: string, id: string) =>
        fetchJson(`${base}/collections/${collection}/${id}`, { method: 'DELETE' }),
    },
    landing: {
      list: () => fetchJson<unknown>(`${base}/landing`),
      read: (page: string) => fetchJson<unknown>(`${base}/landing/${page}`),
      create: (data: Record<string, unknown>) =>
        fetchJson<{ slug: string }>(`${base}/landing`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (page: string, data: Record<string, unknown>) =>
        fetchJson(`${base}/landing/${page}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (page: string) =>
        fetchJson(`${base}/landing/${page}`, { method: 'DELETE' }),
    },
    settings: {
      read: () => fetchJson<Record<string, unknown>>(`${base}/settings`),
      update: (data: Record<string, unknown>) =>
        fetchJson(`${base}/settings`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
    },
  }
}
