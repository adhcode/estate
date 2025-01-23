"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
    LayoutDashboard,
    Users,
    Shield,
    Building2,
    FileText,
    Settings,
    Bell,
    LogOut,
    Menu,
    X,
    Wallet,
    MessageSquare,
    AlertTriangle,
    ClipboardList
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Session } from '@supabase/auth-helpers-nextjs'
import { toast } from "sonner"

interface SuperAdminUIProps {
    children: React.ReactNode
    session: Session
}

const navigationItems = [
    {
        name: "Dashboard",
        href: "/superadmin/dashboard",
        icon: LayoutDashboard,
        description: "Overview and key metrics"
    },

    {
        name: "Resident Directory",
        href: "/superadmin/residents",
        icon: Users,
        description: "View and manage residents"
    },

    {
        name: "Maintenance",
        href: "/superadmin/maintenance",
        icon: ClipboardList,
        description: "Track maintenance requests"
    },

    {
        name: "Communications",
        href: "/superadmin/communications",
        icon: MessageSquare,
        description: "Estate-wide announcements"
    },
    {
        name: "Financial Overview",
        href: "/superadmin/finance",
        icon: Wallet,
        description: "Estate finances and dues"
    }
]

export function SuperAdminUI({ children, session }: SuperAdminUIProps) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClientComponentClient()

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true)
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            toast.success('Logged out successfully')
            router.push('/auth/login')
        } catch (error) {
            console.error('Error logging out:', error)
            toast.error('Failed to log out')
        } finally {
            setIsLoggingOut(false)
        }
    }

    return (
        <div className="flex h-screen bg-white">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex md:flex-col w-64 border-r bg-white shadow-sm">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold text-[#832131]">LKJ Estate</h1>
                    <p className="text-sm text-gray-500 mt-1">Facility Management</p>
                </div>
                <nav className="flex-1 overflow-y-auto py-4">
                    <div className="px-4 space-y-2">
                        {navigationItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                                    pathname === item.href
                                        ? "bg-[#832131] text-white"
                                        : "text-gray-600 hover:bg-gray-100"
                                )}
                            >
                                <item.icon className="h-5 w-5 shrink-0" />
                                <div className="flex-1">
                                    <span className="font-medium">{item.name}</span>
                                    <p className="text-xs opacity-70 line-clamp-1">{item.description}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </nav>
                <div className="p-4 border-t">
                    <Button
                        variant="ghost"
                        className="w-full flex items-center gap-3 text-gray-600 hover:bg-gray-100"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium">
                            {isLoggingOut ? 'Logging out...' : 'Logout'}
                        </span>
                    </Button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b">
                <header className="flex items-center justify-between px-4 h-16">
                    <div>
                        <h1 className="text-xl font-bold text-[#832131]">LKJ Estate</h1>
                        <p className="text-xs text-gray-500">Facility Management</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                        className="text-gray-600"
                    >
                        {isMobileSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                </header>
            </div>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isMobileSidebarOpen && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/50 z-40 md:hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileSidebarOpen(false)}
                        />
                        <motion.aside
                            className="fixed top-16 left-0 bottom-0 w-64 bg-white z-50 md:hidden"
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <nav className="flex-1 overflow-y-auto py-4">
                                <div className="px-4 space-y-2">
                                    {navigationItems.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setIsMobileSidebarOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                                                pathname === item.href
                                                    ? "bg-[#832131] text-white"
                                                    : "text-gray-600 hover:bg-gray-100"
                                            )}
                                        >
                                            <item.icon className="h-5 w-5 shrink-0" />
                                            <div className="flex-1">
                                                <span className="font-medium">{item.name}</span>
                                                <p className="text-xs opacity-70 line-clamp-1">{item.description}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </nav>
                            <div className="p-4 border-t">
                                <Button
                                    variant="ghost"
                                    className="w-full flex items-center gap-3 text-gray-600 hover:bg-gray-100"
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                >
                                    <LogOut className="h-5 w-5" />
                                    <span className="font-medium">
                                        {isLoggingOut ? 'Logging out...' : 'Logout'}
                                    </span>
                                </Button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto md:pt-0 pt-16">
                <div className="container mx-auto p-4 md:p-6">
                    {children}
                </div>
            </main>
        </div>
    )
} 