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
  const { email, full_name, role, organization_id, password, event_id, badge_type } = body

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

  let userId: string

  if (password) {
    // Create user with email + password (user logs in directly, no email verification)
    const { data: createData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (createError) {
      console.error('[invite] Failed to create user:', createError.message)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    userId = createData.user.id
  } else {
    // Invite user via magic link (legacy flow)
    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name },
      redirectTo: `${request.nextUrl.origin}/auth/callback`,
    })

    if (inviteError) {
      console.error('[invite] Failed to invite user:', inviteError.message)
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    userId = inviteData.user.id
  }

  // Split full_name into first/last for profile
  const nameParts = full_name.trim().split(/\s+/)
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ') || ''

  // Create profile with the real auth user ID
  const { error: profileError } = await admin
    .from('profiles')
    .upsert({
      id: userId,
      email,
      full_name,
      first_name: firstName,
      last_name: lastName,
      role,
      organization_id,
      is_active: true,
    }, { onConflict: 'id' })

  if (profileError) {
    console.error('[invite] Failed to create profile:', profileError.message)
    return NextResponse.json({ error: 'User created but profile creation failed' }, { status: 500 })
  }

  // If an event was selected, create an attendee record so they're already registered
  if (event_id) {
    try {
      // Check if attendee already exists for this event (case-insensitive email)
      const { data: existingAttendee } = await admin
        .from('attendees')
        .select('id')
        .eq('event_id', event_id)
        .ilike('email', email)
        .maybeSingle()

      if (existingAttendee) {
        // Link existing attendee to the new profile
        await admin
          .from('attendees')
          .update({ profile_id: userId })
          .eq('id', existingAttendee.id)
      } else {
        await admin
          .from('attendees')
          .insert({
            organization_id,
            event_id,
            first_name: firstName,
            last_name: lastName,
            email,
            badge_type: badge_type || 'attendee',
            profile_id: userId,
          })
      }
    } catch (err) {
      console.error('[invite] Failed to create attendee record:', err)
      // Don't fail the whole operation — user + profile were created successfully
    }
  }

  return NextResponse.json({ success: true, userId })
}
