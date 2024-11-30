'use client'

import { Session } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useState } from 'react'

export default function ClientProvider({
    children,
    session,
}: {
    children: React.ReactNode
    session: Session | null
}) {
    const [supabaseClient] = useState(() => createClientComponentClient())

    return (
        <SessionContextProvider supabaseClient={supabaseClient} initialSession={session}>
            {children}
        </SessionContextProvider>
    )
} 