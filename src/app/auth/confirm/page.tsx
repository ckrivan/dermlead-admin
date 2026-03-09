'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthConfirmPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function handleConfirm() {
      // Check for error in hash fragment
      const hash = window.location.hash
      if (hash.includes('error=')) {
        const params = new URLSearchParams(hash.substring(1))
        const errorDesc = params.get('error_description') || params.get('error') || 'Confirmation failed'
        setError(errorDesc)
        setTimeout(() => router.push('/login?error=confirmation_failed'), 2000)
        return
      }

      // Handle ?token_hash= query param (OTP flow)
      const urlParams = new URLSearchParams(window.location.search)
      const tokenHash = urlParams.get('token_hash')
      const type = urlParams.get('type')

      if (tokenHash && type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          type: type as 'invite' | 'email' | 'magiclink',
          token_hash: tokenHash,
        })
        if (verifyError) {
          setError(verifyError.message)
          setTimeout(() => router.push('/login?error=confirmation_failed'), 2000)
          return
        }
      }

      // Wait for session
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        const { data: { session: retrySession } } = await supabase.auth.getSession()

        if (!retrySession) {
          router.push('/login?error=confirmation_failed')
          return
        }
      }

      // Check if invited user
      const { data: { user } } = await supabase.auth.getUser()

      if (user?.invited_at) {
        router.push('/auth/setup-password')
      } else {
        const next = urlParams.get('next') ?? '/dashboard'
        router.push(next)
      }
    }

    handleConfirm()
  }, [router])

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="text-center">
        {error ? (
          <div>
            <p className="text-red-500 text-sm mb-2">{error}</p>
            <p className="text-[var(--foreground-muted)] text-sm">Redirecting to login...</p>
          </div>
        ) : (
          <div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mx-auto mb-4" />
            <p className="text-[var(--foreground-muted)] text-sm">Confirming your account...</p>
          </div>
        )}
      </div>
    </div>
  )
}
