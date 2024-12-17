import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Get the current URL from the request
    const url = new URL(request.url)
    const code = url.searchParams.get('code')

    if (code) {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth error:', error)
        // Redirect to error page or login with error parameter
        return NextResponse.redirect(`${url.origin}/auth/login?error=auth_error`)
      }
    }

    // Redirect to verify-email page after successful verification
    return NextResponse.redirect(`${url.origin}/auth/verify-email`)

  } catch (error) {
    console.error('Callback error:', error)
    // Redirect to login page if something goes wrong
    return NextResponse.redirect('https://lkjgardensigando.com/auth/login?error=callback_error')
  }
} 