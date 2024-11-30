import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session and trying to access protected routes
  if (!session) {
    const isAuthRoute = req.nextUrl.pathname.startsWith('/auth')
    if (!isAuthRoute) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
    return res
  }

  // If logged in and trying to access auth routes
  if (session) {
    const isAuthRoute = req.nextUrl.pathname.startsWith('/auth')
    if (isAuthRoute) {
      // Get user role
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      // Redirect based on role
      if (userData?.role === 'resident') {
        return NextResponse.redirect(new URL('/resident/dashboard', req.url))
      } else if (userData?.role === 'household_member') {
        return NextResponse.redirect(new URL('/household/dashboard', req.url))
      } else if (userData?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      }
    }
  }

  return res
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
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ]
}
