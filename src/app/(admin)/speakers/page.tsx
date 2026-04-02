'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, Button } from '@/components/ui'
import { getSpeakers, bulkCreateSpeakers, deleteSpeaker } from '@/lib/api/speakers'
import { updateAttendee, uploadAttendeePhoto, syncAttendeeToSpeaker } from '@/lib/api/attendees'
import { getGroups, getAllEntityGroupMemberships } from '@/lib/api/groups'
import { parseCSV, generateSpeakerTemplate, downloadCSV, SpeakerCSVRow } from '@/lib/utils/csv'
import { GroupAssignment } from '@/components/GroupAssignment'
import type { Speaker, EventGroup } from '@/types/database'
import { useEvent } from '@/contexts/EventContext'
import { Plus, User, Mail, Building, Edit, Trash2, Upload, Download, X, Send, CheckSquare, Square, Tag } from 'lucide-react'
import { sendBulkMessage } from '@/lib/api/speaker-messages'

export default function SpeakersPage() {
  const { selectedEvent, events, setSelectedEvent } = useEvent()
  const selectedEventId = selectedEvent?.id ?? ''
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [groups, setGroups] = useState<EventGroup[]>([])
  const [speakerGroupMap, setSpeakerGroupMap] = useState<Record<string, EventGroup[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Messaging state
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedSpeakers, setSelectedSpeakers] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [sending, setSending] = useState(false)
  const [messageData, setMessageData] = useState({
    sender_name: '',
    sender_email: '',
    subject: '',
    message: '',
  })
  const [messageResult, setMessageResult] = useState<{ sent: number; errors: string[] } | null>(null)
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [organisers, setOrganisers] = useState<{id: string, first_name: string, last_name: string, email: string, badge_type: string}[]>([])

  // Attendee-speaker edit state (for speakers with attendee_id — source of truth is the attendee)
  const [editingAS, setEditingAS] = useState<Speaker | null>(null)
  const [asForm, setAsForm] = useState({ first_name: '', last_name: '', credentials: '', institution: '', specialty: '', bio: '' })
  const [asPhotoFile, setAsPhotoFile] = useState<File | null>(null)
  const [asPhotoPreview, setAsPhotoPreview] = useState<string | null>(null)
  const [asSaving, setAsSaving] = useState(false)
  const asFileInputRef = useRef<HTMLInputElement>(null)

  // Derive user-facing badges from role array
  // Faculty is internal — faculty-only people are "Speakers"
  const getDerivedBadges = (roles: string[]): string[] => {
    const badges: string[] = []
    if (roles.includes('leader')) badges.push('leader')
    if (roles.includes('organiser')) badges.push('organizer')
    if (roles.includes('speaker') || roles.includes('faculty')) badges.push('speaker')
    return badges
  }


  useEffect(() => {
    async function loadSpeakers() {
      if (!selectedEventId) {
        setSpeakers([])
        setGroups([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const [speakersData, groupsData, organisersResult] = await Promise.all([
          getSpeakers(selectedEventId),
          getGroups(selectedEventId),
          supabase.from('attendees').select('id, first_name, last_name, email, badge_type').eq('event_id', selectedEventId).eq('badge_type', 'organiser'),
        ])
        setSpeakers(speakersData)
        setOrganisers(organisersResult.data || [])
        setGroups(groupsData)
        const groupMemberships = await getAllEntityGroupMemberships('speaker', selectedEventId, groupsData)
        setSpeakerGroupMap(groupMemberships)
      } catch (err) {
        console.error('Error loading speakers:', err)
        setError('Failed to load speakers. Check your connection and try again.')
      } finally {
        setLoading(false)
      }
    }
    loadSpeakers()
  }, [selectedEventId])

  const handleDownloadTemplate = () => {
    const template = generateSpeakerTemplate()
    downloadCSV(template, 'speakers_template.csv')
  }

  const toggleSpeakerSelection = (speakerId: string) => {
    const newSelected = new Set(selectedSpeakers)
    if (newSelected.has(speakerId)) {
      newSelected.delete(speakerId)
    } else {
      newSelected.add(speakerId)
    }
    setSelectedSpeakers(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedSpeakers.size === speakers.length) {
      setSelectedSpeakers(new Set())
    } else {
      setSelectedSpeakers(new Set(speakers.map((s) => s.id)))
    }
  }

  const handleSendMessage = async () => {
    if (!selectedEventId || selectedSpeakers.size === 0) return
    if (!messageData.subject.trim() || !messageData.message.trim()) return

    setSending(true)
    setMessageResult(null)

    try {
      const result = await sendBulkMessage(
        selectedEventId,
        Array.from(selectedSpeakers),
        {
          sender_name: messageData.sender_name.trim() || 'Event Organizer',
          sender_email: messageData.sender_email.trim() || 'organizer@event.com',
          subject: messageData.subject.trim(),
          message: messageData.message.trim(),
        }
      )
      setMessageResult(result)

      if (result.sent > 0) {
        // Reset selection after successful send
        setSelectedSpeakers(new Set())
        setSelectMode(false)
        setMessageData({
          sender_name: '',
          sender_email: '',
          subject: '',
          message: '',
        })
      }
    } catch (error) {
      console.error('Error sending messages:', error)
      setMessageResult({ sent: 0, errors: ['Failed to send messages'] })
    } finally {
      setSending(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedEventId) return

    setImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      const rows = parseCSV<SpeakerCSVRow>(text)

      if (rows.length === 0) {
        setImportResult({ created: 0, errors: ['No valid rows found in CSV'] })
        return
      }

      const result = await bulkCreateSpeakers(selectedEventId, rows)
      setImportResult(result)

      // Reload speakers if any were created
      if (result.created > 0) {
        const data = await getSpeakers(selectedEventId)
        setSpeakers(data)
      }
    } catch (error) {
      console.error('Error importing CSV:', error)
      setImportResult({ created: 0, errors: ['Failed to parse CSV file'] })
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const openEditAS = (speaker: Speaker) => {
    if (!speaker.attendee_id) return
    setEditingAS(speaker)
    const nameParts = speaker.full_name.split(' ')
    setAsForm({
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      credentials: speaker.credentials || '',
      institution: speaker.institution || '',
      specialty: speaker.specialty || '',
      bio: speaker.bio || '',
    })
    setAsPhotoPreview(speaker.photo_url || null)
    setAsPhotoFile(null)
  }

  const handleSaveAS = async () => {
    if (!editingAS?.attendee_id || !selectedEventId) return
    setAsSaving(true)
    try {
      let photoUrl = editingAS.photo_url
      if (asPhotoFile) {
        photoUrl = await uploadAttendeePhoto(editingAS.attendee_id, asPhotoFile)
      }
      // Update attendee (source of truth)
      await updateAttendee(editingAS.attendee_id, {
        first_name: asForm.first_name,
        last_name: asForm.last_name,
        credentials: asForm.credentials || null,
        institution: asForm.institution || null,
        specialty: asForm.specialty || null,
        bio: asForm.bio || null,
        photo_url: photoUrl,
      })
      // Sync to linked speaker record
      await syncAttendeeToSpeaker(editingAS.attendee_id, {
        first_name: asForm.first_name,
        last_name: asForm.last_name,
        credentials: asForm.credentials || null,
        institution: asForm.institution || null,
        specialty: asForm.specialty || null,
        email: editingAS.email,
        bio: asForm.bio || null,
        photo_url: photoUrl,
        event_id: selectedEventId,
      })
      // Refetch speakers
      const speakersData = await getSpeakers(selectedEventId)
      setSpeakers(speakersData)
      setEditingAS(null)
    } catch (error) {
      console.error('Error saving attendee-speaker:', error)
      alert('Failed to save changes')
    } finally {
      setAsSaving(false)
    }
  }

  return (
    <>
      <Header
        title="Faculty"
        subtitle="Manage faculty for your events"
      />

      <div className="p-4 md:p-6 space-y-6">
        {/* Event Selector & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="text-sm text-[var(--foreground-muted)]">
              Event:
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => {
                const ev = events.find((evt) => evt.id === e.target.value)
                if (ev) setSelectedEvent(ev)
              }}
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

          <div className="flex items-center gap-2">
            {speakers.length > 0 && (
              <>
                <Button
                  variant={selectMode ? 'primary' : 'secondary'}
                  icon={selectMode ? <CheckSquare size={18} /> : <Square size={18} />}
                  onClick={() => {
                    setSelectMode(!selectMode)
                    if (selectMode) setSelectedSpeakers(new Set())
                  }}
                  disabled={!selectedEventId}
                >
                  {selectMode ? `${selectedSpeakers.size} Selected` : 'Select'}
                </Button>
                {selectMode && selectedSpeakers.size > 0 && (
                  <Button
                    variant="primary"
                    icon={<Send size={18} />}
                    onClick={() => setShowMessageModal(true)}
                  >
                    Message ({selectedSpeakers.size})
                  </Button>
                )}
              </>
            )}
            <Button
              variant="secondary"
              icon={<Upload size={18} />}
              onClick={() => setShowImportModal(true)}
              disabled={!selectedEventId}
            >
              Import CSV
            </Button>
            <Link href={`/speakers/new?eventId=${selectedEventId}`}>
              <Button icon={<Plus size={18} />} disabled={!selectedEventId}>
                Add Speaker
              </Button>
            </Link>
          </div>
        </div>

        {/* Role Filter Tabs */}
        {speakers.length > 0 && (
          <div className="flex items-center gap-1 bg-[var(--background-secondary)] rounded-lg p-1 w-fit overflow-x-auto">
            {[
              { value: 'all', label: 'All' },
              { value: 'speaker', label: 'Speakers' },
              { value: 'leader', label: 'Leaders' },
              { value: 'organizer', label: 'Organizers' },
            ].map((tab) => {
              const count = tab.value === 'all'
                ? speakers.length
                : tab.value === 'organizer'
                ? organisers.length
                : speakers.filter((s) => getDerivedBadges(s.role || ['faculty']).includes(tab.value)).length
              if (tab.value !== 'all' && tab.value !== 'organizer' && count === 0) return null
              return (
                <button
                  key={tab.value}
                  onClick={() => setRoleFilter(tab.value)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    roleFilter === tab.value
                      ? 'bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {tab.label} ({count})
                </button>
              )
            })}
          </div>
        )}

        {/* Speakers Grid */}
        {error ? (
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-[var(--accent-danger)] mb-4">{error}</p>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </CardBody>
          </Card>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
          </div>
        ) : speakers.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <User
                size={48}
                className="mx-auto text-[var(--foreground-subtle)] mb-4"
              />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                No speakers yet
              </h3>
              <p className="text-[var(--foreground-muted)] mb-4">
                {selectedEventId
                  ? 'Add speakers to build your event agenda.'
                  : 'Select an event to view its speakers.'}
              </p>
              {selectedEventId && (
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="secondary"
                    icon={<Upload size={18} />}
                    onClick={() => setShowImportModal(true)}
                  >
                    Import from CSV
                  </Button>
                  <Link href={`/speakers/new?eventId=${selectedEventId}`}>
                    <Button icon={<Plus size={18} />}>Add Speaker</Button>
                  </Link>
                </div>
              )}
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectMode && speakers.length > 0 && (
              <div className="col-span-full flex items-center gap-2 mb-2">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                >
                  {selectedSpeakers.size === speakers.length ? (
                    <CheckSquare size={18} className="text-[var(--accent-primary)]" />
                  ) : (
                    <Square size={18} />
                  )}
                  {selectedSpeakers.size === speakers.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            )}
            {/* Organisers from attendees table */}
            {roleFilter === 'organizer' && organisers.map((org) => (
              <Card key={org.id}>
                <CardBody>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                        <span className="text-teal-700 font-bold text-sm">
                          {(org.first_name?.[0] || '') + (org.last_name?.[0] || '')}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--foreground)] truncate">
                        {org.first_name} {org.last_name}
                      </h3>
                      <p className="text-sm text-[var(--foreground-muted)] truncate">{org.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                        Organiser
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
            {/* Speakers/Leaders from speakers table */}
            {roleFilter !== 'organizer' && speakers
              .filter((s) => roleFilter === 'all' || getDerivedBadges(s.role || ['faculty']).includes(roleFilter))
              .map((speaker) => (
              <Card
                key={speaker.id}
                hover
                className={selectMode && selectedSpeakers.has(speaker.id) ? 'ring-2 ring-[var(--accent-primary)]' : ''}
              >
                <CardBody>
                  <div className="flex items-start gap-4">
                    {/* Selection Checkbox */}
                    {selectMode && (
                      <button
                        onClick={() => toggleSpeakerSelection(speaker.id)}
                        className="flex-shrink-0 mt-1"
                      >
                        {selectedSpeakers.has(speaker.id) ? (
                          <CheckSquare size={20} className="text-[var(--accent-primary)]" />
                        ) : (
                          <Square size={20} className="text-[var(--foreground-muted)]" />
                        )}
                      </button>
                    )}
                    {/* Photo */}
                    <div className="flex-shrink-0">
                      {speaker.photo_url ? (
                        <img
                          src={speaker.photo_url}
                          alt={speaker.full_name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center">
                          <User
                            size={24}
                            className="text-[var(--foreground-subtle)]"
                          />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--foreground)] truncate">
                        {speaker.full_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {speaker.credentials && (
                          <span className="text-sm text-[var(--accent-primary)]">
                            {speaker.credentials}
                          </span>
                        )}
                        {getDerivedBadges(speaker.role || ['faculty']).map((badge) => (
                          <span key={badge} className={`text-xs px-1.5 py-0.5 rounded-full ${
                            badge === 'speaker'
                              ? 'bg-purple-500/15 text-purple-400'
                              : badge === 'leader'
                              ? 'bg-blue-500/15 text-blue-400'
                              : badge === 'organizer'
                              ? 'bg-teal-500/15 text-teal-400'
                              : 'bg-gray-500/15 text-gray-400'
                          }`}>
                            {badge === 'speaker' ? 'Speaker' : badge === 'leader' ? 'Leader' : badge === 'organizer' ? 'Organizer' : badge}
                          </span>
                        ))}
                      </div>
                      {speaker.institution && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-[var(--foreground-muted)]">
                          <Building size={14} />
                          <span className="truncate">{speaker.institution}</span>
                        </div>
                      )}
                      {speaker.email && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-[var(--foreground-muted)]">
                          <Mail size={14} />
                          <span className="truncate">{speaker.email}</span>
                        </div>
                      )}
                      {/* Groups */}
                      <div className="flex items-center gap-1 mt-2">
                        <Tag size={14} className="text-[var(--foreground-muted)] flex-shrink-0" />
                        <GroupAssignment
                          entityType="speaker"
                          entityId={speaker.id}
                          eventId={selectedEventId}
                          availableGroups={groups}
                          initialGroups={speakerGroupMap[speaker.id] || []}
                          compact={true}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--card-border)]">
                    <Link
                      href={`/speakers/${speaker.id}/edit`}
                      className="flex-1"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit size={16} />}
                        className="w-full"
                      >
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 size={16} />}
                      className="text-[var(--accent-danger)]"
                      onClick={async () => {
                        if (!confirm(`Delete ${speaker.full_name}?`)) return
                        try {
                          await deleteSpeaker(speaker.id)
                          setSpeakers(speakers.filter(s => s.id !== speaker.id))
                        } catch (e) {
                          console.error('Error deleting speaker:', e)
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Attendee-Speaker Edit Modal */}
      {editingAS && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
              <h3 className="font-semibold text-lg text-[var(--foreground)]">Edit Speaker Profile</h3>
              <button onClick={() => setEditingAS(null)} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Photo */}
              <div className="flex flex-col items-center gap-3">
                {(asPhotoPreview || editingAS.photo_url) ? (
                  <img src={asPhotoPreview || editingAS.photo_url || ''} alt="Photo" className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center">
                    <User size={32} className="text-[var(--foreground-subtle)]" />
                  </div>
                )}
                <input
                  ref={asFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setAsPhotoFile(file)
                      const reader = new FileReader()
                      reader.onloadend = () => setAsPhotoPreview(reader.result as string)
                      reader.readAsDataURL(file)
                    }
                  }}
                />
                <Button variant="secondary" size="sm" onClick={() => asFileInputRef.current?.click()}>
                  {editingAS.photo_url || asPhotoFile ? 'Change Photo' : 'Upload Photo'}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">First Name</label>
                  <input type="text" value={asForm.first_name} onChange={(e) => setAsForm({ ...asForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Last Name</label>
                  <input type="text" value={asForm.last_name} onChange={(e) => setAsForm({ ...asForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Credentials</label>
                  <input type="text" value={asForm.credentials} onChange={(e) => setAsForm({ ...asForm, credentials: e.target.value })} placeholder="MD, PA-C, NP..."
                    className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Specialty</label>
                  <input type="text" value={asForm.specialty} onChange={(e) => setAsForm({ ...asForm, specialty: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Institution</label>
                <input type="text" value={asForm.institution} onChange={(e) => setAsForm({ ...asForm, institution: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Bio</label>
                <textarea value={asForm.bio} onChange={(e) => setAsForm({ ...asForm, bio: e.target.value })} rows={4} placeholder="Speaker biography..."
                  className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm resize-y" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-[var(--card-border)]">
              <Button variant="secondary" onClick={() => setEditingAS(null)}>Cancel</Button>
              <Button onClick={handleSaveAS} disabled={asSaving || !asForm.first_name.trim() || !asForm.last_name.trim()}>
                {asSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
              <h3 className="font-semibold text-[var(--foreground)]">
                Message {selectedSpeakers.size} Speaker{selectedSpeakers.size !== 1 ? 's' : ''}
              </h3>
              <button
                onClick={() => {
                  setShowMessageModal(false)
                  setMessageResult(null)
                }}
                className="p-1 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--foreground-muted)] mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={messageData.sender_name}
                    onChange={(e) =>
                      setMessageData({ ...messageData, sender_name: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                    placeholder="Event Organizer"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--foreground-muted)] mb-1">
                    Your Email
                  </label>
                  <input
                    type="email"
                    value={messageData.sender_email}
                    onChange={(e) =>
                      setMessageData({ ...messageData, sender_email: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                    placeholder="organizer@event.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={messageData.subject}
                  onChange={(e) =>
                    setMessageData({ ...messageData, subject: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                  placeholder="Important information about your session"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-1">
                  Message *
                </label>
                <textarea
                  value={messageData.message}
                  onChange={(e) =>
                    setMessageData({ ...messageData, message: e.target.value })
                  }
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)] resize-none"
                  placeholder="Write your message to the speakers..."
                />
              </div>

              {/* Selected speakers preview */}
              <div className="bg-[var(--background-secondary)] rounded-lg p-3">
                <p className="text-xs text-[var(--foreground-muted)] mb-2">
                  Sending to:
                </p>
                <div className="flex flex-wrap gap-1">
                  {Array.from(selectedSpeakers).slice(0, 5).map((id) => {
                    const speaker = speakers.find((s) => s.id === id)
                    return speaker ? (
                      <span
                        key={id}
                        className="text-xs px-2 py-1 bg-[var(--background-tertiary)] rounded-full text-[var(--foreground)]"
                      >
                        {speaker.full_name}
                      </span>
                    ) : null
                  })}
                  {selectedSpeakers.size > 5 && (
                    <span className="text-xs px-2 py-1 bg-[var(--background-tertiary)] rounded-full text-[var(--foreground-muted)]">
                      +{selectedSpeakers.size - 5} more
                    </span>
                  )}
                </div>
              </div>

              {messageResult && (
                <div
                  className={`p-3 rounded-lg ${
                    messageResult.errors.length > 0
                      ? 'bg-yellow-500/10'
                      : 'bg-green-500/10'
                  }`}
                >
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {messageResult.sent} message{messageResult.sent !== 1 ? 's' : ''} sent successfully
                  </p>
                  {messageResult.errors.length > 0 && (
                    <ul className="mt-2 text-xs text-[var(--accent-warning)]">
                      {messageResult.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-[var(--card-border)]">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowMessageModal(false)
                  setMessageResult(null)
                }}
              >
                Cancel
              </Button>
              <Button
                icon={<Send size={18} />}
                onClick={handleSendMessage}
                disabled={sending || !messageData.subject.trim() || !messageData.message.trim()}
              >
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
              <h3 className="font-semibold text-[var(--foreground)]">Import Speakers from CSV</h3>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportResult(null)
                }}
                className="p-1 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-[var(--foreground-muted)] mb-3">
                  Upload a CSV file with speaker information. Download the template to see the required format.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Download size={16} />}
                  onClick={handleDownloadTemplate}
                >
                  Download Template
                </Button>
              </div>

              <div className="border-2 border-dashed border-[var(--input-border)] rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer"
                >
                  {importing ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mb-2" />
                      <span className="text-sm text-[var(--foreground-muted)]">Importing...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload size={32} className="text-[var(--foreground-subtle)] mb-2" />
                      <span className="text-sm text-[var(--foreground)]">Click to select CSV file</span>
                      <span className="text-xs text-[var(--foreground-muted)] mt-1">or drag and drop</span>
                    </div>
                  )}
                </label>
              </div>

              {importResult && (
                <div className={`p-3 rounded-lg ${importResult.errors.length > 0 ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {importResult.created} speaker{importResult.created !== 1 ? 's' : ''} imported successfully
                  </p>
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-[var(--foreground-muted)] mb-1">Warnings:</p>
                      <ul className="text-xs text-[var(--accent-warning)] space-y-0.5 max-h-24 overflow-y-auto">
                        {importResult.errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end p-4 border-t border-[var(--card-border)]">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowImportModal(false)
                  setImportResult(null)
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
