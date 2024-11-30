"use client"

import { useState, useEffect } from 'react'
import { Description, Dialog , DialogPanel, DialogTitle } from '@headlessui/react'
import Image from 'next/image'
import { useAuth, useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, X } from 'lucide-react'

interface TourStep {
  title: string
  description: string
  image: string
}

interface TourModalProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to LKJ ESTATE ONLINE",
    description: "Hi {firstName}, let's take a mini tour of your new estate management platform",
    image: "/images/welcome.png"
  },
  {
    title: "Register Guests",
    description: "Easily register and manage visitors to your property",
    image: "/images/register-guest.png"
  },
  {
    title: "Guest History",
    description: "Track and view all past visitors with detailed records",
    image: "/images/history.png"
  },
  {
    title: "Community Chat",
    description: "Connect with other residents and stay updated with community news",
    image: "/images/chat.png"
  }
]

export default function TourModal({ isOpen, setIsOpen }: TourModalProps) {
 
  const [currentStep, setCurrentStep] = useState(0)
  const { userId, isLoaded } = useAuth()
  const { user } = useUser()
  
  useEffect(() => {
    if (!isLoaded || !userId || !user) return

    const tourCompleted = user.unsafeMetadata.tourCompleted
    
    if (!tourCompleted) {
      setIsOpen(true)
    }
  }, [isLoaded, userId, user, setIsOpen])

  const handleNext = async () => {
    if (currentStep === tourSteps.length - 1) {
      setIsOpen(false)
      if (!user) return
      await user.update({
        unsafeMetadata: {
          tourCompleted: true
        }
      })
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  // Early return if user data isn't loaded
  if (!user) return null

  // Replace the placeholder with actual user's first name
  const getDescription = (description: string) => {
    return description.replace('{firstName}', user.firstName || 'there')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          static
          as={motion.div}
          open={isOpen}
          onClose={() => setIsOpen(false)}
          className="relative z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
          
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel
              as={motion.div}
              className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="relative mb-6 w-full h-[250px]">
                <Image 
                  src={tourSteps[currentStep].image}
                  alt={tourSteps[currentStep].title}
                  width={500}
                  height={250}
                  className="rounded-lg object-cover w-full h-full"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-white/80 text-gray-800 hover:bg-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <DialogTitle className="text-2xl font-bold mb-2 text-[#8B0000]">
                {tourSteps[currentStep].title}
              </DialogTitle>

              <Description className="mb-6 text-gray-600">
                {getDescription(tourSteps[currentStep].description)}
              </Description>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-[#8B0000] transition-colors"
                >
                  Skip tour
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  className="px-6 py-2 bg-[#8B0000] text-white rounded-full font-medium flex items-center"
                >
                  {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                  <ChevronRight size={18} className="ml-1" />
                </motion.button>
              </div>

              <div className="flex justify-center mt-6 gap-2">
                {tourSteps.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`h-2 w-2 rounded-full ${
                      index === currentStep ? 'bg-[#8B0000]' : 'bg-gray-300'
                    }`}
                    initial={false}
                    animate={index === currentStep ? { scale: 1.5 } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                ))}
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  )
}