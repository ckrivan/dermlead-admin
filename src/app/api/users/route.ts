import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

  // Nullify foreign key references
  await admin.from('leads').update({ captured_by: null }).eq('captured_by', userId)
  await admin.from('attendees').update({ checked_in_by: null }).eq('checked_in_by', userId)
  await admin.from('attendees').update({ profile_id: null }).eq('profile_id', userId)

  // Delete the profile (cascades to post_follows, session_reminders, etc.)
  const { error: deleteError } = await admin
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (deleteError) {
    console.error('[delete-user] Failed to delete profile:', deleteError.message)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Also delete the auth user so they can't log in
  const { error: authError } = await admin.auth.admin.deleteUser(userId)
  if (authError) {
    console.error('[delete-user] Profile deleted but auth user removal failed:', authError.message)
  }

  return NextResponse.json({ success: true })
}
