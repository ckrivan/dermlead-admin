import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-[var(--foreground)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2.5 rounded-lg bg-[var(--input-bg)] border ${
            error ? 'border-[var(--accent-danger)]' : 'border-[var(--input-border)]'
          } text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--input-focus)] transition-colors ${className}`}
          {...props}
        />
        {error && (
          <p className="text-sm text-[var(--accent-danger)]">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-[var(--foreground-muted)]">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
