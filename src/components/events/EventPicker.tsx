'use client'

import { Calendar, MapPin, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useEvent } from '@/contexts/EventContext'
import { getEventStatus } from '@/lib/api/events'
import type { Event } from '@/types/database'

const STATUS_STYLES = {
  active: {
    badge: 'bg-green-100 text-green-700',
    label: 'Live',
  },
  upcoming: {
    badge: 'bg-blue-100 text-blue-700',
    label: 'Upcoming',
  },
  past: {
    badge: 'bg-gray-100 text-gray-500',
    label: 'Past',
  },
}

function formatDateRange(start: string, end: string): string {
  const s = parseISO(start)
  const e = parseISO(end)
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${format(s, 'MMM d')}–${format(e, 'd, yyyy')}`
  }
  return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`
}

function EventCard({ event, onSelect }: { event: Event; onSelect: (e: Event) => void }) {
  const status = getEventStatus(event)
  const { badge, label } = STATUS_STYLES[status]

  return (
    <button
      onClick={() => onSelect(event)}
      className="w-full text-left group rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-sm transition-all hover:shadow-md hover:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${badge}`}>
              {label}
            </span>
          </div>
          <h3 className="text-base font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--accent-primary)] transition-colors">
            {event.name}
          </h3>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-[var(--foreground-muted)]">
            <span className="flex items-center gap-1">
              <Calendar size={13} className="shrink-0" />
              {formatDateRange(event.start_date, event.end_date)}
            </span>
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin size={13} className="shrink-0" />
                <span className="truncate max-w-[200px]">{event.location}</span>
              </span>
            )}
          </div>
        </div>
        <ChevronRight
          size={18}
          className="shrink-0 mt-1 text-[var(--foreground-subtle)] group-hover:text-[var(--accent-primary)] transition-colors"
        />
      </div>
    </button>
  )
}

export function EventPicker() {
  const { events, setSelectedEvent, showPicker } = useEvent()

  if (!showPicker) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 rounded-2xl bg-[var(--background)] shadow-2xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[var(--card-border)]">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-primary)]">
              <Calendar size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">Choose an Event</h2>
              <p className="text-sm text-[var(--foreground-muted)]">
                Select the event you want to manage
              </p>
            </div>
          </div>
        </div>

        {/* Event list */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-center text-[var(--foreground-muted)] py-8">
              No events found. Create one in the Events section.
            </p>
          ) : (
            events.map((event) => (
              <EventCard key={event.id} event={event} onSelect={setSelectedEvent} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
