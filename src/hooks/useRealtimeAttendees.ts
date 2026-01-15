'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Attendee } from '@/types/database'

interface UseRealtimeAttendeesResult {
  attendees: Attendee[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useRealtimeAttendees(eventId: string | null): UseRealtimeAttendeesResult {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAttendees = useCallback(async () => {
    if (!eventId) {
      setAttendees([])
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const { data, error: fetchError } = await supabase
        .from('attendees')
        .select('*')
        .eq('event_id', eventId)
        .order('first_name')

      if (fetchError) throw fetchError
      setAttendees(data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching attendees:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    if (!eventId) {
      setAttendees([])
      setLoading(false)
      return
    }

    setLoading(true)
    fetchAttendees()

    // Set up real-time subscription
    const supabase = createClient()
    const channelName = `attendees:${eventId}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendees',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log('Attendee INSERT:', payload.new)
          setAttendees((prev) => {
            // Check if already exists (avoid duplicates)
            if (prev.some((a) => a.id === payload.new.id)) return prev
            return [...prev, payload.new as Attendee].sort((a, b) =>
              a.first_name.localeCompare(b.first_name)
            )
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'attendees',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log('Attendee UPDATE:', payload.new)
          setAttendees((prev) =>
            prev.map((a) => (a.id === payload.new.id ? (payload.new as Attendee) : a))
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'attendees',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log('Attendee DELETE:', payload.old)
          setAttendees((prev) => prev.filter((a) => a.id !== payload.old.id))
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status for ${channelName}:`, status)
      })

    // Cleanup subscription on unmount or eventId change
    return () => {
      console.log(`Unsubscribing from ${channelName}`)
      supabase.removeChannel(channel)
    }
  }, [eventId, fetchAttendees])

  return {
    attendees,
    loading,
    error,
    refetch: fetchAttendees,
  }
}
