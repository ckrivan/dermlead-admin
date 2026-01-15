import { createClient } from '@/lib/supabase/client'
import type { Announcement, AttendeeGroup } from '@/types/database'

export interface AnnouncementWithGroups extends Announcement {
  groups?: AttendeeGroup[]
}

export async function getAnnouncements(eventId: string): Promise<Announcement[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching announcements:', error)
    throw error
  }

  return data || []
}

export async function getAnnouncement(id: string): Promise<AnnouncementWithGroups | null> {
  const supabase = createClient()

  const { data: announcement, error: announcementError } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .single()

  if (announcementError) {
    console.error('Error fetching announcement:', announcementError)
    return null
  }

  // Fetch target groups if specified
  let groups: AttendeeGroup[] = []
  if (announcement.target_groups && announcement.target_groups.length > 0) {
    const { data: groupsData } = await supabase
      .from('attendee_groups')
      .select('*')
      .in('id', announcement.target_groups)

    groups = groupsData || []
  }

  return {
    ...announcement,
    groups,
  }
}

export async function createAnnouncement(
  announcement: Omit<Announcement, 'id' | 'created_at' | 'updated_at' | 'sent_at'>
): Promise<Announcement> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('announcements')
    .insert(announcement)
    .select()
    .single()

  if (error) {
    console.error('Error creating announcement:', error)
    throw error
  }

  return data
}

export async function updateAnnouncement(
  id: string,
  updates: Partial<Omit<Announcement, 'id' | 'created_at' | 'updated_at'>>
): Promise<Announcement> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('announcements')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating announcement:', error)
    throw error
  }

  return data
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('announcements').delete().eq('id', id)

  if (error) {
    console.error('Error deleting announcement:', error)
    throw error
  }
}

export async function sendAnnouncement(id: string): Promise<Announcement> {
  const supabase = createClient()

  // Mark as sent
  const { data, error } = await supabase
    .from('announcements')
    .update({
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error sending announcement:', error)
    throw error
  }

  // TODO: Integrate with push notification service (Firebase, OneSignal, etc.)
  // This would typically:
  // 1. Get target attendees based on target_groups
  // 2. Fetch their device tokens
  // 3. Send push notifications via FCM/APNs

  return data
}

export async function getUnsentAnnouncements(eventId: string): Promise<Announcement[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('event_id', eventId)
    .is('sent_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching unsent announcements:', error)
    throw error
  }

  return data || []
}

export async function getSentAnnouncements(eventId: string): Promise<Announcement[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('event_id', eventId)
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: false })

  if (error) {
    console.error('Error fetching sent announcements:', error)
    throw error
  }

  return data || []
}
