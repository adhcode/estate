"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger } from "@/components/ui/drawer"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { ChevronLeft, Search, Mail, Phone, UserCircle, Shield, Ban, Check, AlertCircle, Plus, Eye, Power, Loader2, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { AddMemberDialog, type AddMemberDialogProps } from "@/components/household/AddMemberDialog"
import { toast } from "sonner"
import { Loader } from "@/app/components/Loader"
import { Label } from "@/components/ui/label"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { type HouseholdMember } from "@/types/household"

function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false)

    useEffect(() => {
        const media = window.matchMedia(query)
        if (media.matches !== matches) {
            setMatches(media.matches)
        }
        const listener = () => setMatches(media.matches)
        window.addEventListener("resize", listener)
        return () => window.removeEventListener("resize", listener)
    }, [matches, query])

    return matches
}

export default function HouseholdMembers() {
    const [members, setMembers] = useState<HouseholdMember[]>([])
    const [currentUserRole, setCurrentUserRole] = useState<'resident' | 'member' | null>(null)
    const [isLoadingMembers, setIsLoadingMembers] = useState(true)
    const [isLoadingRole, setIsLoadingRole] = useState(true)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [selectedMember, setSelectedMember] = useState<HouseholdMember | null>(null)
    const [isConfirming, setIsConfirming] = useState(false)
    const supabase = createClientComponentClient()

    const fetchHouseholdMembers = async () => {
        console.log('Starting fetchHouseholdMembers')
        try {
            const { data: members, error } = await supabase
                .from('household_members')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            console.log('Successfully fetched members:', members)
            setMembers(members || [])
        } catch (error) {
            console.error('Error fetching members:', error)
            toast.error('Failed to fetch household members')
        } finally {
            setIsLoadingMembers(false)
        }
    }

    const checkUserRole = async () => {
        console.log('Starting checkUserRole')
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setCurrentUserRole(null)
                return
            }

            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single()

            if (userData?.role === 'resident') {
                console.log('Setting user role to resident')
                setCurrentUserRole('resident')
            } else {
                setCurrentUserRole('member')
            }
        } catch (error) {
            console.error('Error checking role:', error)
            toast.error('Error checking permissions')
        } finally {
            setIsLoadingRole(false)
        }
    }

    useEffect(() => {
        const initialize = async () => {
            try {
                await Promise.all([
                    checkUserRole(),
                    fetchHouseholdMembers()
                ])
            } catch (error) {
                console.error('Error during initialization:', error)
                toast.error('Error loading data')
            }
        }

        initialize()
    }, [])

    // Debug loading states
    useEffect(() => {
        console.log('Current state:', {
            isLoadingRole,
            isLoadingMembers,
            membersCount: members.length,
            currentUserRole
        })
    }, [isLoadingRole, isLoadingMembers, members, currentUserRole])

    const handleViewDetails = (member: HouseholdMember) => {
        setSelectedMember(member)
    }

    const handleMemberAdded = async () => {
        await fetchHouseholdMembers()
        setShowAddDialog(false)
    }

    const handleRevokeAccess = () => {
        setIsConfirming(true)
    }

    const confirmRevokeAccess = async () => {
        if (selectedMember) {
            const updatedMember: HouseholdMember = {
                ...selectedMember,
                access_status: 'suspended' as 'suspended'
            }
            setMembers((prevMembers) =>
                prevMembers.map((member) =>
                    member.id === selectedMember.id ? updatedMember : member
                )
            )
            setSelectedMember(updatedMember)
            setIsConfirming(false)
        }
    }

    const handleRestoreAccess = async () => {
        if (selectedMember) {
            const updatedMember: HouseholdMember = {
                ...selectedMember,
                access_status: 'active' as 'active'
            }
            setMembers((prevMembers) =>
                prevMembers.map((member) =>
                    member.id === selectedMember.id ? updatedMember : member
                )
            )
            setSelectedMember(updatedMember)
        }
    }

    if (isLoadingRole || isLoadingMembers) {
        return (
            <Loader />
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <motion.main
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="container mx-auto py-8 px-4"
            >
                <div className="flex flex-col space-y-4 mb-8 border-b pb-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-semibold tracking-tight text-[#832131]">
                            Household Members
                        </h1>
                        <p className="text-base text-gray-600">
                            Manage your household members and their access
                        </p>
                    </div>
                    {currentUserRole === 'resident' && (
                        <Button
                            onClick={() => setShowAddDialog(true)}
                            size="lg"
                            className="bg-[#832131] hover:bg-[#832131]/90 w-full sm:w-auto"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Add New Member
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {members.map((member) => (
                        <motion.div
                            key={member.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="hover:shadow-md transition-all">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <Avatar className="h-12 w-12 border-2 border-gray-100">
                                                <AvatarFallback className="bg-gray-100 text-gray-600">
                                                    {member.first_name[0]}{member.last_name[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-lg font-medium text-gray-900">
                                                    {member.first_name} {member.last_name}
                                                </CardTitle>
                                                <CardDescription className="text-gray-600">
                                                    {member.relationship}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge
                                            variant={member.access_status === 'active' ? 'default' : 'destructive'}
                                            className="capitalize"
                                        >
                                            {member.access_status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-4">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Mail className="h-4 w-4 mr-3 text-gray-400" />
                                        {member.email}
                                    </div>
                                    {member.phone_number && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Phone className="h-4 w-4 mr-3 text-gray-400" />
                                            {member.phone_number}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="flex justify-end border-t pt-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewDetails(member)}
                                        className="text-gray-600 hover:text-gray-900"
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Details
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <AddMemberDialog
                    isOpen={showAddDialog}
                    setIsOpen={setShowAddDialog}
                    onMemberAdded={handleMemberAdded}
                />

                <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">

                            </DialogTitle>
                        </DialogHeader>

                        {selectedMember && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16 border-2 border-gray-100">
                                        <AvatarFallback className="bg-gray-100 text-gray-600 text-xl">
                                            {selectedMember.first_name[0]}{selectedMember.last_name[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {selectedMember.first_name} {selectedMember.last_name}
                                        </h3>
                                        <p className="text-sm text-gray-500">{selectedMember.relationship}</p>
                                    </div>
                                </div>

                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-500">Email</Label>
                                        <div className="flex items-center gap-2 text-gray-900">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            {selectedMember.email}
                                        </div>
                                    </div>

                                    {selectedMember.phone_number && (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-500">Phone</Label>
                                            <div className="flex items-center gap-2 text-gray-900">
                                                <Phone className="h-4 w-4 text-gray-400" />
                                                {selectedMember.phone_number}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-500">Status</Label>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={selectedMember.access_status === 'active' ? 'default' : 'destructive'}
                                                className="capitalize"
                                            >
                                                {selectedMember.access_status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter className="flex items-center mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedMember(null)}
                                        className="px-6 py-2 text-sm mt-2 font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 w-[240px]"
                                    >
                                        Close
                                    </Button>
                                    {currentUserRole === 'resident' && (
                                        selectedMember.access_status === 'active' ? (
                                            <Button
                                                variant="destructive"
                                                className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 w-[240px]"
                                                onClick={handleRevokeAccess}
                                            >
                                                <Ban className="h-4 w-4 mr-2" />
                                                Revoke Access
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="default"
                                                className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 w-[240px]"
                                                onClick={handleRestoreAccess}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Restore Access
                                            </Button>
                                        )
                                    )}
                                </DialogFooter>

                                {isConfirming && (
                                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                                        <p className="text-sm text-red-700">
                                            Are you sure you want to suspend {selectedMember.first_name} {selectedMember.last_name}?
                                        </p>
                                        <div className="flex justify-end space-x-2 mt-2">
                                            <Button variant="outline" size="sm" onClick={() => setIsConfirming(false)}>
                                                Cancel
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={confirmRevokeAccess}>
                                                Confirm
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </motion.main>
        </div>
    )
} 