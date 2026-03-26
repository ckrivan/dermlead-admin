'use client'

import { useState, useEffect } from 'react'
import { X, Mail, User, Shield, Lock, Calendar } from 'lucide-react'
import { Button } from '@/components/ui'
import { inviteUser, InviteUserData } from '@/lib/api/users'
import { getEvents } from '@/lib/api/events'
import type { Event } from '@/types/database'

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  onSuccess: () => void
}

const BADGE_TYPES = [
  { value: 'attendee', label: 'Attendee' },
  { value: 'industry', label: 'Industry' },
  { value: 'speaker', label: 'Speaker' },
  { value: 'exhibitor', label: 'Exhibitor' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'organiser', label: 'Organiser' },
]

export function InviteUserModal({
  isOpen,
  onClose,
  organizationId,
  onSuccess,
}: InviteUserModalProps) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'organiser' | 'leadership' | 'rep' | 'attendee'>('attendee')
  const [eventId, setEventId] = useState('')
  const [badgeType, setBadgeType] = useState('attendee')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      getEvents().then(setEvents).catch(console.error)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password && password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const data: InviteUserData = {
        email,
        full_name: fullName,
        role,
        organization_id: organizationId,
      }

      if (password) data.password = password
      if (eventId) {
        data.event_id = eventId
        data.badge_type = badgeType
      }

      const result = await inviteUser(data)

      if (result.success) {
        onSuccess()
        handleClose()
      } else {
        setError(result.error || 'Failed to create user')
      }
    } catch (err) {
      console.error('[InviteUserModal] Error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setFullName('')
    setPassword('')
    setRole('attendee')
    setEventId('')
    setBadgeType('attendee')
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
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Register User
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
                placeholder="user@example.com"
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
                placeholder="Jane Doe"
                required
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--input-focus)]"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">
              Temporary Password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
              />
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--input-focus)]"
              />
            </div>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
              User can change this in the app after first login
            </p>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
              Global Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {([
                { value: 'admin', label: 'Admin', icon: <Shield size={16} /> },
                { value: 'organiser', label: 'Organizer', icon: <Shield size={16} /> },
                { value: 'rep', label: 'Rep', icon: <User size={16} /> },
                { value: 'attendee', label: 'Attendee', icon: <User size={16} /> },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg border text-sm transition-colors ${
                    role === option.value
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                      : 'border-[var(--card-border)] text-[var(--foreground-muted)] hover:border-[var(--foreground-subtle)]'
                  }`}
                >
                  {option.icon}
                  <span className="font-medium">{option.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-[var(--foreground-muted)]">
              {role === 'admin'
                ? 'Full access to admin panel and all events'
                : role === 'organiser'
                ? 'Check-in, announcements, leads, and analytics'
                : role === 'rep'
                ? 'Can capture leads and view event data'
                : 'Standard event participant'}
            </p>
          </div>

          {/* Event Assignment */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">
              Assign to Event
            </label>
            <div className="relative">
              <Calendar
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
              />
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)] appearance-none"
              >
                <option value="">No event (create account only)</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Badge Type (only if event selected) */}
          {eventId && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
                Event Badge Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BADGE_TYPES.map((bt) => (
                  <button
                    key={bt.value}
                    type="button"
                    onClick={() => setBadgeType(bt.value)}
                    className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                      badgeType === bt.value
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                        : 'border-[var(--card-border)] text-[var(--foreground-muted)] hover:border-[var(--foreground-subtle)]'
                    }`}
                  >
                    {bt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

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
              disabled={loading || !email || !fullName || !password}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
