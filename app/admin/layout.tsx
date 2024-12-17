import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AdminUI } from './components/AdminUI'
import { DM_Sans } from "next/font/google"

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })

  try {
    // 1. Check session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    console.log('1. Session check:', {
      hasSession: !!session,
      userEmail: session?.user?.email,
      authError
    })

    if (authError || !session) {
      console.log('No session in admin layout')
      redirect('/auth/login')
    }

    // 2. Check staff table
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('id, email, role')
      .eq('email', session.user.email)
      .single()

    console.log('2. Staff check:', {
      hasStaffData: !!staffData,
      staffEmail: staffData?.email,
      staffRole: staffData?.role,
      staffError
    })

    // 3. Check admin access
    const hasAdminAccess = staffData && staffData.role === 'admin'
    console.log('3. Admin access check:', {
      hasAdminAccess,
      staffRole: staffData?.role
    })

    if (!hasAdminAccess) {
      console.log('Admin access denied - redirecting to dashboard')
      redirect('/resident/dashboard')
    }

    console.log('4. Admin access granted - rendering layout')
    return (
      <div className={`${dmSans.className} bg-[#FBFBFB] min-h-screen`}>
        <AdminUI>
          {children}
        </AdminUI>
      </div>
    )
  } catch (error) {
    console.error('Admin layout error:', error)
    redirect('/auth/login')
  }
}
