/**
 * Toast notification system for admin — uses Radix UI Toast
 * Provides useToast() hook for success/error messages
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import * as Toast from '@radix-ui/react-toast'

interface ToastItem {
  id: number
  message: string
  variant: 'success' | 'error'
}

interface ToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within AdminToastProvider')
  return ctx
}

let nextId = 0

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((message: string, variant: 'success' | 'error') => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, message, variant }])
    // Auto-dismiss after 4s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const success = useCallback((msg: string) => addToast(msg, 'success'), [addToast])
  const error = useCallback((msg: string) => addToast(msg, 'error'), [addToast])

  return (
    <ToastContext.Provider value={{ success, error }}>
      <Toast.Provider swipeDirection="right" duration={4000}>
        {children}
        {toasts.map((t) => (
          <Toast.Root
            key={t.id}
            open
            onOpenChange={(open) => {
              if (!open) setToasts((prev) => prev.filter((x) => x.id !== t.id))
            }}
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 500,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              background: t.variant === 'success' ? '#dcfce7' : '#fee2e2',
              color: t.variant === 'success' ? '#166534' : '#dc2626',
              border: `1px solid ${t.variant === 'success' ? '#bbf7d0' : '#fecaca'}`,
            }}
          >
            <Toast.Description>{t.message}</Toast.Description>
          </Toast.Root>
        ))}
        <Toast.Viewport
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            zIndex: 9999,
            maxWidth: '360px',
          }}
        />
      </Toast.Provider>
    </ToastContext.Provider>
  )
}
