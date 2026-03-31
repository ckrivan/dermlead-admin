import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/api/auth-check'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: NextRequest) {
  const user = await verifyAdminRequest()
  if (!user) return NextResponse.json({ error: 'Not authenticated or not admin' }, { status: 403 })

  const { id, updates, groupIds } = await request.json()
  if (!id || !updates) return NextResponse.json({ error: 'Missing id or updates' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('attendees').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (groupIds !== undefined) {
    await admin.from('group_members').delete().eq('entity_id', id)
    if (groupIds.length > 0) {
      await admin.from('group_members').insert(
        groupIds.map((groupId: string) => ({ entity_id: id, entity_type: 'attendee', group_id: groupId }))
      )
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const user = await verifyAdminRequest()
  if (!user) return NextResponse.json({ error: 'Not authenticated or not admin' }, { status: 403 })

  const { id, deleteAccount } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const admin = createAdminClient()
  const { data: attendee } = await admin.from('attendees').select('profile_id').eq('id', id).single()
  const profileId = attendee?.profile_id

  await admin.from('speakers').delete().eq('attendee_id', id)
  await admin.from('group_members').delete().eq('entity_id', id)
  const { error } = await admin.from('attendees').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (deleteAccount && profileId) {
    const { data: otherAttendees } = await admin.from('attendees').select('id').eq('profile_id', profileId).limit(1)
    if (!otherAttendees || otherAttendees.length === 0) {
      await admin.from('leads').update({ captured_by: null }).eq('captured_by', profileId)
      await admin.from('messages').delete().eq('sender_id', profileId)
      await admin.from('conversations').delete().or(`participant_1.eq.${profileId},participant_2.eq.${profileId}`)
      await admin.from('post_comments').delete().eq('author_id', profileId)
      await admin.from('community_posts').delete().eq('author_id', profileId)
      await admin.from('post_likes').delete().eq('user_id', profileId)
      await admin.from('content_reports').delete().eq('reporter_id', profileId)
      await admin.from('user_agenda').delete().eq('user_id', profileId)
      await admin.from('event_registrations').delete().eq('user_id', profileId)
      await admin.from('attendees').update({ checked_in_by: null }).eq('checked_in_by', profileId)
      await admin.from('profiles').delete().eq('id', profileId)
      await admin.auth.admin.deleteUser(profileId)
    }
  }

  return NextResponse.json({ success: true })
}

export async function POST(request: NextRequest) {
  const user = await verifyAdminRequest()
  if (!user) return NextResponse.json({ error: 'Not authenticated or not admin' }, { status: 403 })

  const { attendee, groupIds } = await request.json()
  if (!attendee) return NextResponse.json({ error: 'Missing attendee data' }, { status: 400 })

  const admin = createAdminClient()

  if (!attendee.profile_id && attendee.email) {
    const { data: matchedProfile } = await admin.from('profiles').select('id').ilike('email', attendee.email).maybeSingle()
    if (matchedProfile) attendee.profile_id = matchedProfile.id
  }

  const { data: existing } = await admin.from('attendees').select('id').eq('event_id', attendee.event_id).ilike('email', attendee.email).maybeSingle()

  let data
  if (existing) {
    const { data: updated, error } = await admin.from('attendees').update(attendee).eq('id', existing.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    data = updated
  } else {
    const { data: created, error } = await admin.from('attendees').insert(attendee).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    data = created
  }

  if (groupIds && groupIds.length > 0) {
    await admin.from('group_members').insert(
      groupIds.map((groupId: string) => ({ entity_id: data.id, entity_type: 'attendee', group_id: groupId }))
    )
  }

  return NextResponse.json(data)
}
