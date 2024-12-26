import React from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-[#832131] text-white w-full mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Estate Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">LKJ Estate</h3>
            <p className="text-gray-200">
              Modern living with smart security solutions
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-gray-200">
              <li>Email: reach@uvise.ng</li>
              <li>Phone: +234 XXX XXX XXXX</li>
              <li>Lagos, Nigeria</li>
            </ul>
          </div>

          {/* UVISE Branding */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Powered by</h4>
            <Link
              href="https://uvise.ng"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="text-2xl font-bold text-white hover:text-gray-200 transition-colors">
                UVISE
              </div>
              <p className="text-sm text-gray-200 mt-2 leading-relaxed">
                Building Digital Solutions for Business Growth
              </p>
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-200 text-sm">
              &copy; {new Date().getFullYear()} LKJ Estate. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <Link
                href="https://uvise.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-200 hover:text-white transition-colors flex items-center gap-1"
              >
                <span>Visit</span>
                <span className="font-semibold">UVISE</span>
                <span>for more digital solutions</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 