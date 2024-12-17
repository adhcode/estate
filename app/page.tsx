"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Building, Users, Shield, ArrowRight, Menu } from "lucide-react"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-quicksand">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap');
        body {
          font-family: 'Quicksand', sans-serif;
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl md:text-3xl font-bold text-[#8B0000]"
          >
            LKJ Estate
          </motion.div>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex gap-4">
            <Link href="/auth/login">
              <Button variant="outline" className="text-[#8B0000] border-[#8B0000]">
                Login
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-[#8B0000] text-white hover:bg-[#6B0000]">
                Sign up
              </Button>
            </Link>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6 text-[#8B0000]" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="w-full">
                <div className="flex flex-col gap-4 pt-6">
                  <Link href="/auth/login">
                    <Button
                      variant="outline"
                      className="w-full text-[#8B0000] border-[#8B0000]"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button
                      className="w-full bg-[#8B0000] text-white hover:bg-[#6B0000]"
                    >
                      Sign up
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <motion.section
        className="pt-32 pb-16 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to{" "}
            <span className="text-[#8B0000]">LKJ Estate</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Experience seamless visitor management and enhanced security with our digital estate solution
          </p>
          <Link href="/auth/login">
            <Button
              size="lg"
              className="bg-[#8B0000] text-white hover:bg-[#6B0000] text-lg px-8 h-12"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Visitor Management",
                description: "Pre-register your visitors and receive real-time notifications when they arrive"
              },
              {
                icon: Shield,
                title: "Enhanced Security",
                description: "Digital verification system ensuring controlled access to the estate"
              },
              {
                icon: Building,
                title: "Estate Safety",
                description: "Keep track of all visitors and maintain a secure environment"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <div className="w-12 h-12 bg-[#8B0000]/10 rounded-full flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-[#8B0000]" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <motion.div
            className="bg-gradient-to-r from-[#8B0000] to-[#6B0000] rounded-3xl p-8 md:p-12 text-white text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg md:text-xl mb-8 text-white/90">
              Join our community and experience modern estate living
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link href="/auth/login">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full md:w-auto text-[#8B0000] hover:text-[#8B0000] bg-white hover:bg-white/90"
                >
                  Login to Your Account
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="w-full md:w-auto bg-transparent hover:bg-white/10 border-2 border-white"
                >
                  Create New Account
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="text-2xl font-bold">LKJ Estate</div>
              <p className="text-gray-400">
                Modern living with smart security solutions
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Visitor Pre-registration</li>
                <li>Real-time Notifications</li>
                <li>Access Control</li>
                <li>Security Monitoring</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/auth/login" className="text-gray-400 hover:text-[#8B0000] transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="text-gray-400 hover:text-[#8B0000] transition-colors">
                    Sign up
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="text-gray-400 hover:text-[#8B0000] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="text-gray-400 hover:text-[#8B0000] transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Email: reach@uvise.ng</li>
                <li>Phone: +234 XXX XXX XXXX</li>
                <li>Lagos, Nigeria</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 text-center">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400">
                &copy; {new Date().getFullYear()} LKJ Estate. All rights reserved.
              </p>
              <div className="mt-4 md:mt-0">
                <p className="text-gray-400">
                  Powered by{" "}
                  <a
                    href="https://uvise.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-[#8B0000] font-semibold transition-colors"
                  >
                    UVISE
                  </a>
                  {" "}- Building Digital Solutions for Business Growth
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}