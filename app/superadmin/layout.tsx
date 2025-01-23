import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { DM_Sans } from "next/font/google"
import dynamic from 'next/dynamic'

const SuperAdminUI = dynamic(
  () => import('../super-admin/components/SuperAdminUI').then(mod => ({ default: mod.SuperAdminUI })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen bg-white">
        <main className="flex-1">
          <div className="container mx-auto p-4 md:p-6" />
        </main>
      </div>
    )
  }
)

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: true,
})

export const metadata = {
  title: 'Facility Management - LKJ Estate',
  description: 'Facility Management Dashboard for LKJ Estate',
}

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({
    cookies: () => cookieStore,
  })

  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return redirect('/auth/login')
    }

    const { data: superAdminData, error: superAdminError } = await supabase
      .from('super_admins')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (superAdminError || !superAdminData) {
      return redirect('/auth/login')
    }

    return (
      <div className={dmSans.className}>
        <SuperAdminUI session={session}>
          {children}
        </SuperAdminUI>
      </div>
    )

  } catch (error) {
    console.error('Super Admin layout error:', error)
    return redirect('/auth/login')
  }
}