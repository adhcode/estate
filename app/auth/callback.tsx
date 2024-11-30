'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthCallback() {
    const router = useRouter()
    const supabase = createClientComponentClient()

    useEffect(() => {
        const handleAuthCallback = async () => {
            const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)

            if (error) {
                console.error('Error exchanging code for session:', error.message)
                router.push('/auth/login')
                return
            }

            router.push('/resident/dashboard')
        }

        handleAuthCallback()
    }, [router, supabase])

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <p className="text-lg text-gray-600">Processing authentication...</p>
        </div>
    )
}
