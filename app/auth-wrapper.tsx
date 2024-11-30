'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { User } from '@supabase/supabase-js'

const publicRoutes = ['/auth/login', '/auth/signup', '/']
const roleBasedRoutes = {
  superadmin: '/superadmin/dashboard',
  admin: '/admin/dashboard',
  resident: '/resident/dashboard',
}

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const pathname = usePathname()

  useEffect(() => {
    // Check authenticated user on mount
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        setUser(user)
      } catch (error) {
        console.error('Auth error:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          // Verify user with getUser() when auth state changes
          const { data: { user }, error } = await supabase.auth.getUser()
          if (error) throw error

          setUser(user)

          if (user) {
            const role = user.user_metadata.role as keyof typeof roleBasedRoutes
            const dashboardRoute = roleBasedRoutes[role] || '/'

            if (publicRoutes.includes(pathname)) {
              window.location.href = dashboardRoute
            }
          } else if (!publicRoutes.includes(pathname)) {
            window.location.href = '/auth/login'
          }
        } catch (error) {
          console.error('Auth state change error:', error)
          setUser(null)
          if (!publicRoutes.includes(pathname)) {
            window.location.href = '/auth/login'
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, pathname])

  // Handle initial routing
  useEffect(() => {
    if (!loading) {
      if (user) {
        const role = user.user_metadata.role as keyof typeof roleBasedRoutes
        const dashboardRoute = roleBasedRoutes[role] || '/'

        if (publicRoutes.includes(pathname)) {
          window.location.href = dashboardRoute
        }
      } else if (!publicRoutes.includes(pathname)) {
        window.location.href = '/auth/login'
      }
    }
  }, [loading, user, pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#8B0000] border-t-transparent"></div>
      </div>
    )
  }

  return <>{children}</>
}