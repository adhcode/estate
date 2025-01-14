"use client"

import React, { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, PlusIcon, UserPlusIcon } from "lucide-react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from "sonner"
import { AddMemberDialog } from "@/components/household/AddMemberDialog"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { MemberCard } from "./MemberCard"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface HouseholdMember {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string | null;
    relationship: string;
    invitation_status: 'pending' | 'sent' | 'accepted';
    access_status: 'active' | 'restricted';
    created_at: string;
    primary_resident_id?: string;
    avatar_url?: string;
}

interface MemberData {
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    relationship: string;
    avatar_url?: string;
}

interface ApiResponse {
    user: {
        id: string;
        primary_resident_id?: string;
    };
    message: string;
    emailId: string;
}

export function HouseholdMembers() {
    const [members, setMembers] = useState<HouseholdMember[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const supabase = createClientComponentClient();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        relationship: ''
    });

    // Add loading state for initial fetch
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const fetchMembers = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            console.log('Fetching members for user:', session.user.id); // Debug log

            const { data: members, error } = await supabase
                .from('household_members')
                .select('*')
                .eq('primary_resident_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase query error:', error); // Debug log
                throw error;
            }

            console.log('Fetched members:', members); // Debug log
            setMembers(members || []);
        } catch (error) {
            console.error('Error fetching members:', error);
            toast.error('Failed to load household members');
        } finally {
            setIsInitialLoading(false);
        }
    };

    // Fetch members on component mount
    useEffect(() => {
        fetchMembers();
    }, []);

    const generateTempPassword = () => {
        const length = 12;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }
        return password;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Validate form data
            if (!formData.first_name || !formData.last_name || !formData.email || !formData.relationship) {
                throw new Error('Please fill in all required fields');
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No authenticated session');

            const tempPassword = generateTempPassword();

            const requestData = {
                ...formData,
                tempPassword,
                origin: window.location.origin,
                primary_resident_id: session.user.id
            };

            console.log('Sending request with data:', {
                ...requestData,
                tempPassword: '[REDACTED]'
            });

            const response = await fetch('/api/household-member', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Server response:', data);
                throw new Error(data.error || 'Failed to add member');
            }

            // Create new member object with correct types
            const newMember: HouseholdMember = {
                id: data.user.id,
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone_number: formData.phone_number || null,
                relationship: formData.relationship,
                invitation_status: 'pending',
                access_status: 'active',
                created_at: new Date().toISOString(),
                primary_resident_id: session.user.id
            };

            setMembers(prevMembers => [newMember, ...prevMembers]);
            setIsOpen(false);
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                phone_number: '',
                relationship: ''
            });

            toast.success('Member added successfully');
        } catch (error: any) {
            console.error('Error details:', error);
            toast.error(error.message || 'Failed to add household member');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('household_members')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setMembers(prevMembers => prevMembers.filter(member => member.id !== id));
            toast.success('Member removed successfully');
        } catch (error) {
            console.error('Error deleting member:', error);
            toast.error('Failed to remove member');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-gray-200 pb-5">
                <div>
                    <h2 className="text-2xl font-semibold text-[#832131]">
                        Household Members
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Manage your household members and their access
                    </p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button
                            className="bg-[#832131] hover:bg-[#832131]/90 text-white"
                            size="default"
                        >
                            <UserPlusIcon className="w-4 h-4 mr-2" />
                            Add Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-[#832131]">
                                Add Household Member
                            </DialogTitle>
                            <DialogDescription className="text-gray-600">
                                Fill in the details below to invite a new household member.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">
                                        First Name*
                                    </Label>
                                    <Input
                                        id="first_name"
                                        placeholder="John"
                                        className="border-gray-200 focus:border-[#832131] focus:ring-[#832131]/10"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            first_name: e.target.value
                                        }))}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">
                                        Last Name*
                                    </Label>
                                    <Input
                                        id="last_name"
                                        placeholder="Doe"
                                        className="border-gray-200 focus:border-[#832131] focus:ring-[#832131]/10"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            last_name: e.target.value
                                        }))}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                    Email Address*
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john.doe@example.com"
                                    className="border-gray-200 focus:border-[#832131] focus:ring-[#832131]/10"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        email: e.target.value
                                    }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                                    Phone Number
                                </Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+1 (555) 000-0000"
                                    className="border-gray-200 focus:border-[#832131] focus:ring-[#832131]/10"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        phone_number: e.target.value
                                    }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="relationship" className="text-sm font-medium text-gray-700">
                                    Relationship*
                                </Label>
                                <Select
                                    value={formData.relationship}
                                    onValueChange={(value) => setFormData(prev => ({
                                        ...prev,
                                        relationship: value
                                    }))}
                                    required
                                >
                                    <SelectTrigger className="border-gray-200 focus:border-[#832131] focus:ring-[#832131]/10">
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
                            <Button
                                type="submit"
                                className="w-full bg-[#832131] hover:bg-[#832131]/90 text-white"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Adding Member...
                                    </>
                                ) : (
                                    <>
                                        <PlusIcon className="w-4 h-4 mr-2" />
                                        Add Member
                                    </>
                                )}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4">
                {isInitialLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-[#832131] rounded-full" role="status">
                            <span className="sr-only">Loading...</span>
                        </div>
                        <p className="mt-2 text-gray-600">Loading members...</p>
                    </div>
                ) : (
                    <>
                        {members.map((member) => (
                            <MemberCard
                                key={member.id}
                                member={member}
                                onDelete={handleDelete}
                            />
                        ))}
                        {members.length === 0 && (
                            <div className="text-center py-16 px-4 rounded-lg border-2 border-dashed border-gray-200">
                                <UserPlusIcon className="mx-auto h-12 w-12 text-[#832131]/30" />
                                <h3 className="mt-4 text-lg font-medium text-gray-900">
                                    No household members
                                </h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Get started by adding your first household member.
                                </p>
                                <Button
                                    onClick={() => setIsOpen(true)}
                                    className="mt-4 bg-[#832131]/10 text-[#832131] hover:bg-[#832131]/20"
                                >
                                    <UserPlusIcon className="w-4 h-4 mr-2" />
                                    Add Your First Member
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default HouseholdMembers;