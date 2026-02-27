import { createClient } from '@/lib/supabase/client'
import type { Attendee, AttendeeGroup, AttendeeGroupMember } from '@/types/database'

export interface AttendeeWithGroups extends Attendee {
  full_name: string  // Computed from first_name + last_name
  groups: AttendeeGroup[]
}

export async function searchAttendeeRoster(query: string): Promise<Attendee[]> {
  if (!query.trim()) return []
  const supabase = createClient()

  const { data, error } = await supabase
    .from('attendees')
    .select('*')
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error

  // Deduplicate by email, keeping the most recent record
  const seen = new Set<string>()
  return (data || []).filter((a: Attendee) => {
    if (seen.has(a.email)) return false
    seen.add(a.email)
    return true
  })
}

export async function getAttendees(eventId: string): Promise<Attendee[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('attendees')
    .select('*')
    .eq('event_id', eventId)
    .order('first_name')

  if (error) {
    console.error('Error fetching attendees:', error)
    throw error
  }

  return data || []
}

export async function getAttendeesWithGroups(eventId: string): Promise<AttendeeWithGroups[]> {
  const supabase = createClient()

  // Get all attendees for the event
  const { data: attendees, error: attendeesError } = await supabase
    .from('attendees')
    .select('*')
    .eq('event_id', eventId)
    .order('first_name')

  if (attendeesError) {
    console.error('Error fetching attendees:', attendeesError)
    throw attendeesError
  }

  if (!attendees || attendees.length === 0) {
    return []
  }

  // Get all groups for the event
  const { data: groups, error: groupsError } = await supabase
    .from('attendee_groups')
    .select('*')
    .eq('event_id', eventId)

  if (groupsError) {
    console.error('Error fetching groups:', groupsError)
  }

  // Get all group memberships
  const attendeeIds = attendees.map((a: Attendee) => a.id)
  const { data: memberships, error: membershipsError } = await supabase
    .from('attendee_group_members')
    .select('*')
    .in('attendee_id', attendeeIds)

  if (membershipsError) {
    console.error('Error fetching memberships:', membershipsError)
  }

  // Create a map of group_id to group
  const groupMap = new Map<string, AttendeeGroup>()
  ;(groups || []).forEach((g: AttendeeGroup) => groupMap.set(g.id, g))

  // Create a map of attendee_id to groups
  const attendeeGroups = new Map<string, AttendeeGroup[]>()
  ;(memberships || []).forEach((m: AttendeeGroupMember) => {
    const group = groupMap.get(m.group_id)
    if (group) {
      if (!attendeeGroups.has(m.attendee_id)) {
        attendeeGroups.set(m.attendee_id, [])
      }
      attendeeGroups.get(m.attendee_id)!.push(group)
    }
  })

  return (attendees as Attendee[]).map((attendee) => ({
    ...attendee,
    full_name: `${attendee.first_name} ${attendee.last_name}`.trim(),
    groups: attendeeGroups.get(attendee.id) || [],
  }))
}

export async function getAttendee(id: string): Promise<AttendeeWithGroups | null> {
  const supabase = createClient()

  const { data: attendee, error } = await supabase
    .from('attendees')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching attendee:', error)
    return null
  }

  // Get groups for this attendee
  const { data: memberships } = await supabase
    .from('attendee_group_members')
    .select('group_id, attendee_groups(*)')
    .eq('attendee_id', id)

  const groups = (memberships || [])
    .map((m: { attendee_groups: unknown }) => m.attendee_groups as unknown as AttendeeGroup)
    .filter(Boolean)

  return {
    ...attendee,
    full_name: `${attendee.first_name} ${attendee.last_name}`.trim(),
    groups,
  }
}

export async function createAttendee(
  attendee: Omit<Attendee, 'id' | 'created_at'>,
  groupIds?: string[]
): Promise<Attendee> {
  const supabase = createClient()

  const { data, error } = await supabase.from('attendees').insert(attendee).select().single()

  if (error) {
    console.error('Error creating attendee:', error)
    throw error
  }

  // Add group memberships
  if (groupIds && groupIds.length > 0) {
    const memberships = groupIds.map((groupId) => ({
      attendee_id: data.id,
      group_id: groupId,
    }))

    await supabase.from('attendee_group_members').insert(memberships)
  }

  return data
}

export async function updateAttendee(
  id: string,
  updates: Partial<Omit<Attendee, 'id' | 'created_at'>>,
  groupIds?: string[]
): Promise<Attendee> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('attendees')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating attendee:', error)
    throw error
  }

  // Update group memberships if provided
  if (groupIds !== undefined) {
    // Remove existing memberships
    await supabase.from('attendee_group_members').delete().eq('attendee_id', id)

    // Add new memberships
    if (groupIds.length > 0) {
      const memberships = groupIds.map((groupId) => ({
        attendee_id: id,
        group_id: groupId,
      }))

      await supabase.from('attendee_group_members').insert(memberships)
    }
  }

  return data
}

export async function deleteAttendee(id: string): Promise<void> {
  const supabase = createClient()

  // Delete group memberships first
  await supabase.from('attendee_group_members').delete().eq('attendee_id', id)

  const { error } = await supabase.from('attendees').delete().eq('id', id)

  if (error) {
    console.error('Error deleting attendee:', error)
    throw error
  }
}

export async function checkInAttendee(id: string): Promise<Attendee> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('attendees')
    .update({ checked_in_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error checking in attendee:', error)
    throw error
  }

  return data
}

export async function undoCheckIn(id: string): Promise<Attendee> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('attendees')
    .update({ checked_in_at: null })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error undoing check-in:', error)
    throw error
  }

  return data
}

// Groups API
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

export async function createGroup(
  group: Omit<AttendeeGroup, 'id' | 'created_at'>
): Promise<AttendeeGroup> {
  const supabase = createClient()

  const { data, error } = await supabase.from('attendee_groups').insert(group).select().single()

  if (error) {
    console.error('Error creating group:', error)
    throw error
  }

  return data
}

export async function deleteGroup(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('attendee_groups').delete().eq('id', id)

  if (error) {
    console.error('Error deleting group:', error)
    throw error
  }
}

// Bulk import
export interface AttendeeCSVRow {
  full_name?: string  // Will be split into first_name/last_name
  first_name?: string
  last_name?: string
  email: string
  badge_type?: string  // was registration_type
  groups?: string // comma-separated group names
}

export async function bulkCreateAttendees(
  eventId: string,
  attendees: AttendeeCSVRow[],
  existingGroups: AttendeeGroup[]
): Promise<{ created: number; errors: string[] }> {
  const supabase = createClient()
  const errors: string[] = []
  let created = 0

  // Create a lookup map for groups by name (case-insensitive)
  const groupMap = new Map<string, string>()
  existingGroups.forEach((g) => {
    groupMap.set(g.name.toLowerCase().trim(), g.id)
  })

  // Track new groups that need to be created
  const newGroups = new Map<string, string>() // name -> id

  for (const row of attendees) {
    // Handle name - support both full_name and first_name/last_name
    let firstName = row.first_name?.trim() || ''
    let lastName = row.last_name?.trim() || ''

    if (!firstName && !lastName && row.full_name?.trim()) {
      // Split full_name into first and last
      const nameParts = row.full_name.trim().split(/\s+/)
      firstName = nameParts[0] || ''
      lastName = nameParts.slice(1).join(' ') || ''
    }

    if (!firstName) {
      errors.push('Skipped row: missing name')
      continue
    }
    if (!row.email?.trim()) {
      errors.push(`Skipped "${firstName} ${lastName}": missing email`)
      continue
    }

    // Generate QR data (JSON object)
    const qrData = {
      firstName,
      lastName,
      email: row.email.trim().toLowerCase(),
    }

    // Create the attendee
    const { data: createdAttendee, error: attendeeError } = await supabase
      .from('attendees')
      .insert({
        event_id: eventId,
        first_name: firstName,
        last_name: lastName,
        email: row.email.trim().toLowerCase(),
        badge_type: row.badge_type?.trim() || 'attendee',
        qr_data: qrData,
        profile_id: null,
        checked_in: false,
        checked_in_at: null,
      })
      .select()
      .single()

    if (attendeeError) {
      if (attendeeError.code === '23505') {
        errors.push(`Skipped "${firstName} ${lastName}": duplicate email`)
      } else {
        errors.push(`Failed to create "${firstName} ${lastName}": ${attendeeError.message}`)
      }
      continue
    }

    created++

    // Handle group assignments
    if (row.groups?.trim()) {
      const groupNames = row.groups
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean)

      for (const groupName of groupNames) {
        let groupId = groupMap.get(groupName.toLowerCase())

        // If group doesn't exist, create it
        if (!groupId) {
          // Check if we already created this group in this import
          groupId = newGroups.get(groupName.toLowerCase())

          if (!groupId) {
            // Create the new group
            const { data: newGroup, error: groupError } = await supabase
              .from('attendee_groups')
              .insert({
                event_id: eventId,
                name: groupName,
                color: '#3b82f6',
              })
              .select()
              .single()

            if (groupError || !newGroup) {
              errors.push(`Failed to create group "${groupName}": ${groupError?.message || 'Unknown error'}`)
              continue
            }

            groupId = newGroup.id
            newGroups.set(groupName.toLowerCase(), newGroup.id)
            groupMap.set(groupName.toLowerCase(), newGroup.id)
          }
        }

        // Assign attendee to group
        if (groupId) {
          await supabase.from('attendee_group_members').insert({
            attendee_id: createdAttendee.id,
            group_id: groupId,
          })
        }
      }
    }
  }

  return { created, errors }
}

export const BADGE_TYPES = [
  { value: 'attendee', label: 'Attendee' },
  { value: 'speaker', label: 'Speaker' },
  { value: 'exhibitor', label: 'Exhibitor' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'staff', label: 'Staff' },
  { value: 'vip', label: 'VIP' },
  { value: 'press', label: 'Press' },
]

// Alias for backward compatibility
export const REGISTRATION_TYPES = BADGE_TYPES
