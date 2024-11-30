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
import { UserPlus, History, ArrowRight, Users, Trash, Edit, ShoppingBag, Camera } from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { LoadingScreen } from "@/components/ui/loading-screen"
import { toast } from "sonner";
import { createClient } from '@supabase/supabase-js'

type HouseholdMember = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  relationship: string;
  primary_resident_id: string;
  avatar_url?: string;
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

export default function ResidentDashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    relationship: "",
    email: "",
    phone: ""
  });
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

  const handleAddMember = async () => {
    try {
      const tempPassword = generateTempPassword();

      const response = await fetch('/api/household-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newMember.email,
          tempPassword,
          name: newMember.name,
          origin: window.location.origin
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user account');
      }

      // Get current resident's data
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('User not authenticated');

      let { data: residentData, error: residentError } = await supabase
        .from('residents')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();

      if (!residentData) {
        const { data: newResident, error: createError } = await supabase
          .from('residents')
          .insert([{ user_id: currentUser.id }])
          .select('id')
          .single();

        if (createError) throw createError;
        residentData = newResident;
      }

      // Create household member record
      const memberData = {
        primary_resident_id: residentData.id,
        user_id: currentUser.id,
        first_name: newMember.name.split(' ')[0],
        last_name: newMember.name.split(' ')[1] || '',
        relationship: newMember.relationship,
        email: newMember.email,
        phone_number: newMember.phone || null
      };

      const { data: memberResult, error: memberError } = await supabase
        .from('household_members')
        .insert([memberData])
        .select();

      if (memberError) throw memberError;

      if (memberResult && memberResult[0]) {
        setHouseholdMembers(prev => [...prev, memberResult[0]]);
        setNewMember({ name: "", relationship: "", email: "", phone: "" });
        setIsAddMemberOpen(false);
        toast.success('Household member added successfully. They will receive an email to set up their account.');
      }

    } catch (error: any) {
      console.error('Error adding household member:', error);
      toast.error(error.message || 'Failed to add household member');
    }
  };

  const handleEditMember = async () => {
    if (editingMember) {
      try {
        const { error } = await supabase
          .from('household_members')
          .update({
            first_name: editingMember.first_name,
            last_name: editingMember.last_name,
            relationship: editingMember.relationship
          })
          .eq('id', editingMember.id);

        if (error) throw error;

        setHouseholdMembers(members =>
          members.map(member =>
            member.id === editingMember.id ? editingMember : member
          )
        );
        setEditingMember(null);
      } catch (error) {
        console.error('Error updating household member:', error);
        // Add error handling UI feedback here
      }
    }
  };

  const handleDeleteClick = (member: HouseholdMember) => {
    setMemberToDelete(member);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;

    try {
      console.log('Attempting to delete member:', memberToDelete.id);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data: residentData, error: residentError } = await supabase
        .from('residents')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (residentError) throw residentError;

      console.log('Database deletion attempt with:', {
        memberId: memberToDelete.id,
        residentId: residentData.id,
        userId: user?.id
      });

      const { error: deleteError } = await supabase
        .from('household_members')
        .delete()
        .eq('id', memberToDelete.id)
        .eq('primary_resident_id', residentData.id);

      if (deleteError) {
        console.error('Database deletion error:', deleteError);
        throw deleteError;
      }

      const { data: checkData, error: checkError } = await supabase
        .from('household_members')
        .select('*')
        .eq('id', memberToDelete.id);

      if (checkError) throw checkError;

      if (checkData && checkData.length > 0) {
        console.error('Deletion failed - record still exists');
        throw new Error('Failed to delete member');
      }

      console.log('Member successfully deleted');

      setHouseholdMembers(prevMembers =>
        prevMembers.filter(member => member.id !== memberToDelete.id)
      );

      setMemberToDelete(null);

    } catch (error) {
      console.error('Error deleting household member:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <div className={`min-h-screen bg-[#FCE8EB] text-gray-800 font-montserrat transition-colors duration-300`}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');
        body {
          font-family: 'Montserrat', sans-serif;
        }
      `}</style>

      <div className="container mx-auto px-4 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-[#832131] mb-2">
            {getTimeBasedGreeting()}, {userProfile?.full_name ? getFirstName(userProfile.full_name) : ''}
          </h1>

        </motion.div>
      </div>

      <main className="container mx-auto px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-4"
        >

        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[
            { title: "Register Guest", icon: UserPlus, desc: "Seamlessly add new visitors", color: "bg-[#832131]", href: "/resident/register-visitor" },
            { title: "Guest History", icon: History, desc: "Review past visitor logs", color: "bg-[#832131]", href: "/resident/guest-history" },
            { title: "Marketplace", icon: ShoppingBag, desc: "Explore community services", color: "bg-[#832131]", href: "/resident/marketplace" },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={item.href}>
                <Card className="overflow-hidden group hover:shadow-xl transition-shadow duration-300 bg-white">
                  <CardHeader className={`${item.color} text-white p-6 group-hover:scale-105 transition-transform duration-300`}>
                    <item.icon className="h-12 w-12 mb-4" />
                    <CardTitle className="text-2xl font-semibold">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <CardDescription className="text-gray-600 mb-4">{item.desc}</CardDescription>
                    <Button className="w-full bg-[#832131] hover:bg-[#6a1a28] text-white" size="lg">
                      Access {item.title}
                    </Button>
                  </CardContent>
                </Card>
              </Link >
            </motion.div >
          ))
          }
        </div >

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-16"
        >
          <Card className="overflow-hidden bg-white">
            <CardHeader className="bg-[#832131] text-white">
              <CardTitle className="text-3xl font-bold flex items-center">
                <Users className="mr-3 h-8 w-8" />
                My Household
              </CardTitle>
              <CardDescription className="text-[#FCE8EB]">Manage your family members and their access</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {householdMembers.map((member) => (
                  <Card key={member.id} className="bg-[#FCE8EB]">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Avatar className="h-12 w-12 border-2 border-[#832131]">
                          <AvatarImage src={member.avatar_url || ''} />
                          <AvatarFallback className="bg-[#832131] text-white">
                            {member.first_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingMember(member)}>
                            <Edit className="h-4 w-4 text-[#832131]" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(member)}>
                            <Trash className="h-4 w-4 text-[#832131]" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-semibold">{`${member.first_name} ${member.last_name}`}</h3>
                      <p className="text-sm text-gray-600">{member.relationship}</p>
                    </CardContent>
                  </Card>
                ))}
                <Card className="flex items-center justify-center bg-[#FCE8EB]">
                  <Button
                    onClick={() => setIsAddMemberOpen(true)}
                    className="bg-[#832131] hover:bg-[#6a1a28] text-white font-medium py-6"
                    size="lg"
                  >
                    <UserPlus className="mr-2 h-5 w-5" />
                    Add Member
                  </Button>
                </Card>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="bg-white">
            <CardHeader className="bg-[#832131] text-white">
              <CardTitle className="text-2xl font-semibold">Latest Community Updates</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-4">
                {[
                  "New gym equipment arriving next week",
                  "Pool maintenance scheduled for this weekend",
                  "Community BBQ event on Saturday",
                  "Updated parking regulations now in effect"
                ].map((update, index) => (
                  <li key={index} className="flex items-center">
                    <span className="h-2 w-2 bg-[#832131] rounded-full mr-3"></span>
                    <p className="text-gray-700">{update}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/resident/updates" className="w-full">
                <Button className="w-full bg-[#832131] hover:bg-[#6a1a28] text-white">
                  View All Updates
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </main >

      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Add New Household Member</DialogTitle>
            <DialogDescription className="text-gray-500">
              Enter the details of the new household member. They will receive an email to set up their account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="relationship">Relationship</Label>
              <Input
                id="relationship"
                value={newMember.relationship}
                onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddMember}
              className="bg-[#832131] text-white hover:bg-[#6a1a28]"
            >
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Edit Household Member</DialogTitle>
            <DialogDescription className="text-gray-500">Update the details of the household member.</DialogDescription>
          </DialogHeader>
          {editingMember && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={`${editingMember.first_name} ${editingMember.last_name}`}
                  onChange={(e) => {
                    const [firstName, ...lastNameParts] = e.target.value.split(' ');
                    setEditingMember({
                      ...editingMember,
                      first_name: firstName || '',
                      last_name: lastNameParts.join(' ') || ''
                    });
                  }}
                />
              </div>
              <div>
                <Label htmlFor="edit-relationship">Relationship</Label>
                <Input
                  id="edit-relationship"
                  value={editingMember.relationship}
                  onChange={(e) => setEditingMember({ ...editingMember, relationship: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleEditMember} className="bg-[#832131] text-white hover:bg-[#6a1a28]">Update Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {memberToDelete?.first_name} {memberToDelete?.last_name} from your household? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setMemberToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div >
  )
}

function generateTempPassword(): string {
  return Math.random().toString(36).slice(-12);
}