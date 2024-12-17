export type Database = {
    public: {
      Tables: {
        users: {
          Row: {
            id: string
            email: string
            full_name: string
            phone_number: string | null
            block_number: string
            flat_number: string
            role: 'resident'
          }
          Insert: {
            id?: string
            email: string
            full_name: string
            phone_number?: string | null
            block_number: string
            flat_number: string
            role?: 'resident'
            created_at?: string
          }
          Update: {
            id?: string
            email?: string
            full_name?: string
            phone_number?: string | null
            block_number?: string
            flat_number?: string
            role?: 'resident'
            created_at?: string
          }
        }
      }
    }
  }