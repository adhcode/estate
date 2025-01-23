"use client"

import React, { useState, ReactNode, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, BookOpen, Users, UserCircle, LogOut, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Session } from '@supabase/auth-helpers-nextjs'
import { toast } from "react-hot-toast"
import DesktopSidebar from '@/app/admin/components/DesktopSidebar'
import MobileSidebar from '@/app/admin/components/MobileSidebar'

interface AdminUIProps {
    session: Session | null
    children: ReactNode
}

export function AdminUI({ session, children }: AdminUIProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!session) return null;

    if (!mounted) {
        return (
            <div className="flex h-screen bg-white">
                <main className="flex-1">
                    <div className="container mx-auto p-4 md:p-6">
                        {children}
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-white">
            <DesktopSidebar session={session} />
            <MobileSidebar session={session} />
            <main className="flex-1 overflow-y-auto md:pt-0 pt-16">
                <div className="container mx-auto p-4 md:p-6">
                    {children}
                </div>
            </main>
        </div>
    )
}