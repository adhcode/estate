"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet"
import { User, Mail, Phone, Lock, Building, Menu, Eye, EyeOff } from "lucide-react"
import { quicksand } from '@/app/fonts'
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import debounce from "lodash/debounce"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { cn } from "@/lib/utils"
import { Loader } from "@/app/components/Loader"

const PHONE_REGEX = /^(\+234|0)[789][01]\d{8}$/
const UNIQUE_CONSTRAINT_ERROR = 'Flat is already occupied by another resident'
const AUTH_ERROR_MESSAGES = {
  'Email rate limit exceeded': 'Too many attempts. Please try again in a few minutes.',
  'User already registered': 'An account with this email already exists.',
} as const;

interface FlatOccupancy {
  block: string;
  flat: string;
}

type FormErrors = {
  email?: string;
  password?: string;
  phone?: string;
  name?: string;
}

type FieldErrors = {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  block?: string;
  flatNumber?: string;
  password?: string;
  confirmPassword?: string;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber: string;
  block: string;
  flatNumber: string;
}

export default function SignUpPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
    block: '',
    flatNumber: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [previewLocation, setPreviewLocation] = useState<string>("")
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [isEmailTaken, setIsEmailTaken] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const COOLDOWN_PERIOD = 60000; // 1 minute in milliseconds

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required'
        if (!/\S+@\S+\.\S+/.test(value)) return 'Please enter a valid email'
        break
      case 'phoneNumber':
        if (!value) return 'Phone number is required'
        if (!PHONE_REGEX.test(value)) return 'Please enter a valid Nigerian phone number'
        break
      case 'password':
        if (!value) return 'Password is required'
        return validatePassword(value)
      case 'confirmPassword':
        if (!value) return 'Please confirm your password'
        if (value !== formData.password) return 'Passwords do not match'
        break
      case 'fullName':
        if (!value) return 'Full name is required'
        break
      case 'block':
        if (!value) return 'Block is required'
        break
      case 'flatNumber':
        if (!value) return 'Flat number is required'
        break
    }
    return null
  }

  const validatePhoneNumber = (phone: string) => {
    if (!PHONE_REGEX.test(phone)) {
      return "Please enter a valid Nigerian phone number (e.g., 08012345678 or +2348012345678)"
    }
    return null
  }

  const checkFlatAvailability = async (block: string, flatNumber: string) => {
    try {
      const { data: existingFlat, error } = await supabase
        .from('users')
        .select('id, verified')
        .eq('block_number', block)
        .eq('flat_number', flatNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // If flat exists but user isn't verified, allow reuse
      if (existingFlat && !existingFlat.verified) {
        return true;
      }

      return !existingFlat;
    } catch (error) {
      console.error('Flat check error:', error);
      return false;
    }
  };

  const checkEmailAvailability = async (email: string): Promise<boolean> => {
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('email', email);

      if (error) {
        console.error('Email check error:', error);
        return false;
      }

      return count === 0;
    } catch (error) {
      console.error('Email check error:', error);
      return false;
    }
  };

  useEffect(() => {
    if (formData.block && formData.flatNumber) {
      setPreviewLocation(`${formData.block}, ${formData.flatNumber}`)
    } else {
      setPreviewLocation("")
    }
  }, [formData.block, formData.flatNumber])

  const debouncedCheckEmail = useCallback(
    debounce(async (email: string) => {
      if (!email || !/\S+@\S+\.\S+/.test(email)) return;

      setIsCheckingEmail(true);
      try {
        const { count, error } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('email', email);

        if (error) {
          console.error("Email check error:", error);
          return;
        }

        const emailExists = count !== null && count > 0;
        setIsEmailTaken(emailExists);
        setFieldErrors(prev => ({
          ...prev,
          email: emailExists ? "An account with this email already exists." : undefined
        }));
      } catch (error) {
        console.error("Email check error:", error);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500),
    [supabase]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    const error = validateField(name, value)
    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }))

    if (name === 'email' && value && /\S+@\S+\.\S+/.test(value)) {
      debouncedCheckEmail(value)
    }
  }

  const handleBlockChange = (value: string) => {
    setFormData(prev => ({ ...prev, block: value }))
    const error = validateField('block', value)
    setFieldErrors(prev => ({
      ...prev,
      block: error || undefined
    }))
  }

  const handleFlatChange = (value: string) => {
    setFormData(prev => ({ ...prev, flatNumber: value }))
    const error = validateField('flatNumber', value)
    setFieldErrors(prev => ({
      ...prev,
      flatNumber: error || undefined
    }))
  }

  const validatePassword = (password: string) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/
    const hasLowerCase = /[a-z]/
    const hasNumber = /\d/
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/

    if (
      password.length < minLength ||
      !hasUpperCase.test(password) ||
      !hasLowerCase.test(password) ||
      !hasNumber.test(password) ||
      !hasSymbol.test(password)
    ) {
      return "Password must be at least 8 characters long, include uppercase, lowercase, numbers, and special characters."
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
            block_number: formData.block,
            flat_number: formData.flatNumber,
          }
        }
      })

      if (authError) throw authError;

      if (authData.user) {
        const { error: dbError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: formData.email,
              full_name: formData.fullName,
              phone_number: formData.phoneNumber,
              block_number: formData.block,
              flat_number: formData.flatNumber
            }
          ])

        if (dbError) throw dbError;

        toast.success('Please check your email for verification link');
        router.push('/auth/verify-email');
        return;
      }

    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return !Object.values(fieldErrors).some(error => error) &&
      Object.values(formData).every(value => value) &&
      formData.password === formData.confirmPassword;
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      phoneNumber: '',
      block: '',
      flatNumber: '',
    });
    setFieldErrors({});
    setError('');
    setPreviewLocation('');
  };

  useEffect(() => {
    return () => {
      debouncedCheckEmail.cancel();
    };
  }, [debouncedCheckEmail]);

  if (isLoading) {
    return <Loader />
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
            <Link href="/auth/login">
              <Button
                variant="ghost"
                className="text-[#8B0000] hover:bg-[#8B0000]/10"
              >
                Login
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button
                className="bg-[#8B0000] text-white hover:bg-[#6B0000] shadow-lg hover:shadow-xl transition-all"
              >
                Sign up
              </Button>
            </Link>
          </div>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                >
                  <Menu className="h-5 w-5 text-[#8B0000]" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="bg-white w-[280px] p-6"
              >
                <div className="flex flex-col space-y-6">
                  <Link href="/auth/login">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-[#8B0000]"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button
                      className="w-full justify-start bg-[#8B0000] text-white"
                    >
                      Sign up
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
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
                Create an Account
              </h1>
              <p className="text-gray-500">
                Join our community and enjoy exclusive resident benefits
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 text-sm text-red-500 bg-red-50 rounded-lg border border-red-100"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-lg font-medium">Personal Information</h2>
                  <p className="text-sm text-muted-foreground">
                    Please provide your personal details
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      name="fullName"
                      type="text"
                      placeholder="Full Name"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`pl-10 ${fieldErrors.fullName ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {fieldErrors.fullName && (
                    <p className="text-xs text-red-500">{fieldErrors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      name="email"
                      type="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={handleChange}
                      className={`pl-10 ${fieldErrors.email ? 'border-red-500' : ''}`}
                    />
                    {isCheckingEmail && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-[#8B0000] border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs text-red-500">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      name="phoneNumber"
                      type="tel"
                      placeholder="Phone Number"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className={`pl-10 ${fieldErrors.phoneNumber ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {fieldErrors.phoneNumber && (
                    <p className="text-xs text-red-500">{fieldErrors.phoneNumber}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-lg font-medium">Residence Information</h2>
                  <p className="text-sm text-muted-foreground">
                    Select your block and flat number
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                    <Select value={formData.block} onValueChange={handleBlockChange}>
                      <SelectTrigger className={`pl-10 ${fieldErrors.block ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select Block" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        {Array.from({ length: 40 }, (_, i) => (
                          <SelectItem key={i} value={`Block ${i + 1}`}>
                            Block {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {fieldErrors.block && (
                    <p className="text-xs text-red-500">{fieldErrors.block}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                    <Select value={formData.flatNumber} onValueChange={handleFlatChange}>
                      <SelectTrigger className={`pl-10 ${fieldErrors.flatNumber ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select Flat Number" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i} value={`Flat ${i + 1}`}>
                            Flat {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {fieldErrors.flatNumber && (
                    <p className="text-xs text-red-500">{fieldErrors.flatNumber}</p>
                  )}
                </div>

                {previewLocation && (
                  <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-600">
                    Selected Location: {previewLocation}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-lg font-medium">Account Security</h2>
                  <p className="text-sm text-muted-foreground">
                    Create a secure password for your account
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`pl-10 ${fieldErrors.password ? 'border-red-500' : ''}`}
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
                  {fieldErrors.password ? (
                    <p className="text-xs text-red-500">{fieldErrors.password}</p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`pl-10 ${fieldErrors.confirmPassword ? 'border-red-500' : ''}`}
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
                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-red-500">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={!isFormValid() || isLoading || isEmailTaken || isCheckingEmail || isButtonDisabled}
                className={cn(
                  "w-full h-12 text-lg font-medium transition-all duration-200",
                  "bg-[#8B0000] text-white hover:bg-[#6B0000]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "shadow-lg hover:shadow-xl",
                  "rounded-lg"
                )}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full mr-3" />
                    Creating your account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-gray-500">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-[#8B0000] hover:text-[#6B0000] font-medium hover:underline"
                >
                  Login here
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