import { createClient } from '@/lib/supabase/client'
import type { Session, SessionSpeaker, Speaker } from '@/types/database'
import { normalizeSessionRow, SessionCSVRow } from '@/lib/utils/csv'

export interface SessionWithSpeakers extends Session {
  speakers: Array<{
    speaker: Speaker
    role: string
    display_order: number
  }>
}

export async function getSessions(eventId?: string): Promise<Session[]> {
  const supabase = createClient()

  let query = supabase
    .from('sessions')
    .select('*')
    .order('session_date')
    .order('start_time')

  if (eventId) {
    query = query.eq('event_id', eventId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching sessions:', error)
    throw error
  }

  return data || []
}

export async function getSessionsWithSpeakers(eventId: string): Promise<SessionWithSpeakers[]> {
  const supabase = createClient()

  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('*')
    .eq('event_id', eventId)
    .order('session_date')
    .order('start_time')

  if (sessionsError) {
    console.error('Error fetching sessions:', sessionsError)
    throw sessionsError
  }

  if (!sessions || sessions.length === 0) {
    return []
  }

  // Get all session speakers in one query
  const sessionIds = sessions.map((s) => s.id)
  const { data: sessionSpeakers, error: speakersError } = await supabase
    .from('session_speakers')
    .select(`
      session_id,
      role,
      display_order,
      speakers (*)
    `)
    .in('session_id', sessionIds)
    .order('display_order')

  if (speakersError) {
    console.error('Error fetching session speakers:', speakersError)
  }

  // Group speakers by session
  const speakersBySession = new Map<string, SessionWithSpeakers['speakers']>()
  ;(sessionSpeakers || []).forEach((ss) => {
    const sessionId = ss.session_id
    if (!speakersBySession.has(sessionId)) {
      speakersBySession.set(sessionId, [])
    }
    speakersBySession.get(sessionId)!.push({
      speaker: ss.speakers as unknown as Speaker,
      role: ss.role,
      display_order: ss.display_order,
    })
  })

  return sessions.map((session) => ({
    ...session,
    speakers: speakersBySession.get(session.id) || [],
  }))
}

export async function getSession(id: string): Promise<SessionWithSpeakers | null> {
  const supabase = createClient()

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (sessionError) {
    console.error('Error fetching session:', sessionError)
    return null
  }

  // Fetch session speakers
  const { data: sessionSpeakers, error: speakersError } = await supabase
    .from('session_speakers')
    .select(`
      role,
      display_order,
      speakers (*)
    `)
    .eq('session_id', id)
    .order('display_order')

  if (speakersError) {
    console.error('Error fetching session speakers:', speakersError)
  }

  const speakers = (sessionSpeakers || []).map((ss) => ({
    speaker: ss.speakers as unknown as Speaker,
    role: ss.role,
    display_order: ss.display_order,
  }))

  return {
    ...session,
    speakers,
  }
}

export async function createSession(
  session: Omit<Session, 'id' | 'created_at' | 'updated_at'>,
  speakerAssignments?: Array<{ speakerId: string; role: string }>
): Promise<Session> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('sessions')
    .insert(session)
    .select()
    .single()

  if (error) {
    console.error('Error creating session:', error)
    throw error
  }

  // Add speaker assignments
  if (speakerAssignments && speakerAssignments.length > 0) {
    const assignments = speakerAssignments.map((sa, index) => ({
      session_id: data.id,
      speaker_id: sa.speakerId,
      role: sa.role,
      display_order: index,
    }))

    const { error: assignError } = await supabase
      .from('session_speakers')
      .insert(assignments)

    if (assignError) {
      console.error('Error assigning speakers:', assignError)
    }
  }

  return data
}

export async function updateSession(
  id: string,
  updates: Partial<Omit<Session, 'id' | 'created_at' | 'updated_at'>>,
  speakerAssignments?: Array<{ speakerId: string; role: string }>
): Promise<Session> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('sessions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating session:', error)
    throw error
  }

  // Update speaker assignments if provided
  if (speakerAssignments !== undefined) {
    // Remove existing assignments
    await supabase.from('session_speakers').delete().eq('session_id', id)

    // Add new assignments
    if (speakerAssignments.length > 0) {
      const assignments = speakerAssignments.map((sa, index) => ({
        session_id: id,
        speaker_id: sa.speakerId,
        role: sa.role,
        display_order: index,
      }))

      const { error: assignError } = await supabase
        .from('session_speakers')
        .insert(assignments)

      if (assignError) {
        console.error('Error assigning speakers:', assignError)
      }
    }
  }

  return data
}

export async function deleteSession(id: string): Promise<void> {
  const supabase = createClient()

  // Delete speaker assignments first (cascade should handle this, but being explicit)
  await supabase.from('session_speakers').delete().eq('session_id', id)

  const { error } = await supabase.from('sessions').delete().eq('id', id)

  if (error) {
    console.error('Error deleting session:', error)
    throw error
  }
}

export async function duplicateSession(id: string): Promise<Session> {
  const supabase = createClient()

  // Get the original session
  const { data: original, error: fetchError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !original) {
    throw new Error('Failed to fetch original session')
  }

  // Get speaker assignments
  const { data: speakerAssignments } = await supabase
    .from('session_speakers')
    .select('speaker_id, role, display_order')
    .eq('session_id', id)

  // Create the duplicate
  const { id: _, created_at, updated_at, ...sessionData } = original
  const { data: duplicate, error: createError } = await supabase
    .from('sessions')
    .insert({
      ...sessionData,
      title: `${sessionData.title} (Copy)`,
    })
    .select()
    .single()

  if (createError || !duplicate) {
    throw new Error('Failed to create duplicate session')
  }

  // Copy speaker assignments
  if (speakerAssignments && speakerAssignments.length > 0) {
    const newAssignments = speakerAssignments.map((sa) => ({
      session_id: duplicate.id,
      speaker_id: sa.speaker_id,
      role: sa.role,
      display_order: sa.display_order,
    }))

    await supabase.from('session_speakers').insert(newAssignments)
  }

  return duplicate
}

export async function bulkCreateSessions(
  eventId: string,
  rawSessions: SessionCSVRow[],
  existingSpeakers: Array<{ id: string; full_name: string }>
): Promise<{ created: number; errors: string[] }> {
  const supabase = createClient()
  const errors: string[] = []
  let created = 0

  // Create a lookup map for speakers by name (case-insensitive)
  const speakerMap = new Map<string, string>()
  existingSpeakers.forEach((s) => {
    speakerMap.set(s.full_name.toLowerCase().trim(), s.id)
  })

  for (const rawSession of rawSessions) {
    // Normalize from Whova or our format
    const session = normalizeSessionRow(rawSession)

    if (!session.title) {
      errors.push(`Skipped row: missing title`)
      continue
    }
    if (!session.session_date || !session.start_time || !session.end_time) {
      errors.push(`Skipped "${session.title}": missing date or time`)
      continue
    }

    // Create the session
    const { data: createdSession, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        event_id: eventId,
        title: session.title,
        description: session.description,
        session_type: session.session_type || 'presentation',
        session_date: session.session_date,
        start_time: session.start_time,
        end_time: session.end_time,
        location: session.location,
        track: session.track,
        objectives: null,
      })
      .select()
      .single()

    if (sessionError) {
      errors.push(`Failed to create "${session.title}": ${sessionError.message}`)
      continue
    }

    created++

    // Assign speakers if provided
    if (session.speaker_names) {
      const speakerNames = session.speaker_names
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean)

      for (let i = 0; i < speakerNames.length; i++) {
        const name = speakerNames[i]
        const speakerId = speakerMap.get(name.toLowerCase())

        if (speakerId) {
          await supabase.from('session_speakers').insert({
            session_id: createdSession.id,
            speaker_id: speakerId,
            role: 'speaker',
            display_order: i,
          })
        } else {
          errors.push(`Speaker not found for "${session.title}": "${name}"`)
        }
      }
    }
  }

  return { created, errors }
}

export const SESSION_TYPES = [
  { value: 'keynote', label: 'Keynote' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'panel', label: 'Panel Discussion' },
  { value: 'symposium', label: 'Symposium' },
  { value: 'breakout', label: 'Breakout Session' },
  { value: 'networking', label: 'Networking' },
  { value: 'meal', label: 'Meal Break' },
  { value: 'break', label: 'Break' },
  { value: 'registration', label: 'Registration' },
  { value: 'other', label: 'Other' },
]

export const SPEAKER_ROLES = [
  { value: 'speaker', label: 'Speaker' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'panelist', label: 'Panelist' },
  { value: 'chair', label: 'Chair' },
  { value: 'co-chair', label: 'Co-Chair' },
]
