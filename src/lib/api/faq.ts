import { createClient } from '@/lib/supabase/client'
import type { Faq } from '@/types/database'

export async function getFaqs(eventId: string): Promise<Faq[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('event_faq')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching FAQs:', error)
    throw error
  }
  return (data || []) as Faq[]
}

export async function createFaq(
  eventId: string,
  question: string,
  answer: string,
  sortOrder: number,
): Promise<Faq> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('event_faq')
    .insert({ event_id: eventId, question, answer, sort_order: sortOrder })
    .select()
    .single()

  if (error) throw error
  return data as Faq
}

export async function updateFaq(
  id: string,
  updates: Partial<Pick<Faq, 'question' | 'answer' | 'sort_order'>>,
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('event_faq')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

export async function deleteFaq(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('event_faq')
    .delete()
    .eq('id', id)

  if (error) throw error
}
