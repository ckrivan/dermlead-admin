'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useEvent } from '@/contexts/EventContext'

export function AdminLoadingGate({ children }: { children: ReactNode }) {
  const { loading: authLoading, user, profile } = useAuth()
  const { isLoading: eventLoading } = useEvent()
  const router = useRouter()

  if (authLoading || eventLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
      </div>
    )
  }

  // Client-side safety net: redirect non-admin users
  if (!user || !profile || profile.role !== 'admin') {
    router.replace('/unauthorized')
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
      </div>
    )
  }

  return <>{children}</>
}
