"use client";
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClientComponentClient();

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // Initial validations
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            setLoading(true);
            console.log('Updating password...');

            // First get the current user to ensure we're authenticated
            const { data: { user: currentUser }, error: getUserError } = await supabase.auth.getUser();
            if (getUserError) throw getUserError;
            if (!currentUser) throw new Error('No authenticated user found');

            // Update the password
            const { data: updateData, error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) {
                // Handle specific password-related errors
                if (updateError.message.includes('different from the old password')) {
                    toast.error('New password must be different from your current password', {
                        duration: 5000,
                        position: 'top-center'
                    });
                    setPassword('');
                    setConfirmPassword('');
                    return;
                }
                throw updateError;
            }

            console.log('Password updated successfully');

            // Update user metadata
            const { error: metadataError } = await supabase.auth.updateUser({
                data: {
                    temporary_password: false,
                    ...currentUser.user_metadata
                }
            });

            if (metadataError) throw metadataError;

            // Check and update household member status
            const { data: memberData, error: memberError } = await supabase
                .from('household_members')
                .select('invitation_status')
                .eq('id', currentUser.id)
                .maybeSingle();

            if (memberError) throw memberError;

            if (memberData) {
                // Update only the invitation_status
                const { error: updateStatusError } = await supabase
                    .from('household_members')
                    .update({ invitation_status: 'accepted' })
                    .eq('id', currentUser.id);

                if (updateStatusError) throw updateStatusError;

                toast.success('Password set successfully! Redirecting to dashboard...', {
                    duration: 3000,
                    position: 'top-center'
                });

                await new Promise(resolve => setTimeout(resolve, 1000));
                router.push('/resident/dashboard');
                return;
            }

            // If not a household member
            toast.success('Password set successfully! Redirecting to dashboard...', {
                duration: 3000,
                position: 'top-center'
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
            router.push('/resident/dashboard');

        } catch (error: any) {
            console.error('Set password error:', error);

            // Handle different types of errors
            if (error.message?.includes('auth')) {
                toast.error('Authentication error. Please try logging in again.', {
                    duration: 5000,
                    position: 'top-center'
                });
                await supabase.auth.signOut();
                router.push('/auth/login');
            } else if (error.message?.includes('network')) {
                toast.error('Network error. Please check your connection and try again.', {
                    duration: 5000,
                    position: 'top-center'
                });
            } else {
                toast.error('An error occurred while setting your password. Please try again.', {
                    duration: 5000,
                    position: 'top-center'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FCE8EB]">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold text-[#832131] mb-6">Set Your Password</h1>

                <div className="mb-6 text-sm text-gray-600">
                    <p>Your new password must:</p>
                    <ul className="list-disc ml-5 mt-2">
                        <li>Be at least 6 characters long</li>
                        <li>Be different from your temporary password</li>
                        <li>Match in both fields</li>
                    </ul>
                </div>

                <form onSubmit={handleSetPassword} className="space-y-4">
                    <div>
                        <Input
                            type="password"
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <div>
                        <Input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-[#832131] text-white"
                        disabled={loading}
                    >
                        {loading ? 'Setting Password...' : 'Set Password'}
                    </Button>
                </form>
            </div>
        </div>
    );
} 