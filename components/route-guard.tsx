"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { LoadingScreen } from './ui/loading-screen'

export function RouteGuard({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const supabase = createClientComponentClient()

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    router.replace('/auth/login')
                    return
                }

                const { data: userData } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', session.user.id)
                    .single()

                setIsLoading(false)
            } catch (error) {
                console.error('Auth check error:', error)
                router.replace('/auth/login')
            }
        }

        checkAuth()
    }, [router, supabase])

    if (isLoading) {
        return <LoadingScreen />
    }

    return <>{children}</>
}  