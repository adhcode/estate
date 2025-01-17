'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from "@/components/ui/button"
import { Mail, Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { quicksand } from '@/app/fonts'
import { motion } from 'framer-motion'

export default function VerifyEmailPage() {
    const [email, setEmail] = useState<string | null>(null)
    const [isResending, setIsResending] = useState(false)
    const [isVerified, setIsVerified] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [countdown, setCountdown] = useState(0)
    const supabase = createClientComponentClient()
    const router = useRouter()

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    useEffect(() => {
        const checkVerification = async () => {
            try {
                // Get email from localStorage
                const pendingSignup = localStorage.getItem('pendingSignup')
                if (pendingSignup) {
                    const { email } = JSON.parse(pendingSignup)
                    setEmail(email)

                    // Check if user is already verified
                    const { data: { user }, error } = await supabase.auth.getUser()
                    if (user?.email_confirmed_at) {
                        // User is verified, they will be redirected by callback.tsx
                        setIsVerified(true)
                    }
                } else {
                    // No pending signup, redirect to signup
                    router.push('/auth/signup')
                }
            } catch (error) {
                console.error('Verification check error:', error)
                toast.error('Failed to check verification status')
            } finally {
                setIsLoading(false)
            }
        }

        checkVerification()
    }, [router, supabase.auth])

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
        if (!email || isResending || countdown > 0) return

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
            setCountdown(60)
        } catch (error: any) {
            console.error('Error:', error)
            toast.error('Failed to resend verification email')
        } finally {
            setIsResending(false)
        }
    }

    // Loading state with animation
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center space-y-4"
                >
                    <Loader2 className="h-8 w-8 animate-spin text-[#8B0000]" />
                    <p className="text-gray-500">Checking verification status...</p>
                </motion.div>
            </div>
        )
    }

    // Verified state with animation
    if (isVerified) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`min-h-screen bg-white flex flex-col items-center justify-center p-4 ${quicksand.className}`}
            >
                <div className="max-w-md w-full space-y-8 text-center">
                    <motion.div
                        className="flex justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="rounded-full bg-green-100 p-4">
                            <Mail className="h-12 w-12 text-green-600" />
                        </div>
                    </motion.div>

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
            </motion.div>
        )
    }

    // Verification pending state with animation
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`min-h-screen bg-white flex flex-col items-center justify-center p-4 ${quicksand.className}`}
        >
            <div className="max-w-md w-full space-y-8 text-center">
                <motion.div
                    className="flex justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="rounded-full bg-[#8B0000]/10 p-4">
                        <Mail className="h-12 w-12 text-[#8B0000]" />
                    </div>
                </motion.div>

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
                        disabled={isResending || countdown > 0}
                        className="w-full bg-[#8B0000] text-white hover:bg-[#660000] transition-colors disabled:bg-gray-400"
                    >
                        {isResending ? (
                            <span className="flex items-center">
                                <Loader2 className="animate-spin mr-2" />
                                Resending...
                            </span>
                        ) : countdown > 0 ? (
                            `Resend available in ${countdown}s`
                        ) : (
                            'Resend verification email'
                        )}
                    </Button>

                    <Link
                        href="/auth/login"
                        className="inline-flex items-center text-sm font-medium text-[#8B0000] hover:text-[#660000]"
                        onClick={() => supabase.auth.signOut()}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Return to login
                    </Link>

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
        </motion.div>
    )
} 