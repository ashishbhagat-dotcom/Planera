import { useEffect, useRef } from 'react'

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!enabled) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === key) cbRef.current()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, enabled])
}
