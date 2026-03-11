/**
 * Milkdown WYSIWYG Markdown editor — lazy loaded by markdoc-field.tsx
 * Integrates ProseMirror-based editing with glass morphism theme
 */
import { useRef, useState, useCallback, useEffect } from 'react'
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core'
import { commonmark } from '@milkdown/preset-commonmark'
import { gfm } from '@milkdown/preset-gfm'
import { history } from '@milkdown/plugin-history'
import { clipboard } from '@milkdown/plugin-clipboard'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
// nord theme removed — causes Vite EnvironmentPlugin error. Using custom CSS instead.
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react'
import { getMarkdown, replaceAll } from '@milkdown/utils'
import { EditorToolbar } from './editor-toolbar'
import { SourceEditor } from './source-editor'
import '@/styles/admin-editor.css'

interface Props {
  value: string
  onChange: (value: string) => void
}

/** Inner editor with access to Milkdown context */
function MilkdownEditorInner({ value, onChange }: Props) {
  const [mode, setMode] = useState<'wysiwyg' | 'source'>('wysiwyg')
  const editorRef = useRef<Editor | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const initialValue = useRef(value)

  const { get } = useEditor((root) =>
    Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, initialValue.current || '')
        ctx.get(listenerCtx).markdownUpdated((_ctx, md) => {
          // Debounce onChange to avoid excessive re-renders
          if (debounceRef.current) clearTimeout(debounceRef.current)
          debounceRef.current = setTimeout(() => onChange(md), 500)
        })
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(clipboard)
      .use(listener),
  )

  // Store editor instance ref
  useEffect(() => {
    const editor = get()
    if (editor) editorRef.current = editor
  }, [get])

  const handleToggleMode = useCallback(() => {
    setMode((prev) => {
      if (prev === 'wysiwyg') {
        // Serialize current editor content to markdown for source view
        const editor = editorRef.current
        if (editor) {
          try {
            const md = editor.action(getMarkdown())
            onChange(md)
          } catch { /* editor may not be ready */ }
        }
        return 'source'
      }
      // Switch back to WYSIWYG — replace editor content with current value
      const editor = editorRef.current
      if (editor) {
        try {
          editor.action(replaceAll(value))
        } catch { /* editor may not be ready */ }
      }
      return 'wysiwyg'
    })
  }, [value, onChange])

  return (
    <div className="admin-editor-wrap">
      <EditorToolbar
        editor={editorRef.current}
        mode={mode}
        onToggleMode={handleToggleMode}
      />
      <div className="admin-editor-content">
        {mode === 'wysiwyg' ? (
          <Milkdown />
        ) : (
          <SourceEditor value={value} onChange={onChange} />
        )}
      </div>
    </div>
  )
}

/** Root export — wraps with MilkdownProvider */
export default function MarkdocEditor(props: Props) {
  return (
    <MilkdownProvider>
      <MilkdownEditorInner {...props} />
    </MilkdownProvider>
  )
}
