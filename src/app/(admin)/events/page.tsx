'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, Button } from '@/components/ui'
import { getEvents } from '@/lib/api/events'
import type { Event } from '@/types/database'
import { Plus, Calendar, MapPin, Users } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await getEvents()
        setEvents(data)
      } catch (error) {
        console.error('Error loading events:', error)
      } finally {
        setLoading(false)
      }
    }
    loadEvents()
  }, [])

  return (
    <>
      <Header title="Events" subtitle="Manage your conventions and conferences" />

      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <Link href="/events/new">
            <Button icon={<Plus size={18} />}>Create Event</Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <Calendar
                size={48}
                className="mx-auto text-[var(--foreground-subtle)] mb-4"
              />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                No events yet
              </h3>
              <p className="text-[var(--foreground-muted)] mb-4">
                Create your first event to get started.
              </p>
              <Link href="/events/new">
                <Button icon={<Plus size={18} />}>Create First Event</Button>
              </Link>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <Card key={event.id} hover>
                <CardBody>
                  {event.banner_url && (
                    <img
                      src={event.banner_url}
                      alt={event.name}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">
                    {event.name}
                  </h3>
                  <div className="space-y-2 text-sm text-[var(--foreground-muted)]">
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
                  <div className="mt-4 pt-4 border-t border-[var(--card-border)]">
                    <Link href={`/events/${event.id}/edit`}>
                      <Button variant="ghost" size="sm" className="w-full">
                        Edit Event
                      </Button>
                    </Link>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
