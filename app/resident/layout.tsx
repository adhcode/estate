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
  const supabase = createServerComponentClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <ResidentUI user={user} className={quicksand.className}>
      {children}
      <Toaster />
    </ResidentUI>
  )
}
