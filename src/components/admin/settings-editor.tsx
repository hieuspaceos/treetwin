/**
 * Settings editor — renders site-settings for core admin,
 * or product-specific settings when in product admin context.
 */
import { useEffect, useRef } from 'react'
import { api } from '@/lib/admin/api-client'
import { getSchemaForSingleton } from '@/lib/admin/schema-registry'
import { useFormState } from '@/lib/admin/form-reducer'
import { renderField } from './field-renderers/render-field'
import { useToast } from './admin-toast'
import { SettingsIntegrationStatus } from './settings-integration-status'
import { FeatureTogglesPanel } from './feature-toggles-panel'
import type { ProductConfig } from '@/lib/admin/product-types'
import type { FieldSchema } from '@/lib/admin/schema-registry'

interface Props {
  productConfig?: ProductConfig
}

/** Schema for product settings — editable fields from ProductConfig */
const productSettingsSchema: FieldSchema[] = [
  { name: 'name', label: 'Product Name', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'text' },
  { name: 'landingPage', label: 'Landing Page Slug', type: 'text' },
  { name: 'icon', label: 'Sidebar Icon', type: 'text' },
]

export function SettingsEditor({ productConfig }: Props) {
  const toast = useToast()
  const isProduct = !!productConfig
  const schema = isProduct ? productSettingsSchema : getSchemaForSingleton('site-settings')
  const form = useFormState({})
  const saving = useRef(false)

  useEffect(() => {
    if (isProduct) {
      // Load product config from API
      api.products.read(productConfig.slug).then((res) => {
        if (res.ok && res.data) form.reset(res.data as Record<string, unknown>)
      })
    } else {
      api.singletons.read('site-settings').then((res) => {
        if (res.ok && res.data) form.reset(res.data as Record<string, unknown>)
      })
    }
  }, [isProduct, productConfig?.slug])

  async function handleSave() {
    if (saving.current) return
    saving.current = true

    try {
      const res = isProduct
        ? await api.products.update(productConfig!.slug, form.values as Record<string, unknown>)
        : await api.singletons.update('site-settings', form.values)
      if (res.ok) {
        toast.success('Settings saved')
        form.reset(form.values)
        if (!isProduct) window.dispatchEvent(new CustomEvent('settings-changed'))
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
        {isProduct ? `${productConfig.name} Settings` : 'Site Settings'}
      </h1>

      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSave() }}>
          {schema.filter((f) => f.name !== 'enabledFeatures').map((field) =>
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

      {/* Feature toggles and integration status — core admin only */}
      {!isProduct && (
        <>
          <FeatureTogglesPanel
            enabledFeatures={form.values.enabledFeatures as Record<string, boolean> | undefined}
            onChange={(id, val) => {
              const current = (form.values.enabledFeatures || {}) as Record<string, boolean>
              form.setField('enabledFeatures', { ...current, [id]: val })
            }}
          />
          <SettingsIntegrationStatus />
        </>
      )}
    </div>
  )
}
