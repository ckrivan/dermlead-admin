'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, Button } from '@/components/ui'
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, sendAnnouncement } from '@/lib/api/announcements'
import { getGroups } from '@/lib/api/groups'
import { getEvents } from '@/lib/api/events'
import type { Announcement, AttendeeGroup, Event } from '@/types/database'
import { isAbortError } from '@/contexts/EventContext'
import { Plus, Megaphone, Edit, Trash2, Send, X, Clock, CheckCircle, Users } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [groups, setGroups] = useState<AttendeeGroup[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target_groups: [] as string[],
    scheduled_at: '',
  })

  useEffect(() => {
    let cancelled = false
    async function loadEvents() {
      try {
        const data = await getEvents()
        if (cancelled) return
        setEvents(data)
        if (data.length > 0) {
          setSelectedEventId(data[0].id)
        }
      } catch (err: unknown) {
        if (cancelled) return
        if (isAbortError(err)) return
        console.error('Error loading events:', err)
      }
    }
    loadEvents()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    async function loadData() {
      if (!selectedEventId) {
        setAnnouncements([])
        setGroups([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const [announcementsData, groupsData] = await Promise.all([
          getAnnouncements(selectedEventId),
          getGroups(selectedEventId),
        ])
        setAnnouncements(announcementsData)
        setGroups(groupsData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedEventId])

  const handleOpenModal = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement)
      setFormData({
        title: announcement.title,
        message: announcement.message,
        target_groups: announcement.target_groups || [],
        scheduled_at: announcement.scheduled_at || '',
      })
    } else {
      setEditingAnnouncement(null)
      setFormData({ title: '', message: '', target_groups: [], scheduled_at: '' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingAnnouncement(null)
    setFormData({ title: '', message: '', target_groups: [], scheduled_at: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEventId || !formData.title.trim() || !formData.message.trim()) return

    try {
      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, {
          title: formData.title.trim(),
          message: formData.message.trim(),
          target_groups: formData.target_groups.length > 0 ? formData.target_groups : null,
          scheduled_at: formData.scheduled_at || null,
        })
      } else {
        await createAnnouncement({
          event_id: selectedEventId,
          title: formData.title.trim(),
          message: formData.message.trim(),
          target_groups: formData.target_groups.length > 0 ? formData.target_groups : null,
          scheduled_at: formData.scheduled_at || null,
        })
      }

      const data = await getAnnouncements(selectedEventId)
      setAnnouncements(data)
      handleCloseModal()
    } catch (error) {
      console.error('Error saving announcement:', error)
    }
  }

  const handleDelete = async (announcement: Announcement) => {
    if (!confirm(`Delete announcement "${announcement.title}"?`)) return

    try {
      await deleteAnnouncement(announcement.id)
      const data = await getAnnouncements(selectedEventId)
      setAnnouncements(data)
    } catch (error) {
      console.error('Error deleting announcement:', error)
    }
  }

  const handleSend = async (announcement: Announcement) => {
    if (!confirm(`Send "${announcement.title}" to ${announcement.target_groups?.length ? 'selected groups' : 'all attendees'}?`)) return

    setSending(announcement.id)
    try {
      await sendAnnouncement(announcement.id)
      const data = await getAnnouncements(selectedEventId)
      setAnnouncements(data)
    } catch (error) {
      console.error('Error sending announcement:', error)
    } finally {
      setSending(null)
    }
  }

  const toggleGroup = (groupId: string) => {
    setFormData((prev) => ({
      ...prev,
      target_groups: prev.target_groups.includes(groupId)
        ? prev.target_groups.filter((id) => id !== groupId)
        : [...prev.target_groups, groupId],
    }))
  }

  const getGroupNames = (groupIds: string[] | null) => {
    if (!groupIds || groupIds.length === 0) return 'All Attendees'
    return groupIds
      .map((id) => groups.find((g) => g.id === id)?.name)
      .filter(Boolean)
      .join(', ')
  }

  const sentAnnouncements = announcements.filter((a) => a.sent_at)
  const draftAnnouncements = announcements.filter((a) => !a.sent_at)

  return (
    <>
      <Header title="Announcements" subtitle="Send push notifications to attendees" />

      <div className="p-6 space-y-6">
        {/* Event Selector & Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="text-sm text-[var(--foreground-muted)]">Event:</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
            >
              <option value="">Select an event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            icon={<Plus size={18} />}
            onClick={() => handleOpenModal()}
            disabled={!selectedEventId}
          >
            New Announcement
          </Button>
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
          </div>
        ) : announcements.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <Megaphone size={48} className="mx-auto text-[var(--foreground-subtle)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                No announcements yet
              </h3>
              <p className="text-[var(--foreground-muted)] mb-4">
                {selectedEventId
                  ? 'Create announcements to notify attendees about updates, schedule changes, or important information.'
                  : 'Select an event to manage its announcements.'}
              </p>
              {selectedEventId && (
                <Button icon={<Plus size={18} />} onClick={() => handleOpenModal()}>
                  Create First Announcement
                </Button>
              )}
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Draft Announcements */}
            {draftAnnouncements.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-[var(--foreground-muted)]" />
                  Drafts ({draftAnnouncements.length})
                </h2>
                <div className="space-y-3">
                  {draftAnnouncements.map((announcement) => (
                    <Card key={announcement.id} hover>
                      <CardBody>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-[var(--foreground)]">
                              {announcement.title}
                            </h3>
                            <p className="text-sm text-[var(--foreground-muted)] mt-1 line-clamp-2">
                              {announcement.message}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-[var(--foreground-subtle)]">
                              <span className="flex items-center gap-1">
                                <Users size={12} />
                                {getGroupNames(announcement.target_groups)}
                              </span>
                              <span>
                                Created {format(parseISO(announcement.created_at), 'MMM d, h:mm a')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              icon={sending === announcement.id ? undefined : <Send size={16} />}
                              onClick={() => handleSend(announcement)}
                              disabled={sending === announcement.id}
                            >
                              {sending === announcement.id ? 'Sending...' : 'Send'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Edit size={16} />}
                              onClick={() => handleOpenModal(announcement)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 size={16} />}
                              className="text-[var(--accent-danger)]"
                              onClick={() => handleDelete(announcement)}
                            />
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Sent Announcements */}
            {sentAnnouncements.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                  <CheckCircle size={20} className="text-green-500" />
                  Sent ({sentAnnouncements.length})
                </h2>
                <div className="space-y-3">
                  {sentAnnouncements.map((announcement) => (
                    <Card key={announcement.id}>
                      <CardBody className="opacity-75">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-[var(--foreground)]">
                              {announcement.title}
                            </h3>
                            <p className="text-sm text-[var(--foreground-muted)] mt-1 line-clamp-2">
                              {announcement.message}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-[var(--foreground-subtle)]">
                              <span className="flex items-center gap-1">
                                <Users size={12} />
                                {getGroupNames(announcement.target_groups)}
                              </span>
                              <span className="text-green-600">
                                Sent {format(parseISO(announcement.sent_at!), 'MMM d, h:mm a')}
                              </span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={16} />}
                            className="text-[var(--accent-danger)]"
                            onClick={() => handleDelete(announcement)}
                          />
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Announcement Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
              <h3 className="font-semibold text-[var(--foreground)]">
                {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                    placeholder="e.g., Schedule Update"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Message *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)] resize-none"
                    rows={4}
                    placeholder="Enter your announcement message..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Target Audience
                  </label>
                  {groups.length === 0 ? (
                    <p className="text-sm text-[var(--foreground-muted)]">
                      No groups available. Create groups first to target specific audiences.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-[var(--foreground-muted)] mb-2">
                        Select groups or leave empty to send to all attendees
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {groups.map((group) => (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => toggleGroup(group.id)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                              formData.target_groups.includes(group.id)
                                ? 'text-white'
                                : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)]'
                            }`}
                            style={
                              formData.target_groups.includes(group.id)
                                ? { backgroundColor: group.color || '#3b82f6' }
                                : undefined
                            }
                          >
                            {group.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 p-4 border-t border-[var(--card-border)]">
                <Button type="button" variant="ghost" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAnnouncement ? 'Save Changes' : 'Create Announcement'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
