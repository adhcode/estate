"use client"

import { Button } from "@/components/ui/button"
import { LayoutDashboard, BookOpen, Users, UserCircle, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Session } from '@supabase/auth-helpers-nextjs'
import { toast } from "react-hot-toast"
import { useState } from "react"

const navigationItems = [
    { name: "Overview", href: "/admin/overview", icon: LayoutDashboard },
    { name: "Visitor's Logbook", href: "/admin/logbook", icon: BookOpen },
    { name: "Resident Search", href: "/admin/resident-search", icon: Users },
    { name: "Profile", href: "/admin/profile", icon: UserCircle },
]

export default function DesktopSidebar({ session }: { session: Session }) {
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
        <aside className="hidden md:flex md:flex-col w-64 border-r bg-white shadow-sm">
            <div className="p-6 border-b">
                <h1 className="text-2xl font-bold text-[#832131]">LKJ Gardens</h1>
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
                            <item.icon className="h-5 w-5" />
                            <span className="font-medium">{item.name}</span>
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
    )
} 