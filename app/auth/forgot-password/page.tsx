"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"
import { Loader2, Mail } from "lucide-react"
import { motion } from "framer-motion"
import { quicksand } from "@/app/fonts"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const router = useRouter()
    const supabase = createClientComponentClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            })

            if (error) throw error

            setEmailSent(true)
            toast.success("Password reset instructions sent to your email")

            localStorage.setItem('resetEmail', email)

        } catch (error: any) {
            console.error('Reset password error:', error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={`font-sans min-h-screen bg-gradient-to-b from-white to-[#F5F5F5] ${quicksand.className}`}>
            <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <nav className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
                    <Link
                        href="/"
                        className="flex items-center transition-transform hover:scale-105"
                    >
                        <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#8B0000] to-[#6B0000] bg-clip-text text-transparent">
                            LKJ Gardens Connect
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-6">
                        <Link href="/auth/signup">
                            <Button
                                variant="ghost"
                                className="text-[#8B0000] hover:bg-[#8B0000]/10"
                            >
                                Sign up
                            </Button>
                        </Link>
                        <Link href="/auth/login">
                            <Button
                                className="bg-[#8B0000] text-white hover:bg-[#6B0000] shadow-lg hover:shadow-xl transition-all"
                            >
                                Login
                            </Button>
                        </Link>
                    </div>
                </nav>
            </header>

            <main className="container max-w-screen-2xl mx-auto px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-md mx-auto"
                >
                    <div className="bg-white rounded-xl shadow-xl p-8 space-y-8">
                        <div className="space-y-2 text-center">
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#8B0000] to-[#6B0000] bg-clip-text text-transparent">
                                Reset Password
                            </h1>
                            <p className="text-gray-500">
                                {emailSent
                                    ? "Check your email for reset instructions"
                                    : "Enter your email to receive reset instructions"}
                            </p>
                        </div>

                        {!emailSent ? (
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                type="email"
                                                placeholder="Email Address"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading || !email}
                                    className="w-full h-12 text-lg font-medium transition-all duration-200 bg-[#8B0000] text-white hover:bg-[#6B0000] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl rounded-lg"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full mr-3" />
                                            Sending...
                                        </div>
                                    ) : (
                                        "Send Reset Instructions"
                                    )}
                                </Button>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <p className="text-center text-gray-600">
                                    We've sent password reset instructions to <strong>{email}</strong>.
                                    Please check your email and follow the link to reset your password.
                                </p>
                                <Button
                                    onClick={() => router.push('/auth/login')}
                                    className="w-full h-12 text-lg font-medium transition-all duration-200 bg-[#8B0000] text-white hover:bg-[#6B0000] shadow-lg hover:shadow-xl rounded-lg"
                                >
                                    Return to Login
                                </Button>
                            </div>
                        )}

                        <div className="text-center">
                            <p className="text-gray-500">
                                Remember your password?{" "}
                                <Link
                                    href="/auth/login"
                                    className="text-[#8B0000] hover:text-[#6B0000] font-medium hover:underline"
                                >
                                    Sign in here
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </main>

            <footer className="mt-12 py-6 text-center text-sm text-gray-500 border-t">
                <div className="container max-w-screen-2xl mx-auto px-4">
                    <p>
                        Powered by{" "}
                        <a
                            href="https://uvise.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#8B0000] hover:text-[#6B0000] font-medium hover:underline"
                        >
                            UVISE
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    )
} 