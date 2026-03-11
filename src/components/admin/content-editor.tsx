/**
 * Content editor — create/edit form for any collection
 * Renders fields from schema registry, handles save + validation
 */
import { useEffect, useRef } from 'react'
import { useLocation } from 'wouter'
import { api } from '@/lib/admin/api-client'
import { getSchemaForCollection } from '@/lib/admin/schema-registry'
import { useFormState } from '@/lib/admin/form-reducer'
import { renderField } from './field-renderers/render-field'
import { useToast } from './admin-toast'

interface Props {
  collection: string
  slug?: string // undefined = create mode
}

export function ContentEditor({ collection, slug }: Props) {
  const [, navigate] = useLocation()
  const toast = useToast()
  const schema = getSchemaForCollection(collection)
  const form = useFormState({})
  const saving = useRef(false)
  const isCreate = !slug

  // Load entry in edit mode
  useEffect(() => {
    if (!slug) return
    api.collections.read(collection, slug).then((res) => {
      if (res.ok && res.data) form.reset(res.data as Record<string, unknown>)
      else toast.error('Failed to load entry')
    })
  }, [collection, slug])

  // Unsaved changes warning
  useEffect(() => {
    if (!form.dirty) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [form.dirty])

  // Auto-save draft to localStorage every 30s
  useEffect(() => {
    if (!form.dirty) return
    const key = `admin-draft-${collection}-${slug || 'new'}`
    const timer = setInterval(() => {
      localStorage.setItem(key, JSON.stringify(form.values))
    }, 30_000)
    return () => clearInterval(timer)
  }, [form.dirty, form.values, collection, slug])

  // Load draft from localStorage on mount (create mode only)
  useEffect(() => {
    if (slug) return
    const key = `admin-draft-${collection}-new`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        form.reset(JSON.parse(saved))
        toast.success('Draft restored')
      } catch { /* ignore invalid JSON */ }
    }
  }, [collection])

  async function handleSave() {
    if (saving.current) return
    saving.current = true

    // Basic validation
    const errors: Record<string, string> = {}
    for (const field of schema) {
      if (field.required && !form.values[field.name]) {
        errors[field.name] = `${field.label} is required`
      }
    }
    if (Object.keys(errors).some((k) => errors[k])) {
      form.setErrors(errors)
      saving.current = false
      return
    }

    try {
      if (isCreate) {
        const res = await api.collections.create(collection, form.values)
        if (res.ok) {
          localStorage.removeItem(`admin-draft-${collection}-new`)
          toast.success('Created successfully')
          navigate(`/${collection}`)
        } else {
          toast.error(res.error || 'Create failed')
        }
      } else {
        const res = await api.collections.update(collection, slug, form.values)
        if (res.ok) {
          toast.success('Saved')
          form.reset(form.values) // clear dirty flag
        } else {
          toast.error(res.error || 'Save failed')
        }
      }
    } catch {
      toast.error('Network error')
    }
    saving.current = false
  }

  const label = collection.charAt(0).toUpperCase() + collection.slice(1)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <button
            className="admin-btn admin-btn-ghost"
            onClick={() => navigate(`/${collection}`)}
            style={{ marginBottom: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
          >
            ← Back to {label}
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
            {isCreate ? `New ${label.slice(0, -1)}` : form.values.title as string || 'Edit'}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSave() }}>
          {schema.map((field) =>
            renderField(
              field,
              field.type === 'object'
                ? form.values[field.name]
                : form.values[field.name],
              (v) => form.setField(field.name, v),
              false,
              form.errors[field.name],
            ),
          )}

          {/* Sticky save bar */}
          <div
            style={{
              position: 'sticky',
              bottom: 0,
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(8px)',
              padding: '1rem 0',
              marginTop: '1rem',
              borderTop: '1px solid var(--t-glass-border)',
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
            }}
          >
            {form.dirty && (
              <span style={{ fontSize: '0.8rem', color: '#f59e0b', alignSelf: 'center', marginRight: 'auto' }}>
                Unsaved changes
              </span>
            )}
            <button type="button" className="admin-btn admin-btn-ghost" onClick={() => navigate(`/${collection}`)}>
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn-primary">
              {isCreate ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
