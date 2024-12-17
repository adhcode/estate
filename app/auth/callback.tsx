'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'

export default function AuthCallback() {
    const router = useRouter()
    const supabase = createClientComponentClient()
    const [status, setStatus] = useState('Processing...')

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                setStatus('Verifying your email...')
                const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)

                if (error) {
                    console.error('Error:', error.message)
                    toast.error('Verification failed. Please try again.')
                    router.push('/auth/login')
                    return
                }

                setStatus('Email verified successfully!')
                toast.success('Email verified successfully!')
                router.push('/resident/dashboard')
            } catch (error) {
                console.error('Unexpected error:', error)
                toast.error('An unexpected error occurred')
                router.push('/auth/login')
            }
        }

        handleAuthCallback()
    }, [router, supabase])

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="text-center">
                <p className="text-lg text-gray-600">{status}</p>
                <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B0000] mx-auto"></div>
            </div>
        </div>
    )
}
