import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { DM_Sans } from "next/font/google"
import dynamic from 'next/dynamic'

// Remove Suspense import and use noSSR option
const AdminUI = dynamic(
  () => import('./components/AdminUI').then(mod => ({ default: mod.AdminUI })),
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

// Optimize font loading
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap', // Add this for better font loading performance
  preload: true,
  adjustFontFallback: true,
})

export const metadata = {
  title: 'Admin Dashboard - LKJ Estate',
  description: 'Administrative dashboard for LKJ Estate management',
}

// Add caching for better performance
export const revalidate = 3600 // Revalidate every hour

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({
    cookies: () => cookieStore,
  })

  try {
    // 1. Check session - Optimize with single query
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return redirect('/auth/login')
    }

    // 2. Check staff table with optimized query
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (staffError || !staffData) {
      return redirect('/auth/login')
    }

    // 3. Check admin access
    if (staffData.role !== 'admin') {
      return redirect('/resident/dashboard')
    }

    // 4. Render layout with optimized className handling
    return (
      <div className={dmSans.className}>
        <AdminUI session={session}>
          {children}
        </AdminUI>
      </div>
    )

  } catch (error) {
    console.error('Admin layout error:', error)
    return redirect('/auth/login')
  }
}
