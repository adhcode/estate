import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Allow access to the homepage
  if (req.nextUrl.pathname === '/') {
    return res
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session, allow access to homepage and auth routes only
  if (!session) {
    const isAuthRoute = req.nextUrl.pathname.startsWith('/auth')
    if (!isAuthRoute && req.nextUrl.pathname !== '/') {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
    return res
  }

  // Check if email is verified
  if (!session.user.email_confirmed_at) {
    const isVerifyEmailPage = req.nextUrl.pathname === '/auth/verify-email'
    const isAuthCallback = req.nextUrl.pathname === '/auth/callback'
    
    // Allow access to verification page and auth callback
    if (isVerifyEmailPage || isAuthCallback) {
      return res
    }

    // Redirect to verification page for all other routes except homepage
    if (!req.nextUrl.pathname.startsWith('/auth') && req.nextUrl.pathname !== '/') {
      console.log('Email not verified - redirecting to verification page')
      return NextResponse.redirect(new URL('/auth/verify-email', req.url))
    }
  }

  // For verified users, handle route access
  const isAuthRoute = req.nextUrl.pathname.startsWith('/auth')
  
  // Redirect verified users away from auth routes (except callback)
  if (isAuthRoute && req.nextUrl.pathname !== '/auth/callback') {
    return NextResponse.redirect(new URL('/resident/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
