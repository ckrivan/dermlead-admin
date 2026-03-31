'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, Button } from '@/components/ui'
import { getAnnouncements, getBadgeTypeCounts, deleteAnnouncement, sendAnnouncement } from '@/lib/api/announcements'
import { getGroups } from '@/lib/api/groups'
import { BADGE_TYPES } from '@/lib/api/attendees'
import { ComposeAnnouncement } from '@/components/announcements/ComposeAnnouncement'
import { useEvent } from '@/contexts/EventContext'
import { useAuth } from '@/contexts/AuthContext'
import type { Announcement, EventGroup } from '@/types/database'
import { Plus, Megaphone, Edit, Trash2, Send, Clock, CheckCircle, Users, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function AnnouncementsPage() {
  const { selectedEvent } = useEvent()
  const { profile } = useAuth()
  const selectedEventId = selectedEvent?.id ?? ''

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [groups, setGroups] = useState<EventGroup[]>([])
  const [badgeTypeCounts, setBadgeTypeCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [showCompose, setShowCompose] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [sending, setSending] = useState<string | null>(null)

  async function loadData() {
    if (!selectedEventId) {
      setAnnouncements([])
      setGroups([])
      setBadgeTypeCounts({})
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [announcementsData, groupsData, counts] = await Promise.all([
        getAnnouncements(selectedEventId),
        getGroups(selectedEventId),
        getBadgeTypeCounts(selectedEventId),
      ])
      setAnnouncements(announcementsData)
      setGroups(groupsData)
      setBadgeTypeCounts(counts)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false // eslint-disable-line prefer-const
    async function fetchData() {
      if (!selectedEventId) {
        setAnnouncements([])
        setGroups([])
        setBadgeTypeCounts({})
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const [announcementsData, groupsData, counts] = await Promise.all([
          getAnnouncements(selectedEventId),
          getGroups(selectedEventId),
          getBadgeTypeCounts(selectedEventId),
        ])
        if (cancelled) return
        setAnnouncements(announcementsData)
        setGroups(groupsData)
        setBadgeTypeCounts(counts)
      } catch (error) {
        if (cancelled) return
        console.error('Error loading data:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [selectedEventId])

  const handleOpenCompose = (announcement?: Announcement) => {
    setEditingAnnouncement(announcement || null)
    setShowCompose(true)
  }

  const handleDelete = async (announcement: Announcement) => {
    if (!confirm(`Delete announcement "${announcement.title}"?`)) return

    try {
      await deleteAnnouncement(announcement.id)
      await loadData()
    } catch (error) {
      console.error('Error deleting announcement:', error)
    }
  }

  const handleSend = async (announcement: Announcement) => {
    const targetDesc = getTargetDescription(announcement)
    if (!confirm(`Send "${announcement.title}" to ${targetDesc}?`)) return

    setSending(announcement.id)
    try {
      const { pushResult } = await sendAnnouncement(announcement.id)
      await loadData()

      if (pushResult?.error) {
        alert(`Announcement saved but push failed: ${pushResult.error}`)
      } else if (pushResult) {
        alert(`Push sent to ${pushResult.sent}/${pushResult.total} devices`)
      }
    } catch (error) {
      console.error('Error sending announcement:', error)
      alert(`Error sending announcement: ${error}`)
    } finally {
      setSending(null)
    }
  }

  function getTargetDescription(announcement: Announcement): string {
    const parts: string[] = []

    if (announcement.target_badge_types && announcement.target_badge_types.length > 0) {
      const labels = announcement.target_badge_types
        .map((bt) => BADGE_TYPES.find((t) => t.value === bt)?.label || bt)
      parts.push(labels.join(', '))
    }

    if (announcement.target_groups && announcement.target_groups.length > 0) {
      const groupNames = announcement.target_groups
        .map((id) => groups.find((g) => g.id === id)?.name)
        .filter(Boolean)
      if (groupNames.length > 0) parts.push(groupNames.join(', '))
    }

    if (parts.length === 0) return 'All Attendees'
    return parts.join(' + ')
  }

  const scheduledAnnouncements = announcements.filter((a) => !a.sent_at && a.scheduled_at)
  const draftAnnouncements = announcements.filter((a) => !a.sent_at && !a.scheduled_at)
  const sentAnnouncements = announcements.filter((a) => a.sent_at)

  const defaultSenderName = profile?.full_name || ''
  const defaultReplyEmail = profile?.email || ''

  return (
    <>
      <Header title="Announcements" subtitle="Send push notifications to attendees" />

      <div className="p-4 md:p-6 space-y-6">
        {/* Actions */}
        <div className="flex items-center justify-between">
          {selectedEvent && (
            <p className="text-sm text-[var(--foreground-muted)]">
              {selectedEvent.name}
            </p>
          )}
          <Button
            icon={<Plus size={18} />}
            onClick={() => handleOpenCompose()}
            disabled={!selectedEventId}
          >
            New Announcement
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
          </div>
        ) : !selectedEventId ? (
          <Card>
            <CardBody className="text-center py-12">
              <Megaphone size={48} className="mx-auto text-[var(--foreground-subtle)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                No event selected
              </h3>
              <p className="text-[var(--foreground-muted)]">
                Select an event from the sidebar to manage announcements.
              </p>
            </CardBody>
          </Card>
        ) : announcements.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <Megaphone size={48} className="mx-auto text-[var(--foreground-subtle)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                No announcements yet
              </h3>
              <p className="text-[var(--foreground-muted)] mb-4">
                Create announcements to notify attendees about updates, schedule changes, or important information.
              </p>
              <Button icon={<Plus size={18} />} onClick={() => handleOpenCompose()}>
                Create First Announcement
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Scheduled */}
            {scheduledAnnouncements.length > 0 && (
              <Section
                title="Scheduled"
                icon={<Calendar size={20} className="text-blue-500" />}
                count={scheduledAnnouncements.length}
              >
                {scheduledAnnouncements.map((a) => (
                  <AnnouncementCard
                    key={a.id}
                    announcement={a}
                    groups={groups}
                    sending={sending === a.id}
                    onEdit={() => handleOpenCompose(a)}
                    onDelete={() => handleDelete(a)}
                    onSend={() => handleSend(a)}
                  />
                ))}
              </Section>
            )}

            {/* Drafts */}
            {draftAnnouncements.length > 0 && (
              <Section
                title="Drafts"
                icon={<Clock size={20} className="text-[var(--foreground-muted)]" />}
                count={draftAnnouncements.length}
              >
                {draftAnnouncements.map((a) => (
                  <AnnouncementCard
                    key={a.id}
                    announcement={a}
                    groups={groups}
                    sending={sending === a.id}
                    onEdit={() => handleOpenCompose(a)}
                    onDelete={() => handleDelete(a)}
                    onSend={() => handleSend(a)}
                  />
                ))}
              </Section>
            )}

            {/* Sent */}
            {sentAnnouncements.length > 0 && (
              <Section
                title="Sent"
                icon={<CheckCircle size={20} className="text-green-500" />}
                count={sentAnnouncements.length}
              >
                {sentAnnouncements.map((a) => (
                  <AnnouncementCard
                    key={a.id}
                    announcement={a}
                    groups={groups}
                    isSent
                    onDelete={() => handleDelete(a)}
                  />
                ))}
              </Section>
            )}
          </div>
        )}
      </div>

      {/* Compose slide-over */}
      <ComposeAnnouncement
        isOpen={showCompose}
        onClose={() => {
          setShowCompose(false)
          setEditingAnnouncement(null)
        }}
        onSaved={loadData}
        editingAnnouncement={editingAnnouncement}
        eventId={selectedEventId}
        badgeTypeCounts={badgeTypeCounts}
        groups={groups}
        defaultSenderName={defaultSenderName}
        defaultReplyEmail={defaultReplyEmail}
      />
    </>
  )
}

function Section({
  title,
  icon,
  count,
  children,
}: {
  title: string
  icon: React.ReactNode
  count: number
  children: React.ReactNode
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
        {icon}
        {title} ({count})
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

const BADGE_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  attendee: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  industry: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
  speaker: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
  exhibitor: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300' },
  sponsor: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' },
  leader: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  staff: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-300' },
  vip: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300' },
  press: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' },
}

function AudienceBadges({
  announcement,
  groups,
}: {
  announcement: Announcement
  groups: EventGroup[]
}) {
  const hasBadgeTypes = announcement.target_badge_types && announcement.target_badge_types.length > 0
  const hasGroups = announcement.target_groups && announcement.target_groups.length > 0

  if (!hasBadgeTypes && !hasGroups) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-300">
        <Users size={11} />
        All Attendees
      </span>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {hasBadgeTypes && announcement.target_badge_types!.map((bt) => {
        const label = BADGE_TYPES.find((t) => t.value === bt)?.label || bt
        const colors = BADGE_TYPE_COLORS[bt] || BADGE_TYPE_COLORS.attendee
        return (
          <span
            key={bt}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
          >
            {label}
          </span>
        )
      })}
      {hasGroups && announcement.target_groups!.map((id) => {
        const group = groups.find((g) => g.id === id)
        if (!group) return null
        return (
          <span
            key={id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-300"
          >
            {group.name}
          </span>
        )
      })}
    </div>
  )
}

function AnnouncementCard({
  announcement,
  groups,
  isSent,
  sending,
  onEdit,
  onDelete,
  onSend,
}: {
  announcement: Announcement
  groups: EventGroup[]
  isSent?: boolean
  sending?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onSend?: () => void
}) {
  return (
    <Card hover={!isSent}>
      <CardBody className={isSent ? 'opacity-75' : undefined}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold text-[var(--foreground)]">
                {announcement.title}
              </h3>
              <AudienceBadges announcement={announcement} groups={groups} />
            </div>
            <p className="text-sm text-[var(--foreground-muted)] mt-1 line-clamp-2">
              {announcement.message}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[var(--foreground-subtle)]">
              {announcement.sender_name && (
                <span>From: {announcement.sender_name}</span>
              )}
              {announcement.scheduled_at && !isSent && (
                <span className="flex items-center gap-1 text-blue-500">
                  <Calendar size={12} />
                  Scheduled {format(parseISO(announcement.scheduled_at), 'MMM d, h:mm a')}
                </span>
              )}
              {isSent && announcement.sent_at && (
                <span className="text-green-600">
                  Sent {format(parseISO(announcement.sent_at), 'MMM d, h:mm a')}
                </span>
              )}
              {!isSent && !announcement.scheduled_at && (
                <span>
                  Created {format(parseISO(announcement.created_at), 'MMM d, h:mm a')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isSent && onSend && (
              <Button
                variant="primary"
                size="sm"
                icon={sending ? undefined : <Send size={16} />}
                onClick={onSend}
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send'}
              </Button>
            )}
            {!isSent && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Edit size={16} />}
                onClick={onEdit}
              />
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 size={16} />}
                className="text-[var(--accent-danger)]"
                onClick={onDelete}
              />
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
