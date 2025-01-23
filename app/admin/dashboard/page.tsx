"use client"

import { createClientComponentClient, Session } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import AdminOverviewContent from "../overview/page"
import { AdminUI } from "../components/AdminUI"

export default function DashboardPage() {
  const [session, setSession] = useState<Session | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  return (
    <AdminUI session={session}>
      <AdminOverviewContent />
    </AdminUI>
  )
}