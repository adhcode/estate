import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Add cache control headers to prevent back/forward cache
  res.headers.set('Cache-Control', 'no-store, max-age=0')
  res.headers.set('Pragma', 'no-cache')
  res.headers.set('Expires', '0')

  // Debug the session
  console.log('Middleware Session:', {
    path: req.nextUrl.pathname,
    hasSession: !!session,
    email: session?.user?.email,
  })

  // Define public routes that don't require authentication
  const isPublicRoute = req.nextUrl.pathname === '/' || 
                       req.nextUrl.pathname.startsWith('/auth/')

  // If user is logged in and trying to access auth pages, redirect based on role
  if (session && isPublicRoute) {
    try {
      const email = session.user.email;
      
      // Check staff first
      const { data: staffData } = await supabase
        .from('staff')
        .select('*')
        .eq('email', email)
        .single();

      if (staffData) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }

      // Check primary resident
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userData) {
        return NextResponse.redirect(new URL('/resident/dashboard', req.url));
      }

      // Check household member
      const { data: memberData } = await supabase
        .from('household_members')
        .select('*')
        .eq('email', email)
        .single();

      if (memberData?.invitation_status === 'accepted') {
        return NextResponse.redirect(new URL('/resident/dashboard', req.url));
      }
    } catch (error) {
      console.error('Middleware error:', error);
    }
  }

  // If no session and trying to access protected route, redirect to login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
