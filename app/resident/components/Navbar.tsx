"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogHeader,
} from "@/components/ui/dialog"
import { Menu, X, Home, UserPlus, Clock, Users, User, LogOut, User2 } from "lucide-react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Sheet, SheetContent, SheetHeader, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

type NavbarProps = {
    name: string;
    avatar_url?: string;
}

const navigation = [
    { name: 'Dashboard', href: '/resident/dashboard', icon: Home },
    { name: 'Register Visitor', href: '/resident/register-visitor', icon: UserPlus },
    { name: 'Guest History', href: '/resident/guest-history', icon: Clock },
    { name: 'Household Members', href: '/resident/household-members', icon: Users },
    { name: 'Profile', href: '/resident/profile', icon: User },
]

export function Navbar({ name, avatar_url }: NavbarProps) {
    const router = useRouter()
    const supabase = createClientComponentClient()
    const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [activeItem, setActiveItem] = useState<string | null>(null)
    const [fullName, setFullName] = useState<string>("");
    const [userRole, setUserRole] = useState<string>("");
    const [userData, setUserData] = useState<any>(null);
    const pathname = usePathname();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // First try users table
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (userData) {
                    setUserRole('resident');
                    setFullName(userData.full_name);
                    setUserData(userData);
                    return;
                }

                // If not in users table, check household_members
                const { data: memberData, error: memberError } = await supabase
                    .from('household_members')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (memberData) {
                    setUserRole('household_member');
                    setFullName(`${memberData.first_name} ${memberData.last_name}`);
                    setUserData({
                        ...memberData,
                        full_name: `${memberData.first_name} ${memberData.last_name}`
                    });
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, [supabase]);

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

    // Add animation delay before closing
    const handleNavigation = async (href: string, name: string) => {
        setActiveItem(name)

        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 300))

        // Close menu with fade
        setIsOpen(false)

        // Wait for menu to close before navigation
        await new Promise(resolve => setTimeout(resolve, 150))

        router.push(href)
    }

    return (
        <header className="w-full py-4 px-6 flex justify-between items-center bg-white shadow-md sticky top-0 z-50 font-montserrat">
            <Link href="/resident/dashboard" className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-[#832131]">LKJ Estate</h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
                {navigation.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-x-2 text-sm transition-colors duration-200",
                            "hover:text-[#832131]",
                            pathname === item.href ? "text-[#832131] font-medium" : "text-gray-600"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                    </Link>
                ))}
                <Button
                    variant="ghost"
                    className="flex items-center gap-x-2 text-sm hover:text-[#832131] transition-colors duration-200"
                    onClick={() => setShowLogoutConfirmation(true)}
                >
                    <LogOut className="h-4 w-4" />
                    Sign out
                </Button>
            </nav>

            {/* Mobile Navigation */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-6 w-6" />
                        <VisuallyHidden>Open navigation menu</VisuallyHidden>
                    </Button>
                </SheetTrigger>
                <SheetContent
                    className="w-[300px] sm:w-[400px] transition-transform duration-300"
                    side="right"
                >
                    <SheetHeader>
                        <SheetTitle></SheetTitle>
                        <SheetDescription>

                        </SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-col h-full">
                        {/* Profile Section */}
                        <SheetHeader className="pb-8 border-b">
                            <div className="space-y-6">
                                <Avatar className="h-20 w-20 mx-auto">
                                    <AvatarImage
                                        src={userData?.avatar_url || ""}
                                        alt={fullName}
                                        className="object-cover"
                                    />
                                    <AvatarFallback>
                                        <User2 className="h-10 w-10" />
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex flex-col space-y-1.5 items-center">
                                    <p className="text-base font-semibold">{fullName}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {userRole === 'resident' ? 'Resident' : 'Household Member'}
                                    </p>
                                </div>
                            </div>
                        </SheetHeader>

                        {/* Navigation Items */}
                        <div className="flex-1 py-6 space-y-4">
                            <nav className="space-y-2">
                                {navigation.map((item) => (
                                    <button
                                        key={item.name}
                                        onClick={() => handleNavigation(item.href, item.name)}
                                        className={cn(
                                            "flex w-full items-center gap-x-3 px-4 py-3 text-sm rounded-lg",
                                            "transition-all duration-200 ease-in-out",
                                            "hover:bg-accent/80 hover:translate-x-1",
                                            pathname === item.href && "bg-accent",
                                            activeItem === item.name && "bg-accent/90 translate-x-2",
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "h-5 w-5 transition-transform duration-200",
                                            activeItem === item.name && "scale-110"
                                        )} />
                                        <span className={cn(
                                            "transition-colors duration-200",
                                            activeItem === item.name && "font-medium"
                                        )}>
                                            {item.name}
                                        </span>
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Footer Section */}
                        <div className="border-t pt-6">
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-x-3 text-sm hover:translate-x-1 transition-transform duration-200"
                                onClick={() => setShowLogoutConfirmation(true)}
                            >
                                <LogOut className="h-5 w-5" />
                                Sign out
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Logout Confirmation Dialog */}
            <Dialog open={showLogoutConfirmation} onOpenChange={setShowLogoutConfirmation}>
                <DialogContent
                    className="sm:max-w-md"
                    aria-describedby="logout-description"
                >
                    <DialogHeader>
                        <DialogTitle>Confirm Logout</DialogTitle>
                        <DialogDescription id="logout-description">
                            Are you sure you want to logout? You'll need to sign in again to access your account.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center justify-center gap-4 py-4">
                        <div className="rounded-full bg-red-50 p-4" aria-hidden="true">
                            <LogOut className="h-8 w-8 text-[#832131] animate-pulse" />
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col gap-3">
                        <Button
                            type="button"
                            className="w-full bg-[#832131] font-medium text-white hover:bg-[#832131]/90 h-11 transition-colors duration-200"
                            onClick={handleLogout}
                        >
                            Yes, Logout
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowLogoutConfirmation(false)}
                            className="w-full border-2 border-gray-200 font-medium hover:bg-gray-50 h-11 transition-colors duration-200"
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </header>
    )
}