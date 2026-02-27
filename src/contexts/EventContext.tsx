'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getEvents } from '@/lib/api/events'
import { useAuth } from '@/contexts/AuthContext'
import type { Event } from '@/types/database'

const STORAGE_KEY = 'dermlead_selected_event_id'

// Supabase throws plain objects, not Error instances.
// This handles both native AbortError and the Supabase error object format.
export function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const msg = (err as Record<string, unknown>).message
    if (
      typeof msg === 'string' &&
      (msg.includes('AbortError') || msg.includes('signal is aborted'))
    )
      return true
  }
  return false
}

interface EventContextValue {
  selectedEvent: Event | null
  events: Event[]
  isLoading: boolean
  hasManyEvents: boolean
  setSelectedEvent: (event: Event) => void
  showPicker: boolean
  setShowPicker: (show: boolean) => void
}

const EventContext = createContext<EventContextValue | null>(null)

export function EventProvider({ children }: { children: ReactNode }) {
  const { loading: authLoading } = useAuth()

  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEventState] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    // Wait for auth session before fetching — prevents race condition on mobile Safari
    if (authLoading) return

    let cancelled = false

    // Safety net: never block the UI forever if event fetch hangs
    const safetyTimer = setTimeout(() => {
      if (!cancelled) {
        console.warn('[EventContext] event load timed out')
        cancelled = true
        setIsLoading(false)
      }
    }, 8000)

    async function load(attempt = 0): Promise<void> {
      try {
        const data = await getEvents()
        if (cancelled) return

        clearTimeout(safetyTimer)
        setEvents(data)

        if (data.length === 0) {
          setIsLoading(false)
          return
        }

        if (data.length === 1) {
          setSelectedEventState(data[0])
          setIsLoading(false)
          return
        }

        // Multiple events — restore from localStorage or show picker
        const savedId =
          typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
        const savedEvent = savedId ? data.find((e) => e.id === savedId) : null

        if (savedEvent) {
          setSelectedEventState(savedEvent)
        } else {
          setShowPicker(true)
        }
        setIsLoading(false)
      } catch (err: unknown) {
        if (cancelled) return

        if (isAbortError(err)) {
          if (attempt < 2) {
            // Retry with backoff — transient mobile/Safari aborts often recover
            const delay = 300 * (attempt + 1)
            setTimeout(() => { if (!cancelled) load(attempt + 1) }, delay)
            return
          }
          // All retries exhausted — stop loading without data
        } else {
          console.error('EventContext: failed to load events', err)
        }
        clearTimeout(safetyTimer)
        setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
      clearTimeout(safetyTimer)
    }
  }, [authLoading]) // Re-fires once auth resolves

  const setSelectedEvent = (event: Event) => {
    setSelectedEventState(event)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, event.id)
    }
    setShowPicker(false)
  }

  return (
    <EventContext.Provider
      value={{
        selectedEvent,
        events,
        isLoading,
        hasManyEvents: events.length > 1,
        setSelectedEvent,
        showPicker,
        setShowPicker,
      }}
    >
      {children}
    </EventContext.Provider>
  )
}

export function useEvent() {
  const ctx = useContext(EventContext)
  if (!ctx) throw new Error('useEvent must be used within EventProvider')
  return ctx
}
