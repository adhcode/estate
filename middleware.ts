import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Debug the session
  console.log('Middleware Session:', {
    path: req.nextUrl.pathname,
    hasSession: !!session,
    email: session?.user?.email,
    verified: !!session?.user?.email_confirmed_at
  })

  // Allow public routes
  if (req.nextUrl.pathname === '/' || 
      req.nextUrl.pathname.startsWith('/auth/')) {
    return res
  }

  // Redirect to login if no session
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // Allow access to dashboard routes if session exists
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
