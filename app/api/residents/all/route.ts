import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Add this interface near the top of the file
interface HouseholdMember {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone_number: string | null
    avatar_url: string | null
    primary_resident_id: string
    residents: {
        id: string
        block_number: string
        flat_number: string
    }[]
}

export async function GET() {
    try {
        const supabase = createRouteHandlerClient({ cookies })

        // First, fetch primary residents
        const { data: primaryResidents, error: primaryError } = await supabase
            .from('residents')
            .select(`
                id,
                first_name,
                last_name,
                block_number,
                flat_number,
                email,
                phone_number,
                avatar_url
            `)

        if (primaryError) {
            console.error('Primary residents error:', primaryError)
            return NextResponse.json({ error: primaryError.message }, { status: 500 })
        }

        // Then fetch household members with their associated resident info
        const { data: householdMembers, error: householdError } = await supabase
            .from('household_members')
            .select(`
                id,
                first_name,
                last_name,
                email,
                phone_number,
                avatar_url,
                primary_resident_id,
                residents!inner (
                    id,
                    block_number,
                    flat_number
                )
            `)

        if (householdError) throw new Error(householdError.message)

        // Transform the data into UnifiedResident format
        const unifiedResidents = [
            // Format primary residents
            ...primaryResidents.map(resident => ({
                id: resident.id,
                name: `${resident.first_name} ${resident.last_name}`.trim(),
                block_number: resident.block_number,
                flat_number: resident.flat_number,
                email: resident.email,
                phone_number: resident.phone_number,
                is_primary_resident: true,
                avatar_url: resident.avatar_url
            })),
            // Format household members
            ...householdMembers?.map(member => ({
                id: member.id,
                name: `${member.first_name} ${member.last_name}`.trim(),
                block_number: member.residents[0]?.block_number || 'N/A',
                flat_number: member.residents[0]?.flat_number || 'N/A',
                email: member.email,
                phone_number: member.phone_number,
                is_primary_resident: member.id === member.residents[0]?.id,
                avatar_url: member.avatar_url
            })) || []
        ]

        return NextResponse.json(unifiedResidents)

    } catch (error) {
        console.error('Server error:', error)
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ error: 'Unknown server error' }, { status: 500 })
    }
} 