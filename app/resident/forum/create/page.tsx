"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    BookOpen,
    Laptop,
    Briefcase,
    ArrowLeft,
    Tags
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

const CreateForumPost = () => {
    const router = useRouter()
    const supabase = createClientComponentClient()
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [category, setCategory] = useState<string>("")
    const [tag, setTag] = useState("")
    const [tags, setTags] = useState<string[]>([])

    const handleAddTag = () => {
        if (tag && !tags.includes(tag)) {
            setTags([...tags, tag])
            setTag("")
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove))
    }

    const handleCreatePost = async () => {
        try {
            // Get current user's auth ID
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Check if user is a primary resident (in users table)
            const { data: primaryResident } = await supabase
                .from('users')
                .select('id')
                .eq('id', user.id)
                .single();

            // If not in users table, check household_members
            const { data: householdMember } = await supabase
                .from('household_members')
                .select('id')
                .eq('id', user.id)
                .single();

            // Get the correct author_id
            const author_id = primaryResident?.id || householdMember?.id;
            if (!author_id) throw new Error('User not found in either table');

            // Create the post with the correct author_id
            const { data: post, error } = await supabase
                .from('forum_posts')
                .insert({
                    title,
                    content,
                    author_id,  // This will be either the user's id or household member's id
                    category,
                    // ... other post fields
                });

            if (error) throw error;
            // ... handle success
        } catch (error) {
            console.error('Error creating post:', error);
            toast.error('Failed to create post');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error('Please login to create a post')
                return
            }

            // Insert the post
            const { data: post, error: postError } = await supabase
                .from('forum_posts')
                .insert({
                    title,
                    content,
                    category,
                    author_id: user.id,
                })
                .select()
                .single()

            if (postError) throw postError

            // Insert tags
            if (tags.length > 0) {
                // First, ensure all tags exist in forum_tags
                for (const tagName of tags) {
                    const { error: tagError } = await supabase
                        .from('forum_tags')
                        .upsert({ name: tagName }, { onConflict: 'name' })

                    if (tagError) throw tagError
                }

                // Get all tag IDs
                const { data: tagData, error: tagSelectError } = await supabase
                    .from('forum_tags')
                    .select('id, name')
                    .in('name', tags)

                if (tagSelectError) throw tagSelectError

                // Create post-tag relationships
                const postTags = tagData.map(tag => ({
                    post_id: post.id,
                    tag_id: tag.id
                }))

                const { error: relationError } = await supabase
                    .from('forum_post_tags')
                    .insert(postTags)

                if (relationError) throw relationError
            }

            toast.success('Post created successfully')
            router.push('/resident/forum')
            router.refresh()

        } catch (error) {
            console.error('Error creating post:', error)
            toast.error('Failed to create post')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Create New Discussion</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input
                                    placeholder="Enter discussion title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <Select
                                    value={category}
                                    onValueChange={setCategory}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Education">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4" />
                                                Education
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="Technology">
                                            <div className="flex items-center gap-2">
                                                <Laptop className="h-4 w-4" />
                                                Technology
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="Business">
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="h-4 w-4" />
                                                Business
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Content</label>
                                <Textarea
                                    placeholder="Share your thoughts..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    required
                                    className="min-h-[200px]"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tags</label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add tags"
                                        value={tag}
                                        onChange={(e) => setTag(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleAddTag()
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleAddTag}
                                    >
                                        <Tags className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {tags.map(tag => (
                                        <Badge
                                            key={tag}
                                            variant="secondary"
                                            className="cursor-pointer"
                                            onClick={() => handleRemoveTag(tag)}
                                        >
                                            {tag} ×
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-[#8B0000] hover:bg-[#8B0000]/90"
                                disabled={loading}
                            >
                                {loading ? "Creating..." : "Create Discussion"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}

export default CreateForumPost 