export type MemberData = {
  first_name: string
  last_name: string
  email: string
  phone_number?: string | null
  relationship: string
  invitation_status?: 'pending' | 'sent' | 'accepted'
  access_status?: 'active' | 'restricted'
  primary_resident_id?: string
}

export type HouseholdMember = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone_number?: string | null
  relationship: string
  invitation_status: 'pending' | 'sent' | 'accepted'
  access_status: 'active' | 'restricted'
  primary_resident_id: string
  user_id?: string
  avatar_url?: string
}