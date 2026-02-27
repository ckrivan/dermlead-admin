'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, Button } from '@/components/ui'
import {
  getSessions,
  SESSION_TYPES,
  bulkCreateSessions,
  deleteSession,
  duplicateSession,
} from '@/lib/api/sessions'
import { getEvents } from '@/lib/api/events'
import { getSpeakers } from '@/lib/api/speakers'
import { parseCSV, generateSessionTemplate, downloadCSV, SessionCSVRow } from '@/lib/utils/csv'
import type { Session, Event, Speaker } from '@/types/database'
import { isAbortError } from '@/contexts/EventContext'
import {
  Plus,
  Presentation,
  Clock,
  MapPin,
  Edit,
  Trash2,
  Upload,
  Download,
  X,
  Search,
  Filter,
  Copy,
  MoreVertical,
  ChevronDown,
  Users,
  FileDown,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; errors: string[] } | null>(
    null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Whova-style state
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTrack, setSelectedTrack] = useState<string>('')
  const [openMoreMenu, setOpenMoreMenu] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)

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
        setError('Failed to load events. Check your connection and try again.')
        setLoading(false)
      }
    }
    loadEvents()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    async function loadData() {
      if (!selectedEventId) {
        setSessions([])
        setSpeakers([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const [sessionsData, speakersData] = await Promise.all([
          getSessions(selectedEventId),
          getSpeakers(selectedEventId),
        ])
        setSessions(sessionsData)
        setSpeakers(speakersData)

        // Set default selected date to first date with sessions
        if (sessionsData.length > 0) {
          const dates = [...new Set(sessionsData.map((s) => s.session_date))].sort()
          setSelectedDate(dates[0])
        } else {
          setSelectedDate('')
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load sessions. Check your connection and try again.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedEventId])

  // Get unique dates for day tabs
  const uniqueDates = [...new Set(sessions.map((s) => s.session_date))].sort()

  // Get unique tracks for filter
  const uniqueTracks = [...new Set(sessions.map((s) => s.track).filter(Boolean))]

  // Filter sessions by selected date, search, and track
  const filteredSessions = sessions.filter((session) => {
    if (selectedDate && session.session_date !== selectedDate) return false
    if (selectedTrack && session.track !== selectedTrack) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        session.title.toLowerCase().includes(query) ||
        session.description?.toLowerCase().includes(query) ||
        session.location?.toLowerCase().includes(query)
      )
    }
    return true
  })

  // Group sessions by time slot (hour)
  const sessionsByTimeSlot = filteredSessions.reduce(
    (acc, session) => {
      const timeSlot = session.start_time?.slice(0, 5) || '00:00'
      if (!acc[timeSlot]) {
        acc[timeSlot] = []
      }
      acc[timeSlot].push(session)
      return acc
    },
    {} as Record<string, Session[]>
  )

  const sortedTimeSlots = Object.keys(sessionsByTimeSlot).sort()

  const getSessionTypeLabel = (type: string) => {
    return SESSION_TYPES.find((t) => t.value === type)?.label || type
  }

  const getSessionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      keynote: 'bg-purple-500 text-white',
      presentation: 'bg-blue-500 text-white',
      workshop: 'bg-green-500 text-white',
      panel: 'bg-orange-500 text-white',
      symposium: 'bg-pink-500 text-white',
      breakout: 'bg-cyan-500 text-white',
      networking: 'bg-yellow-500 text-white',
      meal: 'bg-amber-500 text-white',
      break: 'bg-gray-500 text-white',
      registration: 'bg-indigo-500 text-white',
    }
    return colors[type] || 'bg-gray-500 text-white'
  }

  const formatTimeSlot = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const handleDownloadTemplate = () => {
    const template = generateSessionTemplate()
    downloadCSV(template, 'sessions_template.csv')
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedEventId) return

    setImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      const rows = parseCSV<SessionCSVRow>(text)

      if (rows.length === 0) {
        setImportResult({ created: 0, errors: ['No valid rows found in CSV'] })
        return
      }

      const result = await bulkCreateSessions(
        selectedEventId,
        rows,
        speakers.map((s) => ({ id: s.id, full_name: s.full_name }))
      )
      setImportResult(result)

      // Reload sessions if any were created
      if (result.created > 0) {
        const data = await getSessions(selectedEventId)
        setSessions(data)
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return

    setDeleting(id)
    try {
      await deleteSession(id)
      setSessions(sessions.filter((s) => s.id !== id))
    } catch (error) {
      console.error('Error deleting session:', error)
    } finally {
      setDeleting(null)
      setOpenMoreMenu(null)
    }
  }

  const handleDuplicate = async (id: string) => {
    setDuplicating(id)
    try {
      const duplicated = await duplicateSession(id)
      setSessions([...sessions, duplicated])
    } catch (error) {
      console.error('Error duplicating session:', error)
    } finally {
      setDuplicating(null)
      setOpenMoreMenu(null)
    }
  }

  const handleExport = () => {
    const csvContent = [
      ['Title', 'Description', 'Type', 'Date', 'Start Time', 'End Time', 'Location', 'Track'],
      ...filteredSessions.map((s) => [
        s.title,
        s.description || '',
        s.session_type,
        s.session_date,
        s.start_time || '',
        s.end_time || '',
        s.location || '',
        s.track || '',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    downloadCSV(csvContent, `sessions_${selectedDate || 'all'}.csv`)
  }

  return (
    <>
      <Header title="Session Manager" subtitle="Manage your event agenda and sessions" />

      <div className="p-6 space-y-4">
        {/* Event Selector */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-[var(--foreground)]">Event:</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)] min-w-[250px]"
          >
            <option value="">Select an event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>

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
        ) : sessions.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <Presentation
                size={48}
                className="mx-auto text-[var(--foreground-subtle)] mb-4"
              />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                No sessions yet
              </h3>
              <p className="text-[var(--foreground-muted)] mb-4">
                {selectedEventId
                  ? 'Create sessions to build your event agenda.'
                  : 'Select an event to view its sessions.'}
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
                  <Link href={`/sessions/new?eventId=${selectedEventId}`}>
                    <Button icon={<Plus size={18} />}>Add First Session</Button>
                  </Link>
                </div>
              )}
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3">
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
                  />
                  <input
                    type="text"
                    placeholder="Search sessions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--input-focus)] w-64"
                  />
                </div>

                {/* Track Filter */}
                {uniqueTracks.length > 0 && (
                  <div className="relative">
                    <Filter
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
                    />
                    <select
                      value={selectedTrack}
                      onChange={(e) => setSelectedTrack(e.target.value)}
                      className="pl-9 pr-8 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)] appearance-none cursor-pointer"
                    >
                      <option value="">All Tracks</option>
                      {uniqueTracks.map((track) => (
                        <option key={track} value={track!}>
                          {track}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] pointer-events-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<FileDown size={16} />}
                  onClick={handleExport}
                >
                  Export
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Upload size={16} />}
                  onClick={() => setShowImportModal(true)}
                >
                  Import
                </Button>
                <Link href={`/sessions/new?eventId=${selectedEventId}`}>
                  <Button size="sm" icon={<Plus size={16} />}>
                    Add Session
                  </Button>
                </Link>
              </div>
            </div>

            {/* Day Tabs */}
            <div className="flex items-center gap-1 border-b border-[var(--card-border)] overflow-x-auto pb-0">
              {uniqueDates.map((date) => {
                const dateObj = parseISO(date)
                const isSelected = date === selectedDate
                const sessionCount = sessions.filter((s) => s.session_date === date).length

                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      isSelected
                        ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                        : 'border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">{format(dateObj, 'EEE')}</span>
                      <span className="text-xs">{format(dateObj, 'MMM d')}</span>
                      <span className="text-xs mt-0.5 opacity-60">{sessionCount} sessions</span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Time Slot Groups */}
            <div className="space-y-6">
              {sortedTimeSlots.length === 0 ? (
                <div className="text-center py-8 text-[var(--foreground-muted)]">
                  No sessions found matching your criteria.
                </div>
              ) : (
                sortedTimeSlots.map((timeSlot) => (
                  <div key={timeSlot} className="space-y-2">
                    {/* Time Slot Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-[var(--foreground)]">
                          <Clock size={18} className="text-[var(--accent-primary)]" />
                          <span className="font-semibold text-lg">
                            {formatTimeSlot(timeSlot)}
                          </span>
                        </div>
                        <span className="text-sm text-[var(--foreground-muted)]">
                          ({sessionsByTimeSlot[timeSlot].length} session
                          {sessionsByTimeSlot[timeSlot].length !== 1 ? 's' : ''})
                        </span>
                      </div>
                      <Link
                        href={`/sessions/new?eventId=${selectedEventId}&date=${selectedDate}&time=${timeSlot}`}
                      >
                        <Button variant="ghost" size="sm" icon={<Plus size={14} />}>
                          Add at {formatTimeSlot(timeSlot)}
                        </Button>
                      </Link>
                    </div>

                    {/* Session Cards */}
                    <div className="space-y-2 ml-6 pl-4 border-l-2 border-[var(--accent-primary)]/20">
                      {sessionsByTimeSlot[timeSlot].map((session) => (
                        <div
                          key={session.id}
                          className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 hover:border-[var(--accent-primary)]/40 transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Type Badge & Track */}
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium ${getSessionTypeColor(
                                    session.session_type
                                  )}`}
                                >
                                  {getSessionTypeLabel(session.session_type)}
                                </span>
                                {session.track && (
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--background-tertiary)] text-[var(--foreground-muted)]">
                                    {session.track}
                                  </span>
                                )}
                              </div>

                              {/* Title */}
                              <h3 className="font-semibold text-[var(--foreground)] mb-1 truncate">
                                {session.title}
                              </h3>

                              {/* Time & Location */}
                              <div className="flex items-center gap-4 text-sm text-[var(--foreground-muted)]">
                                <div className="flex items-center gap-1">
                                  <Clock size={14} />
                                  <span>
                                    {session.start_time?.slice(0, 5)} -{' '}
                                    {session.end_time?.slice(0, 5)}
                                  </span>
                                </div>
                                {session.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin size={14} />
                                    <span>{session.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link href={`/sessions/${session.id}/edit`}>
                                <Button variant="ghost" size="sm" icon={<Edit size={14} />}>
                                  Edit
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Copy size={14} />}
                                onClick={() => handleDuplicate(session.id)}
                                disabled={duplicating === session.id}
                              >
                                {duplicating === session.id ? '...' : 'Duplicate'}
                              </Button>

                              {/* More Menu */}
                              <div className="relative">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={<MoreVertical size={14} />}
                                  onClick={() =>
                                    setOpenMoreMenu(openMoreMenu === session.id ? null : session.id)
                                  }
                                />
                                {openMoreMenu === session.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-10"
                                      onClick={() => setOpenMoreMenu(null)}
                                    />
                                    <div className="absolute right-0 top-full mt-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
                                      <button
                                        onClick={() => handleDelete(session.id)}
                                        disabled={deleting === session.id}
                                        className="w-full px-3 py-2 text-left text-sm text-[var(--accent-danger)] hover:bg-[var(--background-tertiary)] flex items-center gap-2"
                                      >
                                        <Trash2 size={14} />
                                        {deleting === session.id ? 'Deleting...' : 'Delete'}
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
              <h3 className="font-semibold text-[var(--foreground)]">Import Sessions from CSV</h3>
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
                  Upload a CSV file with session information. Speaker names should match existing
                  speakers for auto-assignment.
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
                  id="csv-upload-sessions"
                />
                <label htmlFor="csv-upload-sessions" className="cursor-pointer">
                  {importing ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mb-2" />
                      <span className="text-sm text-[var(--foreground-muted)]">Importing...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload size={32} className="text-[var(--foreground-subtle)] mb-2" />
                      <span className="text-sm text-[var(--foreground)]">
                        Click to select CSV file
                      </span>
                      <span className="text-xs text-[var(--foreground-muted)] mt-1">
                        or drag and drop
                      </span>
                    </div>
                  )}
                </label>
              </div>

              {importResult && (
                <div
                  className={`p-3 rounded-lg ${importResult.errors.length > 0 ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}
                >
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {importResult.created} session{importResult.created !== 1 ? 's' : ''} imported
                    successfully
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
