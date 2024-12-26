"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Trash, Edit, UserPlus } from "lucide-react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from "sonner"
import { AddMemberDialog } from "@/components/household/AddMemberDialog"
import { HouseholdMember, MemberData } from '@/types/index'
import { User } from '@supabase/auth-helpers-nextjs'

export function HouseholdMembers() {
    const supabase = createClientComponentClient()
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([])
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
    const [editingMember, setEditingMember] = useState<HouseholdMember | null>(null)
    const [memberToDelete, setMemberToDelete] = useState<HouseholdMember | null>(null)
    const [memberToUpdateAccess, setMemberToUpdateAccess] = useState<HouseholdMember | null>(null)

    // Fetch current user and household members
    const fetchMembers = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user');

            const { data: members, error } = await supabase
                .from('household_members')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setHouseholdMembers(members || []);
        } catch (error) {
            console.error('Error fetching members:', error);
            toast.error('Failed to load household members');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setCurrentUser(user);

                if (user) {
                    const { data: members, error } = await supabase
                        .from('household_members')
                        .select('*')
                        .eq('primary_resident_id', user.id)
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    setHouseholdMembers(members || []);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load household members');
            }
        };

        fetchData();

        // Set up realtime subscription
        const channel = supabase
            .channel('household_members_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'household_members' },
                () => {
                    fetchMembers();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

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
                    .eq('id', editingMember.id)

                if (error) throw error

                setHouseholdMembers(members =>
                    members.map(member =>
                        member.id === editingMember.id ? editingMember : member
                    )
                )
                setEditingMember(null)
                toast.success('Member updated successfully')
            } catch (error) {
                console.error('Error updating household member:', error)
                toast.error('Failed to update member')
            }
        }
    }

    const handleDeleteClick = (member: HouseholdMember) => {
        setMemberToDelete(member)
    }

    const confirmDelete = async () => {
        if (!memberToDelete) return

        try {
            const { error } = await supabase
                .from('household_members')
                .delete()
                .eq('id', memberToDelete.id)

            if (error) throw error

            setHouseholdMembers(prevMembers =>
                prevMembers.filter(member => member.id !== memberToDelete.id)
            )
            setMemberToDelete(null)
            toast.success('Member deleted successfully')
        } catch (error) {
            console.error('Error deleting household member:', error)
            toast.error('Failed to delete member')
        }
    }

    const handleAddMember = async (memberData: MemberData) => {
        if (!currentUser) {
            toast.error('Please login to add members');
            return;
        }

        try {
            // First check if member already exists for this user
            const { data: existingMember } = await supabase
                .from('household_members')
                .select('*')
                .eq('email', memberData.email)
                .eq('primary_resident_id', currentUser.id)
                .single();

            if (existingMember) {
                toast.error('This member is already in your household');
                return;
            }

            // Create household member
            const { data: newMember, error: memberError } = await supabase
                .from('household_members')
                .insert([{
                    first_name: memberData.first_name,
                    last_name: memberData.last_name,
                    email: memberData.email,
                    phone_number: memberData.phone_number,
                    relationship: memberData.relationship,
                    invitation_status: 'pending',
                    access_status: 'active',
                    primary_resident_id: currentUser.id
                }])
                .select('*')
                .single();

            if (memberError) throw memberError;

            // Send invitation email
            const response = await fetch('/api/household-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: memberData.email,
                    name: `${memberData.first_name} ${memberData.last_name}`,
                    origin: window.location.origin
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send invitation');
            }

            // Update local state
            setHouseholdMembers(prev => [newMember, ...prev]);
            toast.success('Member added and invitation sent successfully!');

        } catch (error: any) {
            console.error('Error adding member:', error);
            toast.error(error.message || 'Failed to add member');
        }
    };

    const handleAccessStatusChange = async (member: HouseholdMember, newStatus: 'active' | 'restricted') => {
        try {
            const { error } = await supabase
                .from('household_members')
                .update({ access_status: newStatus })
                .eq('id', member.id);

            if (error) throw error;

            // Update local state
            setHouseholdMembers(prevMembers =>
                prevMembers.map(m =>
                    m.id === member.id ? { ...m, access_status: newStatus } : m
                )
            );

            toast.success(`Member access updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating access status:', error);
            toast.error('Failed to update member access');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12"
        >
            <Card className="overflow-hidden">
                <CardHeader className="bg-[#832131] p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="bg-white/10 p-3 rounded-full">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl text-white">Household Members</CardTitle>
                                <CardDescription className="text-gray-200">
                                    {householdMembers.length} registered members
                                </CardDescription>
                            </div>
                        </div>
                        <Button
                            onClick={() => setIsAddMemberOpen(true)}
                            className="bg-white text-[#832131] hover:bg-gray-100"
                            size="lg"
                        >
                            <UserPlus className="h-5 w-5 mr-2" />
                            Add Member
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {householdMembers.map((member) => (
                            <Card key={member.id} className="bg-white border hover:shadow-md transition-all duration-300">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={member.avatar_url || ''} />
                                            <AvatarFallback className="bg-[#832131] text-white font-medium">
                                                {`${member.first_name[0]}${member.last_name[0]}`}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingMember(member)}
                                                className="hover:bg-gray-100"
                                            >
                                                <Edit className="h-4 w-4 text-gray-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteClick(member)}
                                                className="hover:bg-red-50"
                                            >
                                                <Trash className="h-4 w-4 text-red-500" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setMemberToUpdateAccess(member)}
                                                className={`hover:bg-gray-100 ${member.access_status === 'restricted' ? 'text-yellow-500' : 'text-green-500'
                                                    }`}
                                            >
                                                {member.access_status === 'active' ? '✓ Active' : '⚠️ Restricted'}
                                            </Button>
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-lg mb-1">{`${member.first_name} ${member.last_name}`}</h3>
                                    <p className="text-gray-600 text-sm mb-3">{member.relationship}</p>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium 
                                            ${member.invitation_status === 'accepted' ? 'bg-green-100 text-green-700' :
                                            member.invitation_status === 'sent' ? 'bg-blue-100 text-blue-700' :
                                                'bg-yellow-100 text-yellow-700'}`}
                                    >
                                        {member.invitation_status === 'accepted' ? '✓ Active' :
                                            member.invitation_status === 'sent' ? '⌛ Invited' :
                                                '⏳ Pending'}
                                    </span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Dialogs */}
            <AddMemberDialog
                isOpen={isAddMemberOpen}
                onClose={() => setIsAddMemberOpen(false)}
                onMemberAdded={handleAddMember}
            />

            {/* Edit Member Dialog */}
            <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>Edit Household Member</DialogTitle>
                        <DialogDescription>
                            Update the details of the household member.
                        </DialogDescription>
                    </DialogHeader>
                    {editingMember && (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="edit-name">Name</Label>
                                <Input
                                    id="edit-name"
                                    value={`${editingMember.first_name} ${editingMember.last_name}`}
                                    onChange={(e) => {
                                        const [firstName, ...lastNameParts] = e.target.value.split(' ')
                                        setEditingMember({
                                            ...editingMember,
                                            first_name: firstName || '',
                                            last_name: lastNameParts.join(' ') || ''
                                        })
                                    }}
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-relationship">Relationship</Label>
                                <Input
                                    id="edit-relationship"
                                    value={editingMember.relationship}
                                    onChange={(e) => setEditingMember({
                                        ...editingMember,
                                        relationship: e.target.value
                                    })}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            onClick={handleEditMember}
                            className="bg-[#832131] text-white hover:bg-[#6a1a28]"
                        >
                            Update Member
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={!!memberToDelete}
                onOpenChange={(open) => !open && setMemberToDelete(null)}
            >
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {memberToDelete?.first_name} {memberToDelete?.last_name}
                            from your household? This action cannot be undone.
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

            {/* Update Access Status Dialog */}
            <Dialog
                open={!!memberToUpdateAccess}
                onOpenChange={() => setMemberToUpdateAccess(null)}
            >
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>Update Access Status</DialogTitle>
                        <DialogDescription>
                            Change access level for {memberToUpdateAccess?.first_name} {memberToUpdateAccess?.last_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Button
                            onClick={() => {
                                if (memberToUpdateAccess) {
                                    handleAccessStatusChange(memberToUpdateAccess, 'active');
                                    setMemberToUpdateAccess(null);
                                }
                            }}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                            Set Active
                        </Button>
                        <Button
                            onClick={() => {
                                if (memberToUpdateAccess) {
                                    handleAccessStatusChange(memberToUpdateAccess, 'restricted');
                                    setMemberToUpdateAccess(null);
                                }
                            }}
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                            Set Restricted
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}