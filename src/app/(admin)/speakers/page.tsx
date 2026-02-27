'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, Button } from '@/components/ui'
import { getSpeakers, bulkCreateSpeakers } from '@/lib/api/speakers'
import { getEvents } from '@/lib/api/events'
import { getGroups } from '@/lib/api/groups'
import { parseCSV, generateSpeakerTemplate, downloadCSV, SpeakerCSVRow } from '@/lib/utils/csv'
import { GroupAssignment } from '@/components/GroupAssignment'
import type { Speaker, Event, EventGroup } from '@/types/database'
import { isAbortError } from '@/contexts/EventContext'
import { Plus, User, Mail, Building, Edit, Trash2, Upload, Download, X, Send, CheckSquare, Square, Tag } from 'lucide-react'
import { sendBulkMessage } from '@/lib/api/speaker-messages'

export default function SpeakersPage() {
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [groups, setGroups] = useState<EventGroup[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
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

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      try {
        const [eventsData] = await Promise.all([getEvents()])
        if (cancelled) return
        setEvents(eventsData)

        // Auto-select first event if available
        if (eventsData.length > 0) {
          setSelectedEventId(eventsData[0].id)
        }
      } catch (err: unknown) {
        if (cancelled) return
        if (isAbortError(err)) return
        console.error('Error loading events:', err)
        setError('Failed to load events. Check your connection and try again.')
        setLoading(false)
      }
    }
    loadData()
    return () => { cancelled = true }
  }, [])

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
        const [speakersData, groupsData] = await Promise.all([
          getSpeakers(selectedEventId),
          getGroups(selectedEventId),
        ])
        setSpeakers(speakersData)
        setGroups(groupsData)
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

  return (
    <>
      <Header
        title="Speakers"
        subtitle="Manage speakers for your events"
      />

      <div className="p-6 space-y-6">
        {/* Event Selector & Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="text-sm text-[var(--foreground-muted)]">
              Event:
            </label>
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
            {speakers.map((speaker) => (
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
                      {speaker.credentials && (
                        <p className="text-sm text-[var(--accent-primary)]">
                          {speaker.credentials}
                        </p>
                      )}
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
              <div className="grid grid-cols-2 gap-4">
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
