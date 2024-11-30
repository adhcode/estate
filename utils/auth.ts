'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function getAuthUser() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  })
  
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) return null
  return user
}

export async function getUserRole(userId: string) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  })
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data?.role
  } catch (error) {
    console.error('Error fetching user role:', error)
    return null
  }
}

// Optional: Add a helper to check auth status and role together
export async function checkAuthAndRole() {
  const user = await getAuthUser()
  if (!user) return { user: null, role: null }
  
  const role = await getUserRole(user.id)
  return { user, role }
} 