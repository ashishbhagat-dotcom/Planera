import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:     'bg-[--accent] text-white hover:bg-[--accent-hover]',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline:     'border border-[--border] bg-transparent text-[--text-primary] hover:bg-[--surface-hover]',
        ghost:       'bg-transparent text-[--text-primary] hover:bg-[--surface-hover]',
        link:        'bg-transparent text-[--accent] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm:      'h-7 px-2.5 text-xs',
        default: 'h-8 px-3',
        lg:      'h-10 px-4 text-base',
        icon:    'h-8 w-8 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
export type { ButtonProps }
