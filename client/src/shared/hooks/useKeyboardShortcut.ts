import { useEffect, useRef } from 'react'

interface ShortcutOptions {
  enabled?: boolean
  meta?: boolean
  ctrl?: boolean
  shift?: boolean
  /** When true (default for bare letter/number keys), skip if focus is inside an input, textarea, or contenteditable. */
  ignoreInputs?: boolean
}

function isInputFocused(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return (el as HTMLElement).isContentEditable
}

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: ShortcutOptions = {},
) {
  const { enabled = true, meta = false, ctrl = false, shift = false, ignoreInputs } = options
  // Default: ignore inputs only for bare single-character keys (a-z, 0-9).
  // Special keys (Escape, Enter, Arrow*, F1-F12) and modifier combos always fire.
  const isBareCharKey = !meta && !ctrl && key.length === 1
  const shouldIgnoreInputs = ignoreInputs ?? isBareCharKey
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!enabled) return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== key) return
      if (meta && !e.metaKey) return
      if (ctrl && !e.ctrlKey) return
      if (shift && !e.shiftKey) return
      if (shouldIgnoreInputs && isInputFocused()) return
      e.preventDefault()
      cbRef.current()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, enabled, meta, ctrl, shift, shouldIgnoreInputs])
}
