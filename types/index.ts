export interface HouseholdMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  relationship: string;
  invitation_status: 'pending' | 'sent' | 'accepted';
  access_status: 'active' | 'restricted';
  created_at: string;
  primary_resident_id?: string;
  avatar_url?: string;
}

export interface MemberData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  relationship: string;
  avatar_url?: string;
}

export interface ApiResponse {
  user: {
      id: string;
      primary_resident_id?: string;
  };
  message: string;
  emailId: string;
}