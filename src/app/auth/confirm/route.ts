import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // If this is an invite verification, redirect to password setup
      if (type === 'invite') {
        return NextResponse.redirect(`${origin}/auth/setup-password`)
      }

      // Check if user was invited (fallback detection)
      const user = data.user
      if (user?.invited_at) {
        return NextResponse.redirect(`${origin}/auth/setup-password`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
}
