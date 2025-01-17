"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"
import { Loader2, Lock, Eye, EyeOff } from "lucide-react"
import { motion } from "framer-motion"
import { quicksand } from "@/app/fonts"

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [isValidSession, setIsValidSession] = useState(false)
    const router = useRouter()
    const supabase = createClientComponentClient()

    useEffect(() => {
        const handleRecoveryFlow = async () => {
            try {
                const searchParams = new URLSearchParams(window.location.search)
                const token = searchParams.get('token')
                const type = searchParams.get('type')

                console.log("Recovery flow started with:", { token, type })

                if (!token || type !== 'recovery') {
                    toast.error("Invalid reset link")
                    router.push('/auth/forgot-password')
                    return
                }

                setIsValidSession(true)

            } catch (error) {
                console.error("Recovery flow error:", error)
                router.push('/auth/forgot-password')
            }
        }

        handleRecoveryFlow()
    }, [router, supabase.auth])

    const validatePassword = (password: string) => {
        if (password.length < 8) return "Password must be at least 8 characters"
        if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter"
        if (!/[a-z]/.test(password)) return "Password must include a lowercase letter"
        if (!/[0-9]/.test(password)) return "Password must include a number"
        if (!/[^A-Za-z0-9]/.test(password)) return "Password must include a special character"
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!isValidSession) {
            toast.error("Please use a valid reset link")
            return
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match")
            return
        }

        const passwordError = validatePassword(password)
        if (passwordError) {
            toast.error(passwordError)
            return
        }

        setLoading(true)

        try {
            const token = new URLSearchParams(window.location.search).get('token')

            const { error } = await supabase.auth.updateUser({
                password,
                data: { reset_token: token }
            })

            if (error) throw error

            toast.success("Password updated successfully!")
            router.push('/auth/login')

        } catch (error: any) {
            console.error('Password update failed:', error)
            toast.error("Failed to update password. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    // Only render the form if we have a valid session
    if (!isValidSession) {
        return (
            <div className={`font-sans min-h-screen bg-gradient-to-b from-white to-[#F5F5F5] ${quicksand.className}`}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin h-8 w-8 border-4 border-[#8B0000] border-t-transparent rounded-full"></div>
                </div>
            </div>
        )
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
                                Create New Password
                            </h1>
                            <p className="text-gray-500">
                                Please enter your new password below
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="New Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="pl-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="text-gray-400 h-4 w-4" />
                                            ) : (
                                                <Eye className="text-gray-400 h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Confirm New Password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="pl-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="text-gray-400 h-4 w-4" />
                                            ) : (
                                                <Eye className="text-gray-400 h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading || !password || !confirmPassword}
                                className="w-full h-12 text-lg font-medium transition-all duration-200 bg-[#8B0000] text-white hover:bg-[#6B0000] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl rounded-lg"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full mr-3" />
                                        Updating Password...
                                    </div>
                                ) : (
                                    "Update Password"
                                )}
                            </Button>
                        </form>
                    </div>
                </motion.div>
            </main>

            <footer className="mt-12 py-6 text-center text-sm text-gray-500 border-t">
                <div className="container max-w-screen-2xl mx-auto px-4">
                    <p>
                        Powered by{" "}
                        <a
                            href="https://uvise.ng"
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