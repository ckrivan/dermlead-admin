import { createClient } from '@/lib/supabase/client'
import type { Lead } from '@/types/database'

export async function getLeads(eventId: string): Promise<Lead[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching leads:', error)
    throw error
  }

  return data || []
}

export async function deleteLead(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('leads').delete().eq('id', id)

  if (error) {
    console.error('Error deleting lead:', error)
    throw error
  }
}

export async function bulkDeleteLeads(ids: string[]): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('leads').delete().in('id', ids)

  if (error) {
    console.error('Error bulk deleting leads:', error)
    throw error
  }
}
