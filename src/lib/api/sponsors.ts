import { createClient } from '@/lib/supabase/client'
import type { Sponsor } from '@/types/database'
import { normalizeSponsorRow, SponsorCSVRow } from '@/lib/utils/csv'

export const SPONSOR_TIERS = [
  { value: 'platinum', label: 'Platinum', color: '#e5e4e2' },
  { value: 'gold', label: 'Gold', color: '#ffd700' },
  { value: 'silver', label: 'Silver', color: '#c0c0c0' },
  { value: 'bronze', label: 'Bronze', color: '#cd7f32' },
  { value: 'partner', label: 'Partner', color: '#3b82f6' },
] as const

export async function getSponsors(eventId: string): Promise<Sponsor[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('sponsors')
    .select('*')
    .eq('event_id', eventId)
    .order('display_order')

  if (error) {
    console.error('Error fetching sponsors:', error)
    throw error
  }

  return data || []
}

export async function getSponsorsByTier(
  eventId: string,
  tier: Sponsor['tier']
): Promise<Sponsor[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('sponsors')
    .select('*')
    .eq('event_id', eventId)
    .eq('tier', tier)
    .order('display_order')

  if (error) {
    console.error('Error fetching sponsors by tier:', error)
    throw error
  }

  return data || []
}

export async function getSponsor(id: string): Promise<Sponsor | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('sponsors')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching sponsor:', error)
    return null
  }

  return data
}

export async function createSponsor(
  sponsor: Omit<Sponsor, 'id' | 'created_at' | 'updated_at'>
): Promise<Sponsor> {
  const supabase = createClient()

  // Get max display_order for this event
  const { data: existing } = await supabase
    .from('sponsors')
    .select('display_order')
    .eq('event_id', sponsor.event_id)
    .order('display_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.display_order ?? 0) + 1

  const { data, error } = await supabase
    .from('sponsors')
    .insert({
      ...sponsor,
      display_order: sponsor.display_order ?? nextOrder,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating sponsor:', error)
    throw error
  }

  return data
}

export async function updateSponsor(
  id: string,
  updates: Partial<Omit<Sponsor, 'id' | 'created_at'>>
): Promise<Sponsor> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('sponsors')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating sponsor:', error)
    throw error
  }

  return data
}

export async function deleteSponsor(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('sponsors').delete().eq('id', id)

  if (error) {
    console.error('Error deleting sponsor:', error)
    throw error
  }
}

export async function reorderSponsors(
  sponsorIds: string[]
): Promise<void> {
  const supabase = createClient()

  for (let i = 0; i < sponsorIds.length; i++) {
    await supabase
      .from('sponsors')
      .update({ display_order: i + 1 })
      .eq('id', sponsorIds[i])
  }
}

export async function uploadSponsorLogo(
  sponsorId: string,
  file: File
): Promise<string> {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${sponsorId}-logo.${fileExt}`
  const filePath = `sponsors/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('events')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error('Error uploading sponsor logo:', uploadError)
    throw uploadError
  }

  const { data } = supabase.storage.from('events').getPublicUrl(filePath)

  await updateSponsor(sponsorId, { logo_url: data.publicUrl })

  return data.publicUrl
}

export async function uploadSponsorBanner(
  sponsorId: string,
  file: File
): Promise<string> {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${sponsorId}-banner.${fileExt}`
  const filePath = `sponsors/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('events')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error('Error uploading sponsor banner:', uploadError)
    throw uploadError
  }

  const { data } = supabase.storage.from('events').getPublicUrl(filePath)

  await updateSponsor(sponsorId, { banner_url: data.publicUrl })

  return data.publicUrl
}

export async function bulkCreateSponsors(
  eventId: string,
  rawSponsors: SponsorCSVRow[]
): Promise<{ created: number; errors: string[] }> {
  const supabase = createClient()
  const errors: string[] = []
  let created = 0

  for (const rawSponsor of rawSponsors) {
    // Normalize from Whova or our format
    const sponsor = normalizeSponsorRow(rawSponsor)

    if (!sponsor.company_name) {
      errors.push('Skipped row: missing company name')
      continue
    }

    const { error } = await supabase.from('sponsors').insert({
      event_id: eventId,
      company_name: sponsor.company_name,
      description: sponsor.description,
      tier: sponsor.tier,
      website_url: sponsor.website_url,
      contact_name: sponsor.contact_name,
      contact_email: sponsor.contact_email,
      booth_number: sponsor.booth_number,
      is_featured: sponsor.is_featured,
      logo_url: sponsor.logo_url,
      banner_url: sponsor.banner_url,
      display_order: 0,
    })

    if (error) {
      errors.push(`Failed to create "${sponsor.company_name}": ${error.message}`)
    } else {
      created++
    }
  }

  return { created, errors }
}
