import { ReactNode, ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--background)] disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:
      'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] focus:ring-[var(--accent-primary)]',
    secondary:
      'bg-[var(--background-tertiary)] text-[var(--foreground)] hover:bg-[var(--foreground-subtle)] focus:ring-[var(--background-tertiary)]',
    danger:
      'bg-[var(--accent-danger)] text-white hover:bg-red-600 focus:ring-[var(--accent-danger)]',
    ghost:
      'bg-transparent text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)] hover:text-[var(--foreground)] focus:ring-[var(--background-tertiary)]',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : icon}
      {children}
    </button>
  )
}
