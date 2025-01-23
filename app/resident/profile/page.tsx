"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Phone, Home as HomeIcon, LogOut, Camera, ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Quicksand } from 'next/font/google'
import { Loader } from "@/app/components/Loader"
import { toast } from "react-hot-toast"

const quicksand = Quicksand({
    subsets: ['latin'],
})

export default function ProfilePage() {
    const [user, setUser] = useState({
        full_name: "",
        email: "",
        phone_number: "",
        block_number: "",
        flat_number: "",
        avatar_url: null as string | null
    })
    const [loading, setLoading] = useState(true)
    const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
    const [imageUploading, setImageUploading] = useState(false)
    const router = useRouter()
    const supabase = createClientComponentClient()

    useEffect(() => {
        async function loadUserProfile() {
            try {
                console.log('Loading user profile...')

                const { data: { user: authUser } } = await supabase.auth.getUser()
                console.log('Auth user:', authUser)

                if (!authUser) {
                    router.push('/auth/login')
                    return
                }

                // First check if user is in users table
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUser.id)
                    .single()

                if (userData) {
                    // This is a primary resident
                    setUser({
                        full_name: userData.full_name || '',
                        email: authUser.email || '',
                        phone_number: userData.phone_number || '',
                        block_number: userData.block_number || '',
                        flat_number: userData.flat_number || '',
                        avatar_url: userData.avatar_url
                    })
                } else {
                    // If not in users table, check household_members
                    const { data: householdData, error: householdError } = await supabase
                        .from('household_members')
                        .select('*')
                        .eq('id', authUser.id)
                        .single()

                    console.log('Household member data:', householdData)

                    if (householdError) {
                        console.error('Error fetching household member:', householdError)
                        return
                    }

                    if (householdData) {
                        // Get primary resident's details
                        const { data: primaryResidentData, error: primaryError } = await supabase
                            .from('users')
                            .select('block_number, flat_number')
                            .eq('id', householdData.primary_resident_id)
                            .single()

                        console.log('Primary resident data:', primaryResidentData)

                        if (primaryError) {
                            console.error('Error fetching primary resident:', primaryError)
                        }

                        setUser({
                            full_name: `${householdData.first_name} ${householdData.last_name}`,
                            email: authUser.email || '',
                            phone_number: householdData.phone_number || '',
                            block_number: primaryResidentData?.block_number || '',
                            flat_number: primaryResidentData?.flat_number || '',
                            avatar_url: householdData.avatar_url
                        })
                    }
                }
            } catch (error) {
                console.error('Error:', error)
            } finally {
                setLoading(false)
            }
        }

        loadUserProfile()
    }, [supabase, router])

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            router.refresh()
            router.push('/auth/login')
        } catch (error: unknown) {
            console.error('Error signing out:', error instanceof Error ? error.message : JSON.stringify(error))
        } finally {
            setShowLogoutConfirmation(false)
        }
    }

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = event.target.files?.[0]
            if (!file) return

            setImageUploading(true)
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) return

            // Upload image to Supabase storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${authUser.id}-${Math.random()}.${fileExt}`
            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(fileName, file)

            if (error) throw error

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            // Update user with new avatar URL in users table
            const { error: updateError } = await supabase
                .from('users')
                .update({ avatar_url: publicUrl })
                .eq('id', authUser.id)

            if (updateError) throw updateError

            setUser(prev => ({ ...prev, avatar_url: publicUrl }))
            toast.success('Profile picture updated successfully')
        } catch (error) {
            console.error('Error uploading image:', error)
            toast.error('Failed to update profile picture')
        } finally {
            setImageUploading(false)
        }
    }

    if (loading) {
        return <Loader />
    }

    return (
        <div className="min-h-screen bg-[#FCE8EB]">
            <main className="container mx-auto px-4 py-8">
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Button
                        variant="ghost"
                        className="mb-8 group flex items-center text-[#832131] hover:text-[#832131]/80 hover:bg-white/50"
                        onClick={() => router.push('/resident/dashboard')}
                    >
                        <ChevronLeft className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
                        Back to Dashboard
                    </Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="max-w-2xl mx-auto space-y-6">
                        {/* Profile Header Card */}
                        <Card className="border-none shadow-lg overflow-hidden">
                            <div className="bg-[#832131] h-32 relative">
                                <div className="absolute -bottom-16 w-full flex justify-center">
                                    <div className="relative">
                                        <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                                            <AvatarImage
                                                src={user.avatar_url || "/default-avatar.png"}
                                                alt={user.full_name}
                                                className="object-cover"
                                                width={128}
                                                height={128}
                                                loading="eager"
                                                style={{ imageRendering: 'crisp-edges' }}
                                            />
                                            <AvatarFallback className="bg-[#832131] text-white text-3xl">
                                                {user.full_name ? user.full_name[0] : '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <label htmlFor="avatar-upload"
                                            className="absolute bottom-2 right-2 p-3 bg-white rounded-full shadow-md cursor-pointer 
                                                     hover:bg-gray-50 transition-all duration-300 hover:shadow-lg
                                                     active:scale-95">
                                            <Camera className="h-5 w-5 text-[#832131]" />
                                            <input
                                                id="avatar-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageUpload}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <CardContent className="pt-20 pb-6 text-center">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {user.full_name || 'Loading...'}
                                </h2>
                            </CardContent>
                        </Card>

                        {/* Profile Details Card */}
                        <Card className="border-none shadow-lg">
                            <CardHeader className="border-b border-gray-100 bg-white">
                                <CardTitle className="text-xl font-semibold text-[#832131]">
                                    Personal Information
                                </CardTitle>
                                <p className="text-sm text-gray-500">
                                    Contact support if you need to update your information
                                </p>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {[
                                    { label: "Full Name", value: user.full_name, icon: User },
                                    { label: "Email Address", value: user.email, icon: Mail },
                                    { label: "Phone Number", value: user.phone_number, icon: Phone },
                                    { label: "Block", value: user.block_number, icon: HomeIcon },
                                    { label: "Flat", value: user.flat_number, icon: HomeIcon }
                                ].map((item, index) => (
                                    <div key={index} className="group p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                                        <Label className="text-sm font-medium text-gray-500 mb-2 block">
                                            {item.label}
                                        </Label>
                                        <div className="flex items-center gap-3">
                                            <item.icon className="h-5 w-5 text-[#832131] group-hover:scale-110 transition-transform duration-200" />
                                            <p className="text-base text-gray-900">
                                                {item.value || 'Not provided'}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-6 border-t border-gray-100">
                                    <Button
                                        variant="ghost"
                                        className="w-full flex items-center justify-center gap-2 text-[#832131] 
                                                 hover:bg-red-50 hover:text-[#832131] h-12 text-base"
                                        onClick={() => setShowLogoutConfirmation(true)}
                                    >
                                        <LogOut className="h-5 w-5" />
                                        <span>Logout from Account</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </motion.div>
            </main>

            {/* Logout Dialog */}
            <Dialog open={showLogoutConfirmation} onOpenChange={setShowLogoutConfirmation}>
                <DialogContent className="w-[90%] max-w-[320px] rounded-xl bg-white p-6 shadow-xl">
                    <div className="flex flex-col items-center justify-center gap-4 pb-4">
                        <div className="rounded-full bg-red-50 p-4">
                            <LogOut className="h-8 w-8 text-[#832131]" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-gray-900">
                            Confirm Logout
                        </DialogTitle>
                        <DialogDescription className="text-center text-sm text-gray-600">
                            Are you sure you want to logout? You'll need to sign in again to access your account.
                        </DialogDescription>
                    </div>

                    <DialogFooter className="flex flex-col gap-3 pt-4">
                        <Button
                            type="button"
                            className="w-full bg-[#832131] font-medium text-white hover:bg-[#832131]/90 h-11"
                            onClick={handleLogout}
                        >
                            Yes, Logout
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowLogoutConfirmation(false)}
                            className="w-full border-2 border-gray-200 font-medium hover:bg-gray-50 h-11"
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}