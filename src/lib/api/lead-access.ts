import { createClient } from '@/lib/supabase/client'

export interface LeadAccessCompany {
  id: string
  event_id: string
  company_name: string
  enabled: boolean
  created_at: string
}

export async function getLeadAccessCompanies(eventId: string): Promise<LeadAccessCompany[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lead_access_companies')
    .select('*')
    .eq('event_id', eventId)
    .order('company_name')

  if (error) throw error
  return data || []
}

export async function addLeadAccessCompany(eventId: string, companyName: string): Promise<LeadAccessCompany> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lead_access_companies')
    .insert({ event_id: eventId, company_name: companyName.trim(), enabled: true })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function toggleLeadAccess(id: string, enabled: boolean): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('lead_access_companies')
    .update({ enabled })
    .eq('id', id)

  if (error) throw error
}

export async function removeLeadAccessCompany(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('lead_access_companies')
    .delete()
    .eq('id', id)

  if (error) throw error
}
