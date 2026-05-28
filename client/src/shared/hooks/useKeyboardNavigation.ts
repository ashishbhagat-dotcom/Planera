import { useState, useCallback } from 'react'
import { useKeyboardShortcut } from './useKeyboardShortcut'

interface UseKeyboardNavigationOptions {
  ids: string[]
  enabled?: boolean
  onOpen?: (id: string) => void
  onToggleSelect?: (id: string) => void
}

export function useKeyboardNavigation({
  ids,
  enabled = true,
  onOpen,
  onToggleSelect,
}: UseKeyboardNavigationOptions) {
  const [focusedId, setFocusedId] = useState<string | null>(null)

  const focusNext = useCallback(() => {
    setFocusedId((current) => {
      if (ids.length === 0) return null
      if (!current || !ids.includes(current)) return ids[0]
      const idx = ids.indexOf(current)
      return ids[Math.min(idx + 1, ids.length - 1)]
    })
  }, [ids])

  const focusPrev = useCallback(() => {
    setFocusedId((current) => {
      if (ids.length === 0) return null
      if (!current || !ids.includes(current)) return ids[0]
      const idx = ids.indexOf(current)
      return ids[Math.max(idx - 1, 0)]
    })
  }, [ids])

  useKeyboardShortcut('j', focusNext, { enabled: enabled && ids.length > 0 })
  useKeyboardShortcut('k', focusPrev, { enabled: enabled && ids.length > 0 })

  useKeyboardShortcut('Enter', () => {
    if (focusedId) onOpen?.(focusedId)
  }, { enabled: enabled && !!focusedId, ignoreInputs: true })

  useKeyboardShortcut('x', () => {
    if (focusedId) onToggleSelect?.(focusedId)
  }, { enabled: enabled && !!focusedId })

  return { focusedId, setFocusedId }
}
