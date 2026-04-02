import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/api/auth-check'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const user = await verifyAdminRequest()
  if (!user) return NextResponse.json({ error: 'Not authenticated or not admin' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const sessionId = formData.get('sessionId') as string

  if (!file || !sessionId) {
    return NextResponse.json({ error: 'Missing file or sessionId' }, { status: 400 })
  }

  const admin = createAdminClient()
  const fileExt = file.name.split('.').pop() || 'jpg'
  const timestamp = Date.now()
  const fileName = `${sessionId}/${timestamp}.${fileExt}`

  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage
    .from('sessions')
    .upload(fileName, buffer, { upsert: true, contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data } = admin.storage.from('sessions').getPublicUrl(fileName)
  return NextResponse.json({ publicUrl: data.publicUrl })
}
