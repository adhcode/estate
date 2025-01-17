import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
      const supabase = createRouteHandlerClient({ cookies })
      
      // Exchange code for session
      const { error: authError } = await supabase.auth.exchangeCodeForSession(code)
      if (authError) throw authError

      // Get the user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      if (user) {
        // Update user status to active
        const { error: updateError } = await supabase
          .from('users')
          .update({ status: 'active' })
          .eq('id', user.id)
        
        if (updateError) throw updateError

        // Redirect directly to dashboard after verification
        return NextResponse.redirect(`${requestUrl.origin}/resident/dashboard`)
      }
    }

    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=Invalid verification link`)
  } catch (error) {
    console.error('Callback error:', error)
    const url = new URL(request.url)
    return NextResponse.redirect(`${url.origin}/auth/login?error=Verification failed`)
  }
} 