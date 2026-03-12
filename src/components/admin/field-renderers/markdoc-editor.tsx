/**
 * Enhanced Markdown editor — toolbar + textarea with formatting shortcuts
 * No external WYSIWYG dependency (Milkdown caused Vite compatibility issues)
 * Provides markdown shortcuts via toolbar buttons and keyboard shortcuts
 */
import { useState, useRef, useCallback } from 'react'
import { MediaBrowser } from '../media-browser'
import '@/styles/admin-editor.css'

interface Props {
  value: string
  onChange: (value: string) => void
}

/** Insert/wrap text at cursor position */
function applyFormat(
  textarea: HTMLTextAreaElement,
  prefix: string,
  suffix: string,
  onChange: (v: string) => void,
) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = textarea.value
  const selected = text.substring(start, end)
  const replacement = prefix + (selected || 'text') + suffix
  const newValue = text.substring(0, start) + replacement + text.substring(end)
  onChange(newValue)
  // Restore selection
  requestAnimationFrame(() => {
    textarea.focus()
    const newStart = start + prefix.length
    const newEnd = selected ? newStart + selected.length : newStart + 4
    textarea.setSelectionRange(newStart, newEnd)
  })
}

/** Insert text at cursor (no wrapping) */
function insertAt(textarea: HTMLTextAreaElement, text: string, onChange: (v: string) => void) {
  const start = textarea.selectionStart
  const val = textarea.value
  const newVal = val.substring(0, start) + text + val.substring(start)
  onChange(newVal)
  requestAnimationFrame(() => {
    textarea.focus()
    textarea.setSelectionRange(start + text.length, start + text.length)
  })
}

export default function MarkdocEditor({ value, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showMedia, setShowMedia] = useState(false)

  const fmt = useCallback(
    (prefix: string, suffix: string) => {
      if (textareaRef.current) applyFormat(textareaRef.current, prefix, suffix, onChange)
    },
    [onChange],
  )

  const ins = useCallback(
    (text: string) => {
      if (textareaRef.current) insertAt(textareaRef.current, text, onChange)
    },
    [onChange],
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab') {
      e.preventDefault()
      ins('  ')
    }
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); fmt('**', '**') }
      if (e.key === 'i') { e.preventDefault(); fmt('*', '*') }
      if (e.key === 'k') { e.preventDefault(); fmt('[', '](url)') }
    }
  }

  return (
    <div className="admin-editor-wrap">
      <div className="admin-editor-toolbar">
        <button type="button" title="Bold (Ctrl+B)" onClick={() => fmt('**', '**')}>B</button>
        <button type="button" title="Italic (Ctrl+I)" onClick={() => fmt('*', '*')}><em>I</em></button>
        <button type="button" title="Strikethrough" onClick={() => fmt('~~', '~~')}><s>S</s></button>
        <button type="button" title="Code" onClick={() => fmt('`', '`')}>{'<>'}</button>
        <div className="toolbar-divider" />
        <button type="button" title="Heading 2" onClick={() => ins('\n## ')}>H2</button>
        <button type="button" title="Heading 3" onClick={() => ins('\n### ')}>H3</button>
        <div className="toolbar-divider" />
        <button type="button" title="Bullet list" onClick={() => ins('\n- ')}>•</button>
        <button type="button" title="Numbered list" onClick={() => ins('\n1. ')}>1.</button>
        <button type="button" title="Blockquote" onClick={() => ins('\n> ')}>❝</button>
        <div className="toolbar-divider" />
        <button type="button" title="Link (Ctrl+K)" onClick={() => fmt('[', '](url)')}>🔗</button>
        <button type="button" title="Insert image — opens media browser (Ctrl+Shift+I)" onClick={() => setShowMedia(true)}>🖼</button>
        <button type="button" title="Code block" onClick={() => fmt('\n```\n', '\n```\n')}>{'{}'}</button>
        <button type="button" title="Horizontal rule" onClick={() => ins('\n---\n')}>—</button>
      </div>
      <textarea
        ref={textareaRef}
        className="admin-source-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        placeholder="Start writing markdown... (click 🖼 in toolbar to insert images)"
      />

      {showMedia && (
        <MediaBrowser
          mode="dialog"
          onSelect={(url) => ins(`\n![](${url})\n`)}
          onClose={() => setShowMedia(false)}
        />
      )}
    </div>
  )
}
