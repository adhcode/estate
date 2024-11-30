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
}

interface FormData {
  email: string;
  password: string;
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

  const checkFlatAvailability = async (block: string, flatNumber: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('block_number', block)
      .eq('flat_number', flatNumber)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return !data
  }

  const checkEmailAvailability = async (email: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single()

    return !data
  }

  useEffect(() => {
    if (formData.block && formData.flatNumber) {
      setPreviewLocation(`${formData.block}, ${formData.flatNumber}`)
    } else {
      setPreviewLocation("")
    }
  }, [formData.block, formData.flatNumber])

  const debouncedCheckEmail = useCallback(
    debounce(async (email: string) => {
      if (!email || !/\S+@\S+\.\S+/.test(email)) return

      setIsCheckingEmail(true)
      try {
        const { count, error } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('email', email)

        if (error) {
          console.error("Email check error:", error)
          return
        }

        const emailExists = count !== null && count > 0
        setIsEmailTaken(emailExists)
        setFieldErrors(prev => ({
          ...prev,
          email: emailExists ? "An account with this email already exists." : undefined
        }))
      } catch (error) {
        console.error("Email check error:", error)
        setIsEmailTaken(false)
        setFieldErrors(prev => ({
          ...prev,
          email: undefined
        }))
      } finally {
        setIsCheckingEmail(false)
      }
    }, 500),
    [supabase]
  )

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
      // Step 1: Create auth user
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error('Signup failed - no user returned');

      // Step 2: Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: formData.email,
          full_name: formData.fullName,
          phone_number: formData.phoneNumber,
          block_number: formData.block,
          flat_number: formData.flatNumber,
          role: 'resident'
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      // Step 3: Create resident record
      const { error: residentError } = await supabase
        .from('residents')
        .insert([
          {
            user_id: user.id,
            status: 'active'
          }
        ])

      if (residentError) {
        console.error('Resident creation error:', residentError);
        throw residentError;
      }

      toast.success('Account created successfully!');
      router.push('/auth/login');

    } catch (error) {
      console.error('Full error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
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
              <Menu className="h-24 w-24 text-[#8B0000]" />
            </Button>
          </SheetTrigger>
          <SheetContent side="top" className={`w-full py-6 px-4 ${quicksand.className} font-sans`}>
            <SheetHeader>
              <SheetTitle></SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              <Link href="/auth/login">
                <Button variant="outline" className="w-full justify-center mt-20">Login</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="w-full justify-center bg-[#8B0000] text-white">Sign up</Button>
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
                  className={`pl-10 h-12 w-full ${fieldErrors.fullName ? 'border-red-500' : ''}`}
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
                  className={`pl-10 h-12 w-full ${fieldErrors.email ? 'border-red-500' : ''}`}
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
                  className={`pl-10 h-12 w-full ${fieldErrors.phoneNumber ? 'border-red-500' : ''}`}
                />
              </div>
              {fieldErrors.phoneNumber && (
                <p className="text-red-500 text-sm">{fieldErrors.phoneNumber}</p>
              )}
            </div>

            <div className="w-[350px] space-y-1">
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                <Select value={formData.block} onValueChange={handleBlockChange}>
                  <SelectTrigger className={`pl-10 h-12 w-full ${fieldErrors.block ? 'border-red-500' : ''}`}>
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
                  <SelectTrigger className={`pl-10 h-12 w-full ${fieldErrors.flatNumber ? 'border-red-500' : ''}`}>
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
                  className={`pl-10 h-12 w-full ${fieldErrors.password ? 'border-red-500' : ''}`}
                />
                {showPassword ? (
                  <EyeOff
                    onClick={() => setShowPassword(false)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                  />
                ) : (
                  <Eye
                    onClick={() => setShowPassword(true)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                  />
                )}
              </div>
              {fieldErrors.password && (
                <p className="text-red-500 text-sm">{fieldErrors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading || isEmailTaken || isCheckingEmail}
              className="w-[350px] h-12 bg-[#8B0000] text-white hover:bg-[#660000] transition-colors disabled:bg-gray-400"
            >
              {isLoading ? "Signing up..." : "Sign up"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}