import { createClient } from '@/lib/supabase/client'
import type { Speaker } from '@/types/database'
import { normalizeSpeakerRow, SpeakerCSVRow } from '@/lib/utils/csv'

export async function getSpeakers(eventId?: string): Promise<Speaker[]> {
  const supabase = createClient()

  let query = supabase
    .from('speakers')
    .select('*')
    .order('full_name')

  if (eventId) {
    query = query.eq('event_id', eventId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching speakers:', error)
    throw error
  }

  return data || []
}

export async function getSpeaker(id: string): Promise<Speaker | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('speakers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching speaker:', error)
    return null
  }

  return data
}

export async function createSpeaker(
  speaker: Omit<Speaker, 'id' | 'created_at' | 'updated_at'>
): Promise<Speaker> {
  const res = await fetch('/api/speakers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ speaker }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to create speaker')
  }
  return await res.json()
}

export async function updateSpeaker(
  id: string,
  updates: Partial<Omit<Speaker, 'id' | 'created_at' | 'updated_at'>>
): Promise<Speaker> {
  const res = await fetch('/api/speakers', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, updates }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to update speaker')
  }
  return await res.json()
}

export async function deleteSpeaker(id: string): Promise<void> {
  const res = await fetch('/api/speakers', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to delete speaker')
  }
}

export async function bulkCreateSpeakers(
  eventId: string,
  speakers: SpeakerCSVRow[]
): Promise<{ created: number; errors: string[] }> {
  const errors: string[] = []
  let created = 0

  for (const rawSpeaker of speakers) {
    const speaker = normalizeSpeakerRow(rawSpeaker)

    if (!speaker.full_name) {
      errors.push(`Skipped row: missing name`)
      continue
    }

    try {
      await createSpeaker({
        event_id: eventId,
        full_name: speaker.full_name,
        credentials: speaker.credentials || null,
        bio: speaker.bio || null,
        specialty: speaker.specialty || null,
        institution: speaker.institution || null,
        city: null,
        state: null,
        email: speaker.email || null,
        linkedin_url: speaker.linkedin_url || null,
        website_url: speaker.website_url || null,
        photo_url: null,
        role: ['faculty'],
      })
      created++
    } catch (e) {
      errors.push(`Failed to create "${speaker.full_name}": ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return { created, errors }
}

export async function uploadSpeakerPhoto(
  speakerId: string,
  file: File
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('speakerId', speakerId)

  const res = await fetch('/api/speakers/upload', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to upload photo')
  }

  const { publicUrl } = await res.json()
  return publicUrl
}
