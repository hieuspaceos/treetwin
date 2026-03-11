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
}
