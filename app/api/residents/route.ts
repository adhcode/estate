import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET() {
    try {
        const { data: residents, error: dbError } = await supabase
            .rpc('get_residents_with_avatars');

        if (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json(
                { error: 'Database error', details: dbError.message },
                { status: 500 }
            );
        }

        // Transform the data to combine names
        const unifiedResidents = residents?.map((resident: any) => ({
            ...resident,
            name: `${resident.first_name || ''} ${resident.last_name || ''}`.trim()
        })) || [];

        return NextResponse.json(unifiedResidents);
    } catch (error) {
        console.error('Route handler error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: (error as Error).message },
            { status: 500 }
        );
    }
} 