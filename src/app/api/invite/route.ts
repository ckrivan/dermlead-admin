import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
  const { email, full_name, role, organization_id } = body

  if (!email || !full_name || !role || !organization_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Check if a profile with this email already exists
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (existingProfile) {
    return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
  }

  // Invite user via Supabase Auth (creates auth.users entry + sends magic link)
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name },
    redirectTo: `${request.nextUrl.origin}/auth/callback?next=/auth/setup-password`,
  })

  if (inviteError) {
    console.error('[invite] Failed to invite user:', inviteError.message)
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  // Create profile with the real auth user ID
  const { error: profileError } = await admin
    .from('profiles')
    .upsert({
      id: inviteData.user.id,
      email,
      full_name,
      role,
      organization_id,
      is_active: true,
    }, { onConflict: 'id' })

  if (profileError) {
    console.error('[invite] Failed to create profile:', profileError.message)
    return NextResponse.json({ error: 'User invited but profile creation failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, userId: inviteData.user.id })
}
