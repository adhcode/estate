"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Mail, Lock, Menu, Eye, EyeOff } from "lucide-react"
import { quicksand } from '@/app/fonts'
import { motion, AnimatePresence } from "framer-motion"
import { LoadingScreen } from "@/components/ui/loading-screen"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session fetch error:', sessionError.message)
          return
        }

        if (session?.user?.id) {
          const { data: staffData, error: staffError } = await supabase
            .from('staff')
            .select('role')
            .eq('id', session.user.id)
            .single()

          if (!staffError && staffData) {
            if (staffData.role === 'admin') {
              router.replace('/admin/dashboard')
              return
            }
            if (staffData.role === 'superadmin') {
              router.replace('/superadmin/dashboard')
              return
            }
          }

          const { data: users, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)

          if (userError) {
            console.error('User data fetch error:', userError.message)
            return
          }

          if (users && users.length > 0 && users[0].role === 'resident') {
            router.replace('/resident/dashboard')
          }
        }
      } catch (error) {
        console.error('Session check error:', error)
      }
    }

    checkSession()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      // 1. Sign in with email and password
      const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      if (!session?.user) throw new Error('No user session found');

      // 2. First check if user is staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!staffError && staffData) {
        if (staffData.role === 'admin') {
          router.replace('/admin/dashboard');
          return;
        }
        if (staffData.role === 'superadmin') {
          router.replace('/superadmin/dashboard');
          return;
        }
      }

      // 3. Then check users table for resident or household member
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, id')
        .eq('id', session.user.id)
        .single();

      if (userError) throw userError;

      // 4. Check household_members table if not found in users
      if (!userData) {
        const { data: householdMember, error: householdError } = await supabase
          .from('household_members')
          .select('id, user_id')
          .eq('user_id', session.user.id)
          .single();

        if (!householdError && householdMember) {
          router.replace('/household/dashboard');
          return;
        }
      }

      // 5. Handle resident login
      if (userData?.role === 'resident') {
        router.replace('/resident/dashboard');
        return;
      }

      // 6. If no role found, create resident profile
      if (!userData) {
        const { error: createError } = await supabase
          .from('users')
          .insert([
            {
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata.full_name || 'Not Set',
              phone_number: session.user.user_metadata.phone_number || 'Not Set',
              block_number: session.user.user_metadata.block_number || 'Not Set',
              flat_number: session.user.user_metadata.flat_number || 'Not Set',
              role: 'resident'
            }
          ]);

        if (createError) throw createError;
        router.replace('/resident/dashboard');
      }

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className={`font-sans flex min-h-screen flex-col bg-white ${quicksand.className}`}>
      <header className="flex justify-between items-center px-4 py-3 bg-white">
        <Link href="/" className="text-2xl md:text-3xl font-bold text-[#8B0000]">LKJ Estate</Link>
        <div className="hidden md:flex space-x-4">
          <Link href="/auth/login">
            <Button variant="outline" className="text-[#8B0000] border-[#8B0000]">Login</Button>
          </Link>
          <Link href="/auth/signup">
            <Button className="bg-[#8B0000] text-white">Sign up</Button>
          </Link>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6 text-[#8B0000]" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="top" className="w-full py-6 px-4">
            <div className="space-y-4">
              <Link href="/auth/login">
                <Button variant="outline" className="w-full justify-center">Login</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="w-full justify-center bg-[#8B0000] text-white">Sign up</Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-4 py-8">
        <div className="w-[350px] space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Welcome, Login your Account</h2>
            <p className="mt-2 text-sm text-gray-600">Login your resident account to register your guest</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Mail
                  className="absolute left-3 top-[50%] -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                  size={20}
                />
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-12 transition-colors duration-200
                    border
                    focus-visible:ring-0
                    focus-visible:ring-offset-0
                    focus:border-gray-300
                    hover:border-gray-300"
                />
              </div>

              <div className="relative">
                <Lock
                  className="absolute left-3 top-[50%] -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                  size={20}
                />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 h-12 transition-colors duration-200
                    border
                    focus-visible:ring-0
                    focus-visible:ring-offset-0
                    focus:border-gray-300
                    hover:border-gray-300"
                />
                <div className="absolute right-3 top-[50%] -translate-y-1/2 z-10">
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={showPassword ? "hide" : "show"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="h-5 w-5"
              />
              <label htmlFor="remember-me" className="ml-2 text-sm text-gray-600">
                Remember my password
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#8B0000] hover:bg-[#6B0000] text-white h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                  Logging in...
                </div>
              ) : (
                "Login"
              )}
            </Button>

            <div className="text-center">
              <Link href="/auth/reset-password" className="text-sm text-[#8B0000] hover:underline">
                Forgot Password?
              </Link>
            </div>
          </form>
        </div>
      </main>

      <footer className="py-4 text-center text-base md:text-lg font-medium text-gray-500">
        Powered by UVISE
      </footer>
    </div>
  )
}