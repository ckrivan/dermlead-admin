import { createClient } from '@/lib/supabase/client'
import type { SpeakerMessage, Speaker } from '@/types/database'

export interface SpeakerMessageWithSpeaker extends SpeakerMessage {
  speaker: Speaker
}

export async function getSpeakerMessages(
  eventId: string
): Promise<SpeakerMessageWithSpeaker[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('speaker_messages')
    .select(`
      *,
      speaker:speakers(*)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching speaker messages:', error)
    throw error
  }

  return data || []
}

export async function getMessagesForSpeaker(
  speakerId: string
): Promise<SpeakerMessage[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('speaker_messages')
    .select('*')
    .eq('speaker_id', speakerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching messages for speaker:', error)
    throw error
  }

  return data || []
}

export async function getMessage(id: string): Promise<SpeakerMessage | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('speaker_messages')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching message:', error)
    return null
  }

  return data
}

export async function sendMessageToSpeaker(
  message: Omit<SpeakerMessage, 'id' | 'read_at' | 'replied_at' | 'created_at'>
): Promise<SpeakerMessage> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('speaker_messages')
    .insert(message)
    .select()
    .single()

  if (error) {
    console.error('Error sending message to speaker:', error)
    throw error
  }

  return data
}

export async function sendBulkMessage(
  eventId: string,
  speakerIds: string[],
  message: {
    sender_name: string
    sender_email: string
    subject: string
    message: string
  }
): Promise<{ sent: number; errors: string[] }> {
  const supabase = createClient()
  const errors: string[] = []
  let sent = 0

  for (const speakerId of speakerIds) {
    const { error } = await supabase.from('speaker_messages').insert({
      event_id: eventId,
      speaker_id: speakerId,
      ...message,
    })

    if (error) {
      errors.push(`Failed to send to speaker ${speakerId}: ${error.message}`)
    } else {
      sent++
    }
  }

  return { sent, errors }
}

export async function markAsRead(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('speaker_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error marking message as read:', error)
    throw error
  }
}

export async function markAsReplied(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('speaker_messages')
    .update({ replied_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error marking message as replied:', error)
    throw error
  }
}

export async function deleteMessage(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('speaker_messages').delete().eq('id', id)

  if (error) {
    console.error('Error deleting message:', error)
    throw error
  }
}

export async function getUnreadCount(eventId: string): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('speaker_messages')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .is('read_at', null)

  if (error) {
    console.error('Error getting unread count:', error)
    return 0
  }

  return count || 0
}
