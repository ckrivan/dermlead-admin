'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      const hash = window.location.hash.substring(1)
      const hashParams = new URLSearchParams(hash)
      const queryParams = new URLSearchParams(window.location.search)

      // Check for error in hash fragment
      if (hashParams.get('error')) {
        const errorDesc = hashParams.get('error_description') || hashParams.get('error') || 'Authentication failed'
        setError(errorDesc)
        setTimeout(() => router.push('/login'), 3000)
        return
      }

      const supabase = createClient()

      // Explicitly extract tokens from hash and set the session
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (sessionError) {
          console.error('[auth/callback] Failed to set session:', sessionError.message)
          setError(sessionError.message)
          setTimeout(() => router.push('/login'), 3000)
          return
        }
      }

      // Handle ?code= query param (PKCE flow)
      const code = queryParams.get('code')
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          console.error('[auth/callback] Code exchange failed:', exchangeError.message)
          setError(exchangeError.message)
          setTimeout(() => router.push('/login'), 3000)
          return
        }
      }

      // Verify we have a session
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Could not establish session. Please try again.')
        setTimeout(() => router.push('/login'), 3000)
        return
      }

      // Invited user → password setup, otherwise → dashboard
      if (user.invited_at) {
        router.push('/auth/setup-password')
      } else {
        router.push(queryParams.get('next') ?? '/dashboard')
      }
    }

    handleCallback()
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
            <p className="text-[var(--foreground-muted)] text-sm">Setting up your account...</p>
          </div>
        )}
      </div>
    </div>
  )
}
