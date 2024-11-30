"use client"

import React, { useState, ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, BookOpen, Users, UserCircle, LogOut, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LoadingProvider } from "@/components/providers/loading-provider"

interface AdminUIProps {
    children: ReactNode
}

export function AdminUI({ children }: AdminUIProps) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
    const pathname = usePathname()

    const handleLogout = () => {
        console.log("Logout clicked")
        // Add your logout logic here
    }

    const navigationItems = [
        { name: "Overview", href: "/admin/overview", icon: LayoutDashboard },
        { name: "Visitor's Logbook", href: "/admin/logbook", icon: BookOpen },
        { name: "Resident Search", href: "/admin/resident-search", icon: Users },
        { name: "Profile", href: "/admin/profile", icon: UserCircle },
    ]

    return (
        <LoadingProvider>
            <div className="min-h-screen">
                <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap');
          
          .stat-box {
            width: 100%;
            height: 100px;
          }
          
          @media (min-width: 375px) {
            .stat-box {
              height: 120px;
            }
          }
          
          @media (min-width: 640px) {
            .stat-box {
              width: 160px;
              height: 135px;
            }
          }
          
          @media (min-width: 1024px) {
            .stat-box {
              width: 260px;
              height: 164px;
            }
          }
        `}</style>

                {/* Desktop Sidebar - with Montserrat font */}
                <aside className="hidden md:flex md:fixed md:h-screen md:flex-col md:w-64 md:bg-white md:border-r font-['Montserrat']">
                    <div className="p-6 border-b">
                        <h1 className="text-2xl font-bold text-[#832131] font-['Quicksand']">LKJ Estate</h1>
                    </div>
                    <nav className="flex-1 p-4 space-y-2">
                        {navigationItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-['Montserrat']",
                                        isActive
                                            ? "bg-[#FCE8EB] text-[#832131]"
                                            : "text-gray-600 hover:bg-[#FCE8EB] hover:text-[#832131]"
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span>{item.name}</span>
                                </Link>
                            )
                        })}
                    </nav>
                    <div className="p-4 border-t">
                        <Button
                            variant="ghost"
                            className="w-full flex items-center space-x-3 text-gray-600 hover:bg-[#FCE8EB] hover:text-[#832131] font-['Montserrat']"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-5 w-5" />
                            <span>Logout</span>
                        </Button>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex flex-col min-h-screen md:pl-64">
                    <main className="flex-1 bg-[#FCE8EB] font-['DM_Sans'] pt-16 md:pt-6 px-4 md:px-8">
                        <div className="max-w-[1200px] mx-auto">
                            {children}
                        </div>
                    </main>
                </div>

                {/* Mobile Header - with Montserrat font */}
                <div className="md:hidden fixed top-0 left-0 right-0 z-50">
                    <header className="bg-white border-b h-16 flex items-center justify-between px-4 font-['Montserrat']">
                        <h1 className="text-xl font-bold text-[#832131] font-['Quicksand']">LKJ Estate</h1>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                            className="text-[#832131]"
                        >
                            {isMobileSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </header>
                </div>

                {/* Mobile Navigation - with Montserrat font */}
                <AnimatePresence>
                    {isMobileSidebarOpen && (
                        <motion.nav
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "tween", duration: 0.3 }}
                            className="fixed top-16 left-0 right-0 bottom-0 z-50 bg-white p-4 space-y-2 overflow-y-auto font-['Montserrat']"
                        >
                            {navigationItems.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsMobileSidebarOpen(false)}
                                        className={cn(
                                            "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-['Montserrat']",
                                            isActive ? "bg-[#FCE8EB] text-[#832131]" : "text-gray-600"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        <span>{item.name}</span>
                                    </Link>
                                )
                            })}
                            <button
                                className="flex items-center space-x-3 px-4 py-3 w-full text-left text-gray-600 font-['Montserrat']"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-5 w-5" />
                                <span>Logout</span>
                            </button>
                        </motion.nav>
                    )}
                </AnimatePresence>
            </div>
        </LoadingProvider>
    )
}