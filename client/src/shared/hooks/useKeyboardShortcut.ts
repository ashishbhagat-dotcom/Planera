import { useEffect, useRef } from 'react'

interface ShortcutOptions {
  enabled?: boolean
  meta?: boolean
  ctrl?: boolean
  shift?: boolean
}

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: ShortcutOptions = {},
) {
  const { enabled = true, meta = false, ctrl = false, shift = false } = options
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!enabled) return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== key) return
      if (meta && !e.metaKey) return
      if (ctrl && !e.ctrlKey) return
      if (shift && !e.shiftKey) return
      e.preventDefault()
      cbRef.current()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, enabled, meta, ctrl, shift])
}
