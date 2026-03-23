import { createClient } from '@/lib/supabase/client'
import type { SupportRequest } from '@/types/database'

export async function getSupportRequests(): Promise<SupportRequest[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('support_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching support requests:', error)
    throw error
  }
  return (data || []) as SupportRequest[]
}

export async function updateSupportStatus(
  id: string,
  status: 'in_progress' | 'resolved',
  reviewedBy: string,
): Promise<void> {
  const supabase = createClient()
  const updates: Record<string, unknown> = { status }

  if (status === 'resolved') {
    updates.resolved_by = reviewedBy
    updates.resolved_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('support_requests')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

export async function createSupportRequest(data: {
  name: string
  email: string
  subject: string
  message: string
  event_id?: string
}): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('support_requests')
    .insert(data)

  if (error) throw error
}
