'use client'


import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { ReactNode } from 'react'
import { User } from '@supabase/auth-helpers-nextjs'


type ResidentUIProps = {
    children: ReactNode
    user: User
}

export default function ResidentUI({ children, user }: ResidentUIProps) {
    return (
        <div className="min-h-screen bg-[#FCE8EB]">
            <Navbar name={user.user_metadata.full_name || user.email} />
            {children}
            <Footer />
        </div>
    )
}