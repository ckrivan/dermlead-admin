'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ArrowLeft } from 'lucide-react'

export default function MFAEnrollPage() {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const startEnroll = async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator App',
      issuer: 'Converge Admin',
    })
    setLoading(false)

    if (error) {
      if (error.message.includes('not authenticated') || error.message.includes('session')) {
        setError('Please sign in first')
        setTimeout(() => router.push('/login'), 1500)
        return
      }
      setError(error.message)
      return
    }
    if (data) {
      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)
      setFactorId(data.id)
    }
  }

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
      <div className="max-w-md w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-lg p-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-[var(--accent-primary)]/20 rounded-full flex items-center justify-center">
            <ShieldCheck size={32} className="text-[var(--accent-primary)]" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-[var(--foreground)] mb-2">
          Set Up Two-Factor Authentication
        </h1>
        <p className="text-[var(--foreground-muted)] text-center mb-6 text-sm">
          Two-factor authentication is required. Scan the QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
        </p>

        {!qrCode ? (
          <button
            onClick={startEnroll}
            disabled={loading}
            className="w-full bg-[var(--accent-primary)] text-white rounded-lg py-3 font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Setting up...' : 'Set Up 2FA'}
          </button>
        ) : (
          <div className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center">
              <div
                className="bg-white p-4 rounded-lg border border-[var(--card-border)]"
                dangerouslySetInnerHTML={{ __html: qrCode }}
              />
            </div>

            {/* Manual secret */}
            <div>
              <p className="text-xs text-[var(--foreground-muted)] mb-1">
                Can&apos;t scan? Enter this code manually:
              </p>
              <code className="block bg-[var(--background-secondary)] p-2 rounded text-xs font-mono break-all select-all text-[var(--foreground)]">
                {secret}
              </code>
            </div>

            {/* TOTP input */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">
                Enter the 6-digit code from your app
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && verifyCode()}
                className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                placeholder="000000"
                autoFocus
              />
            </div>

            <button
              onClick={verifyCode}
              disabled={loading || code.length !== 6}
              className="w-full bg-[var(--accent-primary)] text-white rounded-lg py-3 font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
            </button>
          </div>
        )}

        {error && (
          <p className="mt-4 text-red-500 text-sm text-center">{error}</p>
        )}

        <button
          onClick={async () => {
            await supabase.auth.signOut()
            router.push('/login')
          }}
          className="mt-4 w-full flex items-center justify-center gap-2 text-[var(--foreground-muted)] text-sm hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft size={14} />
          Sign out
        </button>
      </div>
    </div>
  )
}
