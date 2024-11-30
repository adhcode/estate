import { supabase } from '@/utils/supabase/supabaseClient'

interface ProfileUpdateData {
    full_name?: string;
    block_number?: string;
    flat_number?: string;
    phone_number?: string;
  }
  
  export const updateProfile = async (userId: string, profileData: ProfileUpdateData) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
  
    if (error) {
      throw error
    }
    return data
  }