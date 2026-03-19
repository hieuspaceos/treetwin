/**
 * Field renderer registry — maps field type to React component
 * Central dispatch for rendering any field from a FieldSchema
 */
import type { FieldSchema } from '@/lib/admin/schema-registry'
import { TextField } from './text-field'
import { TextareaField } from './textarea-field'
import { SelectField } from './select-field'
import { CheckboxField } from './checkbox-field'
import { DateField } from './date-field'
import { ArrayField } from './array-field'
import { ObjectField } from './object-field'
import { MarkdocField } from './markdoc-field'
import { DynamicSelectField } from './dynamic-select-field'
import { ColorField } from './color-field'
import { ChipSelectField } from './chip-select-field'

/** Render a single field from its schema definition */
export function renderField(
  schema: FieldSchema,
  value: unknown,
  onChange: (value: unknown) => void,
  disabled?: boolean,
  error?: string,
) {
  const key = schema.name
  const baseProps = {
    name: schema.name,
    label: schema.label,
    value,
    onChange,
    error,
    required: schema.required,
    disabled,
    mediaBrowse: schema.mediaBrowse,
  }

  switch (schema.type) {
    case 'text':
      return <TextField key={key} {...baseProps} />
    case 'textarea':
      return <TextareaField key={key} {...baseProps} />
    case 'select':
      return <SelectField key={key} {...baseProps} options={schema.options} />
    case 'checkbox':
      return <CheckboxField key={key} {...baseProps} />
    case 'date':
      return <DateField key={key} {...baseProps} />
    case 'array':
      return <ArrayField key={key} {...baseProps} />
    case 'markdoc':
      return <MarkdocField key={key} {...baseProps} />
    case 'dynamic-select':
      return <DynamicSelectField key={key} {...baseProps} apiEndpoint={schema.apiEndpoint} />
    case 'color':
      return <ColorField key={key} {...baseProps} />
    case 'chip-select':
      return <ChipSelectField key={key} {...baseProps} options={schema.options} />
    case 'object':
      return (
        <ObjectField
          key={key}
          name={schema.name}
          label={schema.label}
          value={value}
          onChange={onChange}
          fields={schema.fields || []}
          disabled={disabled}
        />
      )
    default:
      return <TextField key={key} {...baseProps} />
  }
}
