import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  className?: string
}

const variantStyles = {
  primary: 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]',
  secondary: 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)]',
  success: 'bg-green-500/10 text-green-500',
  warning: 'bg-yellow-500/10 text-yellow-500',
  danger: 'bg-red-500/10 text-red-500',
}

export function Badge({ children, variant = 'secondary', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
