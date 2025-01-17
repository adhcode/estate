"use client"

import { useState } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Upload } from "lucide-react"

export default function ProfileSetup() {
    const [uploading, setUploading] = useState(false)
    const [image, setImage] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [completed, setCompleted] = useState(false)
    const supabase = createClientComponentClient()
    const router = useRouter()

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const img = document.createElement('img')
            img.src = URL.createObjectURL(file)
            img.onload = () => {
                if (img.height > img.width) {
                    setImage(file)
                    setPreview(URL.createObjectURL(file))
                    toast.success('Image uploaded successfully')
                } else {
                    toast.error('Please upload a portrait image')
                }
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!image) {
            toast.error('Please select an image')
            return
        }

        setUploading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No user found')

            // Upload image
            const fileExt = image.name.split('.').pop()
            const fileName = `${user.id}-${Math.random()}.${fileExt}`
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, image)

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            // Check if user is a household member
            const { data: memberData, error: memberError } = await supabase
                .from('household_members')
                .select('id')
                .eq('id', user.id)
                .single()

            if (memberError && memberError.code !== 'PGRST116') {
                throw memberError
            }

            if (memberData) {
                // Update household member profile
                const { error: updateError } = await supabase
                    .from('household_members')
                    .update({
                        avatar_url: publicUrl,
                        profile_completed: true
                    })
                    .eq('id', user.id)

                if (updateError) throw updateError
            } else {
                // Update resident profile
                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        avatar_url: publicUrl,
                        profile_completed: true
                    })
                    .eq('id', user.id)

                if (updateError) throw updateError
            }

            setCompleted(true)
            toast.success('Profile setup completed!')

            // Close modal and refresh after 1.5 seconds
            setTimeout(() => {
                setCompleted(false) // This will remove the modal
                router.refresh()
            }, 1500)

        } catch (error: any) {
            console.error('Error:', error)
            toast.error(error.message)
        } finally {
            setUploading(false)
        }
    }

    // If completed, show success message briefly before closing
    if (completed) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeOut">
                <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4 text-center">
                    <div className="mb-4 text-green-600">
                        <svg
                            className="w-16 h-16 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-green-600">Success!</h2>
                    <p className="text-gray-600">Your profile has been updated</p>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold mb-6">Complete Your Profile</h2>
                <p className="text-gray-600 mb-6">
                    Please upload a portrait photo of your face. This helps us maintain security within the estate.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center relative">
                        {preview ? (
                            <div className="relative w-48 h-64 mx-auto">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-full h-full object-cover rounded-lg"
                                />
                            </div>
                        ) : (
                            <div className="py-8">
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
                                <p className="text-xs text-gray-500">Portrait photo required</p>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-[#8B0000] hover:bg-[#6B0000]"
                        disabled={uploading || !image}
                    >
                        {uploading ? 'Uploading...' : 'Complete Profile'}
                    </Button>
                </form>
            </div>
        </div>
    )
}