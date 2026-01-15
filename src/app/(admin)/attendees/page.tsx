'use client'

import { useEffect, useState, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, Button, Input } from '@/components/ui'
import {
  getAttendeesWithGroups,
  getGroups,
  deleteAttendee,
  checkInAttendee,
  undoCheckIn,
  bulkCreateAttendees,
  BADGE_TYPES,
  AttendeeWithGroups,
} from '@/lib/api/attendees'
import { getEvents } from '@/lib/api/events'
import { downloadCSV, parseCSV } from '@/lib/utils/csv'
import type { Event, AttendeeGroup } from '@/types/database'
import {
  Plus,
  Users,
  Search,
  Filter,
  Upload,
  Download,
  X,
  MoreVertical,
  Trash2,
  CheckCircle2,
  XCircle,
  Mail,
  Tag,
  FileDown,
  ChevronDown,
  QrCode,
  Clock,
  UserCheck,
  UserX,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function AttendeesPage() {
  const [attendees, setAttendees] = useState<AttendeeWithGroups[]>([])
  const [groups, setGroups] = useState<AttendeeGroup[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; errors: string[] } | null>(
    null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [selectedRegType, setSelectedRegType] = useState<string>('')
  const [showCheckedIn, setShowCheckedIn] = useState<'all' | 'checked_in' | 'not_checked_in'>('all')

  // Action state
  const [openMoreMenu, setOpenMoreMenu] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [checkingIn, setCheckingIn] = useState<string | null>(null)

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await getEvents()
        setEvents(data)
        if (data.length > 0) {
          setSelectedEventId(data[0].id)
        }
      } catch (error) {
        console.error('Error loading events:', error)
      }
    }
    loadEvents()
  }, [])

  useEffect(() => {
    async function loadData() {
      if (!selectedEventId) {
        setAttendees([])
        setGroups([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const [attendeesData, groupsData] = await Promise.all([
          getAttendeesWithGroups(selectedEventId),
          getGroups(selectedEventId),
        ])
        setAttendees(attendeesData)
        setGroups(groupsData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedEventId])

  // Filter attendees
  const filteredAttendees = attendees.filter((attendee) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (
        !attendee.full_name.toLowerCase().includes(query) &&
        !attendee.email.toLowerCase().includes(query)
      ) {
        return false
      }
    }
    if (selectedGroup && !attendee.groups.some((g) => g.id === selectedGroup)) {
      return false
    }
    if (selectedRegType && attendee.badge_type !== selectedRegType) {
      return false
    }
    if (showCheckedIn === 'checked_in' && !attendee.checked_in_at) {
      return false
    }
    if (showCheckedIn === 'not_checked_in' && attendee.checked_in_at) {
      return false
    }
    return true
  })

  // Stats
  const totalAttendees = attendees.length
  const checkedInCount = attendees.filter((a) => a.checked_in_at).length
  const notCheckedInCount = totalAttendees - checkedInCount

  const getBadgeTypeLabel = (type: string) => {
    return BADGE_TYPES.find((t) => t.value === type)?.label || type
  }

  const getBadgeTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      attendee: 'bg-gray-500/20 text-gray-600',
      vip: 'bg-purple-500/20 text-purple-600',
      speaker: 'bg-blue-500/20 text-blue-600',
      exhibitor: 'bg-green-500/20 text-green-600',
      sponsor: 'bg-amber-500/20 text-amber-600',
      staff: 'bg-cyan-500/20 text-cyan-600',
      press: 'bg-pink-500/20 text-pink-600',
    }
    return colors[type] || 'bg-gray-500/20 text-gray-600'
  }

  const handleDownloadTemplate = () => {
    const template = [
      'full_name,email,badge_type,groups',
      'John Doe,john@example.com,attendee,"VIP,Speakers"',
      'Jane Smith,jane@example.com,vip,Sponsors',
    ].join('\n')
    downloadCSV(template, 'attendees_template.csv')
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedEventId) return

    setImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      const rows = parseCSV<{
        full_name: string
        email: string
        badge_type?: string
        groups?: string
      }>(text)

      if (rows.length === 0) {
        setImportResult({ created: 0, errors: ['No valid rows found in CSV'] })
        return
      }

      const result = await bulkCreateAttendees(selectedEventId, rows, groups)
      setImportResult(result)

      // Reload attendees if any were created
      if (result.created > 0) {
        const [attendeesData, groupsData] = await Promise.all([
          getAttendeesWithGroups(selectedEventId),
          getGroups(selectedEventId),
        ])
        setAttendees(attendeesData)
        setGroups(groupsData)
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
    if (!confirm('Are you sure you want to delete this attendee?')) return

    setDeleting(id)
    try {
      await deleteAttendee(id)
      setAttendees(attendees.filter((a) => a.id !== id))
    } catch (error) {
      console.error('Error deleting attendee:', error)
    } finally {
      setDeleting(null)
      setOpenMoreMenu(null)
    }
  }

  const handleCheckIn = async (id: string, isCheckedIn: boolean) => {
    setCheckingIn(id)
    try {
      if (isCheckedIn) {
        await undoCheckIn(id)
        setAttendees(
          attendees.map((a) => (a.id === id ? { ...a, checked_in_at: null } : a))
        )
      } else {
        const updated = await checkInAttendee(id)
        setAttendees(
          attendees.map((a) => (a.id === id ? { ...a, checked_in_at: updated.checked_in_at } : a))
        )
      }
    } catch (error) {
      console.error('Error updating check-in:', error)
    } finally {
      setCheckingIn(null)
    }
  }

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Email', 'Badge Type', 'Groups', 'Checked In'],
      ...filteredAttendees.map((a) => [
        a.full_name,
        a.email,
        a.badge_type,
        a.groups.map((g) => g.name).join(', '),
        a.checked_in_at ? format(parseISO(a.checked_in_at), 'yyyy-MM-dd HH:mm') : '',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    downloadCSV(csvContent, 'attendees.csv')
  }

  return (
    <>
      <Header title="Attendees" subtitle="Manage event attendees and registrations" />

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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
          </div>
        ) : attendees.length === 0 && selectedEventId ? (
          <Card>
            <CardBody className="text-center py-12">
              <Users size={48} className="mx-auto text-[var(--foreground-subtle)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                No attendees yet
              </h3>
              <p className="text-[var(--foreground-muted)] mb-4">
                Import attendees from CSV or add them manually.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  icon={<Upload size={18} />}
                  onClick={() => setShowImportModal(true)}
                >
                  Import from CSV
                </Button>
                <Button icon={<Plus size={18} />}>Add Attendee</Button>
              </div>
            </CardBody>
          </Card>
        ) : !selectedEventId ? (
          <Card>
            <CardBody className="text-center py-12">
              <Users size={48} className="mx-auto text-[var(--foreground-subtle)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                Select an event
              </h3>
              <p className="text-[var(--foreground-muted)]">
                Choose an event to view its attendees.
              </p>
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardBody className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <Users size={24} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--foreground-muted)]">Total Attendees</p>
                    <p className="text-2xl font-bold text-[var(--foreground)]">{totalAttendees}</p>
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <UserCheck size={24} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--foreground-muted)]">Checked In</p>
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                      {checkedInCount}
                      <span className="text-sm font-normal text-[var(--foreground-muted)] ml-2">
                        ({totalAttendees > 0 ? Math.round((checkedInCount / totalAttendees) * 100) : 0}%)
                      </span>
                    </p>
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-500/10">
                    <UserX size={24} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--foreground-muted)]">Not Checked In</p>
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                      {notCheckedInCount}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
                  />
                  <input
                    type="text"
                    placeholder="Search attendees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--input-focus)] w-64"
                  />
                </div>

                {/* Group Filter */}
                {groups.length > 0 && (
                  <div className="relative">
                    <Tag
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
                    />
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="pl-9 pr-8 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)] appearance-none cursor-pointer"
                    >
                      <option value="">All Groups</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] pointer-events-none"
                    />
                  </div>
                )}

                {/* Badge Type Filter */}
                <div className="relative">
                  <Filter
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
                  />
                  <select
                    value={selectedRegType}
                    onChange={(e) => setSelectedRegType(e.target.value)}
                    className="pl-9 pr-8 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)] appearance-none cursor-pointer"
                  >
                    <option value="">All Types</option>
                    {BADGE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] pointer-events-none"
                  />
                </div>

                {/* Check-in Status Filter */}
                <div className="flex rounded-lg overflow-hidden border border-[var(--input-border)]">
                  <button
                    onClick={() => setShowCheckedIn('all')}
                    className={`px-3 py-2 text-sm ${
                      showCheckedIn === 'all'
                        ? 'bg-[var(--accent-primary)] text-white'
                        : 'bg-[var(--input-bg)] text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)]'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setShowCheckedIn('checked_in')}
                    className={`px-3 py-2 text-sm border-l border-[var(--input-border)] ${
                      showCheckedIn === 'checked_in'
                        ? 'bg-green-500 text-white'
                        : 'bg-[var(--input-bg)] text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)]'
                    }`}
                  >
                    Checked In
                  </button>
                  <button
                    onClick={() => setShowCheckedIn('not_checked_in')}
                    className={`px-3 py-2 text-sm border-l border-[var(--input-border)] ${
                      showCheckedIn === 'not_checked_in'
                        ? 'bg-amber-500 text-white'
                        : 'bg-[var(--input-bg)] text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)]'
                    }`}
                  >
                    Not Checked In
                  </button>
                </div>
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
                <Button size="sm" icon={<Plus size={16} />}>
                  Add Attendee
                </Button>
              </div>
            </div>

            {/* Attendees Table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--card-border)]">
                      <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">
                        Attendee
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">
                        Type
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">
                        Groups
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">
                        Status
                      </th>
                      <th className="text-right p-4 text-sm font-medium text-[var(--foreground-muted)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendees.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-[var(--foreground-muted)]">
                          No attendees found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredAttendees.map((attendee) => (
                        <tr
                          key={attendee.id}
                          className="border-b border-[var(--card-border)] hover:bg-[var(--background-tertiary)] transition-colors"
                        >
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-[var(--foreground)]">
                                {attendee.full_name}
                              </p>
                              <p className="text-sm text-[var(--foreground-muted)] flex items-center gap-1">
                                <Mail size={12} />
                                {attendee.email}
                              </p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getBadgeTypeColor(
                                attendee.badge_type
                              )}`}
                            >
                              {getBadgeTypeLabel(attendee.badge_type)}
                            </span>
                          </td>
                          <td className="p-4">
                            {attendee.groups.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {attendee.groups.map((group) => (
                                  <span
                                    key={group.id}
                                    className="px-2 py-0.5 rounded text-xs"
                                    style={{
                                      backgroundColor: `${group.color || '#3b82f6'}20`,
                                      color: group.color || '#3b82f6',
                                    }}
                                  >
                                    {group.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[var(--foreground-subtle)] text-sm">—</span>
                            )}
                          </td>
                          <td className="p-4">
                            {attendee.checked_in_at ? (
                              <div className="flex items-center gap-2 text-green-500">
                                <CheckCircle2 size={16} />
                                <div>
                                  <p className="text-sm font-medium">Checked In</p>
                                  <p className="text-xs text-[var(--foreground-muted)]">
                                    {format(parseISO(attendee.checked_in_at), 'MMM d, h:mm a')}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
                                <XCircle size={16} />
                                <span className="text-sm">Not checked in</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={
                                  attendee.checked_in_at ? (
                                    <XCircle size={14} />
                                  ) : (
                                    <CheckCircle2 size={14} />
                                  )
                                }
                                onClick={() =>
                                  handleCheckIn(attendee.id, !!attendee.checked_in_at)
                                }
                                disabled={checkingIn === attendee.id}
                                className={
                                  attendee.checked_in_at
                                    ? 'text-amber-500'
                                    : 'text-green-500'
                                }
                              >
                                {checkingIn === attendee.id
                                  ? '...'
                                  : attendee.checked_in_at
                                    ? 'Undo'
                                    : 'Check In'}
                              </Button>

                              {/* More Menu */}
                              <div className="relative">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={<MoreVertical size={14} />}
                                  onClick={() =>
                                    setOpenMoreMenu(
                                      openMoreMenu === attendee.id ? null : attendee.id
                                    )
                                  }
                                />
                                {openMoreMenu === attendee.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-10"
                                      onClick={() => setOpenMoreMenu(null)}
                                    />
                                    <div className="absolute right-0 top-full mt-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
                                      <button
                                        onClick={() => handleDelete(attendee.id)}
                                        disabled={deleting === attendee.id}
                                        className="w-full px-3 py-2 text-left text-sm text-[var(--accent-danger)] hover:bg-[var(--background-tertiary)] flex items-center gap-2"
                                      >
                                        <Trash2 size={14} />
                                        {deleting === attendee.id ? 'Deleting...' : 'Delete'}
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Results count */}
            <p className="text-sm text-[var(--foreground-muted)] text-center">
              Showing {filteredAttendees.length} of {totalAttendees} attendees
            </p>
          </>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
              <h3 className="font-semibold text-[var(--foreground)]">Import Attendees from CSV</h3>
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
                  Upload a CSV file with attendee information. Groups will be created automatically
                  if they don't exist.
                </p>
                <div className="bg-[var(--background-tertiary)] rounded-lg p-3 text-sm">
                  <p className="font-medium text-[var(--foreground)] mb-1">CSV Columns:</p>
                  <ul className="text-[var(--foreground-muted)] space-y-0.5 text-xs">
                    <li>
                      <code className="bg-[var(--input-bg)] px-1 rounded">full_name</code> - Required
                    </li>
                    <li>
                      <code className="bg-[var(--input-bg)] px-1 rounded">email</code> - Required
                    </li>
                    <li>
                      <code className="bg-[var(--input-bg)] px-1 rounded">badge_type</code> -
                      Optional (attendee, vip, speaker, etc.)
                    </li>
                    <li>
                      <code className="bg-[var(--input-bg)] px-1 rounded">groups</code> - Optional
                      (comma-separated group names)
                    </li>
                  </ul>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Download size={16} />}
                  onClick={handleDownloadTemplate}
                  className="mt-3"
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
                  id="csv-upload-attendees"
                />
                <label htmlFor="csv-upload-attendees" className="cursor-pointer">
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
                  className={`p-3 rounded-lg ${
                    importResult.errors.length > 0 ? 'bg-yellow-500/10' : 'bg-green-500/10'
                  }`}
                >
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {importResult.created} attendee{importResult.created !== 1 ? 's' : ''} imported
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
