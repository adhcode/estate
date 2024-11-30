import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import ResidentUI from '@/components/ResidentUI'
import { Database } from '../../types/database.types'
import { Quicksand } from 'next/font/google'
import { Toaster } from 'sonner'

const quicksand = Quicksand({ subsets: ['latin'] })

export const dynamic = 'force-dynamic'

export default async function ResidentLayout({
  children
}: {
  children: ReactNode
}) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (userError || userData?.role !== 'resident') {
    redirect('/')
  }

  return (
    <ResidentUI user={session.user} className={quicksand.className}>
      {children}
      <Toaster />
    </ResidentUI>
  )
}
