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
    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      redirect('/auth/login')
    }

    // Verify admin role
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (staffError || staffData?.role !== 'admin') {
      console.error('Staff role error or unauthorized access:', staffError)
      redirect('/auth/login')
    }

    return (
      <div className={`${dmSans.className} bg-[#FBFBFB] min-h-screen`}>
        <AdminUI>
          {children}
        </AdminUI>
      </div >
    )
  } catch (error) {
    console.error('Unexpected error in AdminLayout:', error)
    redirect('/auth/login')
  }
}
