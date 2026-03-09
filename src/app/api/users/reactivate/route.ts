import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/users/reactivate — Reactivate a deactivated user
 */
export async function POST(request: NextRequest) {
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

  // Set is_active = true
  const { error: updateError } = await admin
    .from('profiles')
    .update({ is_active: true })
    .eq('id', userId)

  if (updateError) {
    console.error('[reactivate-user] Failed to update profile:', updateError.message)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
