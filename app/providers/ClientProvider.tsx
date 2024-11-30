'use client'

import { Session } from '@supabase/supabase-js'

export default function ClientProvider({
    children,
    session,
}: {
    children: React.ReactNode
    session: Session | null
}) {
    return (
        <>
            {children}
        </>
    )
} 