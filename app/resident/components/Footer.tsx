import React from "react"
import Link from "next/link"
import { Mail, Phone, MapPin, ExternalLink, Facebook, Twitter, Instagram, Globe } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-[#8B0000]">
      <div className="container mx-auto">
        {/* Main Footer Content */}
        <div className="px-4 md:px-6 py-8 md:py-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
            {/* Brand Section */}
            <div className="md:col-span-4 space-y-4 md:space-y-6">
              <div className="text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-bold text-white">LKJ Estate</h3>
                <p className="text-sm text-gray-300 mt-2 leading-relaxed max-w-sm mx-auto md:mx-0">
                  Experience modern living with smart security solutions. Building a connected and secure community together.
                </p>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-6">
                <Link href="#" className="text-white hover:text-gray-300 transition-colors">
                  <Facebook className="h-5 w-5" />
                </Link>
                <Link href="#" className="text-white hover:text-gray-300 transition-colors">
                  <Twitter className="h-5 w-5" />
                </Link>
                <Link href="#" className="text-white hover:text-gray-300 transition-colors">
                  <Instagram className="h-5 w-5" />
                </Link>
                <Link href="#" className="text-white hover:text-gray-300 transition-colors">
                  <Globe className="h-5 w-5" />
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-4">
              <h4 className="text-lg font-semibold text-white mb-4 md:mb-6 text-center md:text-left">
                Quick Links
              </h4>
              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto md:max-w-none">
                <div>
                  <ul className="space-y-3">
                    <li>
                      <Link
                        href="/resident/register-visitor"
                        className="text-gray-300 hover:text-white transition-colors text-sm flex items-center justify-center md:justify-start gap-2"
                      >
                        Register Visitor
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/resident/guest-history"
                        className="text-gray-300 hover:text-white transition-colors text-sm flex items-center justify-center md:justify-start gap-2"
                      >
                        Guest History
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/resident/amenities"
                        className="text-gray-300 hover:text-white transition-colors text-sm flex items-center justify-center md:justify-start gap-2"
                      >
                        Amenities
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <ul className="space-y-3">
                    <li>
                      <Link
                        href="/resident/events"
                        className="text-gray-300 hover:text-white transition-colors text-sm flex items-center justify-center md:justify-start gap-2"
                      >
                        Events
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/resident/social"
                        className="text-gray-300 hover:text-white transition-colors text-sm flex items-center justify-center md:justify-start gap-2"
                      >
                        Social Hub
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/resident/forums"
                        className="text-gray-300 hover:text-white transition-colors text-sm flex items-center justify-center md:justify-start gap-2"
                      >
                        Forums
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="md:col-span-4">
              <h4 className="text-lg font-semibold text-white mb-4 md:mb-6 text-center md:text-left">
                Contact Us
              </h4>
              <ul className="space-y-4 max-w-xs mx-auto md:max-w-none">
                <li>
                  <a
                    href="mailto:reach@uvise.ng"
                    className="text-gray-300 hover:text-white transition-colors flex items-center justify-center md:justify-start gap-3 text-sm"
                  >
                    <Mail className="h-5 w-5" />
                    reach@uvise.ng
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+234XXXXXXXXX"
                    className="text-gray-300 hover:text-white transition-colors flex items-center justify-center md:justify-start gap-3 text-sm"
                  >
                    <Phone className="h-5 w-5" />
                    +234 XXX XXX XXXX
                  </a>
                </li>
                <li className="flex items-center justify-center md:justify-start gap-3 text-gray-300 text-sm">
                  <MapPin className="h-5 w-5" />
                  Lagos, Nigeria
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="px-4 md:px-6 py-6 flex flex-col items-center space-y-4 md:space-y-0 md:flex-row md:justify-between">
            <p className="text-sm text-gray-300 text-center md:text-left">
              &copy; {new Date().getFullYear()} LKJ Estate. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              <Link
                href="/privacy"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="https://uvise.ng"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
              >
                Powered by{" "}
                <span className="font-semibold">UVISE</span>
                <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 