'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'

export default function MFAVerifyPage() {
  const [code, setCode] = useState('')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadFactor = async () => {
      const { data } = await supabase.auth.mfa.listFactors()
      if (data?.totp && data.totp.length > 0) {
        setFactorId(data.totp[0].id)
      } else {
        router.push('/mfa-enroll')
      }
    }
    loadFactor()
  }, [supabase, router])

  const verifyCode = async () => {
    if (!factorId || !code) return
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    })
    setLoading(false)

    if (error) {
      setError('Invalid code. Please try again.')
      setCode('')
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="max-w-sm w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-lg p-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-[var(--accent-primary)]/20 rounded-full flex items-center justify-center">
            <ShieldCheck size={32} className="text-[var(--accent-primary)]" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-center text-[var(--foreground)] mb-1">
          Two-Factor Authentication
        </h1>
        <p className="text-[var(--foreground-muted)] text-center mb-6 text-sm">
          Enter the 6-digit code from your authenticator app
        </p>

        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && verifyCode()}
          className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)] mb-4"
          placeholder="000000"
          autoFocus
        />

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <button
          onClick={verifyCode}
          disabled={loading || code.length !== 6}
          className="w-full bg-[var(--accent-primary)] text-white rounded-lg py-3 font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>

        <button
          onClick={async () => {
            await supabase.auth.signOut()
            router.push('/login')
          }}
          className="mt-4 w-full text-[var(--foreground-muted)] text-sm hover:text-[var(--foreground)] transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
