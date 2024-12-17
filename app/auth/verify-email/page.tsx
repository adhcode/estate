'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { quicksand } from '@/app/fonts'

export default function VerifyEmailPage() {
    const [email, setEmail] = useState<string | null>(null)
    const [isResending, setIsResending] = useState(false)
    const [isVerified, setIsVerified] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClientComponentClient()
    const router = useRouter()

    useEffect(() => {
        const checkVerificationStatus = async () => {
            try {
                // Get email from localStorage if available
                const pendingSignup = localStorage.getItem('pendingSignup')
                if (pendingSignup) {
                    const { email } = JSON.parse(pendingSignup)
                    if (email) setEmail(email)
                }

                // Check current session
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user?.email) {
                    setEmail(session.user.email)
                    if (session.user.email_confirmed_at) {
                        setIsVerified(true)
                        await handleVerificationSuccess(session.user)
                    }
                }
            } catch (error) {
                console.error('Error checking verification:', error)
            } finally {
                setIsLoading(false)
            }
        }

        checkVerificationStatus()

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user?.email) {
                setEmail(session.user.email)
            }

            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                if (session?.user?.email_confirmed_at) {
                    setIsVerified(true)
                    await handleVerificationSuccess(session.user)
                }
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase, router])

    const handleVerificationSuccess = async (user: any) => {
        if (!user?.email) return

        try {
            const pendingData = localStorage.getItem('pendingSignup')
            if (!pendingData) return

            const userData = JSON.parse(pendingData)

            const { error } = await supabase
                .from('users')
                .insert({
                    id: user.id,
                    email: user.email,
                    full_name: userData.fullName,
                    phone_number: userData.phoneNumber,
                    block_number: userData.block,
                    flat_number: userData.flatNumber,
                    role: 'resident',
                    created_at: new Date().toISOString(),
                    avatar_url: null
                })

            if (error) throw error

            localStorage.removeItem('pendingSignup')
            toast.success('Registration completed successfully!')

            // Sign out and redirect
            await supabase.auth.signOut()
            router.push('/auth/login?verified=true')
        } catch (error) {
            console.error('Error creating user:', error)
            toast.error('Failed to complete registration')
        }
    }

    const handleResendEmail = async () => {
        if (!email || isResending) return

        setIsResending(true)
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                }
            })

            if (error) throw error
            toast.success('Verification email resent successfully!')
        } catch (error: any) {
            console.error('Error:', error)
            toast.error('Failed to resend verification email')
        } finally {
            setIsResending(false)
        }
    }

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#8B0000] border-t-transparent" />
            </div>
        )
    }

    // Show verified state
    if (isVerified) {
        return (
            <div className={`min-h-screen bg-white flex flex-col items-center justify-center p-4 ${quicksand.className}`}>
                <div className="max-w-md w-full space-y-8 text-center">
                    <div className="flex justify-center">
                        <div className="rounded-full bg-green-100 p-4">
                            <Mail className="h-12 w-12 text-green-600" />
                        </div>
                    </div>

                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Email Verified!
                    </h2>

                    <p className="mt-2 text-sm text-gray-600">
                        Your email has been verified successfully. You can now log in to your account.
                    </p>

                    <Button
                        onClick={() => router.push('/auth/login')}
                        className="w-full bg-[#8B0000] text-white hover:bg-[#660000] transition-colors"
                    >
                        Continue to Login
                    </Button>
                </div>
            </div>
        )
    }

    // Show verification pending state
    return (
        <div className={`min-h-screen bg-white flex flex-col items-center justify-center p-4 ${quicksand.className}`}>
            <div className="max-w-md w-full space-y-8 text-center">
                <div className="flex justify-center">
                    <div className="rounded-full bg-[#8B0000]/10 p-4">
                        <Mail className="h-12 w-12 text-[#8B0000]" />
                    </div>
                </div>

                <h2 className="mt-6 text-3xl font-bold text-gray-900">
                    Verify your email
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                    We've sent a verification email to{' '}
                    <span className="font-medium text-[#8B0000]">{email}</span>
                </p>

                <div className="mt-4 space-y-4">
                    <p className="text-sm text-gray-500">
                        Please check your email and click the verification link to continue.
                        If you don't see the email, check your spam folder.
                    </p>

                    <Button
                        onClick={handleResendEmail}
                        disabled={isResending}
                        className="w-full bg-[#8B0000] text-white hover:bg-[#660000] transition-colors disabled:bg-gray-400"
                    >
                        {isResending ? 'Resending...' : 'Resend verification email'}
                    </Button>

                    <div className="text-sm">
                        <Link
                            href="/auth/login"
                            className="font-medium text-[#8B0000] hover:text-[#660000]"
                            onClick={() => {
                                // Optionally clear the session when returning to login
                                supabase.auth.signOut();
                            }}
                        >
                            Return to login
                        </Link>
                    </div>
                </div>

                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900">
                        What happens next?
                    </h3>
                    <ul className="mt-4 text-sm text-gray-500 list-disc list-inside space-y-2">
                        <li>Click the verification link in your email</li>
                        <li>You'll be redirected back to the site</li>
                        <li>Your email will be verified and you can start using your account</li>
                    </ul>
                </div>
            </div>
        </div>
    )
} 