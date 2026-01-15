import { TextareaHTMLAttributes, forwardRef } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-[var(--foreground)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-4 py-2.5 rounded-lg bg-[var(--input-bg)] border ${
            error ? 'border-[var(--accent-danger)]' : 'border-[var(--input-border)]'
          } text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--input-focus)] transition-colors resize-none ${className}`}
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

Textarea.displayName = 'Textarea'
