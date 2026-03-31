'use client'

import { useState, useEffect } from 'react'
import { X, User, Shield, Calendar, Mail } from 'lucide-react'
import { Button } from '@/components/ui'
import { UserWithEmail, updateUser } from '@/lib/api/users'
import { getEvents } from '@/lib/api/events'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/types/database'

const BADGE_TYPES = [
  { value: 'attendee', label: 'Attendee' },
  { value: 'industry', label: 'Industry' },
  { value: 'speaker', label: 'Speaker' },
  { value: 'exhibitor', label: 'Exhibitor' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'organiser', label: 'Organiser' },
]

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserWithEmail | null
  onSuccess: () => void
}

export function EditUserModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: EditUserModalProps) {
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'admin' | 'organiser' | 'leadership' | 'rep' | 'attendee'>('rep')
  const [events, setEvents] = useState<Event[]>([])
  const [eventId, setEventId] = useState('')
  const [badgeType, setBadgeType] = useState('attendee')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && user) {
      setFullName(user.full_name || '')
      setRole((user.role as 'admin' | 'organiser' | 'leadership' | 'rep' | 'attendee') || 'rep')
      setIsActive(user.is_active !== false)
      getEvents().then(setEvents).catch(console.error)

      // Load user's current event assignment
      const loadAttendee = async () => {
        const supabase = createClient()
        const { data } = await supabase
          .from('attendees')
          .select('event_id, badge_type')
          .eq('profile_id', user.id)
          .limit(1)
          .maybeSingle()
        if (data) {
          setEventId(data.event_id)
          setBadgeType(data.badge_type || 'attendee')
        }
      }
      loadAttendee()
    }
  }, [isOpen, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setError('')
    setLoading(true)

    try {
      await updateUser(user.id, {
        full_name: fullName,
        role,
        is_active: isActive,
      })

      // Update badge type if event is selected
      if (eventId) {
        const supabase = createClient()
        await supabase
          .from('attendees')
          .update({ badge_type: badgeType })
          .eq('profile_id', user.id)
          .eq('event_id', eventId)
      }

      onSuccess()
      handleClose()
    } catch (err) {
      setError('Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError('')
    onClose()
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Edit User
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-[var(--card-border)] bg-[var(--background-secondary)]">
          <div className="flex items-center gap-3">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || ''}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center">
                <User size={24} className="text-[var(--accent-primary)]" />
              </div>
            )}
            <div>
              <p className="font-medium text-[var(--foreground)]">
                {user.full_name || 'Unnamed User'}
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">
              Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]" />
              <input
                type="email"
                value={user.email || ''}
                readOnly
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--input-border)] text-[var(--foreground-muted)] cursor-not-allowed"
              />
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">
              Full Name
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]" />
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
              Global Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {([
                { value: 'admin', label: 'Admin', icon: <Shield size={16} /> },
                { value: 'organiser', label: 'Organiser', icon: <Shield size={16} /> },
                { value: 'leadership', label: 'Leadership', icon: <Shield size={16} /> },
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
                : role === 'leadership'
                ? 'Announcements and moderation across events'
                : role === 'rep'
                ? 'Can capture leads and view event data'
                : 'Standard event participant'}
            </p>
          </div>

          {/* Event Assignment */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">
              Event Assignment
            </label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]" />
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)] appearance-none"
              >
                <option value="">No event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Badge Type */}
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

          {/* Active Status */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--card-border)]">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Account Active</p>
              <p className="text-xs text-[var(--foreground-muted)]">Deactivated users cannot sign in</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                isActive ? 'bg-[var(--accent-primary)]' : 'bg-[var(--background-tertiary)]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--card-bg)] rounded-full transition-transform ${
                  isActive ? 'translate-x-5' : ''
                }`}
              />
            </button>
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
              disabled={loading || !fullName}
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
