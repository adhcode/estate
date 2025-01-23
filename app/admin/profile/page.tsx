"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from "@/components/ui/button"

interface StaffData {
    id: string
    email: string
    first_name: string
    last_name: string
    phone: string
    address: string
    avatar_url: string | null
    staff_id?: string
    role?: string
}

export default function AdminProfile() {
    const [staffData, setStaffData] = React.useState<StaffData | null>(null)
    const supabase = createClientComponentClient()

    // Fetch staff data on mount
    React.useEffect(() => {
        loadStaffProfile()
    }, [supabase])

    async function loadStaffProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: staffData, error: staffError } = await supabase
                .from('staff')
                .select(`
                    id,
                    email,
                    first_name,
                    last_name,
                    phone,
                    address,
                    avatar_url,
                    staff_id,
                    role
                `)
                .eq('id', user.id)
                .single()

            if (staffError) throw staffError
            if (staffData) setStaffData(staffData)

        } catch (error) {
            console.error('Error:', error)
        }
    }

    return (
        <div className="min-h-screen">
            <div className="container mx-auto p-4 md:p-6 max-w-4xl">
                <h1 className="text-3xl font-bold mb-8 text-center text-[#832131]">Admin Profile</h1>

                <Card className="shadow-lg">
                    <CardContent className="p-6 md:p-8">
                        {/* Profile Header */}
                        <div className="flex flex-col md:flex-row items-center gap-8 mb-12 pb-8 border-b">
                            <div className="relative">
                                <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white shadow-lg">
                                    <AvatarImage
                                        src={staffData?.avatar_url || "/placeholder.svg"}
                                        alt={staffData?.first_name || "Profile"}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="bg-[#832131] text-white text-2xl">
                                        {staffData?.first_name?.[0]}{staffData?.last_name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="flex flex-col items-center md:items-start gap-2">
                                <h2 className="text-2xl md:text-3xl font-semibold">
                                    {staffData ? `${staffData.first_name} ${staffData.last_name}` : 'Loading...'}
                                </h2>
                                <p className="text-gray-600 font-medium">
                                    {staffData?.role || 'Staff Member'}
                                </p>
                                <p className="text-gray-500">
                                    ID: {staffData?.staff_id || 'Loading...'}
                                </p>
                            </div>
                        </div>

                        {/* Profile Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Email</h3>
                                    <p className="text-gray-900">{staffData?.email || 'Loading...'}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Phone</h3>
                                    <p className="text-gray-900">{staffData?.phone || 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Address</h3>
                                    <p className="text-gray-900">{staffData?.address || 'Not provided'}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Role</h3>
                                    <p className="text-gray-900">{staffData?.role || 'Staff Member'}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}