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
    Users as UsersIcon
} from 'lucide-react'

type ResidentUIProps = {
    children: ReactNode
    user: User
    className?: string
}

const navigation = [
    { name: 'Dashboard', href: '/resident/dashboard', icon: HomeIcon },
    { name: 'Register Visitor', href: '/resident/register-visitor', icon: UserPlusIcon },
    { name: 'Guest History', href: '/resident/guest-history', icon: ClockIcon },
    { name: 'Household Members', href: '/resident/household-members', icon: UsersIcon }
]

export default function ResidentUI({ children, user, className }: ResidentUIProps) {
    const pathname = usePathname()

    return (
        <div className="flex min-h-screen flex-col bg-[#FCE8EB]">
            <Navbar
                name={user.user_metadata.full_name || user.email}
                avatar_url={user.user_metadata.avatar_url}
            />
            <div className="flex flex-1">
                {/* Sidebar Navigation */}
                <div className="hidden md:flex md:w-64 md:flex-col">
                    <div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 bg-white pt-5">
                        <div className="flex flex-grow flex-col">
                            <nav className="flex-1 space-y-1 px-2">
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
                                                'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                                            )}
                                        >
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
                                        </Link>
                                    )
                                })}
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <main className="flex-1">
                    <div className="py-6">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    )
}