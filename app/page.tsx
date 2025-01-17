"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Building, Users, Shield, ArrowRight, Menu, MessageSquare, Bell, FileText } from "lucide-react"
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

      {/* Header with fixed navigation */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl md:text-3xl font-bold text-[#8B0000]"
          >
            LKJ Gardens Connect
          </motion.div>

          {/* Desktop Navigation */}
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

      {/* Updated Hero Section */}
      <motion.section
        className="pt-32 pb-16 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to{" "}
            <span className="text-[#8B0000]">LKJ Gardens Connect</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Your all-in-one platform for estate living, community engagement, and service management
          </p>
          <Link href="/auth/signup">
            <Button
              size="lg"
              className="bg-[#8B0000] text-white hover:bg-[#6B0000] text-lg px-8 h-12"
            >
              Join Our Community
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </motion.section>

      {/* Updated Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Building,
                title: "Residence Management",
                description: "Manage your flat details, access estate information, and stay updated with community announcements"
              },
              {
                icon: Users,
                title: "Visitor Management",
                description: "Pre-register visitors, generate access codes, and track visitor history for enhanced security"
              },
              {
                icon: Shield,
                title: "Security & Access Control",
                description: "Secure authentication, visitor verification, and real-time security notifications"
              },
              {
                icon: MessageSquare,
                title: "Community Forum",
                description: "Engage with fellow residents, share updates, and participate in community discussions"
              },
              {
                icon: Bell,
                title: "Notifications & Updates",
                description: "Receive important announcements, maintenance schedules, and community event notifications"
              },
              {
                icon: FileText,
                title: "Service Requests",
                description: "Submit and track maintenance requests, report issues, and access estate services"
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

      {/* Updated CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <motion.div
            className="bg-gradient-to-r from-[#8B0000] to-[#6B0000] rounded-3xl p-8 md:p-12 text-white text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Connect with Your Community
            </h2>
            <p className="text-lg md:text-xl mb-8 text-white/90">
              Join LKJ Gardens Connect to access all estate services and stay connected with your community
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full md:w-auto text-[#8B0000] hover:text-[#8B0000] bg-white hover:bg-white/90"
                >
                  Register Now
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  size="lg"
                  className="w-full md:w-auto bg-transparent hover:bg-white/10 border-2 border-white"
                >
                  Resident Login
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Updated Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="text-2xl font-bold">LKJ Gardens Connect</div>
              <p className="text-gray-400">
                Connecting residents, enhancing community living
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Platform Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Resident Portal</li>
                <li>Visitor Management</li>
                <li>Community Forum</li>
                <li>Service Requests</li>
                <li>Payment Integration</li>
                <li>Event Management</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/auth/signup" className="text-gray-400 hover:text-[#8B0000] transition-colors">
                    Register
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="text-gray-400 hover:text-[#8B0000] transition-colors">
                    Login
                  </Link>
                </li>
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