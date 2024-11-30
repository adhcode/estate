export type Database = {
    public: {
      Tables: {
        users: {
          Row: {
            id: string
            full_name: string
            email: string
            phone_number: string | null
            block_number: string
            flat_number: string
            profile_image_url: string | null
            role: string
            created_at: string
          }
          Insert: {
            id?: string
            full_name: string
            email: string
            phone_number?: string | null
            block_number: string
            flat_number: string
            profile_image_url?: string | null
            role?: string
            created_at?: string
          }
          Update: {
            id?: string
            full_name?: string
            email?: string
            phone_number?: string | null
            block_number?: string
            flat_number?: string
            profile_image_url?: string | null
            role?: string
            created_at?: string
          }
        }
      }
    }
  }