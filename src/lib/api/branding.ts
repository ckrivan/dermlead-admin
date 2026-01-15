import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/types/database'

export interface BrandingSettings {
  brand_color: string | null
  logo_url: string | null
  banner_url: string | null
  show_logo_on_banner: boolean
  custom_url_slug: string | null
}

export async function getBrandingSettings(eventId: string): Promise<BrandingSettings | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('events')
    .select('brand_color, logo_url, banner_url, show_logo_on_banner, custom_url_slug')
    .eq('id', eventId)
    .single()

  if (error) {
    console.error('Error fetching branding settings:', error)
    return null
  }

  return {
    brand_color: data.brand_color,
    logo_url: data.logo_url,
    banner_url: data.banner_url,
    show_logo_on_banner: data.show_logo_on_banner ?? false,
    custom_url_slug: data.custom_url_slug,
  }
}

export async function updateBrandingSettings(
  eventId: string,
  settings: Partial<BrandingSettings>
): Promise<Event> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('events')
    .update({
      ...settings,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .select()
    .single()

  if (error) {
    console.error('Error updating branding settings:', error)
    throw error
  }

  return data
}

export async function uploadEventLogo(eventId: string, file: File): Promise<string> {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${eventId}-logo.${fileExt}`
  const filePath = `events/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('events')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error('Error uploading logo:', uploadError)
    throw uploadError
  }

  const { data } = supabase.storage.from('events').getPublicUrl(filePath)

  // Update the event with the new logo URL
  await updateBrandingSettings(eventId, { logo_url: data.publicUrl })

  return data.publicUrl
}

export async function uploadEventBanner(eventId: string, file: File): Promise<string> {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${eventId}-banner.${fileExt}`
  const filePath = `events/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('events')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error('Error uploading banner:', uploadError)
    throw uploadError
  }

  const { data } = supabase.storage.from('events').getPublicUrl(filePath)

  // Update the event with the new banner URL
  await updateBrandingSettings(eventId, { banner_url: data.publicUrl })

  return data.publicUrl
}

export async function deleteEventLogo(eventId: string): Promise<void> {
  const supabase = createClient()

  // Try to delete common extensions
  const extensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']
  for (const ext of extensions) {
    await supabase.storage.from('events').remove([`events/${eventId}-logo.${ext}`])
  }

  await updateBrandingSettings(eventId, { logo_url: null })
}

export async function deleteEventBanner(eventId: string): Promise<void> {
  const supabase = createClient()

  const extensions = ['png', 'jpg', 'jpeg', 'gif', 'webp']
  for (const ext of extensions) {
    await supabase.storage.from('events').remove([`events/${eventId}-banner.${ext}`])
  }

  await updateBrandingSettings(eventId, { banner_url: null })
}

export const DEFAULT_BRAND_COLOR = '#3b82f6'
