import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/types/database'

export async function getEvents(): Promise<Event[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: false })

  if (error) {
    console.error('Error fetching events:', error)
    throw error
  }

  return data || []
}

export async function getEvent(id: string): Promise<Event | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching event:', error)
    return null
  }

  return data
}

export async function createEvent(
  event: Omit<Event, 'id' | 'created_at' | 'updated_at'>
): Promise<Event> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select()
    .single()

  if (error) {
    console.error('Error creating event:', error)
    throw error
  }

  return data
}

export async function updateEvent(
  id: string,
  updates: Partial<Omit<Event, 'id' | 'created_at' | 'updated_at'>>
): Promise<Event> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating event:', error)
    throw error
  }

  return data
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('events').delete().eq('id', id)

  if (error) {
    console.error('Error deleting event:', error)
    throw error
  }
}

export async function archiveEvent(id: string): Promise<Event> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('events')
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error archiving event:', error)
    throw error
  }

  return data
}

export async function unarchiveEvent(id: string): Promise<Event> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('events')
    .update({
      archived_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error unarchiving event:', error)
    throw error
  }

  return data
}

export async function uploadEventBanner(
  eventId: string,
  file: File
): Promise<string> {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${eventId}-banner.${fileExt}`
  const filePath = `events/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('events')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error('Error uploading banner:', uploadError)
    throw uploadError
  }

  const { data } = supabase.storage.from('events').getPublicUrl(filePath)

  return data.publicUrl
}

export async function uploadEventLogo(
  eventId: string,
  file: File
): Promise<string> {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${eventId}-logo.${fileExt}`
  const filePath = `events/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('events')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error('Error uploading logo:', uploadError)
    throw uploadError
  }

  const { data } = supabase.storage.from('events').getPublicUrl(filePath)

  return data.publicUrl
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function getEventStatus(event: Event): 'upcoming' | 'active' | 'past' {
  const now = new Date()
  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)

  if (now < startDate) return 'upcoming'
  if (now > endDate) return 'past'
  return 'active'
}

export async function getEventStats(eventId: string): Promise<{
  attendeesCount: number
  leadsCount: number
  sessionsCount: number
  speakersCount: number
}> {
  const supabase = createClient()

  const [attendees, leads, sessions, speakers] = await Promise.all([
    supabase.from('attendees').select('id', { count: 'exact', head: true }).eq('event_id', eventId),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('event_id', eventId),
    supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('event_id', eventId),
    supabase.from('speakers').select('id', { count: 'exact', head: true }).eq('event_id', eventId),
  ])

  return {
    attendeesCount: attendees.count || 0,
    leadsCount: leads.count || 0,
    sessionsCount: sessions.count || 0,
    speakersCount: speakers.count || 0,
  }
}
