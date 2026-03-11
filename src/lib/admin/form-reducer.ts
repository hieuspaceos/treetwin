/**
 * Form state management hook for admin content editors
 * useReducer-based — no external state library needed
 */
import { useReducer, useCallback } from 'react'

export interface FormState {
  values: Record<string, unknown>
  dirty: boolean
  errors: Record<string, string>
}

type FormAction =
  | { type: 'SET_FIELD'; name: string; value: unknown }
  | { type: 'SET_NESTED'; path: string; value: unknown }
  | { type: 'ADD_ARRAY_ITEM'; name: string; value: string }
  | { type: 'REMOVE_ARRAY_ITEM'; name: string; index: number }
  | { type: 'SET_ERRORS'; errors: Record<string, string> }
  | { type: 'RESET'; values: Record<string, unknown> }

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        values: { ...state.values, [action.name]: action.value },
        dirty: true,
        errors: { ...state.errors, [action.name]: '' },
      }

    case 'SET_NESTED': {
      // path format: "seo.seoTitle" or "cover.url"
      const [parent, child] = action.path.split('.')
      const parentObj = (state.values[parent] as Record<string, unknown>) || {}
      return {
        ...state,
        values: {
          ...state.values,
          [parent]: { ...parentObj, [child]: action.value },
        },
        dirty: true,
        errors: { ...state.errors, [action.path]: '' },
      }
    }

    case 'ADD_ARRAY_ITEM': {
      const arr = ((state.values[action.name] as string[]) || []).slice()
      arr.push(action.value)
      return {
        ...state,
        values: { ...state.values, [action.name]: arr },
        dirty: true,
      }
    }

    case 'REMOVE_ARRAY_ITEM': {
      const arr = ((state.values[action.name] as string[]) || []).slice()
      arr.splice(action.index, 1)
      return {
        ...state,
        values: { ...state.values, [action.name]: arr },
        dirty: true,
      }
    }

    case 'SET_ERRORS':
      return { ...state, errors: action.errors }

    case 'RESET':
      return { values: action.values, dirty: false, errors: {} }

    default:
      return state
  }
}

/** Custom hook wrapping useReducer for form state */
export function useFormState(initial: Record<string, unknown> = {}) {
  const [state, dispatch] = useReducer(formReducer, {
    values: initial,
    dirty: false,
    errors: {},
  })

  const setField = useCallback(
    (name: string, value: unknown) => dispatch({ type: 'SET_FIELD', name, value }),
    [],
  )

  const setNested = useCallback(
    (path: string, value: unknown) => dispatch({ type: 'SET_NESTED', path, value }),
    [],
  )

  const addArrayItem = useCallback(
    (name: string, value = '') => dispatch({ type: 'ADD_ARRAY_ITEM', name, value }),
    [],
  )

  const removeArrayItem = useCallback(
    (name: string, index: number) => dispatch({ type: 'REMOVE_ARRAY_ITEM', name, index }),
    [],
  )

  const setErrors = useCallback(
    (errors: Record<string, string>) => dispatch({ type: 'SET_ERRORS', errors }),
    [],
  )

  const reset = useCallback(
    (values: Record<string, unknown>) => dispatch({ type: 'RESET', values }),
    [],
  )

  return { ...state, setField, setNested, addArrayItem, removeArrayItem, setErrors, reset }
}
