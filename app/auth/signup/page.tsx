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
    if (isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      // First create the user in Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: 'https://lkjgardensigando.com/auth/callback',
          data: {
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
            block_number: formData.block,
            flat_number: formData.flatNumber,
            role: 'resident'
          }
        }
      });

      if (signUpError) throw signUpError;

      if (!data.user) {
        throw new Error('Signup failed - no user data returned');
      }

      // Send custom welcome email using Resend
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: formData.email,
          subject: 'Welcome to LKJ Gardens Igando',
          html: `
                    <h1>Welcome to LKJ Gardens Igando</h1>
                    <p>Thank you for signing up! You will receive a separate email to verify your account.</p>
                    <p>Please check your inbox and click the verification link to complete your registration.</p>
                    <br />
                    <p>Best regards,</p>
                    <p>LKJ Gardens Igando Team</p>
                `
        }),
      });

      if (!response.ok) {
        console.error('Failed to send welcome email');
      }

      localStorage.setItem('pendingSignup', JSON.stringify({
        email: formData.email,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        block: formData.block,
        flatNumber: formData.flatNumber,
        timestamp: new Date().toISOString()
      }));

      toast.success('Account created! Please check your email for verification.');
      router.push('/auth/verify-email');

    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message);
      toast.error('Signup failed');
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
        <div className="w-full max-w-md flex flex-col items-center justify-center space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Sign up as a Resident!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign up your resident account to register your guest
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center space-y-4">
            {error && (
              <div className="text-red-500 text-center text-sm w-[350px]">{error}</div>
            )}
            {successMessage && (
              <div className="text-green-500 text-center text-sm w-[350px]">{successMessage}</div>
            )}

            {/* Personal Information */}
            <div className="w-[350px] mb-2">
              <h3 className="text-lg font-semibold text-gray-700">Personal Information</h3>
            </div>
            {/* Name, Email, Phone fields */}

            <div className="w-[350px] space-y-1">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  name="fullName"
                  type="text"
                  placeholder="Full Name"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`pl-10 h-12 w-full ${fieldErrors.fullName ? 'border-red-500' : ''} text-base appearance-none`}
                  style={{
                    WebkitAppearance: 'none',
                    fontSize: '16px'
                  }}
                />
              </div>
              {fieldErrors.fullName && (
                <p className="text-red-500 text-sm">{fieldErrors.fullName}</p>
              )}
            </div>

            <div className="w-[350px] space-y-1">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`pl-10 h-12 w-full ${fieldErrors.email ? 'border-red-500' : ''} text-base appearance-none`}
                  style={{
                    WebkitAppearance: 'none',
                    fontSize: '16px'
                  }}
                />
                {isCheckingEmail && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    Checking...
                  </span>
                )}
              </div>
              {fieldErrors.email && (
                <p className="text-red-500 text-sm">{fieldErrors.email}</p>
              )}
            </div>

            <div className="w-[350px] space-y-1">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  name="phoneNumber"
                  type="tel"
                  placeholder="Phone Number"
                  required
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`pl-10 h-12 w-full ${fieldErrors.phoneNumber ? 'border-red-500' : ''} text-base appearance-none`}
                  style={{
                    WebkitAppearance: 'none',
                    fontSize: '16px'
                  }}
                />
              </div>
              {fieldErrors.phoneNumber && (
                <p className="text-red-500 text-sm">{fieldErrors.phoneNumber}</p>
              )}
            </div>

            {/* Residence Information */}
            <div className="w-[350px] mb-2 mt-6">
              <h3 className="text-lg font-semibold text-gray-700">Residence Information</h3>
            </div>
            {/* Block and Flat fields */}

            <div className="w-[350px] space-y-1">
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                <Select value={formData.block} onValueChange={handleBlockChange}>
                  <SelectTrigger
                    className={`pl-10 h-12 w-full ${fieldErrors.block ? 'border-red-500' : ''} text-base appearance-none`}
                    style={{
                      WebkitAppearance: 'none',
                      fontSize: '16px'
                    }}
                  >
                    <SelectValue placeholder="Select Block" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    className={`${quicksand.className} font-sans w-[350px] max-h-[300px] overflow-y-auto z-50 bg-white`}
                    sideOffset={5}
                  >
                    {Array.from({ length: 40 }, (_, i) => (
                      <SelectItem
                        key={i}
                        value={`Block ${i + 1}`}
                        className="hover:bg-gray-100 cursor-pointer"
                      >
                        Block {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {fieldErrors.block && (
                <p className="text-red-500 text-sm">{fieldErrors.block}</p>
              )}
            </div>

            <div className="w-[350px] space-y-1">
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                <Select value={formData.flatNumber} onValueChange={handleFlatChange}>
                  <SelectTrigger className={`pl-10 h-12 w-full ${fieldErrors.flatNumber ? 'border-red-500' : ''} text-base appearance-none`} style={{ WebkitAppearance: 'none', fontSize: '16px' }}>
                    <SelectValue placeholder="Select Flat Number" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    className={`${quicksand.className} font-sans w-[350px] max-h-[300px] overflow-y-auto z-50 bg-white`}
                    sideOffset={5}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem
                        key={i}
                        value={`Flat ${i + 1}`}
                        className="hover:bg-gray-100 cursor-pointer"
                      >
                        Flat {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {fieldErrors.flatNumber && (
                <p className="text-red-500 text-sm">{fieldErrors.flatNumber}</p>
              )}
            </div>

            {previewLocation && (
              <div className="w-[350px] p-3 bg-gray-50 rounded-md text-sm text-gray-600">
                Selected Location: {previewLocation}
              </div>
            )}

            {/* Account Security */}
            <div className="w-[350px] mb-2 mt-6">
              <h3 className="text-lg font-semibold text-gray-700">Account Security</h3>
            </div>
            {/* Password Field */}

            <div className="w-[350px] space-y-1">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`pl-10 h-12 w-full ${fieldErrors.password ? 'border-red-500' : ''} text-base appearance-none`}
                  style={{
                    WebkitAppearance: 'none',
                    fontSize: '16px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="text-gray-400" />
                  ) : (
                    <Eye className="text-gray-400" />
                  )}
                </button>
              </div>
              {fieldErrors.password ? (
                <p className="text-red-500 text-sm">{fieldErrors.password}</p>
              ) : (
                <p className="text-gray-500 text-xs">
                  Password must be at least 8 characters long with uppercase, lowercase, numbers, and special characters
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="w-[350px] space-y-1">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`pl-10 h-12 w-full ${fieldErrors.confirmPassword ? 'border-red-500' : ''} text-base appearance-none`}
                  style={{
                    WebkitAppearance: 'none',
                    fontSize: '16px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="text-gray-400" />
                  ) : (
                    <Eye className="text-gray-400" />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-red-500 text-sm">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={!isFormValid() || isLoading || isEmailTaken || isCheckingEmail || isButtonDisabled}
              className="w-[350px] h-12 bg-[#8B0000] text-white hover:bg-[#660000] transition-colors disabled:bg-gray-400"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                  Signing up...
                </div>
              ) : isButtonDisabled ? (
                "Please wait..."
              ) : (
                "Sign up"
              )}
            </Button>
          </form>
        </div>
      </main>

      <div className="w-[350px] text-center mt-4">
        <p className="text-gray-600">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[#8B0000] hover:underline">
            Login here
          </Link>
        </p>
      </div>

      <footer className="py-4 text-center text-base md:text-lg font-medium text-gray-500">
        Powered by{" "}
        <a
          href="https://uvise.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#8B0000] hover:underline"
        >
          UVISE
        </a>
      </footer>
    </div>
  )
}