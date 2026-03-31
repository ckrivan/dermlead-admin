import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/api/auth-check'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: NextRequest) {
  const user = await verifyAdminRequest()
  if (!user) return NextResponse.json({ error: 'Not authenticated or not admin' }, { status: 403 })

  const { attendeeId, leadsAccess } = await request.json()
  if (!attendeeId || typeof leadsAccess !== 'boolean') {
    return NextResponse.json({ error: 'Missing attendeeId or leadsAccess' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('attendees')
    .update({ leads_access: leadsAccess })
    .eq('id', attendeeId)
    .select('id, leads_access')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
