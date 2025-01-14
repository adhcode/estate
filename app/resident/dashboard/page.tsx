"use client";

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users, Calendar, MessageSquare, Bell, Shield,
  Activity, Megaphone, Building, Heart, Coffee,
  Ticket, Utensils, Music, Zap, ArrowRight, Sparkles
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader } from "@/app/components/Loader"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).toUpperCase();
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(formatTime(new Date()))
  const [firstName, setFirstName] = useState("")
  const supabase = createClientComponentClient()
  const router = useRouter()

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(formatTime(new Date()))
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Data fetching effect
  useEffect(() => {
    async function initializePage() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Current user:', user);

        if (!user) {
          router.push('/login');
          return;
        }

        // Try to get user data from users table with explicit filter
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(`
            id,
            role,
            full_name,
            avatar_url
          `)
          .filter('id', 'eq', user.id)
          .maybeSingle();

        if (userData) {
          // Primary resident found
          console.log('Primary resident data:', userData);
          setUserRole(userData.role);
          setFirstName(userData.full_name.split(' ')[0]);
          setLoading(false);
          return;
        }

        // If not found in users table, try household_members
        const { data: memberData, error: memberError } = await supabase
          .from('household_members')
          .select(`
            id,
            first_name,
            last_name,
            avatar_url
          `)
          .filter('id', 'eq', user.id)
          .maybeSingle();

        if (memberError) {
          console.error('Error fetching household member:', memberError);
          toast.error('Failed to load user data');
          return;
        }

        if (memberData) {
          console.log('Household member data:', memberData);
          setUserRole('household_member');
          setFirstName(memberData.first_name);
        } else {
          // Handle case where user is not found in either table
          console.error('User not found in any table');
          toast.error('User profile not found');
          router.push('/login');
        }

      } catch (error) {
        console.error('Error in initializePage:', error);
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    }

    initializePage();
  }, [supabase, router]);

  if (loading) {
    return <Loader />
  }

  return (
    <div className="min-h-screen bg-white font-quicksand">
      {/* Hero Section - Restored original design */}
      <motion.section
        className="relative pt-8 pb-16 px-4 bg-gradient-to-b from-[#8B0000]/5 to-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto text-center">
          <motion.div
            className="flex flex-col items-center justify-center gap-2 md:gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative">
              <div className="text-base md:text-lg text-gray-600">
                {time}
              </div>
              <div className="text-xl md:text-2xl font-medium text-gray-700">
                {(() => {
                  const hour = new Date().getHours();
                  if (hour < 12) return `Good Morning, ${firstName}`;
                  if (hour < 17) return `Good Afternoon, ${firstName}`;
                  return `Good Evening, ${firstName}`;
                })()}
              </div>
            </div>
            <motion.h1
              className="text-3xl md:text-4xl font-bold text-gray-900 mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Welcome to <span className="text-[#8B0000] relative">
                LKJ Estate Connect
                <motion.span
                  className="absolute -top-4 -right-4 md:-top-6 md:-right-6"
                  animate={{
                    rotate: 360,
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity
                  }}
                >
                  <Sparkles className="h-4 w-4 md:h-6 md:w-6 text-[#8B0000]" />
                </motion.span>
              </span>
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Your digital gateway to seamless estate living
            </motion.p>
          </motion.div>
        </div>
      </motion.section>

      {/* Quick Actions - Solid background cards */}
      <motion.section
        className="py-8 px-4 bg-gray-50"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Essential Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Register Visitor",
                description: "Pre-register and manage your visitors",
                href: "/resident/register-visitor",
              },
              {
                icon: Activity,
                title: "Guest History",
                description: "View and manage past visitors",
                href: "/resident/guest-history",
              },
              {
                icon: Bell,
                title: "Emergency Contacts",
                description: "Quick access to emergency services",
                href: "/resident/emergency",
              }
            ].map((service, index) => (
              <motion.div key={index} variants={item}>
                <Link href={service.href}>
                  <Card className="group hover:shadow-lg transition-all duration-300 border-none overflow-hidden bg-white">
                    <CardHeader className="space-y-1 bg-white">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#8B0000]/10">
                          <service.icon className="h-5 w-5 text-[#8B0000]" />
                        </div>
                        <CardTitle className="text-lg">{service.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-gray-600">{service.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Community Features - Solid background */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Community Life</h2>
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Calendar,
                title: "Events",
                description: "Community gatherings",
                href: "/resident/events",
              },
              {
                icon: Coffee,
                title: "Social Hub",
                description: "Connect with neighbors",
                href: "/resident/social",
              },
              {
                icon: Ticket,
                title: "Amenities",
                description: "Book facilities",
                href: "/resident/amenities",
              },
              {
                icon: MessageSquare,
                title: "Forums",
                description: "Join discussions",
                href: "/resident/forums",
              }
            ].map((feature, index) => (
              <motion.div key={index} variants={item}>
                <Link href={feature.href}>
                  <Card className="group hover:shadow-lg transition-all duration-300 border-none h-full bg-gray-50">
                    <CardHeader className="space-y-1">
                      <feature.icon className="h-5 w-5 text-[#8B0000] group-hover:scale-110 transition-transform duration-300" />
                      <CardTitle className="text-base md:text-lg">
                        {feature.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {feature.description}
                      </p>
                    </CardHeader>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Updates Section */}
      <motion.section
        className="py-12 px-4 bg-white"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto">
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="bg-[#8B0000] text-white p-6">
              <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                <Megaphone className="h-6 w-6" />
                Latest Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[
                  {
                    title: "Estate Meeting",
                    description: "Monthly community meeting this Saturday at 10 AM.",
                    time: "Today"
                  },
                  {
                    title: "Maintenance Notice",
                    description: "Water system maintenance scheduled for next week.",
                    time: "2 days ago"
                  },
                  {
                    title: "New Security Protocol",
                    description: "Updated visitor registration process now in effect.",
                    time: "1 week ago"
                  }
                ].map((update, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-300"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{update.title}</h3>
                      <p className="text-sm text-gray-600">{update.description}</p>
                    </div>
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {update.time}
                    </span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>
    </div>
  )
}