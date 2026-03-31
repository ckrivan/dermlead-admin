import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * PATCH /api/users — Update user (deactivate/reactivate)
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!callerProfile || callerProfile.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const body = await request.json()
  const { userId, updates } = body

  if (!userId || !updates) {
    return NextResponse.json({ error: 'Missing userId or updates' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify target is in same org
  const { data: targetProfile } = await admin
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single()

  if (!targetProfile || targetProfile.organization_id !== callerProfile.organization_id) {
    return NextResponse.json({ error: 'User not found in your organization' }, { status: 404 })
  }

  // Only allow safe fields
  const safeUpdates: Record<string, unknown> = {}
  if ('is_active' in updates) safeUpdates.is_active = updates.is_active
  if ('role' in updates) safeUpdates.role = updates.role
  if ('full_name' in updates) safeUpdates.full_name = updates.full_name

  const { error } = await admin
    .from('profiles')
    .update(safeUpdates)
    .eq('id', userId)

  if (error) {
    console.error('[update-user] Failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

/**
 * DELETE /api/users — Permanently delete user
 */
export async function DELETE(request: NextRequest) {
  // Verify the caller is an authenticated admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!callerProfile || callerProfile.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const body = await request.json()
  const { userId } = body

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  if (userId === user.id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify the target user is in the same organization
  const { data: targetProfile } = await admin
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single()

  if (!targetProfile || targetProfile.organization_id !== callerProfile.organization_id) {
    return NextResponse.json({ error: 'User not found in your organization' }, { status: 404 })
  }

  // Clean up all foreign key references before deleting profile
  await admin.from('messages').delete().eq('sender_id', userId)
  await admin.from('conversations').delete().or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
  await admin.from('post_comments').delete().eq('author_id', userId)
  await admin.from('community_posts').delete().eq('author_id', userId)
  await admin.from('post_likes').delete().eq('user_id', userId)
  await admin.from('content_reports').delete().eq('reporter_id', userId)
  await admin.from('user_agenda').delete().eq('user_id', userId)
  await admin.from('event_registrations').delete().eq('user_id', userId)
  const { error: leadsError } = await admin.from('leads').update({ captured_by: null }).eq('captured_by', userId)
  if (leadsError) {
    console.error('[delete-user] Failed to nullify leads.captured_by:', leadsError.message)
    return NextResponse.json({ error: 'Failed to unlink leads: ' + leadsError.message }, { status: 500 })
  }
  await admin.from('attendees').update({ checked_in_by: null }).eq('checked_in_by', userId)
  await admin.from('attendees').update({ profile_id: null }).eq('profile_id', userId)

  // Delete the profile
  const { error: deleteError } = await admin
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (deleteError) {
    console.error('[delete-user] Failed to delete profile:', deleteError.message)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Delete the auth user so they can't log in
  const { error: authError } = await admin.auth.admin.deleteUser(userId)
  if (authError) {
    console.error('[delete-user] Profile deleted but auth user removal failed:', authError.message)
  }

  return NextResponse.json({ success: true })
}
