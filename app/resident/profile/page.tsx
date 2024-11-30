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
import { LoadingScreen } from "@/components/ui/loading-screen"

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
                const { data: { user: authUser } } = await supabase.auth.getUser()
                console.log('Auth user:', authUser)

                if (!authUser) {
                    router.push('/auth/login')
                    return
                }

                const { data: resident, error } = await supabase
                    .from('residents')
                    .select('*')
                    .eq('user_id', authUser.id)
                    .single()

                console.log('Resident data:', resident)
                console.log('Resident error:', error)

                if (error) {
                    console.error('Error fetching resident:', error.message)
                    return
                }

                if (resident) {
                    const userData = {
                        full_name: `${resident.first_name} ${resident.last_name}`.trim(),
                        email: authUser.email || '',
                        phone_number: resident.phone_number || '',
                        block_number: resident.block_number || '',
                        flat_number: resident.flat_number || '',
                        avatar_url: resident.avatar_url
                    }
                    console.log('Setting user state:', userData)
                    setUser(userData)
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

            // Update user with new avatar URL
            const { error: updateError } = await supabase
                .from('users')
                .update({ avatar_url: publicUrl })
                .eq('id', authUser.id)

            if (updateError) throw updateError

            setUser(prev => ({ ...prev, avatar_url: publicUrl }))
        } catch (error) {
            console.error('Error uploading image:', error)
            // You might want to show an error toast here
        } finally {
            setImageUploading(false)
        }
    }

    if (loading) {
        return <LoadingScreen />
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto px-4 py-12">
                <Button
                    variant="ghost"
                    className="mb-6 -ml-4 text-gray-600 hover:text-gray-900 hover:bg-transparent"
                    onClick={() => router.push('/resident/dashboard')}
                >
                    <ChevronLeft className="h-5 w-5 mr-1" />
                    Back to Dashboard
                </Button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="max-w-2xl mx-auto space-y-6">
                        {/* Profile Header Card */}
                        <Card className="border-none shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center">
                                    <div className="relative">
                                        <Avatar className="w-32 h-32 border-2 border-white">
                                            <AvatarImage
                                                src={user.avatar_url || "/default-avatar.png"}
                                                alt={user.full_name}
                                            />
                                            <AvatarFallback className="bg-primary text-2xl">
                                                {user.full_name ? user.full_name[0] : '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <label htmlFor="avatar-upload"
                                            className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                                            <Camera className="h-5 w-5 text-primary" />
                                            <input
                                                id="avatar-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageUpload}
                                            />
                                        </label>
                                    </div>
                                    {!user.avatar_url && (
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            Upload profile picture
                                        </p>
                                    )}
                                    <h2 className="mt-4 text-2xl font-bold">{user.full_name || 'Loading...'}</h2>
                                    <p className="text-muted-foreground">Resident</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Profile Details Card */}
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold">Personal Information</CardTitle>
                                <p className="text-sm text-muted-foreground">Contact support if you need to update your information</p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-gray-400" />
                                        <p className="text-base">{user.full_name || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-gray-500">Email Address</Label>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <p className="text-base">{user.email || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-gray-500">Phone Number</Label>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <p className="text-base">{user.phone_number || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-gray-500">Block</Label>
                                    <div className="flex items-center gap-2">
                                        <HomeIcon className="h-4 w-4 text-gray-400" />
                                        <p className="text-base">{user.block_number || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-gray-500">Flat</Label>
                                    <div className="flex items-center gap-2">
                                        <HomeIcon className="h-4 w-4 text-gray-400" />
                                        <p className="text-base">{user.flat_number || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <Button
                                        variant="ghost"
                                        className="w-full flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10"
                                        onClick={() => setShowLogoutConfirmation(true)}
                                    >
                                        <LogOut size={20} />
                                        <span>Logout</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </motion.div>
            </main>

            {/* Updated Logout Dialog with Quicksand font */}
            <Dialog open={showLogoutConfirmation} onOpenChange={setShowLogoutConfirmation}>
                <DialogContent className={`w-[90%] max-w-[320px] rounded-xl bg-white p-6 shadow-lg ${quicksand.className}`}>
                    <div className="flex flex-col items-center justify-center gap-2 pb-4">
                        <div className="rounded-full bg-red-50 p-3">
                            <LogOut className="h-6 w-6 text-[#832131]" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-gray-900">
                            Logout Account
                        </DialogTitle>
                        <DialogDescription className="text-center text-sm text-gray-500">
                            Are you sure you want to logout from your account? You will need to login again to access your account.
                        </DialogDescription>
                    </div>

                    <DialogFooter className="flex flex-col gap-2 pt-4">
                        <Button
                            type="button"
                            className="w-full bg-[#832131] font-medium text-white hover:bg-[#832131]/90"
                            onClick={handleLogout}
                        >
                            Yes, Logout
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowLogoutConfirmation(false)}
                            className="w-full border-2 border-gray-200 font-medium hover:bg-gray-50"
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}