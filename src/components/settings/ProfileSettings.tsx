'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, Button } from '@/components/ui'
import { User, Mail, Save, Key, ShieldCheck, ShieldOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { updateProfile, changePassword } from '@/lib/api/auth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function ProfileSettings() {
  const { user, profile, refreshProfile } = useAuth()
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password change state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // MFA state
  const [mfaEnrolled, setMfaEnrolled] = useState(false)
  const [mfaLoading, setMfaLoading] = useState(true)
  const [mfaMessage, setMfaMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [disablingMfa, setDisablingMfa] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
    }
  }, [profile])

  useEffect(() => {
    const checkMfa = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.mfa.listFactors()
      setMfaEnrolled(!!(data?.totp && data.totp.length > 0))
      setMfaLoading(false)
    }
    checkMfa()
  }, [])

  const handleSaveProfile = async () => {
    if (!user) return

    setSaving(true)
    setMessage(null)

    try {
      await updateProfile(user.id, { full_name: fullName })
      await refreshProfile()
      setMessage({ type: 'success', text: 'Profile updated successfully' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }

    setChangingPassword(true)
    setPasswordMessage(null)

    try {
      await changePassword(newPassword)
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage({ type: 'success', text: 'Password changed successfully' })
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'Failed to change password' })
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Profile Information
          </h3>

          {message && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-500'
                  : 'bg-red-500/10 border border-red-500/20 text-red-500'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">
                Full Name
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
                />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
                />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--background-tertiary)] border border-[var(--card-border)] text-[var(--foreground-muted)] cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                Contact support to change your email address
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">
                Role
              </label>
              <input
                type="text"
                value={profile?.role || 'Unknown'}
                disabled
                className="w-full px-4 py-2 rounded-lg bg-[var(--background-tertiary)] border border-[var(--card-border)] text-[var(--foreground-muted)] cursor-not-allowed capitalize"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSaveProfile}
              disabled={saving || fullName === profile?.full_name}
            >
              <Save size={18} className="mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Change Password */}
      <Card>
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Change Password
          </h3>

          {passwordMessage && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                passwordMessage.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-500'
                  : 'bg-red-500/10 border border-red-500/20 text-red-500'
              }`}
            >
              {passwordMessage.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">
                New Password
              </label>
              <div className="relative">
                <Key
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--input-focus)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Key
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--input-focus)]"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !newPassword || !confirmPassword}
            >
              <Key size={18} className="mr-2" />
              {changingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-[var(--foreground-muted)]">
                Add an extra layer of security to your account with TOTP-based 2FA
              </p>
            </div>
            <div className={`p-2 rounded-lg ${mfaEnrolled ? 'bg-green-500/10' : 'bg-[var(--background-tertiary)]'}`}>
              {mfaEnrolled
                ? <ShieldCheck size={24} className="text-green-500" />
                : <ShieldOff size={24} className="text-[var(--foreground-muted)]" />
              }
            </div>
          </div>

          {mfaMessage && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm ${
                mfaMessage.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-500'
                  : 'bg-red-500/10 border border-red-500/20 text-red-500'
              }`}
            >
              {mfaMessage.text}
            </div>
          )}

          {!mfaLoading && (
            <div className="mt-4">
              {mfaEnrolled ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                  <span className="text-sm text-green-500 font-medium">
                    2FA is enabled
                  </span>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      setDisablingMfa(true)
                      setMfaMessage(null)
                      try {
                        const supabase = createClient()
                        const { data } = await supabase.auth.mfa.listFactors()
                        if (data?.totp?.[0]) {
                          const { error } = await supabase.auth.mfa.unenroll({
                            factorId: data.totp[0].id,
                          })
                          if (error) {
                            setMfaMessage({ type: 'error', text: error.message })
                          } else {
                            setMfaEnrolled(false)
                            setMfaMessage({ type: 'success', text: '2FA has been disabled' })
                          }
                        }
                      } catch {
                        setMfaMessage({ type: 'error', text: 'Failed to disable 2FA' })
                      } finally {
                        setDisablingMfa(false)
                      }
                    }}
                    disabled={disablingMfa}
                    className="text-red-500 hover:text-red-400"
                  >
                    {disablingMfa ? 'Disabling...' : 'Disable 2FA'}
                  </Button>
                </div>
              ) : (
                <Button onClick={() => router.push('/mfa-enroll')}>
                  <ShieldCheck size={18} className="mr-2" />
                  Set Up 2FA
                </Button>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
