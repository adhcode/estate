'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { quicksand } from '@/app/fonts'

export default function VerifyDevicePage() {
    const [email, setEmail] = useState<string | null>(null)
    const [isResending, setIsResending] = useState(false)
    const supabase = createClientComponentClient()
    const router = useRouter()

    useEffect(() => {
        // Get pending verification data
        const pendingVerification = localStorage.getItem('pendingDeviceVerification')
        if (pendingVerification) {
            const { email } = JSON.parse(pendingVerification)
            setEmail(email)
        }

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                if (session?.user) {
                    const pendingData = localStorage.getItem('pendingDeviceVerification')
                    if (pendingData) {
                        const { device, userId } = JSON.parse(pendingData)
                        // Store verified device
                        localStorage.setItem(`device_${userId}`, device)
                        localStorage.removeItem('pendingDeviceVerification')

                        toast.success('Device verified successfully!')
                        router.push('/resident/dashboard')
                    }
                }
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase, router])

    const handleResendEmail = async () => {
        if (!email || isResending) return

        setIsResending(true)
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            })

            if (error) throw error
            toast.success('Verification email resent successfully!')
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to resend verification email')
        } finally {
            setIsResending(false)
        }
    }

    return (
        <div className={`min-h-screen bg-white flex flex-col items-center justify-center p-4 ${quicksand.className}`}>
            <div className="max-w-md w-full space-y-8 text-center">
                <div className="flex justify-center">
                    <div className="rounded-full bg-[#8B0000]/10 p-4">
                        <Mail className="h-12 w-12 text-[#8B0000]" />
                    </div>
                </div>

                <h2 className="mt-6 text-3xl font-bold text-gray-900">
                    Verify New Device
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                    We've sent a verification email to{' '}
                    <span className="font-medium text-[#8B0000]">{email}</span>
                </p>

                <div className="mt-4 space-y-4">
                    <p className="text-sm text-gray-500">
                        For your security, we need to verify this new device.
                        Please check your email and click the verification link to continue.
                    </p>

                    <Button
                        onClick={handleResendEmail}
                        disabled={isResending}
                        className="w-full bg-[#8B0000] text-white hover:bg-[#660000] transition-colors"
                    >
                        {isResending ? 'Resending...' : 'Resend verification email'}
                    </Button>

                    <div className="text-sm">
                        <Link
                            href="/auth/login"
                            className="font-medium text-[#8B0000] hover:text-[#660000]"
                        >
                            Return to login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
} 