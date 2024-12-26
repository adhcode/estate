'use client'

import { Navbar } from '@/app/resident/components/Navbar'
import { Footer } from '@/app/resident/components/Footer'
import { ReactNode } from 'react'
import { User } from '@supabase/auth-helpers-nextjs'

type ResidentUIProps = {
    children: ReactNode
    user: User
    className?: string
}

export default function ResidentUI({ children, user, className }: ResidentUIProps) {
    return (
        <div className="flex min-h-screen flex-col bg-[#FCE8EB]">
            <Navbar
                name={user.user_metadata.full_name || user.email}
                avatar_url={user.user_metadata.avatar_url}
            />
            <main className="flex-1 flex flex-col">
                {children}
            </main>
            <Footer />
        </div>
    )
}