"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { Check, ChevronLeft, ChevronRight, Copy, CalendarIcon, Clock, User, Mail, Phone } from "lucide-react"
import { cn } from "@/lib/utils"
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { useRouter } from "next/navigation"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function RegisterVisitor() {
  const supabase = createClientComponentClient()
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const generateGuestId = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = 'VIS-';
    for (let i = 0; i < 6; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  const [formData, setFormData] = useState({
    fullName: "",
    purpose: "",
    guestId: generateGuestId()
  })

  const handleCopyGuestId = () => {
    navigator.clipboard.writeText(formData.guestId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.purpose) {
      setError("Please fill in all fields")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Authentication error')

      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (userDataError) throw new Error('Failed to get user data')

      const now = new Date()
      const currentDate = now.toISOString().split('T')[0]
      const currentTime = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })

      const guestData = {
        guest_id: formData.guestId,
        user_id: user.id,
        full_name: formData.fullName,
        visit_date: currentDate,
        visit_time: currentTime,
        purpose_of_visit: formData.purpose,
        status: 'pending',
        block_number: userData.block_number,
        flat_number: userData.flat_number
      }

      const { error: visitorError } = await supabase
        .from('guests')
        .insert([guestData])

      if (visitorError) throw new Error('Failed to register visitor')

      setShowSuccessModal(true)

    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen font-quicksand text-gray-800">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap');
        
        .rdp {
          --rdp-font-family: 'Quicksand', sans-serif !important;
        }
        
        .calendar-container * {
          font-family: 'Quicksand', sans-serif !important;
        }

        .dialog-content * {
          font-family: 'Quicksand', sans-serif !important;
        }

        @keyframes slideUp {
          from {
            transform: translateY(10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .dialog-content {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>

      <main className="container mx-auto px-4 py-12">
        <Button
          variant="ghost"
          className="mb-6 -ml-4 text-gray-600 hover:text-gray-900 hover:bg-transparent"
          onClick={() => router.push('/resident/dashboard')}
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Dashboard
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-2xl mx-auto bg-transparent border-none shadow-none">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center text-[#832131]">
                Register a New Visitor
              </CardTitle>
              <CardDescription className="text-center">
                Quickly register a visitor by providing their name and purpose of visit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 max-w-[350px] mx-auto">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A4A4A4]" />
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full pl-10 placeholder:text-[#A4A4A4] h-12 border-[#E5E7EB] focus:border-[#832131] focus-visible:ring-0 focus-visible:border-[#832131] transition-colors"
                    placeholder="Visitor's full name"
                    required
                  />
                </div>

                <Textarea
                  placeholder="Purpose of visit"
                  value={formData.purpose}
                  onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  className="min-h-[100px] resize-none border-[#E5E7EB] focus:border-[#832131] focus-visible:ring-0 focus-visible:border-[#832131] transition-colors placeholder:text-[#A4A4A4]"
                />

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={{ background: '#832131' }}
                  className="w-full text-white hover:bg-[#832131]/90 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Registering...
                    </div>
                  ) : (
                    "Register Visitor"
                  )}
                </Button>

                {error && (
                  <div className="text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="dialog-content w-[90%] max-w-[400px] rounded-xl bg-white p-0 border-none font-quicksand">
          <div className="p-6 flex flex-col items-center">
            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>

            <DialogHeader className="space-y-2 text-center">
              <DialogTitle className="text-2xl font-bold text-gray-800 font-quicksand">
                Registration Successful
              </DialogTitle>
              <DialogDescription className="text-gray-600 font-quicksand">
                Your visitor has been registered successfully. Please save the guest ID for reference.
              </DialogDescription>
            </DialogHeader>

            {/* Guest ID Card */}
            <div className="w-full mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex flex-col space-y-2">
                <span className="text-sm text-gray-500 font-medium font-quicksand">Guest ID</span>
                <div className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200">
                  <span className="font-semibold text-gray-800 font-quicksand">{formData.guestId}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCopyGuestId}
                    className="h-8 px-2 hover:bg-gray-100 font-quicksand"
                  >
                    {copied ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <Check className="w-4 h-4" />
                        <span className="text-xs font-quicksand">Copied</span>
                      </div>
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Visit Details Summary */}
            <div className="w-full mt-4 space-y-3">
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="w-4 h-4" />
                <span className="text-sm font-quicksand">{formData.fullName}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <CalendarIcon className="w-4 h-4" />
                <span className="text-sm font-quicksand">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-quicksand">
                  {new Date().toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
            </div>

            <DialogFooter className="w-full mt-8">
              <Button
                type="button"
                className="w-full h-12 text-white bg-[#832131] hover:bg-[#832131]/90 transition-colors font-quicksand"
                onClick={() => {
                  setShowSuccessModal(false)
                  router.push('/resident/dashboard')
                }}
              >
                Back to Dashboard
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}