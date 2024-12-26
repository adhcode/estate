'use client'

import { Navbar } from '@/app/resident/components/Navbar'
import { Footer } from '@/app/resident/components/Footer'
import { ReactNode } from 'react'
import { User } from '@supabase/supabase-js'

interface ResidentUIProps {
    children: ReactNode
    user: User & {
        user_metadata: {
            full_name?: string
            avatar_url?: string
        }
    }
    className?: string
}

export default function ResidentUI({ children, user, className }: ResidentUIProps) {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar
                name={user.user_metadata?.full_name || user.email || ''}
                avatar_url={user.user_metadata?.avatar_url}
            />
            <div className={`flex-1 flex flex-col ${className}`}>
                {children}
            </div>
            <Footer />
        </div>
    )
} 