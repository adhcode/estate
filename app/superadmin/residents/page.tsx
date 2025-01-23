"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Search, User, Home, Phone, Mail, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "react-hot-toast"

type Profile = {
    block_number: string | null;
    flat_number: string | null;
}

type PrimaryResident = {
    id: string;
    full_name: string;
    email: string;
    phone_number: string | null;
    role: string;
    avatar_url: string | null;
    profiles: Profile[];
}

type HouseholdMember = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string | null;
    relationship: string;
    primary_resident_id: string;
    primary_resident: {
        id: string;
        block_number: string | null;
        flat_number: string | null;
    };
}

type UnifiedResident = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone_number: string | null;
    block_number?: string | null;
    flat_number?: string | null;
    avatar_url?: string | null;
    is_primary_resident: boolean;
    role?: string;
}

export default function ResidentSearch() {
    const [searchQuery, setSearchQuery] = useState("")
    const [residents, setResidents] = useState<UnifiedResident[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClientComponentClient()

    useEffect(() => {
        fetchAllResidents()
    }, [])

    const fetchAllResidents = async () => {
        try {
            setIsLoading(true)

            // Fetch users with full_name
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select(`
                    id,
                    full_name,
                    email,
                    phone_number,
                    block_number,
                    flat_number,
                    avatar_url
                `)

            if (usersError) throw usersError

            // Fetch household members
            const { data: householdMembers, error: membersError } = await supabase
                .from('household_members')
                .select(`
                    id,
                    first_name,
                    last_name,
                    email,
                    phone_number,
                    primary_resident_id,
                    avatar_url
                `)

            if (membersError) throw membersError

            // Get primary resident details for household members
            const primaryResidentIds = [...new Set(householdMembers?.map(m => m.primary_resident_id) || [])]
            const { data: primaryResidents } = await supabase
                .from('users')
                .select('id, block_number, flat_number')
                .in('id', primaryResidentIds)

            const primaryResidentsMap = Object.fromEntries(
                (primaryResidents || []).map(pr => [pr.id, pr])
            )

            // Combine data
            const combinedResidents = [
                ...(users || []).map(user => ({
                    id: user.id,
                    first_name: user.full_name?.split(' ')[0] || '',
                    last_name: user.full_name?.split(' ').slice(1).join(' ') || '',
                    email: user.email,
                    phone_number: user.phone_number,
                    block_number: user.block_number,
                    flat_number: user.flat_number,
                    avatar_url: user.avatar_url,
                    is_primary_resident: true
                })),
                ...(householdMembers || []).map(member => ({
                    id: member.id,
                    first_name: member.first_name,
                    last_name: member.last_name,
                    email: member.email,
                    phone_number: member.phone_number,
                    block_number: primaryResidentsMap[member.primary_resident_id]?.block_number,
                    flat_number: primaryResidentsMap[member.primary_resident_id]?.flat_number,
                    avatar_url: member.avatar_url,
                    is_primary_resident: false,
                    primary_resident_id: member.primary_resident_id
                }))
            ]

            setResidents(combinedResidents)

        } catch (error) {
            console.error('Error fetching residents:', error)
            toast.error('Failed to load residents')
        } finally {
            setIsLoading(false)
        }
    }

    const filteredResidents = searchQuery.trim() === ""
        ? residents
        : residents.filter(resident => {
            const searchLower = searchQuery.toLowerCase()
            return (
                (resident.first_name?.toLowerCase() || '').includes(searchLower) ||
                (resident.last_name?.toLowerCase() || '').includes(searchLower) ||
                (resident.email?.toLowerCase() || '').includes(searchLower) ||
                (resident.block_number?.toLowerCase() || '').includes(searchLower) ||
                (resident.flat_number?.toLowerCase() || '').includes(searchLower)
            )
        })

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen">
            <h1 className="text-3xl font-bold mb-8 text-center text-[#832131]">Resident Directory</h1>

            {/* Search Section */}
            <div className="relative max-w-2xl mx-auto mb-12">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                    type="text"
                    placeholder="Search by name, email, block, or flat number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border-2 focus:border-[#832131] focus:ring-[#832131]"
                />
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#832131]" />
                </div>
            ) : filteredResidents.length === 0 ? (
                <div className="text-center py-12">
                    <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">No residents found matching your search.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredResidents.map((resident, index) => (
                        <Card key={`${resident.id}-${index}`} className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                            <CardHeader className="p-0">
                                <div className="bg-gradient-to-r from-[#832131] to-[#932131] p-6 relative">
                                    <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white shadow-lg">
                                        {resident.avatar_url ? (
                                            <AvatarImage
                                                src={resident.avatar_url}
                                                alt={`${resident.first_name} ${resident.last_name}`}
                                                className="object-cover"
                                            />
                                        ) : (
                                            <AvatarFallback className="bg-white text-[#832131] text-xl font-semibold">
                                                {`${resident.first_name?.[0] || ''}${resident.last_name?.[0] || ''}`}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    {resident.is_primary_resident && (
                                        <span className="absolute top-4 right-4 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md">
                                            Primary
                                        </span>
                                    )}
                                    <CardTitle className="text-center text-white font-semibold">
                                        {`${resident.first_name || ''} ${resident.last_name || ''}`}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-3">
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Mail className="h-4 w-4 text-[#832131]" />
                                    <span className="text-sm truncate">{resident.email || 'No email'}</span>
                                </div>
                                {resident.phone_number && (
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Phone className="h-4 w-4 text-[#832131]" />
                                        <span className="text-sm">{resident.phone_number}</span>
                                    </div>
                                )}
                                {(resident.block_number || resident.flat_number) && (
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Home className="h-4 w-4 text-[#832131]" />
                                        <span className="text-sm">
                                            {resident.block_number || 'N/A'},
                                            {resident.flat_number || 'N/A'}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}