import { ReactNode } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { Home, Users, Settings, BarChart, FileText, Bell } from 'lucide-react'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

function SuperAdminSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/superadmin">Super Admin</Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem
            href="/superadmin/dashboard"
            icon={<Home className="mr-2 h-4 w-4" />}
          >
            <SidebarMenuButton asChild>
              <Link href="/superadmin/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem href="/superadmin/users" icon={<Users size={20} />}>Users</SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}

export default async function SuperAdminLayout({
  children
}: {
  children: ReactNode
}) {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="flex h-screen">
      <SuperAdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}