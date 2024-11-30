"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type NavbarProps = {
    name: string
}

export function Navbar({ name }: NavbarProps) {
    const router = useRouter()

    return (
        <header className="w-full py-4 px-6 flex justify-between items-center bg-white shadow-md sticky top-0 z-10 font-montserrat">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');
            `}</style>
            <Link href="/resident/dashboard" className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-[#832131]">LKJ Estate</h1>
            </Link>

            <Link href="/resident/profile">
                <div className="h-10 w-10 rounded-full bg-[#FFC145] overflow-hidden flex items-center justify-center cursor-pointer">
                    <div className="relative w-full h-full">
                        <div className="absolute bottom-0 left-1/2 h-2 w-4 -translate-x-1/2 bg-[#4F4F4F] rounded-t-full"></div>
                        <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
                    </div>
                </div>
            </Link>
        </header>
    )
}