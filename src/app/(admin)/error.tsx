'use client'

import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Admin Error Boundary]', error)
  }, [error])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)]">
      <div className="text-center max-w-md px-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-[var(--foreground-muted)] mb-6">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--accent-primary)] text-white hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/login"
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--card-border)] text-[var(--foreground)] hover:bg-[var(--background-secondary)]"
          >
            Back to login
          </a>
        </div>
      </div>
    </div>
  )
}
