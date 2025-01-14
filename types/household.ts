export interface HouseholdMember {
    id: string
    first_name: string
    last_name: string
    email: string
    phone_number?: string
    relationship: string
    access_status: 'active' | 'suspended'
    role?: string
    created_at: string
}