"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog"
import { User, LogOut } from "lucide-react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type NavbarProps = {
    name: string;
    avatar_url?: string;
}

export function Navbar({ name, avatar_url }: NavbarProps) {
    console.log('Avatar URL in Navbar:', avatar_url); // Debug log

    const router = useRouter()
    const supabase = createClientComponentClient()
    const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            router.refresh()
            router.push('/auth/login')
        } catch (error) {
            console.error('Error signing out:', error)
        } finally {
            setShowLogoutConfirmation(false)
        }
    }

    // Get initials for avatar fallback
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <header className="w-full py-4 px-6 flex justify-between items-center bg-white shadow-md sticky top-0 z-50 font-montserrat">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');
            `}</style>
            <Link href="/resident/dashboard" className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-[#832131]">LKJ Estate</h1>
            </Link>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="relative h-10 w-10 rounded-full hover:bg-[#FCE8EB] transition-all duration-300 p-0"
                    >
                        <Avatar className="h-10 w-10 border-2 border-[#832131]">
                            <AvatarImage
                                src={avatar_url || '/images/default-avatar.png'}
                                alt={name}
                            />
                            <AvatarFallback className="bg-[#832131] text-white">
                                {getInitials(name)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-56 mt-2"
                    align="end"
                    sideOffset={5}
                >
                    <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{name}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                Resident
                            </p>
                        </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="cursor-pointer flex items-center gap-2 py-3"
                        onClick={() => router.push('/resident/profile')}
                    >
                        <User className="h-4 w-4" />
                        <span>View Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="cursor-pointer flex items-center gap-2 text-red-600 py-3"
                        onClick={() => setShowLogoutConfirmation(true)}
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Logout Confirmation Dialog */}
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
        </header>
    )
}