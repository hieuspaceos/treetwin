/**
 * Editor sidebar panel — sticky right column: Publish + SEO Score only
 * Other fields (Description, Tags, etc.) are rendered in the main panel below content
 */
import { SeoScorePanel } from './seo-score-panel'
import { VoiceScorePanel } from './voice-score-panel'
import { renderField } from './field-renderers/render-field'
import { getSchemaForCollection, type FieldSchema } from '@/lib/admin/schema-registry'

interface Props {
  collection: string
  values: Record<string, unknown>
  errors: Record<string, string>
  dirty: boolean
  isCreate: boolean
  slug?: string
  onFieldChange: (name: string, value: unknown) => void
  onObjectChange: (parentName: string, childName: string, value: unknown) => void
  onSave: () => void
  onCancel: () => void
  onPreview: () => void
}

/** Find a field schema by name from the collection schema */
function findField(collection: string, name: string): FieldSchema | undefined {
  return getSchemaForCollection(collection).find((f) => f.name === name)
}

export function EditorSidebarPanel({
  collection,
  values,
  errors,
  dirty,
  isCreate,
  slug,
  onFieldChange,
  onObjectChange,
  onSave,
  onCancel,
  onPreview,
}: Props) {
  const statusField = findField(collection, 'status')
  const dateField = findField(collection, 'publishedAt')
  const seoSchema = findField(collection, 'seo')

  return (
    <div className="editor-sidebar-panel">
      {/* Publish box */}
      <div className="editor-panel-box">
        <div className="editor-panel-box-title">Publish</div>
        {statusField && renderField(statusField, values.status, (v) => onFieldChange('status', v), false, errors.status)}
        {dateField && renderField(dateField, values.publishedAt, (v) => onFieldChange('publishedAt', v), false, errors.publishedAt)}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          {dirty && (
            <span style={{ fontSize: '0.75rem', color: '#f59e0b', alignSelf: 'center', marginRight: 'auto' }}>
              Unsaved
            </span>
          )}
          <button type="button" className="admin-btn admin-btn-ghost" onClick={onCancel} style={{ fontSize: '0.8rem', padding: '0.375rem 0.75rem' }}>
            Cancel
          </button>
          {!isCreate && slug && (
            <button type="button" className="admin-btn admin-btn-ghost" onClick={onPreview} style={{ fontSize: '0.8rem', padding: '0.375rem 0.75rem' }}>
              Preview
            </button>
          )}
          <button type="submit" className="admin-btn admin-btn-primary" onClick={onSave} style={{ fontSize: '0.8rem', padding: '0.375rem 0.75rem' }}>
            {isCreate ? 'Create' : 'Save'}
          </button>
        </div>
      </div>

      {/* SEO Score Panel */}
      {seoSchema && seoSchema.fields && (
        <SeoScorePanel
          values={values}
          slug={slug || ''}
          seoFields={seoSchema.fields}
          onObjectChange={onObjectChange}
          errors={errors}
        />
      )}

      {/* Voice Quality Panel */}
      {collection === 'voices' && <VoiceScorePanel values={values} />}
    </div>
  )
}
