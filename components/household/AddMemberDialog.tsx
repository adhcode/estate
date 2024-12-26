"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from "sonner";
import { MemberData } from '@/types/index'

interface AddMemberDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onMemberAdded: (newMember: MemberData) => Promise<void>;
}

export function AddMemberDialog({ isOpen, onClose, onMemberAdded }: AddMemberDialogProps) {
    const supabase = createClientComponentClient();
    const [newMember, setNewMember] = useState({
        name: "",
        relationship: "",
        email: "",
        phone: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddMember = async () => {
        if (!newMember.name || !newMember.email || !newMember.relationship) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const tempPassword = generateTempPassword();

            // First, send the invitation email
            console.log('Sending invitation email...');
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
            console.log('API Response:', data);

            if (!response.ok) {
                console.error('API Error:', data);
                throw new Error(data.message || data.error || 'Failed to create user account');
            }

            if (!data.user) {
                console.error('Missing user data in response:', data);
                throw new Error('No user data received from server');
            }

            // Get current user and resident data
            console.log('Getting current user...');
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) {
                console.error('No current user found');
                throw new Error('User not authenticated');
            }

            console.log('Getting resident data...');
            let { data: residentData, error: residentError } = await supabase
                .from('residents')
                .select('id')
                .eq('user_id', currentUser.id)
                .single();

            if (residentError) {
                console.error('Resident error:', residentError);
            }

            if (residentError || !residentData) {
                console.log('Creating new resident...');
                const { data: newResident, error: createError } = await supabase
                    .from('residents')
                    .insert([{ user_id: currentUser.id }])
                    .select('id')
                    .single();

                if (createError) {
                    console.error('Create resident error:', createError);
                    throw createError;
                }
                residentData = newResident;
            }

            // Create the household member with invitation status
            console.log('Creating household member...');
            const memberData: MemberData = {
                primary_resident_id: residentData.id,
                first_name: newMember.name.split(' ')[0],
                last_name: newMember.name.split(' ')[1] || '',
                relationship: newMember.relationship,
                email: newMember.email,
                phone_number: newMember.phone || null,
                invitation_status: 'sent',
                access_status: 'active'
            };

            const { data: memberResult, error: memberError } = await supabase
                .from('household_members')
                .insert([memberData])
                .select('id, created_at, primary_resident_id, first_name, last_name, email, phone_number, relationship, avatar_url, user_id, invitation_status');

            if (memberError) {
                console.error('Member creation error:', memberError);
                throw memberError;
            }

            if (memberResult && memberResult[0]) {
                console.log('Member added successfully:', memberResult[0]);
                await onMemberAdded(memberResult[0]);
                setNewMember({ name: "", relationship: "", email: "", phone: "" });
                onClose();
                toast.success('Household member added successfully. An invitation has been sent to their email.');
            }

        } catch (error: any) {
            console.error('Error adding household member:', error);
            toast.error(error.message || 'Failed to add household member');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-white">
                <DialogHeader>
                    <DialogTitle>Add New Household Member</DialogTitle>
                    <DialogDescription className="text-gray-500">
                        Enter the details of the new household member. They will receive an email invitation to set up their account.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            value={newMember.name}
                            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                            placeholder="Enter full name"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                        <Input
                            id="email"
                            type="email"
                            value={newMember.email}
                            onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                            placeholder="Enter email address"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={newMember.phone}
                            onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                            placeholder="Enter phone number (optional)"
                        />
                    </div>
                    <div>
                        <Label htmlFor="relationship">Relationship <span className="text-red-500">*</span></Label>
                        <Input
                            id="relationship"
                            value={newMember.relationship}
                            onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
                            placeholder="e.g., Spouse, Child, Parent"
                            required
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleAddMember}
                        className="bg-[#832131] text-white hover:bg-[#6a1a28]"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Adding Member...' : 'Add Member'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function generateTempPassword(): string {
    return Math.random().toString(36).slice(-12);
} 