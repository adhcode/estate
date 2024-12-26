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
import { toast } from "react-hot-toast"

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
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user?.id) {
          const lastDevice = localStorage.getItem(`device_${session.user.id}`);
          const currentDevice = navigator.userAgent;

          // If device is not verified, don't auto-redirect
          if (!lastDevice || lastDevice !== currentDevice) {
            return;
          }

          // Only redirect if device is verified
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (userData?.role === 'resident') {
            router.replace('/resident/dashboard');
          } else if (userData?.role === 'admin') {
            router.replace('/admin/dashboard');
          } else if (userData?.role === 'superadmin') {
            router.replace('/superadmin/dashboard');
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    };

    checkSession();
  }, [supabase, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('verified') === 'true') {
      toast(
        <div className="flex flex-col gap-1">
          <p className="font-medium">Welcome!</p>
          <p className="text-sm text-gray-500">Your account is now verified.</p>
        </div>
      )

      // Clean up the URL
      window.history.replaceState({}, '', '/auth/login')
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) throw signInError;

      if (!user) {
        throw new Error('Login failed - no user data returned');
      }

      // Get user role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      // Determine redirect path
      const redirectPath = userData?.role === 'admin'
        ? '/admin/dashboard'
        : userData?.role === 'superadmin'
          ? '/superadmin/dashboard'
          : '/resident/dashboard';

      // Force a hard redirect
      window.location.href = redirectPath;

    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'An error occurred during login');
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
            </Button>
          </SheetTrigger>
          <SheetContent
            side="top"
            className={`w-full py-4 px-4 ${quicksand.className} font-sans`}
          >
            <div className="flex flex-col items-center justify-center space-y-3 mt-2">
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  className="w-[200px] justify-center h-9 text-[#8B0000] border-[#8B0000]"
                >
                  Login
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button
                  className="w-[200px] justify-center h-9 bg-[#8B0000] text-white hover:bg-[#6B0000]"
                >
                  Sign up
                </Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-4 py-8">
        <div className="w-[350px] space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back!</h2>
            <p className="mt-2 text-sm text-gray-600">
              Please login to your account to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-100"
              >
                {error}
              </motion.div>
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
                    hover:border-gray-300
                    text-base
                    appearance-none"
                  style={{
                    WebkitAppearance: 'none',
                    fontSize: '16px'
                  }}
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
                    hover:border-gray-300
                    text-base
                    appearance-none"
                  style={{
                    WebkitAppearance: 'none',
                    fontSize: '16px'
                  }}
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

            <div className="space-y-4">
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

              <div className="text-center space-y-2">
                <Link href="/auth/reset-password" className="text-sm text-[#8B0000] hover:underline">
                  Forgot Password?
                </Link>
                <div className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link href="/auth/signup" className="text-[#8B0000] hover:underline">
                    Sign up
                  </Link>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <footer className="py-4 text-center">
        <a
          href="https://uvise.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-base font-medium text-gray-500 hover:text-[#8B0000] transition-colors"
        >
          Powered by UVISE
        </a>
      </footer>
    </div>
  )
}