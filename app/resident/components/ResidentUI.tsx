'use client'

import { Navbar } from '@/app/resident/components/Navbar'
import { Footer } from '@/app/resident/components/Footer'
import { ReactNode } from 'react'
import { User } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    Home as HomeIcon,
    UserPlus as UserPlusIcon,
    Clock as ClockIcon,
    Users as UsersIcon,
    MessageSquare,
    Bell,
    Menu,
    CreditCard
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

type ResidentUIProps = {
    children: ReactNode
    user: User
    className?: string
}

const navigation = [
    { name: 'Dashboard', href: '/resident/dashboard', icon: HomeIcon },
    { name: 'Messages', href: '/resident/messages', icon: MessageSquare },
    { name: 'Payments', href: '/resident/payments', icon: CreditCard },
    { name: 'Register Visitor', href: '/resident/register-visitor', icon: UserPlusIcon },
    { name: 'Guest History', href: '/resident/guest-history', icon: ClockIcon },
    { name: 'Household Members', href: '/resident/household-members', icon: UsersIcon }
]

export default function ResidentUI({ children, user, className }: ResidentUIProps) {
    const pathname = usePathname()
    const [unreadCount, setUnreadCount] = useState(0)

    const fetchUnreadCount = useCallback(async () => {
        const supabase = createClientComponentClient()
        try {
            const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('recipient_id', user.id)
                .eq('is_read', false)

            if (error) throw error
            setUnreadCount(count || 0)
        } catch (error) {
            console.error('Error fetching unread count:', error)
        }
    }, [user.id])

    useEffect(() => {
        const supabase = createClientComponentClient()
        fetchUnreadCount()

        // Set up real-time subscription
        const channel = supabase
            .channel('messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `recipient_id=eq.${user.id}`
                },
                () => {
                    fetchUnreadCount()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user.id, fetchUnreadCount])

    return (
        <div className="flex h-screen overflow-hidden bg-[#FCE8EB]">
            <Navbar
                name={user.user_metadata.full_name || user.email}
                avatar_url={user.user_metadata.avatar_url}
            >
                {/* Mobile Menu Button */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0">
                        <div className="flex flex-col h-full bg-white">
                            <div className="p-4 border-b">
                                <h2 className="text-lg font-semibold">Menu</h2>
                            </div>
                            <nav className="flex-1 space-y-1 p-2">
                                {navigation.map((item) => {
                                    const isActive = pathname === item.href
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={cn(
                                                isActive
                                                    ? 'bg-[#832131] text-white'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                                'group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md'
                                            )}
                                        >
                                            <div className="flex items-center">
                                                <item.icon
                                                    className={cn(
                                                        isActive
                                                            ? 'text-white'
                                                            : 'text-gray-400 group-hover:text-gray-500',
                                                        'mr-3 flex-shrink-0 h-6 w-6'
                                                    )}
                                                    aria-hidden="true"
                                                />
                                                {item.name}
                                            </div>
                                            {item.name === 'Messages' && unreadCount > 0 && (
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-[#8B0000] text-white"
                                                >
                                                    {unreadCount}
                                                </Badge>
                                            )}
                                        </Link>
                                    )
                                })}
                            </nav>
                        </div>
                    </SheetContent>
                </Sheet>
            </Navbar>

            <div className="flex flex-1 pt-16">
                {/* Sidebar Navigation */}
                <div className="hidden md:flex md:w-64 md:flex-col">
                    <div className="flex flex-grow flex-col border-r border-gray-200 bg-white">
                        <nav className="flex-1 space-y-1 px-2 py-4">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            isActive
                                                ? 'bg-[#832131] text-white'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                            'group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md'
                                        )}
                                    >
                                        <div className="flex items-center">
                                            <item.icon
                                                className={cn(
                                                    isActive
                                                        ? 'text-white'
                                                        : 'text-gray-400 group-hover:text-gray-500',
                                                    'mr-3 flex-shrink-0 h-6 w-6'
                                                )}
                                                aria-hidden="true"
                                            />
                                            {item.name}
                                        </div>
                                        {item.name === 'Messages' && unreadCount > 0 && (
                                            <Badge
                                                variant="secondary"
                                                className="bg-[#8B0000] text-white"
                                            >
                                                {unreadCount}
                                            </Badge>
                                        )}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <main className="flex-1 relative overflow-y-auto">
                    <div className="py-6">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
            <Footer className="fixed bottom-0 w-full" />
        </div>
    )
}