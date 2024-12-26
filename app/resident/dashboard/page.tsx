"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, History, ArrowRight, Users, Trash, Edit, ShoppingBag, Camera, Bell, User, LogOut } from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { LoadingScreen } from "@/components/ui/loading-screen"
import { toast } from "sonner";
import { createClient } from '@supabase/supabase-js'
import { AddMemberDialog } from "@/components/household/AddMemberDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Footer } from '@/app/resident/components/Footer'  // Adjust path as needed
import { HouseholdMembers } from '@/app/resident/components/HouseholdMembers'

type HouseholdMember = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  relationship: string;
  primary_resident_id: string;
  avatar_url?: string;
  invitation_status: 'pending' | 'sent' | 'accepted';
};

type UserProfile = {
  full_name: string;
  email: string;
  block_number: string;
  flat_number: string;
  avatar_url?: string;
}

type SupabaseUser = {
  id: string;

};

type MemberData = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  relationship: string;
  invitation_status: 'pending' | 'sent' | 'accepted';
};

export default function ResidentDashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<HouseholdMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<HouseholdMember | null>(null);

  function generateAccessCode(): string {
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    return code;
  }

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const checkUser = async () => {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('full_name, email, phone_number, block_number, flat_number')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
          throw profileError;
        }

        if (!profile) {
          throw new Error('No profile found');
        }

        setUserProfile({
          full_name: profile.full_name,
          email: profile.email,
          block_number: profile.block_number,
          flat_number: profile.flat_number
        });

        const { data: residentData, error: residentError } = await supabase
          .from('residents')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (residentError) {
          console.error('Resident error:', residentError);
          setLoading(false);
          return;
        }

        const { data: members, error: membersError } = await supabase
          .from('household_members')
          .select('*')
          .eq('primary_resident_id', residentData.id);

        if (membersError) {
          console.error('Members error:', membersError);
        } else {
          setHouseholdMembers(members || []);
        }

      } catch (error) {
        console.error('Error:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [isClient, supabase, router]);

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="flex-1 text-gray-800 font-montserrat">
      {/* Hero Section with User Welcome */}
      <div className="mb-8">
        <div className="container mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-2xl md:text-4xl font-bold text-[#832131]">
              {getTimeBasedGreeting()}, {userProfile?.full_name ? getFirstName(userProfile.full_name) : ''}
            </h1>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 mb-12">
        {/* Primary Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {[
            {
              title: "Register New Visitor",
              icon: UserPlus,
              desc: "Quick and secure visitor registration process",
              href: "/resident/register-visitor",
            },
            {
              title: "Guest History",
              icon: History,
              desc: "View and manage your visitor records",
              href: "/resident/guest-history",
            }
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="h-full"
            >
              <Link href={item.href} className="h-full block">
                <Card
                  className="group cursor-pointer active:shadow-lg hover:shadow-lg 
                     transition-all duration-300 border-2 border-[#832131] h-full"
                  style={{ touchAction: "manipulation" }}
                >
                  <CardHeader className="p-6 sm:p-8 h-full">
                    <div className="flex flex-col h-full">
                      <div className="flex items-start space-x-4 mb-4">
                        <div
                          className="bg-gray-100 p-4 rounded-full shrink-0 transition-colors duration-300
                            group-hover:bg-[#832131] group-active:bg-[#832131]
                            touch:group-active:bg-[#832131]"
                        >
                          <item.icon
                            className="h-6 w-6 sm:h-8 sm:w-8 transition-colors duration-300
                              text-[#832131] group-hover:text-white 
                              group-active:text-white touch:group-active:text-white"
                          />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl sm:text-2xl font-bold text-[#832131] mb-2">
                            {item.title}
                          </CardTitle>
                          <CardDescription className="text-sm sm:text-base">
                            {item.desc}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="mt-auto flex justify-end">
                        <ArrowRight
                          className="h-5 w-5 sm:h-6 sm:w-6 text-[#832131] transform transition-transform duration-300
                            group-hover:translate-x-2 group-active:translate-x-2
                            touch:group-active:translate-x-2"
                        />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Household Members Section */}
        <HouseholdMembers />

        {/* Estate Updates Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="bg-[#832131] p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-white/10 p-3 rounded-full">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">Estate Updates</CardTitle>
                  <CardDescription className="text-gray-200">
                    Latest announcements and security updates
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {[
                  {
                    title: "New Security Protocol",
                    desc: "Updated visitor registration process starts next week",
                    date: "Today"
                  },
                  {
                    title: "Visitor Parking Update",
                    desc: "New designated areas for visitor parking",
                    date: "Yesterday"
                  },
                  {
                    title: "Guest Access Hours",
                    desc: "Revised timing for visitor entry (6 AM - 10 PM)",
                    date: "2 days ago"
                  }
                ].map((update, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className="h-2 w-2 bg-[#832131] rounded-full mt-2"></div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{update.title}</h4>
                      <p className="text-gray-600">{update.desc}</p>
                      <p className="text-sm text-gray-400 mt-1">{update.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 p-6">
              <Button className="w-full bg-[#832131] hover:bg-[#6a1a28] text-white" size="lg">
                View All Updates
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}