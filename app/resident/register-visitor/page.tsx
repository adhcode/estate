"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { Check, ChevronLeft, ChevronRight, Copy, CalendarIcon, Clock, User, Mail, Phone, Share2, MessageSquare, Instagram, Twitter } from "lucide-react"
import { cn } from "@/lib/utils"
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { useRouter } from "next/navigation"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader } from "@/app/components/Loader"
import { toast } from "sonner"
import { useToast } from "@/components/ui/use-toast"

export default function RegisterVisitor() {
  const generateGuestId = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = 'VIS-';
    for (let i = 0; i < 6; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  const [pageLoading, setPageLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClientComponentClient()
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    purpose: "",
    guestId: generateGuestId()
  })
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setPageLoading(false)
      }
    }

    checkAuth()
  }, [supabase, router])

  useEffect(() => {
    console.log('Page loading state:', pageLoading)
    console.log('Submit loading state:', isSubmitting)
  }, [pageLoading, isSubmitting])

  if (pageLoading || isSubmitting) {
    return <Loader />
  }

  const handleCopyGuestId = () => {
    navigator.clipboard.writeText(formData.guestId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.purpose) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Authentication error');

      const userEmail = user.email?.toLowerCase();
      console.log('Current auth user:', { id: user.id, email: userEmail });

      // Try to get user data first (either as household member or primary resident)
      const { data: userData, error: userError2 } = await supabase
        .rpc('get_user_details', {
          user_email: userEmail
        });

      console.log('User details:', userData);

      if (userError2 || !userData) {
        console.error('Error getting user details:', userError2);
        throw new Error('Failed to get user details');
      }

      const guestData = {
        guest_id: formData.guestId,
        user_id: userData.primary_resident_id || userData.user_id,
        registered_by: user.id,
        registered_by_type: userData.is_household_member ? 'household_member' : 'primary_resident',
        full_name: formData.fullName,
        visit_date: new Date().toISOString().split('T')[0],
        visit_time: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        purpose_of_visit: formData.purpose,
        status: 'pending',
        block_number: userData.block_number,
        flat_number: userData.flat_number,
        created_at: new Date().toISOString()
      };

      console.log('Attempting to insert guest data:', guestData);

      const { error: visitorError } = await supabase
        .from('guests')
        .insert([guestData]);

      if (visitorError) {
        console.error('Visitor insert error:', visitorError);
        throw new Error('Failed to register visitor: ' + visitorError.message);
      }

      setShowSuccessModal(true);

    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  {isSubmitting ? "Register Visitor" : "Register Visitor"}
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
                Your visitor has been registered successfully. Please share the guest ID with the visitor.
              </DialogDescription>
            </DialogHeader>

            {/* Guest ID Card */}
            <div className="w-full mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex flex-col space-y-2">
                <span className="text-sm text-gray-500 font-medium font-quicksand">Guest ID</span>
                <div className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200">
                  <span className="font-semibold text-gray-800 font-quicksand">{formData.guestId}</span>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const text = `Welcome to LKJ estate, this is your access code ${formData.guestId}. Powered by UVISE\nhttps://uvise.com`;
                          try {
                            if (navigator.share) {
                              await navigator.share({
                                text: text,
                                url: 'https://uvise.ng'
                              });
                            } else {
                              navigator.clipboard.writeText(text);
                              toast.success("Link copied to clipboard!");
                            }
                          } catch (error) {
                            console.error('Error sharing:', error);
                          }
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const text = `Welcome to LKJ estate, this is your access code ${formData.guestId}. Powered by UVISE\nhttps://uvise.ng`;
                          navigator.clipboard.writeText(text);
                          toast.success("Code copied to clipboard!");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
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