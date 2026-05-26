import { useState, useRef, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib/utils'

interface TooltipProps {
  content: string
  children: ReactNode
  delay?: number
  className?: string
}

function Tooltip({ content, children, delay = 600, className }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const show = () => {
    timerRef.current = setTimeout(() => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (rect) {
        setPos({
          top: rect.top - 32 + window.scrollY,
          left: rect.left + rect.width / 2 + window.scrollX,
        })
      }
      setVisible(true)
    }, delay)
  }

  const hide = () => {
    clearTimeout(timerRef.current)
    setVisible(false)
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        className="inline-flex"
      >
        {children}
      </div>
      {visible &&
        createPortal(
          <div
            className={cn(
              'pointer-events-none fixed z-[999] -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white dark:bg-gray-100 dark:text-gray-900',
              className
            )}
            style={{ top: pos.top, left: pos.left }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  )
}

export { Tooltip }
export type { TooltipProps }
