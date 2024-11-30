'use client'

import { Navbar } from '../app/resident/components/Navbar'
import { Footer } from '../app/resident/components/Footer'
import { ReactNode } from 'react'
import { User } from '@supabase/auth-helpers-nextjs'

interface ResidentUIProps {
    user: User
    children: ReactNode
    className?: string
}

export default function ResidentUI({ children, user, className }: ResidentUIProps) {
    // Get user's full name from user metadata if available
    const displayName = user.user_metadata?.full_name || user.email || 'User'

    return (
        <div className={`min-h-screen bg-[#FCE8EB] ${className}`}>
            <Navbar name={displayName} />
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
            <Footer />
        </div>
    )
} 