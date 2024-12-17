"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from "sonner";

interface MemberData {
    primary_resident_id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    relationship: string;
    email: string;
    phone_number: string | null;
    invitation_status: 'pending' | 'sent' | 'accepted';
}

type AddMemberDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onMemberAdded: (newMember: MemberData) => void;
};

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

            // Get current user and resident data
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) throw new Error('User not authenticated');

            let { data: residentData, error: residentError } = await supabase
                .from('residents')
                .select('id')
                .eq('user_id', currentUser.id)
                .single();

            if (residentError || !residentData) {
                const { data: newResident, error: createError } = await supabase
                    .from('residents')
                    .insert([{ user_id: currentUser.id }])
                    .select('id')
                    .single();

                if (createError) throw createError;
                residentData = newResident;
            }

            // Create the household member with invitation status
            const memberData: MemberData = {
                primary_resident_id: residentData.id,
                user_id: currentUser.id,
                first_name: newMember.name.split(' ')[0],
                last_name: newMember.name.split(' ')[1] || '',
                relationship: newMember.relationship,
                email: newMember.email,
                phone_number: newMember.phone || null,
                invitation_status: 'sent' // Set to 'sent' since we just sent the email
            };

            const { data: memberResult, error: memberError } = await supabase
                .from('household_members')
                .insert([memberData])
                .select();

            if (memberError) throw memberError;

            if (memberResult && memberResult[0]) {
                onMemberAdded(memberResult[0]);
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