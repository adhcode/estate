"use client"

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useState, useEffect } from 'react'

export function HeaderLogout() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        setUserData(data)
      }
    }

    getUser()
  }, [])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push("/auth/login")
    }
  }

  return (
    <div className="flex items-center space-x-4">
      <Button
        variant="ghost"
        size="icon"
        className="text-gray-600 hover:text-[#FFC145] transition-colors"
      >
        <Bell className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        onClick={handleLogout}
        className="text-gray-600 hover:text-[#FFC145] transition-colors"
      >
        Logout
      </Button>
      <Avatar className="h-10 w-10 border-2 border-[#FFC145]">
        <AvatarImage
          src={userData?.email}
          alt={userData?.full_name || 'User'}
        />
        <AvatarFallback className="bg-[#FFC145] text-white">
          {userData?.full_name?.[0] || 'U'}
        </AvatarFallback>
      </Avatar>
    </div>
  )
}
