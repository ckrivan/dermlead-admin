import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/api/auth-check'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: NextRequest) {
  const user = await verifyAdminRequest()
  if (!user) return NextResponse.json({ error: 'Not authenticated or not admin' }, { status: 403 })

  const { id, updates } = await request.json()
  if (!id || !updates) return NextResponse.json({ error: 'Missing id or updates' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('speakers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sync changes to linked attendee record
  if (data.attendee_id) {
    const nameParts = (data.full_name || '').split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    // Map speaker roles to badge_types
    const roles: string[] = data.role || ['faculty']
    const badgeTypes = roles.map((r: string) => {
      if (r === 'leader') return 'leadership'
      if (r === 'organiser') return 'organiser'
      return 'speaker'
    })
    const primaryBadge = badgeTypes.includes('leadership') ? 'leadership'
      : badgeTypes.includes('organiser') ? 'organiser'
      : 'speaker'

    await admin.from('attendees').update({
      first_name: firstName,
      last_name: lastName,
      credentials: data.credentials,
      specialty: data.specialty,
      institution: data.institution,
      city: data.city,
      state: data.state,
      email: data.email,
      badge_type: primaryBadge,
      badge_types: [...new Set(badgeTypes)],
      updated_at: new Date().toISOString(),
    }).eq('id', data.attendee_id)
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const user = await verifyAdminRequest()
  if (!user) return NextResponse.json({ error: 'Not authenticated or not admin' }, { status: 403 })

  const { speaker } = await request.json()
  if (!speaker) return NextResponse.json({ error: 'Missing speaker data' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('speakers').insert(speaker).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const user = await verifyAdminRequest()
  if (!user) return NextResponse.json({ error: 'Not authenticated or not admin' }, { status: 403 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const admin = createAdminClient()
  await admin.from('session_speakers').delete().eq('speaker_id', id)
  const { error } = await admin.from('speakers').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
