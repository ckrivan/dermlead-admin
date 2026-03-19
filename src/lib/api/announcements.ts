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
      .from('event_groups')
      .select('*')
      .in('id', announcement.target_groups)

    groups = groupsData || []
  }

  return {
    ...announcement,
    groups,
  }
}

export async function getBadgeTypeCounts(eventId: string): Promise<Record<string, number>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('attendees')
    .select('badge_type')
    .eq('event_id', eventId)

  if (error) {
    console.error('Error fetching badge type counts:', error)
    return {}
  }

  const counts: Record<string, number> = {}
  let total = 0
  for (const row of data || []) {
    const bt = row.badge_type || 'attendee'
    counts[bt] = (counts[bt] || 0) + 1
    total++
  }
  counts._total = total
  return counts
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

  // Fetch the announcement first to get the linked community_post_id
  const { data: announcement } = await supabase
    .from('announcements')
    .select('community_post_id')
    .eq('id', id)
    .single()

  // Delete the announcement
  const { error } = await supabase.from('announcements').delete().eq('id', id)

  if (error) {
    console.error('Error deleting announcement:', error)
    throw error
  }

  // Also delete the linked community post so it disappears from mobile app
  if (announcement?.community_post_id) {
    await supabase.from('community_posts').delete().eq('id', announcement.community_post_id)
  }
}

export async function sendAnnouncement(id: string): Promise<{ announcement: Announcement; pushResult?: { sent: number; total: number; error?: string } }> {
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

  // Use stored sender_name or fall back to profile lookup
  const user = (await supabase.auth.getUser()).data.user
  let senderName = data.sender_name || 'Admin'
  if (!data.sender_name && user?.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, first_name, last_name')
      .eq('id', user.id)
      .maybeSingle()
    if (profile) {
      senderName = profile.full_name
        || [profile.first_name, profile.last_name].filter(Boolean).join(' ')
        || 'Admin'
    }
  }

  // Create community post and link to announcement
  // Pre-generate UUID so we can set community_post_id on the announcement BEFORE
  // inserting the community post (prevents the DB trigger from creating a duplicate)
  let communityPostId: string | null = null
  try {
    const postId = crypto.randomUUID()

    // Set community_post_id first so the trigger sees it
    await supabase.from('announcements')
      .update({ community_post_id: postId })
      .eq('id', id)

    const { data: postData } = await supabase.from('community_posts').insert({
      id: postId,
      event_id: data.event_id,
      author_id: user?.id ?? null,
      author_name: senderName,
      title: data.title,
      content: data.message,
      post_type: 'announcement',
      is_pinned: true,
      target_badge_types: data.target_badge_types ?? null,
    }).select('id').single()
    communityPostId = postData?.id ?? null
  } catch (postError) {
    console.error('Failed to create community post (non-critical):', postError)
  }

  // Trigger push notification via Edge Function
  let pushResult: { sent: number; total: number; error?: string } | undefined
  try {
    const preview = data.message.length > 100 ? `${data.message.substring(0, 97)}...` : data.message
    const pushRoute = communityPostId ? `/community/${communityPostId}` : '/community'

    const pushBody: Record<string, unknown> = {
      type: 'announcement',
      eventId: data.event_id,
      senderId: user?.id,
      title: senderName,
      body: `${data.title}\n${preview}`,
      route: pushRoute,
    }

    // Pass badge type targeting if specified
    if (data.target_badge_types && data.target_badge_types.length > 0) {
      pushBody.badgeTypes = data.target_badge_types
    }

    const { data: pushData, error: pushError } = await supabase.functions.invoke('send-push', {
      body: pushBody,
    })

    if (pushError) {
      pushResult = { sent: 0, total: 0, error: String(pushError) }
    } else {
      pushResult = pushData as { sent: number; total: number }
    }
  } catch (pushError) {
    console.error('Push notification failed (non-critical):', pushError)
    pushResult = { sent: 0, total: 0, error: String(pushError) }
  }

  return { announcement: data, pushResult }
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
