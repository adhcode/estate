"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Building, Users, Shield, ArrowRight } from "lucide-react"
import Link from "next/link"

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
          <div className="flex gap-4">
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
            Your comprehensive estate management platform for seamless visitor registration and community engagement
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
                icon: Building,
                title: "Estate Management",
                description: "Efficiently manage your estate with our comprehensive digital solutions"
              },
              {
                icon: Users,
                title: "Visitor Registration",
                description: "Seamlessly register and track visitors to ensure estate security"
              },
              {
                icon: Shield,
                title: "Secure Access",
                description: "Control and monitor access to your estate with advanced security features"
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
              Join our community and experience seamless estate management
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full md:w-auto text-[#8B0000] hover:text-[#8B0000] bg-white hover:bg-white/90"
                >
                  Login to Your Account
                </Button>
              </Link>
              <Link href="/signup">
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
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-2xl font-bold mb-4 md:mb-0">LKJ Estate</div>
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-center md:text-left">
              <Link href="/login" className="hover:text-[#8B0000] transition-colors">
                Login
              </Link>
              <Link href="/signup" className="hover:text-[#8B0000] transition-colors">
                Sign up
              </Link>
              <a href="#" className="hover:text-[#8B0000] transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-[#8B0000] transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} LKJ Estate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}