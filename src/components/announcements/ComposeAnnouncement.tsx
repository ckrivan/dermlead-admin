'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { BADGE_TYPES } from '@/lib/api/attendees'
import { createAnnouncement, updateAnnouncement } from '@/lib/api/announcements'
import type { Announcement, EventGroup } from '@/types/database'
import { X, Send, Clock, Save } from 'lucide-react'

interface ComposeAnnouncementProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  editingAnnouncement: Announcement | null
  eventId: string
  badgeTypeCounts: Record<string, number>
  groups: EventGroup[]
  defaultSenderName: string
  defaultReplyEmail: string
}

type RecipientMode = 'all' | 'categories'

export function ComposeAnnouncement({
  isOpen,
  onClose,
  onSaved,
  editingAnnouncement,
  eventId,
  badgeTypeCounts,
  groups,
  defaultSenderName,
  defaultReplyEmail,
}: ComposeAnnouncementProps) {
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('all')
  const [selectedBadgeTypes, setSelectedBadgeTypes] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [senderName, setSenderName] = useState(defaultSenderName)
  const [replyToEmail, setReplyToEmail] = useState(defaultReplyEmail)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const totalAttendees = badgeTypeCounts._total || 0

  // Reset form when opening/closing or switching between edit/new
  useEffect(() => {
    if (isOpen) {
      if (editingAnnouncement) {
        setSubject(editingAnnouncement.title)
        setBody(editingAnnouncement.message)
        setSenderName(editingAnnouncement.sender_name || defaultSenderName)
        setReplyToEmail(editingAnnouncement.reply_to_email || defaultReplyEmail)
        setSelectedGroups(editingAnnouncement.target_groups || [])

        if (editingAnnouncement.target_badge_types && editingAnnouncement.target_badge_types.length > 0) {
          setRecipientMode('categories')
          setSelectedBadgeTypes(editingAnnouncement.target_badge_types)
        } else {
          setRecipientMode('all')
          setSelectedBadgeTypes([])
        }

        if (editingAnnouncement.scheduled_at) {
          setScheduleEnabled(true)
          // Convert to local datetime-local format
          const dt = new Date(editingAnnouncement.scheduled_at)
          setScheduledAt(toLocalDatetime(dt))
        } else {
          setScheduleEnabled(false)
          setScheduledAt('')
        }
      } else {
        setSubject('')
        setBody('')
        setSenderName(defaultSenderName)
        setReplyToEmail(defaultReplyEmail)
        setRecipientMode('all')
        setSelectedBadgeTypes([])
        setSelectedGroups([])
        setScheduleEnabled(false)
        setScheduledAt('')
      }
      setError('')
    }
  }, [isOpen, editingAnnouncement, defaultSenderName, defaultReplyEmail])

  function toLocalDatetime(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  function toggleBadgeType(value: string) {
    setSelectedBadgeTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  function toggleGroup(groupId: string) {
    setSelectedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    )
  }

  async function handleSave(sendNow: boolean) {
    if (!subject.trim() || !body.trim()) {
      setError('Subject and body are required.')
      return
    }
    if (!senderName.trim()) {
      setError('Sender name is required.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const payload = {
        event_id: eventId,
        title: subject.trim(),
        message: body.trim(),
        sender_name: senderName.trim(),
        reply_to_email: replyToEmail.trim() || null,
        target_badge_types: recipientMode === 'categories' && selectedBadgeTypes.length > 0
          ? selectedBadgeTypes
          : null,
        target_groups: selectedGroups.length > 0 ? selectedGroups : null,
        scheduled_at: !sendNow && scheduleEnabled && scheduledAt
          ? new Date(scheduledAt).toISOString()
          : null,
      }

      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, payload)
      } else {
        await createAnnouncement(payload)
      }

      onSaved()
      onClose()
    } catch (err) {
      console.error('Error saving announcement:', err)
      setError('Failed to save announcement.')
    } finally {
      setSaving(false)
    }
  }

  // Filter badge types to only show those with attendees in this event
  const availableBadgeTypes = BADGE_TYPES.filter(
    (bt) => (badgeTypeCounts[bt.value] || 0) > 0
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Slide-over panel */}
      <div className="relative ml-auto w-full max-w-2xl h-full bg-[var(--card-bg)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--card-border)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
              Compose Announcement
            </p>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              {editingAnnouncement ? 'Edit Announcement' : 'Start from scratch'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Recipients */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">
              Recipients <span className="text-[var(--accent-danger)]">*</span>
            </label>

            <div className="space-y-3">
              {/* All attendees */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="recipientMode"
                  checked={recipientMode === 'all'}
                  onChange={() => {
                    setRecipientMode('all')
                    setSelectedBadgeTypes([])
                  }}
                  className="w-4 h-4 accent-[var(--accent-primary)]"
                />
                <span className="text-sm text-[var(--foreground)]">
                  All attendees ({totalAttendees})
                </span>
              </label>

              {/* Specific categories */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="recipientMode"
                  checked={recipientMode === 'categories'}
                  onChange={() => setRecipientMode('categories')}
                  className="w-4 h-4 accent-[var(--accent-primary)]"
                />
                <span className="text-sm text-[var(--foreground)]">
                  Specific attendee category
                </span>
              </label>

              {/* Category checkboxes */}
              {recipientMode === 'categories' && (
                <div className="ml-7 grid grid-cols-3 gap-2">
                  {availableBadgeTypes.map((bt) => (
                    <label key={bt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBadgeTypes.includes(bt.value)}
                        onChange={() => toggleBadgeType(bt.value)}
                        className="w-4 h-4 rounded accent-[var(--accent-primary)]"
                      />
                      <span className="text-sm text-[var(--foreground)]">
                        {bt.label} ({badgeTypeCounts[bt.value] || 0})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Group targeting */}
            {groups.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-[var(--foreground-muted)] mb-2">
                  Additionally filter by group (optional)
                </p>
                <div className="flex flex-wrap gap-2">
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedGroups.includes(group.id)
                          ? 'text-white'
                          : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)]'
                      }`}
                      style={
                        selectedGroups.includes(group.id)
                          ? { backgroundColor: group.color || '#3b82f6' }
                          : undefined
                      }
                    >
                      {group.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sender name */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">
              Sender name <span className="text-[var(--accent-danger)]">*</span>
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
              placeholder="Your name"
            />
          </div>

          {/* Reply-to email */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">
              Reply-to-email
            </label>
            <input
              type="email"
              value={replyToEmail}
              onChange={(e) => setReplyToEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
              placeholder="you@example.com"
            />
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
              You will receive replies at this email address.
            </p>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">
              Subject <span className="text-[var(--accent-danger)]">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
              placeholder="Enter subject"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">
              Body <span className="text-[var(--accent-danger)]">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)] resize-none"
              placeholder="Write your announcement here..."
            />
          </div>

          {/* Schedule */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={scheduleEnabled}
                onChange={(e) => {
                  setScheduleEnabled(e.target.checked)
                  if (!e.target.checked) setScheduledAt('')
                }}
                className="w-4 h-4 rounded accent-[var(--accent-primary)]"
              />
              <span className="text-sm font-semibold text-[var(--foreground)]">
                Schedule for later
              </span>
            </label>

            {scheduleEnabled && (
              <div className="mt-3 ml-7">
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={toLocalDatetime(new Date())}
                  className="px-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                />
                <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                  The announcement will be sent automatically at the scheduled time.
                </p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-[var(--accent-danger)]">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--card-border)] flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            icon={<Save size={16} />}
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          {!scheduleEnabled ? (
            <Button
              icon={<Send size={16} />}
              onClick={() => handleSave(true)}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save & Send Now'}
            </Button>
          ) : (
            <Button
              icon={<Clock size={16} />}
              onClick={() => handleSave(false)}
              disabled={saving || !scheduledAt}
            >
              {saving ? 'Saving...' : 'Schedule'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
