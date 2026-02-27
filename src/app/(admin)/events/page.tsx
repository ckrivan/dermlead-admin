'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, Button } from '@/components/ui'
import { getEvents, getEventStatus, getEventStats } from '@/lib/api/events'
import type { Event } from '@/types/database'
import { isAbortError } from '@/contexts/EventContext'
import { Plus, Calendar, MapPin, Users, Grid3x3, List, Search } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

type ViewMode = 'grid' | 'table'

interface EventWithStats extends Event {
  stats?: {
    attendeesCount: number
    leadsCount: number
    sessionsCount: number
    speakersCount: number
  }
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [filteredEvents, setFilteredEvents] = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'active' | 'past'>('all')

  useEffect(() => {
    let cancelled = false
    async function loadEvents() {
      try {
        const data = await getEvents()
        if (cancelled) return

        // Load stats for each event
        const eventsWithStats = await Promise.all(
          data.map(async (event) => {
            try {
              const stats = await getEventStats(event.id)
              return { ...event, stats }
            } catch (error) {
              console.error(`Error loading stats for event ${event.id}:`, error)
              return event
            }
          })
        )

        if (cancelled) return
        setEvents(eventsWithStats)
        setFilteredEvents(eventsWithStats)
      } catch (err: unknown) {
        if (cancelled) return
        if (isAbortError(err)) return
        console.error('Error loading events:', err)
        setError('Failed to load events. Check your connection and try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadEvents()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let filtered = events

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((event) => getEventStatus(event) === statusFilter)
    }

    setFilteredEvents(filtered)
  }, [searchQuery, statusFilter, events])

  const getStatusBadge = (event: Event) => {
    const status = getEventStatus(event)
    const colors = {
      upcoming: 'bg-blue-500/10 text-blue-500',
      active: 'bg-green-500/10 text-green-500',
      past: 'bg-gray-500/10 text-gray-500',
    }

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <>
      <Header title="Events" subtitle="Manage your conventions and conferences" />

      <div className="p-6 space-y-6">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex gap-4 flex-1 max-w-2xl">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
              />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--input-focus)]"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
            >
              <option value="all">All Events</option>
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="past">Past</option>
            </select>
          </div>

          <div className="flex gap-2">
            {/* View Mode Toggle */}
            <div className="flex gap-1 p-1 rounded-lg bg-[var(--background-tertiary)]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <Grid3x3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded ${
                  viewMode === 'table'
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <List size={18} />
              </button>
            </div>

            {/* Create Button */}
            <Link href="/events/new">
              <Button icon={<Plus size={18} />}>Create Event</Button>
            </Link>
          </div>
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
        ) : filteredEvents.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <Calendar
                size={48}
                className="mx-auto text-[var(--foreground-subtle)] mb-4"
              />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                {searchQuery || statusFilter !== 'all' ? 'No events found' : 'No events yet'}
              </h3>
              <p className="text-[var(--foreground-muted)] mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first event to get started.'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Link href="/events/new">
                  <Button icon={<Plus size={18} />}>Create First Event</Button>
                </Link>
              )}
            </CardBody>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event) => (
              <Card key={event.id} hover>
                <CardBody>
                  {event.banner_url && (
                    <img
                      src={event.banner_url}
                      alt={event.name}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-[var(--foreground)] flex-1">
                      {event.name}
                    </h3>
                    {getStatusBadge(event)}
                  </div>

                  <div className="space-y-2 text-sm text-[var(--foreground-muted)] mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>
                        {format(new Date(event.start_date), 'MMM d')} -{' '}
                        {format(new Date(event.end_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.invite_code && (
                      <div className="flex items-center gap-2">
                        <Users size={14} />
                        <span>Code: {event.invite_code}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  {event.stats && (
                    <div className="grid grid-cols-2 gap-2 pt-4 border-t border-[var(--card-border)] mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[var(--foreground)]">
                          {event.stats.attendeesCount}
                        </div>
                        <div className="text-xs text-[var(--foreground-muted)]">Attendees</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[var(--foreground)]">
                          {event.stats.leadsCount}
                        </div>
                        <div className="text-xs text-[var(--foreground-muted)]">Leads</div>
                      </div>
                    </div>
                  )}

                  <Link href={`/events/${event.id}/edit`}>
                    <Button variant="ghost" size="sm" className="w-full">
                      Edit Event
                    </Button>
                  </Link>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--card-border)]">
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                      Event
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                      Dates
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-[var(--foreground)]">
                      Attendees
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-[var(--foreground)]">
                      Leads
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr
                      key={event.id}
                      className="border-b border-[var(--card-border)] hover:bg-[var(--background-tertiary)] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {event.logo_url && (
                            <img
                              src={event.logo_url}
                              alt={event.name}
                              className="w-10 h-10 object-contain rounded"
                            />
                          )}
                          <div>
                            <div className="font-medium text-[var(--foreground)]">
                              {event.name}
                            </div>
                            {event.invite_code && (
                              <div className="text-xs text-[var(--foreground-muted)] font-mono">
                                {event.invite_code}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--foreground-muted)]">
                        {format(new Date(event.start_date), 'MMM d')} -{' '}
                        {format(new Date(event.end_date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--foreground-muted)]">
                        {event.location || '-'}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(event)}</td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-[var(--foreground)]">
                        {event.stats?.attendeesCount || 0}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-[var(--foreground)]">
                        {event.stats?.leadsCount || 0}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/events/${event.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </>
  )
}
