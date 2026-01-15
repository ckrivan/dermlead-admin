import { createClient } from '@/lib/supabase/client'
import type { AttendeeGroup, AttendeeGroupMember, Attendee } from '@/types/database'

export interface GroupWithMembers extends AttendeeGroup {
  members: Attendee[]
  member_count: number
}

export const DEFAULT_GROUPS = [
  { name: 'Admin', color: '#ef4444', description: 'Event administrators and organizers' },
  { name: 'Attendee', color: '#3b82f6', description: 'General event attendees' },
  { name: 'Sponsor', color: '#f59e0b', description: 'Event sponsors and exhibitors' },
  { name: 'Speaker', color: '#8b5cf6', description: 'Speakers and presenters' },
  { name: 'VIP', color: '#10b981', description: 'VIP guests and special invitees' },
]

export async function getGroups(eventId: string): Promise<AttendeeGroup[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('attendee_groups')
    .select('*')
    .eq('event_id', eventId)
    .order('name')

  if (error) {
    console.error('Error fetching groups:', error)
    throw error
  }

  return data || []
}

export async function getGroupWithMembers(groupId: string): Promise<GroupWithMembers | null> {
  const supabase = createClient()

  const { data: group, error: groupError } = await supabase
    .from('attendee_groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (groupError) {
    console.error('Error fetching group:', groupError)
    return null
  }

  // Fetch members
  const { data: memberLinks, error: membersError } = await supabase
    .from('attendee_group_members')
    .select('attendee_id')
    .eq('group_id', groupId)

  if (membersError) {
    console.error('Error fetching group members:', membersError)
  }

  const attendeeIds = (memberLinks || []).map((m) => m.attendee_id)
  let members: Attendee[] = []

  if (attendeeIds.length > 0) {
    const { data: attendees } = await supabase
      .from('attendees')
      .select('*')
      .in('id', attendeeIds)
      .order('full_name')

    members = attendees || []
  }

  return {
    ...group,
    members,
    member_count: members.length,
  }
}

export async function createGroup(
  group: Omit<AttendeeGroup, 'id' | 'created_at'>
): Promise<AttendeeGroup> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('attendee_groups')
    .insert(group)
    .select()
    .single()

  if (error) {
    console.error('Error creating group:', error)
    throw error
  }

  return data
}

export async function updateGroup(
  id: string,
  updates: Partial<Omit<AttendeeGroup, 'id' | 'created_at'>>
): Promise<AttendeeGroup> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('attendee_groups')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating group:', error)
    throw error
  }

  return data
}

export async function deleteGroup(id: string): Promise<void> {
  const supabase = createClient()

  // Delete member associations first
  await supabase.from('attendee_group_members').delete().eq('group_id', id)

  const { error } = await supabase.from('attendee_groups').delete().eq('id', id)

  if (error) {
    console.error('Error deleting group:', error)
    throw error
  }
}

export async function addMembersToGroup(
  groupId: string,
  attendeeIds: string[]
): Promise<void> {
  const supabase = createClient()

  const members = attendeeIds.map((attendeeId) => ({
    group_id: groupId,
    attendee_id: attendeeId,
  }))

  const { error } = await supabase.from('attendee_group_members').insert(members)

  if (error) {
    console.error('Error adding members to group:', error)
    throw error
  }
}

export async function removeMemberFromGroup(
  groupId: string,
  attendeeId: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('attendee_group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('attendee_id', attendeeId)

  if (error) {
    console.error('Error removing member from group:', error)
    throw error
  }
}

export async function getAttendeeGroups(attendeeId: string): Promise<AttendeeGroup[]> {
  const supabase = createClient()

  const { data: memberLinks, error: linksError } = await supabase
    .from('attendee_group_members')
    .select('group_id')
    .eq('attendee_id', attendeeId)

  if (linksError) {
    console.error('Error fetching attendee groups:', linksError)
    return []
  }

  const groupIds = (memberLinks || []).map((m) => m.group_id)
  if (groupIds.length === 0) return []

  const { data: groups, error: groupsError } = await supabase
    .from('attendee_groups')
    .select('*')
    .in('id', groupIds)

  if (groupsError) {
    console.error('Error fetching groups:', groupsError)
    return []
  }

  return groups || []
}

export async function initializeDefaultGroups(eventId: string): Promise<AttendeeGroup[]> {
  const supabase = createClient()
  const createdGroups: AttendeeGroup[] = []

  for (const defaultGroup of DEFAULT_GROUPS) {
    const { data, error } = await supabase
      .from('attendee_groups')
      .insert({
        event_id: eventId,
        name: defaultGroup.name,
        color: defaultGroup.color,
        description: defaultGroup.description,
      })
      .select()
      .single()

    if (!error && data) {
      createdGroups.push(data)
    }
  }

  return createdGroups
}

export async function bulkCreateGroups(
  eventId: string,
  groups: Array<{
    name: string
    description?: string
    color?: string
  }>
): Promise<{ created: number; errors: string[] }> {
  const supabase = createClient()
  const errors: string[] = []
  let created = 0

  for (const group of groups) {
    if (!group.name?.trim()) {
      errors.push('Skipped row: missing name')
      continue
    }

    const { error } = await supabase.from('attendee_groups').insert({
      event_id: eventId,
      name: group.name.trim(),
      description: group.description?.trim() || null,
      color: group.color?.trim() || '#3b82f6',
    })

    if (error) {
      errors.push(`Failed to create "${group.name}": ${error.message}`)
    } else {
      created++
    }
  }

  return { created, errors }
}
