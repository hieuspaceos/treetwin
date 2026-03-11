/**
 * Shared field renderer props interface
 */
import type { FieldOption } from '@/lib/admin/schema-registry'

export interface FieldProps {
  name: string
  label: string
  value: unknown
  onChange: (value: unknown) => void
  error?: string
  required?: boolean
  disabled?: boolean
  options?: FieldOption[]
}
