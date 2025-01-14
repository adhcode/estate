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
  const [rememberMe, setRememberMe] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFirstLogin, setIsFirstLogin] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [redirectTo, setRedirectTo] = useState<string | null>(null)
  const [userType, setUserType] = useState<'staff' | 'resident' | 'household' | null>(null)

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

  useEffect(() => {
    if (redirectTo) {
      console.log('Attempting to redirect to:', redirectTo);
      toast.success('Login successful! Redirecting...');

      // Force navigation after a short delay
      setTimeout(() => {
        router.push(redirectTo);

        // Fallback if router.push doesn't work
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 500);
      }, 1000);
    }
  }, [redirectTo, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      if (!user) throw new Error('No user data returned');

      // Check staff first
      const { data: staffData } = await supabase
        .from('staff')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (staffData) {
        console.log('Staff member found:', staffData);
        setUserType('staff');
        setRedirectTo('/admin/dashboard');
        return;
      }

      // Check primary resident
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (userData) {
        console.log('Primary resident found:', userData);
        setUserType('resident');
        setRedirectTo('/resident/dashboard');
        return;
      }

      // Check household member
      const { data: memberData } = await supabase
        .from('household_members')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (memberData) {
        console.log('Household member found:', memberData);

        if (memberData.invitation_status === 'sent') {
          setIsFirstLogin(true);
          toast.success('Please set your new password to continue');
          return;
        } else if (memberData.invitation_status === 'accepted') {
          setUserType('household');
          setRedirectTo('/resident/dashboard');
          return;
        }
      }

      throw new Error(
        'Account not found. Please ensure you are registered as either a primary resident, household member, or staff.'
      );

    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Update password
      const { data: { user }, error: passwordUpdateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (passwordUpdateError) throw passwordUpdateError;
      if (!user) throw new Error('No user data returned');

      // Update member status
      const { error: updateError } = await supabase
        .from('household_members')
        .update({
          invitation_status: 'accepted',
          access_status: 'active',
        })
        .eq('email', email.toLowerCase());

      if (updateError) throw updateError;

      toast.success('Password updated successfully');
      window.location.replace('/resident/dashboard');

    } catch (error: any) {
      console.error('Password update error:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a helper function to determine user type (optional)
  const getUserType = async (email: string) => {
    const { data: staff } = await supabase
      .from('staff')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (staff) return 'staff';

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (user) return 'primary_resident';

    const { data: member } = await supabase
      .from('household_members')
      .select('id, invitation_status')
      .eq('email', email.toLowerCase())
      .single();

    if (member) return 'household_member';

    return null;
  };

  // Debug logging
  useEffect(() => {
    if (userType || redirectTo) {
      console.log('State updated:', {
        userType,
        redirectTo,
        timestamp: new Date().toISOString()
      });
    }
  }, [userType, redirectTo]);

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
            <h2 className="text-2xl font-bold text-gray-900">
              {isFirstLogin ? "Set Your Password" : "Welcome Back!"}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isFirstLogin
                ? "Please set a new password to continue"
                : "Please login to your account to continue"
              }
            </p>
          </div>

          {isFirstLogin ? (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-100">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <Input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="h-12"
                />
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#8B0000] hover:bg-[#6B0000] text-white h-12"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                    Updating...
                  </div>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          ) : (
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
          )}
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

      {userType && (
        <div className="text-sm text-gray-500 text-center mt-2">
          Logged in as: {userType}
        </div>
      )}

      {(userType || redirectTo) && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg">
          <p>User Type: {userType}</p>
          <p>Redirect To: {redirectTo}</p>
        </div>
      )}
    </div>
  )
}