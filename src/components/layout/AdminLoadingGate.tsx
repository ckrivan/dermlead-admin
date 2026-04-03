'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export function AdminLoadingGate({ children }: { children: ReactNode }) {
  const { loading: authLoading, user, profile } = useAuth()
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  const isUnauthorized = !authLoading && (!user || !profile || profile.role !== 'admin')

  useEffect(() => {
    if (isUnauthorized) {
      setRedirecting(true)
      router.replace('/unauthorized')
    }
  }, [isUnauthorized, router])

  if (authLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
      </div>
    )
  }

  if (isUnauthorized || redirecting) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)]">
        <p className="text-sm text-[var(--foreground-muted)]">Redirecting…</p>
      </div>
    )
  }

  return <>{children}</>
}
