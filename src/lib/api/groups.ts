import { createClient } from '@/lib/supabase/client'
import type { EventGroup, GroupMember, EntityType, Attendee } from '@/types/database'

export interface GroupWithMembers extends EventGroup {
  members: GroupMember[]
  member_count: number
}

export const DEFAULT_GROUPS = [
  { name: 'Admin', color: '#ef4444', description: 'Event administrators and organizers' },
  { name: 'Attendee', color: '#3b82f6', description: 'General event attendees' },
  { name: 'Sponsor', color: '#f59e0b', description: 'Event sponsors and exhibitors' },
  { name: 'Speaker', color: '#8b5cf6', description: 'Speakers and presenters' },
  { name: 'VIP', color: '#10b981', description: 'VIP guests and special invitees' },
]

// ============ Group CRUD ============

export async function getGroups(eventId: string): Promise<EventGroup[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('event_groups')
    .select('*')
    .eq('event_id', eventId)
    .order('name')

  if (error) {
    console.error('Error fetching groups:', error)
    throw error
  }

  return data || []
}

export async function getGroup(groupId: string): Promise<EventGroup | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('event_groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (error) {
    console.error('Error fetching group:', error)
    return null
  }

  return data
}

export async function createGroup(
  group: Omit<EventGroup, 'id' | 'created_at'>
): Promise<EventGroup> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('event_groups')
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
  updates: Partial<Omit<EventGroup, 'id' | 'created_at'>>
): Promise<EventGroup> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('event_groups')
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

  // group_members will cascade delete automatically due to FK constraint
  const { error } = await supabase.from('event_groups').delete().eq('id', id)

  if (error) {
    console.error('Error deleting group:', error)
    throw error
  }
}

// ============ Group Members ============

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)

  if (error) {
    console.error('Error fetching group members:', error)
    return []
  }

  return data || []
}

export async function addToGroup(
  groupId: string,
  entityType: EntityType,
  entityId: string
): Promise<GroupMember> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('group_members')
    .insert({
      group_id: groupId,
      entity_type: entityType,
      entity_id: entityId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding to group:', error)
    throw error
  }

  return data
}

export async function removeFromGroup(
  groupId: string,
  entityType: EntityType,
  entityId: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)

  if (error) {
    console.error('Error removing from group:', error)
    throw error
  }
}

export async function getEntityGroups(
  entityType: EntityType,
  entityId: string
): Promise<EventGroup[]> {
  const supabase = createClient()

  // First get group IDs for this entity
  const { data: memberLinks, error: linksError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)

  if (linksError) {
    console.error('Error fetching entity groups:', linksError)
    return []
  }

  const groupIds = (memberLinks || []).map((m: { group_id: string }) => m.group_id)
  if (groupIds.length === 0) return []

  // Then get the actual group details
  const { data: groups, error: groupsError } = await supabase
    .from('event_groups')
    .select('*')
    .in('id', groupIds)

  if (groupsError) {
    console.error('Error fetching groups:', groupsError)
    return []
  }

  return groups || []
}

export async function setEntityGroups(
  entityType: EntityType,
  entityId: string,
  groupIds: string[]
): Promise<void> {
  const supabase = createClient()

  // Remove all existing group memberships for this entity
  await supabase
    .from('group_members')
    .delete()
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)

  // Add new group memberships
  if (groupIds.length > 0) {
    const members = groupIds.map((groupId) => ({
      group_id: groupId,
      entity_type: entityType,
      entity_id: entityId,
    }))

    const { error } = await supabase.from('group_members').insert(members)

    if (error) {
      console.error('Error setting entity groups:', error)
      throw error
    }
  }
}

// ============ Bulk Operations ============

export async function addManyToGroup(
  groupId: string,
  entityType: EntityType,
  entityIds: string[]
): Promise<void> {
  const supabase = createClient()

  const members = entityIds.map((entityId) => ({
    group_id: groupId,
    entity_type: entityType,
    entity_id: entityId,
  }))

  const { error } = await supabase
    .from('group_members')
    .upsert(members, { onConflict: 'group_id,entity_type,entity_id' })

  if (error) {
    console.error('Error bulk adding to group:', error)
    throw error
  }
}

export async function initializeDefaultGroups(eventId: string): Promise<EventGroup[]> {
  const supabase = createClient()
  const createdGroups: EventGroup[] = []

  for (const defaultGroup of DEFAULT_GROUPS) {
    const { data, error } = await supabase
      .from('event_groups')
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

export interface GroupCSVRow {
  name: string
  description?: string
  color?: string
}

export async function bulkCreateGroups(
  eventId: string,
  rows: GroupCSVRow[]
): Promise<{ created: number; errors: string[] }> {
  const supabase = createClient()
  const errors: string[] = []
  let created = 0

  for (const row of rows) {
    if (!row.name?.trim()) {
      errors.push('Skipped row with empty name')
      continue
    }

    const { error } = await supabase.from('event_groups').insert({
      event_id: eventId,
      name: row.name.trim(),
      description: row.description?.trim() || null,
      color: row.color?.trim() || '#3b82f6',
    })

    if (error) {
      if (error.code === '23505') {
        errors.push(`Group "${row.name}" already exists`)
      } else {
        errors.push(`Error creating "${row.name}": ${error.message}`)
      }
    } else {
      created++
    }
  }

  return { created, errors }
}

// ============ Legacy Compatibility ============

// For backward compatibility with existing code using attendee-specific functions
export async function getAttendeeGroups(attendeeId: string): Promise<EventGroup[]> {
  return getEntityGroups('attendee', attendeeId)
}

export async function addMembersToGroup(groupId: string, attendeeIds: string[]): Promise<void> {
  return addManyToGroup(groupId, 'attendee', attendeeIds)
}

export async function removeMemberFromGroup(groupId: string, attendeeId: string): Promise<void> {
  return removeFromGroup(groupId, 'attendee', attendeeId)
}
