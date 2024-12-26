'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function AcceptInvitation() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClientComponentClient()
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(true)
    const [invitationData, setInvitationData] = useState<any>(null)

    useEffect(() => {
        const token = searchParams.get('token')
        if (!token) {
            toast.error('Invalid invitation link')
            router.push('/auth/login')
            return
        }

        const validateInvitation = async () => {
            try {
                const { data, error } = await supabase
                    .from('member_invitations')
                    .select('*, household_members(*)')
                    .eq('token', token)
                    .single()

                if (error || !data || new Date(data.expires_at) < new Date()) {
                    throw new Error('Invalid or expired invitation')
                }

                setInvitationData(data)
            } catch (error) {
                toast.error('Invalid or expired invitation')
                router.push('/auth/login')
            } finally {
                setLoading(false)
            }
        }

        validateInvitation()
    }, [searchParams, router, supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            // Create auth user
            const { data: { user }, error: signUpError } = await supabase.auth.signUp({
                email: invitationData.household_members.email,
                password,
            })

            if (signUpError) throw signUpError

            // Update household member record
            const { error: updateError } = await supabase
                .from('household_members')
                .update({
                    user_id: user?.id,
                    invitation_status: 'accepted'
                })
                .eq('id', invitationData.household_members.id)

            if (updateError) throw updateError

            toast.success('Account created successfully')
            router.push('/resident/dashboard')
        } catch (error) {
            console.error('Error accepting invitation:', error)
            toast.error('Failed to create account')
        }
    }

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <div className="max-w-md mx-auto mt-12 p-6">
            <h1 className="text-2xl font-bold mb-6">Accept Invitation</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-2">Set Your Password</label>
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                </div>
                <Button type="submit" className="w-full">
                    Create Account
                </Button>
            </form>
        </div>
    )
} 