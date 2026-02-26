'use client'

import { useState } from 'react'
import { X, Mail, User, Shield } from 'lucide-react'
import { Button } from '@/components/ui'
import { inviteUser, InviteUserData } from '@/lib/api/users'

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  onSuccess: () => void
}

export function InviteUserModal({
  isOpen,
  onClose,
  organizationId,
  onSuccess,
}: InviteUserModalProps) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'admin' | 'rep'>('rep')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await inviteUser({
        email,
        full_name: fullName,
        role,
        organization_id: organizationId,
      })

      if (result.success) {
        onSuccess()
        handleClose()
      } else {
        setError(result.error || 'Failed to invite user')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setFullName('')
    setRole('rep')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Invite Team Member
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Email */}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--input-focus)]"
              />
            </div>
          </div>

          {/* Full Name */}
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
                placeholder="John Doe"
                required
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--input-focus)]"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
              Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('rep')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                  role === 'rep'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                    : 'border-[var(--card-border)] text-[var(--foreground-muted)] hover:border-[var(--foreground-subtle)]'
                }`}
              >
                <User size={18} />
                <span className="font-medium">Rep</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                  role === 'admin'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                    : 'border-[var(--card-border)] text-[var(--foreground-muted)] hover:border-[var(--foreground-subtle)]'
                }`}
              >
                <Shield size={18} />
                <span className="font-medium">Admin</span>
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--foreground-muted)]">
              {role === 'admin'
                ? 'Admins can manage team members and all settings'
                : 'Reps can capture leads and view event data'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !email || !fullName}
              className="flex-1"
            >
              {loading ? 'Inviting...' : 'Send Invite'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
