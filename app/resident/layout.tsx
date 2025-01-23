import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import ResidentUI from '@/components/ResidentUI'
import { Quicksand } from 'next/font/google'
import { Toaster } from 'sonner'

const quicksand = Quicksand({ subsets: ['latin'] })

export const dynamic = 'force-dynamic'

export default async function ResidentLayout({
  children
}: {
  children: ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user profile data including avatar_url
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email, avatar_url, block_number, flat_number')
    .eq('id', user.id)
    .single()

  // Combine auth user with profile data
  const userData = {
    ...user,
    user_metadata: {
      ...user.user_metadata,
      full_name: profile?.full_name,
      avatar_url: profile?.avatar_url
    }
  }

  return (
    <div className={quicksand.className}>
      <ResidentUI user={userData}>
        {children}
      </ResidentUI>
      <Toaster />
    </div>
  )
}
