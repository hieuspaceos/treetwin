/**
 * Settings editor — singleton editor for site-settings
 */
import { useEffect, useRef } from 'react'
import { api } from '@/lib/admin/api-client'
import { getSchemaForSingleton } from '@/lib/admin/schema-registry'
import { useFormState } from '@/lib/admin/form-reducer'
import { renderField } from './field-renderers/render-field'
import { useToast } from './admin-toast'
import { SettingsIntegrationStatus } from './settings-integration-status'

export function SettingsEditor() {
  const toast = useToast()
  const schema = getSchemaForSingleton('site-settings')
  const form = useFormState({})
  const saving = useRef(false)

  useEffect(() => {
    api.singletons.read('site-settings').then((res) => {
      if (res.ok && res.data) form.reset(res.data as Record<string, unknown>)
    })
  }, [])

  async function handleSave() {
    if (saving.current) return
    saving.current = true

    try {
      const res = await api.singletons.update('site-settings', form.values)
      if (res.ok) {
        toast.success('Settings saved')
        form.reset(form.values)
      } else {
        toast.error(res.error || 'Save failed')
      }
    } catch {
      toast.error('Network error')
    }
    saving.current = false
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.25rem' }}>
        Site Settings
      </h1>

      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSave() }}>
          {schema.map((field) =>
            renderField(field, form.values[field.name], (v) => form.setField(field.name, v)),
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            {form.dirty && (
              <span style={{ fontSize: '0.8rem', color: '#f59e0b', alignSelf: 'center', marginRight: 'auto' }}>
                Unsaved changes
              </span>
            )}
            <button type="submit" className="admin-btn admin-btn-primary">
              Save Settings
            </button>
          </div>
        </form>
      </div>

      <SettingsIntegrationStatus />
    </div>
  )
}
