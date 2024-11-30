import React from "react"
import { Button } from "@/components/ui/button"

export function Footer() {
  return (
    <footer className="bg-[#832131] text-white py-6 sm:py-8 mt-12">
      <div className="container mx-auto px-4 flex flex-col items-center sm:items-start">
        <div className="flex flex-col sm:flex-row w-full justify-between items-center gap-4">
          <p className="text-center sm:text-left text-sm sm:text-base">
            &copy; 2024 LKJ Estate. All rights reserved.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Button variant="link" className="text-white hover:text-[#FCE8EB] text-sm sm:text-base h-auto p-0">
              Privacy Policy
            </Button>
            <Button variant="link" className="text-white hover:text-[#FCE8EB] text-sm sm:text-base h-auto p-0">
              Terms of Service
            </Button>
            <Button variant="link" className="text-white hover:text-[#FCE8EB] text-sm sm:text-base h-auto p-0">
              Contact Us
            </Button>
          </div>
        </div>
        <div className="text-center w-full mt-4 sm:mt-6">
          <p className="text-xs sm:text-sm">Powered by UVISE</p>
        </div>
      </div>
    </footer>
  )
} 