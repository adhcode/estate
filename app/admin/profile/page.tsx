"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, EyeOff, Upload, Loader2 } from "lucide-react"
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
        async function loadStaffProfile() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                // Get staff data using id instead of user_id
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

                if (staffError) {
                    console.error('Staff Error details:', staffError.message, staffError.details)
                    return
                }

                if (!staffData) {
                    console.error('No staff data found for user:', user.id)
                    return
                }

                if (staffData) {
                    console.log('Staff data loaded:', {
                        email: staffData.email,
                        first_name: staffData.first_name,
                        last_name: staffData.last_name,
                        phone: staffData.phone
                    })
                    setStaffData(staffData)
                }

            } catch (error) {
                console.error('Error:', error)
            }
        }
        loadStaffProfile()
    }, [supabase])

    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto p-4 md:p-6 max-w-3xl">
                <Card className="border-0 shadow-none">
                    <CardContent className="p-4 md:p-6 lg:p-8">
                        {/* Profile Header */}
                        <div className="flex flex-col items-center mb-8 md:mb-12">
                            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                                <div className="relative">
                                    <Avatar className="h-32 w-32 md:h-44 md:w-44">
                                        <AvatarImage src={staffData?.avatar_url || "/placeholder.svg"} alt={staffData?.first_name || "Profile"} />
                                        <AvatarFallback>
                                            {staffData?.first_name?.[0]}{staffData?.last_name?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="flex flex-col items-center md:items-start gap-1">
                                    <h2 className="text-xl md:text-2xl font-semibold font-montserrat text-[#434343]">
                                        {staffData ? `${staffData.first_name} ${staffData.last_name}` : 'Loading...'}
                                    </h2>
                                    <p className="text-sm text-gray-500 font-montserrat">
                                        {staffData?.phone || 'Loading...'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Profile Details */}
                        <div className="font-montserrat">
                            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 md:gap-x-16 md:gap-y-8 max-w-2xl mx-auto">
                                {/* Info Row Component */}
                                {[
                                    { label: "Email", value: staffData?.email },
                                    { label: "Phone", value: staffData?.phone },
                                    { label: "Admin ID", value: staffData?.staff_id },
                                    { label: "Address", value: staffData?.address },
                                ].map((item, index) => (
                                    <React.Fragment key={index}>
                                        <span className="text-sm text-gray-500 md:text-right">
                                            {item.label}
                                        </span>
                                        <span className="text-sm mb-4 md:mb-0">
                                            {item.value || 'Loading...'}
                                        </span>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}