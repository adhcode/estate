"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface AddMemberDialogProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onMemberAdded: () => Promise<void>;
}

export function AddMemberDialog({ isOpen, setIsOpen, onMemberAdded }: AddMemberDialogProps) {
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        relationship: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const supabase = createClientComponentClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const { data: session } = await supabase.auth.getSession()
            if (!session?.session?.user) {
                toast.error('Please login again')
                return
            }

            const userId = session.session.user.id
            const tempPassword = Math.random().toString(36).slice(-8)

            // Match the exact property names expected by the API
            const response = await fetch('/api/household-member', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    first_name: formData.first_name,      // Use snake_case
                    last_name: formData.last_name,        // Use snake_case
                    email: formData.email,
                    phone_number: formData.phone_number,
                    relationship: formData.relationship,
                    tempPassword,
                    primary_resident_id: userId,
                    origin: window.location.origin
                }),
            })

            const responseData = await response.json()
            console.log('API Response:', responseData)  // Log the response

            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to add member')
            }

            await onMemberAdded()
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                phone_number: '',
                relationship: ''
            })
            setIsOpen(false)
            toast.success('Member added and invitation sent')

        } catch (error) {
            console.error('Error in form submission:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to add member')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Household Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">First Name</Label>
                            <Input
                                id="first_name"
                                value={formData.first_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Last Name</Label>
                            <Input
                                id="last_name"
                                value={formData.last_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={formData.phone_number}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="relationship">Relationship</Label>
                        <Select
                            value={formData.relationship}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, relationship: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="spouse">Spouse</SelectItem>
                                <SelectItem value="child">Child</SelectItem>
                                <SelectItem value="parent">Parent</SelectItem>
                                <SelectItem value="sibling">Sibling</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Adding..." : "Add Member"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
} 