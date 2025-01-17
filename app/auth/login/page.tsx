"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"
import { Loader2, Mail, Lock } from "lucide-react"
import { motion } from "framer-motion"
import { quicksand } from "@/app/fonts"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('Attempting to sign in with:', email)
      // First attempt to sign in
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('Sign in error:', signInError)
        throw signInError
      }
      if (!user) throw new Error('No user found')

      console.log('Successfully signed in user:', user.id)

      // Get user metadata to check if password change is required
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) throw new Error('Unable to get user data')

      console.log('Full user metadata:', currentUser)
      console.log('Temporary password flag:', currentUser.user_metadata?.temporary_password)
      const isTemporaryPassword = currentUser.user_metadata?.temporary_password === true

      // If using temporary password, redirect to change password immediately
      if (isTemporaryPassword) {
        console.log('Temporary password detected, redirecting to change password')
        toast.info("Please change your temporary password", {
          duration: 5000,
          position: 'top-center'
        })
        await new Promise(resolve => setTimeout(resolve, 1000))
        router.push('/auth/set-password')
        return
      }

      // Check if user is in users table (resident)
      const { data: residentData, error: residentError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (residentError) {
        console.error('Error checking resident status:', residentError)
        throw new Error('Error checking user status')
      }

      console.log('Resident check result:', residentData)

      if (residentData) {
        console.log('User is a resident, redirecting to dashboard')
        toast.success("Welcome back!")
        router.push('/resident/dashboard')
        return
      }

      // If not in users table, check household_members table
      const { data: memberData, error: memberError } = await supabase
        .from('household_members')
        .select('invitation_status')
        .eq('id', user.id)
        .maybeSingle()

      if (memberError) {
        console.error('Error checking member status:', memberError)
        throw new Error('Error checking member status')
      }

      console.log('Member check result:', memberData)

      if (memberData) {
        switch (memberData.invitation_status) {
          case 'pending':
          case 'sent':
            console.log('Member invitation is pending/sent')
            toast.error("Please check your email for an invitation to complete your account setup.", {
              duration: 5000,
              position: 'top-center'
            })
            await supabase.auth.signOut()
            setTimeout(() => {
              window.location.href = '/auth/login'
            }, 2000)
            return

          case 'accepted':
            console.log('Member is accepted, redirecting to dashboard')
            toast.success("Welcome back!", {
              duration: 3000,
              position: 'top-center'
            })
            await new Promise(resolve => setTimeout(resolve, 1000))
            router.push('/resident/dashboard')
            return

          default:
            console.log(`Unknown invitation status: ${memberData.invitation_status}`)
            toast.error("Invalid account status. Please contact support.", {
              duration: 5000,
              position: 'top-center'
            })
            await supabase.auth.signOut()
            setTimeout(() => {
              window.location.href = '/auth/login'
            }, 2000)
            return
        }
      }

      // If we get here, the user isn't in either table
      console.log('User not found in either table')
      toast.error("Account not found. Please contact support.", {
        duration: 5000,
        position: 'top-center'
      })
      await supabase.auth.signOut()
      setTimeout(() => {
        window.location.href = '/auth/login'
      }, 2000)

    } catch (error: any) {
      console.error('Login error:', error)
      if (error.message.includes('Email not confirmed')) {
        toast.error("Please verify your email before logging in")
      } else if (error.message.includes('Invalid login credentials')) {
        toast.error("Invalid email or password")
      } else {
        toast.error(error.message || 'An error occurred during login')
      }
      await supabase.auth.signOut()
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
                Welcome Back
              </h1>
              <p className="text-gray-500">
                Sign in to access your resident account
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
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
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10"
                    />
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-lg font-medium transition-all duration-200 bg-[#8B0000] text-white hover:bg-[#6B0000] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl rounded-lg"
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