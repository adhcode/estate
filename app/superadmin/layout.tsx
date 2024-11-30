'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { Home, Users, Settings, BarChart, FileText, Bell } from 'lucide-react'

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar>
        <SidebarHeader>
          <Link href="/superadmin/dashboard" className="flex items-center space-x-2 px-4 py-3">
            <span className="text-2xl font-bold text-[#8B0000]">LKJ Estate</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/superadmin/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/superadmin/users">
                  <Users className="mr-2 h-4 w-4" />
                  User Management
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/superadmin/estates">
                  <BarChart className="mr-2 h-4 w-4" />
                  Estate Analytics
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/superadmin/reports">
                  <FileText className="mr-2 h-4 w-4" />
                  Reports
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/superadmin/notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/superadmin/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Super Admin Dashboard</h1>
            <UserButton />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <ScrollArea className="h-full">
              {children}
            </ScrollArea>
          </div>
        </main>
      </div>
    </div>
  )
}