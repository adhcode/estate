"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { motion } from "framer-motion"
import { quicksand } from "@/app/fonts"
import { User } from "@supabase/supabase-js"
import { z } from "zod"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [lastAttempt, setLastAttempt] = useState<Date | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const MAX_ATTEMPTS = 50
  const COOLDOWN_MINUTES = 1
  const COOLDOWN_RESET = 5

  useEffect(() => {
    const storedAttempts = localStorage.getItem('loginAttempts')
    const storedLastAttempt = localStorage.getItem('lastLoginAttempt')

    if (storedAttempts) setAttempts(parseInt(storedAttempts))
    if (storedLastAttempt) setLastAttempt(new Date(storedLastAttempt))
  }, [])

  useEffect(() => {
    localStorage.setItem('loginAttempts', attempts.toString())
    if (lastAttempt) localStorage.setItem('lastLoginAttempt', lastAttempt.toISOString())
  }, [attempts, lastAttempt])

  const checkRateLimit = () => {
    if (attempts >= MAX_ATTEMPTS && lastAttempt) {
      const timeSinceLastAttempt = Math.floor((new Date().getTime() - lastAttempt.getTime()) / 60000)

      // Quick complete reset
      if (timeSinceLastAttempt >= COOLDOWN_RESET) {
        setAttempts(0)
        setLastAttempt(null)
        localStorage.removeItem('loginAttempts')
        localStorage.removeItem('lastLoginAttempt')
        return false
      }

      // Brief cooldown with clear message
      if (timeSinceLastAttempt < COOLDOWN_MINUTES) {
        setError(`System busy, please try again in ${COOLDOWN_MINUTES} minute`)
        return true
      }

      // Quick partial reset
      setAttempts(10)
      return false
    }
    return false
  }

  const handleLogin = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    try {
      console.log('Starting login attempt for:', values.email)

      // 1. First authenticate the user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (authError) throw authError
      console.log('Auth successful, checking user role...')

      if (!authData.user) throw new Error('No user data')

      // 2. Check user role in different tables
      // Check super_admin first since that's what we're testing
      const { data: superAdminData, error: superAdminError } = await supabase
        .from('super_admins')
        .select('id, email')  // Be explicit about what we're selecting
        .eq('email', values.email)  // Match by email instead of id
        .single()

      if (superAdminData) {
        console.log('User found in super_admin table')
        router.push('/superadmin/dashboard')
        return
      }

      // Then check other roles if needed
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', values.email)
        .single()

      if (userData) {
        console.log('User found in residents table')
        router.push('/resident/dashboard')
        return
      }

      // Check household members
      const { data: householdData, error: householdError } = await supabase
        .from('household_members')
        .select('id, email')
        .eq('email', values.email)
        .single()

      if (householdData) {
        console.log('User found in household members table')
        router.push('/resident/dashboard')
        return
      }

      // Check staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, email')
        .eq('email', values.email)
        .single()

      if (staffData) {
        console.log('User found in staff table')
        router.push('/admin/dashboard')
        return
      }

      // If we get here, user exists in auth but not in any role
      throw new Error('User not found in any role')

    } catch (error) {
      console.error('Login error details:', error)
      toast.error('Invalid login credentials')
    } finally {
      setLoading(false)
    }
  }

  const resetRateLimit = () => {
    setAttempts(0)
    setLastAttempt(null)
    localStorage.removeItem('loginAttempts')
    localStorage.removeItem('lastLoginAttempt')
    setError(null)
    toast.success('Rate limit reset. You can try logging in again.', { duration: 3000 })
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
                Welcome Back
              </h1>
              <p className="text-gray-500">
                Sign in to access your resident account
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault()
              handleLogin({ email, password })
            }} className="space-y-8">
              {/* Show error message if exists */}
              {error && (
                <div className="p-3 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

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

                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-[#8B0000] hover:text-[#6B0000] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {attempts >= MAX_ATTEMPTS && (
                <div className="p-3 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  <p className="mb-2">Too many login attempts</p>
                  <Button
                    type="button"
                    onClick={resetRateLimit}
                    variant="outline"
                    className="text-sm"
                  >
                    Reset Login Attempts
                  </Button>
                </div>
              )}

              <Button
                id="loginButton"
                type="submit"
                disabled={loading}
                className="w-full h-12 text-lg font-medium transition-all duration-200 
                    bg-[#8B0000] text-white hover:bg-[#6B0000] disabled:opacity-50 
                    disabled:cursor-not-allowed shadow-lg hover:shadow-xl rounded-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full mr-3" />
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-gray-500">
                Don't have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="text-[#8B0000] hover:text-[#6B0000] font-medium hover:underline"
                >
                  Sign up here
                </Link>
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Household member? Check your email for an invitation
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