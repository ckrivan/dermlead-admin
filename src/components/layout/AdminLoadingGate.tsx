'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useEvent } from '@/contexts/EventContext'

export function AdminLoadingGate({ children }: { children: ReactNode }) {
  const { loading: authLoading } = useAuth()
  const { isLoading: eventLoading } = useEvent()

  if (authLoading || eventLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
      </div>
    )
  }

  return <>{children}</>
}
