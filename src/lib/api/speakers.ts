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
  const supabase = createClient()

  const { data, error } = await supabase
    .from('speakers')
    .insert(speaker)
    .select()
    .single()

  if (error) {
    console.error('Error creating speaker:', error)
    throw error
  }

  return data
}

export async function updateSpeaker(
  id: string,
  updates: Partial<Omit<Speaker, 'id' | 'created_at' | 'updated_at'>>
): Promise<Speaker> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('speakers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating speaker:', error)
    throw error
  }

  return data
}

export async function deleteSpeaker(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('speakers').delete().eq('id', id)

  if (error) {
    console.error('Error deleting speaker:', error)
    throw error
  }
}

export async function bulkCreateSpeakers(
  eventId: string,
  speakers: SpeakerCSVRow[]
): Promise<{ created: number; errors: string[] }> {
  const supabase = createClient()
  const errors: string[] = []
  let created = 0

  for (const rawSpeaker of speakers) {
    // Normalize from Whova or our format
    const speaker = normalizeSpeakerRow(rawSpeaker)

    if (!speaker.full_name) {
      errors.push(`Skipped row: missing name`)
      continue
    }

    const { error } = await supabase.from('speakers').insert({
      event_id: eventId,
      full_name: speaker.full_name,
      credentials: speaker.credentials,
      bio: speaker.bio,
      specialty: speaker.specialty,
      institution: speaker.institution,
      email: speaker.email,
      linkedin_url: speaker.linkedin_url,
      website_url: speaker.website_url,
      photo_url: null,
    })

    if (error) {
      errors.push(`Failed to create "${speaker.full_name}": ${error.message}`)
    } else {
      created++
    }
  }

  return { created, errors }
}

export async function uploadSpeakerPhoto(
  speakerId: string,
  file: File
): Promise<string> {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${speakerId}.${fileExt}`
  const filePath = `speakers/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('speakers')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error('Error uploading photo:', uploadError)
    throw uploadError
  }

  const { data } = supabase.storage.from('speakers').getPublicUrl(filePath)

  return data.publicUrl
}
