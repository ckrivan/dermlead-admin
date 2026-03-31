import { createClient } from '@/lib/supabase/client'
import type { Exhibitor } from '@/types/database'
import { normalizeExhibitorRow, ExhibitorCSVRow } from '@/lib/utils/csv'

export async function getExhibitors(eventId: string): Promise<Exhibitor[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('exhibitors')
    .select('*')
    .eq('event_id', eventId)
    .order('company_name')

  if (error) {
    console.error('Error fetching exhibitors:', error)
    throw error
  }

  return data || []
}

export async function getExhibitor(id: string): Promise<Exhibitor | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('exhibitors')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching exhibitor:', error)
    return null
  }

  return data
}

export async function createExhibitor(
  exhibitor: Omit<Exhibitor, 'id' | 'created_at' | 'updated_at'>
): Promise<Exhibitor> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('exhibitors')
    .insert(exhibitor)
    .select()
    .single()

  if (error) {
    console.error('Error creating exhibitor:', error)
    throw error
  }

  return data
}

export async function updateExhibitor(
  id: string,
  updates: Partial<Omit<Exhibitor, 'id' | 'created_at'>>
): Promise<Exhibitor> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('exhibitors')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating exhibitor:', error)
    throw error
  }

  return data
}

export async function deleteExhibitor(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('exhibitors').delete().eq('id', id)

  if (error) {
    console.error('Error deleting exhibitor:', error)
    throw error
  }
}

export async function uploadExhibitorLogo(
  exhibitorId: string,
  file: File
): Promise<string> {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${exhibitorId}-logo.${fileExt}`
  const filePath = `exhibitors/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('events')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error('Error uploading exhibitor logo:', uploadError)
    throw uploadError
  }

  const { data } = supabase.storage.from('events').getPublicUrl(filePath)

  await updateExhibitor(exhibitorId, { logo_url: data.publicUrl })

  return data.publicUrl
}

export async function uploadExhibitorBanner(
  exhibitorId: string,
  file: File
): Promise<string> {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${exhibitorId}-banner.${fileExt}`
  const filePath = `exhibitors/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('events')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error('Error uploading exhibitor banner:', uploadError)
    throw uploadError
  }

  const { data } = supabase.storage.from('events').getPublicUrl(filePath)

  await updateExhibitor(exhibitorId, { banner_url: data.publicUrl })

  return data.publicUrl
}

export async function uploadExhibitorDocument(
  exhibitorId: string,
  file: File,
  title: string
): Promise<{ title: string; url: string }> {
  const supabase = createClient()

  const timestamp = Date.now()
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `exhibitors/${exhibitorId}/docs/${timestamp}-${sanitized}`

  const { error: uploadError } = await supabase.storage
    .from('events')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error('Error uploading exhibitor document:', uploadError)
    throw uploadError
  }

  const { data } = supabase.storage.from('events').getPublicUrl(filePath)

  return { title, url: data.publicUrl }
}

export async function deleteExhibitorDocument(documentUrl: string): Promise<void> {
  const supabase = createClient()

  try {
    const urlObj = new URL(documentUrl)
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/events\/(.+)/)
    if (pathMatch) {
      await supabase.storage.from('events').remove([pathMatch[1]])
    }
  } catch {
    console.error('Error deleting exhibitor document from storage')
  }
}

export const EXHIBITOR_CATEGORIES = [
  'Technology',
  'Pharmaceuticals',
  'Medical Devices',
  'Healthcare Services',
  'Education',
  'Research',
  'Publishing',
  'Consulting',
  'Software',
  'Other',
]

export async function bulkCreateExhibitors(
  eventId: string,
  rawExhibitors: ExhibitorCSVRow[]
): Promise<{ created: number; errors: string[] }> {
  const supabase = createClient()
  const errors: string[] = []
  let created = 0

  for (const rawExhibitor of rawExhibitors) {
    // Normalize from Whova or our format
    const exhibitor = normalizeExhibitorRow(rawExhibitor)

    if (!exhibitor.company_name) {
      errors.push('Skipped row: missing company name')
      continue
    }

    const { error } = await supabase.from('exhibitors').insert({
      event_id: eventId,
      company_name: exhibitor.company_name,
      description: exhibitor.description,
      booth_number: exhibitor.booth_number,
      website_url: exhibitor.website_url,
      contact_name: exhibitor.contact_name,
      contact_email: exhibitor.contact_email,
      contact_phone: exhibitor.contact_phone,
      category: exhibitor.category,
      leads_enabled: false,
    })

    if (error) {
      errors.push(`Failed to create "${exhibitor.company_name}": ${error.message}`)
    } else {
      created++
    }
  }

  return { created, errors }
}
