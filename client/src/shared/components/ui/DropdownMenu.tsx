import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'

interface DropdownContextValue {
  open: boolean
  setOpen: (v: boolean) => void
}
const DropdownContext = createContext<DropdownContextValue>({ open: false, setOpen: () => {} })

function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

function Trigger({ children, className }: { children: ReactNode; className?: string }) {
  const { open, setOpen } = useContext(DropdownContext)
  return (
    <div
      className={className}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
    >
      {children}
    </div>
  )
}

function Content({ children, className, align = 'left' }: { children: ReactNode; className?: string; align?: 'left' | 'right' }) {
  const { open } = useContext(DropdownContext)
  if (!open) return null
  return (
    <div
      className={cn(
        'absolute z-50 mt-1 min-w-[160px] rounded-md border border-[--border] bg-[--surface] py-1 shadow-lg',
        'animate-in fade-in-0 zoom-in-95 duration-100',
        align === 'right' ? 'right-0' : 'left-0',
        className
      )}
    >
      {children}
    </div>
  )
}

function Item({
  children,
  onClick,
  className,
  destructive,
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
  destructive?: boolean
  disabled?: boolean
}) {
  const { setOpen } = useContext(DropdownContext)
  return (
    <button
      className={cn(
        'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors',
        destructive
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
          : 'text-[--text-primary] hover:bg-[--surface-hover]',
        disabled && 'pointer-events-none opacity-40',
        className
      )}
      onClick={(e) => { e.stopPropagation(); onClick?.(); setOpen(false) }}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function Separator() {
  return <div className="my-1 border-t border-[--border]" />
}

DropdownMenu.Trigger = Trigger
DropdownMenu.Content = Content
DropdownMenu.Item = Item
DropdownMenu.Separator = Separator

export { DropdownMenu }
