import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  // Public routes — skip auth entirely (fastest path)
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/unauthorized') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terms') ||
    pathname === '/support' ||
    pathname === '/delete-account' ||
    pathname.startsWith('/mfa-verify') ||
    pathname.startsWith('/mfa-enroll') ||
    pathname === '/'
  ) {
    return supabaseResponse
  }

  // Protected routes — refresh session cookie + verify auth (single network call)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Admin role + MFA checks run in parallel (saves ~1-2s vs sequential)
  const [profileResult, aalResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ])

  const { data: profile, error: profileError } = profileResult
  if (profileError) {
    console.error('[proxy] Profile lookup failed:', profileError.message)
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  if (!profile || profile.role !== 'admin' || !profile.is_active) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  const { data: aalData } = aalResult
  if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
    return NextResponse.redirect(new URL('/mfa-verify', request.url))
  }
  if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal1') {
    return NextResponse.redirect(new URL('/mfa-enroll', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
