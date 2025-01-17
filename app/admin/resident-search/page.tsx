"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Search, User, Home, Phone, Mail, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
    primary_residents: {
        id: string;
        profiles: Profile[];
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
            console.log('Fetching residents...')

            // Fetch primary residents (users) with block and flat numbers
            const { data: primaryResidents, error: primaryError } = await supabase
                .from('users')
                .select(`
                    id,
                    full_name,
                    email,
                    phone_number,
                    role,
                    avatar_url,
                    block_number,
                    flat_number
                `)
                .eq('role', 'resident')

            if (primaryError) {
                console.error('Primary residents error:', primaryError)
                throw primaryError
            }

            // Define interface for user map
            interface UserMapType {
                [key: string]: {
                    id: string;
                    block_number: string | null;
                    flat_number: string | null;
                    [key: string]: any; // for other properties
                }
            }

            // Create a map of users by id for block/flat lookup
            const userMap: UserMapType = (primaryResidents || []).reduce((acc: UserMapType, user) => {
                acc[user.id] = user
                return acc
            }, {})

            // Fetch household members
            const { data: householdMembers, error: membersError } = await supabase
                .from('household_members')
                .select(`
                    id,
                    first_name,
                    last_name,
                    email,
                    phone_number,
                    relationship,
                    primary_resident_id
                `)

            if (membersError) {
                console.error('Household members error:', membersError)
                throw membersError
            }

            // Combine and format the data
            const combinedResidents = [
                ...(primaryResidents || []).map(resident => {
                    const [firstName = '', lastName = ''] = (resident.full_name || '').split(' ')
                    return {
                        id: resident.id,
                        first_name: firstName,
                        last_name: lastName,
                        email: resident.email,
                        phone_number: resident.phone_number || null,
                        block_number: resident.block_number || null,
                        flat_number: resident.flat_number || null,
                        avatar_url: resident.avatar_url || null,
                        is_primary_resident: true,
                        role: resident.role
                    }
                }),
                ...(householdMembers || []).map(member => ({
                    id: member.id,
                    first_name: member.first_name,
                    last_name: member.last_name,
                    email: member.email,
                    phone_number: member.phone_number,
                    block_number: userMap[member.primary_resident_id]?.block_number || null,
                    flat_number: userMap[member.primary_resident_id]?.flat_number || null,
                    is_primary_resident: false
                }))
            ]

            console.log('Primary residents:', primaryResidents)
            console.log('Household members:', householdMembers)
            console.log('Combined residents:', combinedResidents)
            setResidents(combinedResidents)

        } catch (error) {
            console.error('Error fetching residents:', error)
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
        <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-8 text-center text-[#832131]">Resident Search</h1>
            <div className="flex gap-2 mb-8 max-w-2xl mx-auto">
                <Input
                    type="text"
                    placeholder="Search by Name, Email, Block, or Flat Number"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-grow"
                />
            </div>

            {isLoading ? (
                <p className="text-center text-gray-500">Loading residents...</p>
            ) : filteredResidents.length === 0 ? (
                <p className="text-center text-gray-500">No residents found.</p>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredResidents.map((resident, index) => (
                        <Card key={`${resident.id}-${index}`} className="overflow-hidden transition-shadow hover:shadow-lg">
                            <CardHeader className="p-0">
                                <div className="bg-gradient-to-r from-[#832131] to-[#932131] p-4">
                                    <div className="relative">
                                        <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white">
                                            {resident.avatar_url ? (
                                                <AvatarImage src={resident.avatar_url} alt={`${resident.first_name} ${resident.last_name}`} />
                                            ) : (
                                                <AvatarFallback className="bg-gray-200 text-gray-600 text-xl">
                                                    {`${resident.first_name?.[0] || ''}${resident.last_name?.[0] || ''}`}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        {resident.is_primary_resident && (
                                            <span className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                    <CardTitle className="text-center text-white">
                                        {`${resident.first_name || ''} ${resident.last_name || ''}`}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-[#832131]" />
                                    <span>{resident.email || 'No email'}</span>
                                </div>
                                {resident.phone_number && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-[#832131]" />
                                        <span>{resident.phone_number}</span>
                                    </div>
                                )}
                                {(resident.block_number || resident.flat_number) && (
                                    <div className="flex items-center gap-2">
                                        <Home className="h-4 w-4 text-[#832131]" />
                                        <span>
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