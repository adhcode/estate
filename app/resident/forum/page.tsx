"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
    MessageSquare,
    ThumbsUp,
    Eye,
    Clock,
    ChevronRight,
    Pin,
    AlertCircle,
    HelpCircle,
    Megaphone,
    Settings,
    BookOpen,
    Laptop,
    Briefcase,
    PenSquare
} from "lucide-react"
import { Loader } from "@/app/components/Loader"

interface ForumPost {
    id: string
    title: string
    content: string
    author: {
        name: string
        unit: string
        avatar_url?: string
    }
    category: "Education" | "Technology" | "Business" | "Announcement"
    subCategory?: string
    isPinned: boolean
    views: number
    reactions: {
        likes: number
        replies: number
    }
    tags: string[]
    created_at: string
    updated_at: string
}

interface ForumReaction {
    type: string
    user_id: string
}

interface ForumTag {
    tag: {
        name: string
    }
}

interface PrimaryResident {
    id: string;
    full_name: string;
    avatar_url: string | null;
    block_number: string;
    flat_number: string;
}

interface HouseholdMember {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    users: {
        block_number: string;
        flat_number: string;
    } | null;
}

const ForumPage: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [posts, setPosts] = useState<ForumPost[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClientComponentClient()
    const router = useRouter()

    useEffect(() => {
        fetchPosts()
    }, [selectedCategory])

    const fetchPosts = async () => {
        try {
            // First, get the posts
            const { data: posts, error } = await supabase
                .from('forum_posts')
                .select('id, title, content, author_id, category, sub_category, is_pinned, views, created_at, updated_at')
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!posts?.length) {
                setPosts([]);
                return;
            }

            // Process each post with author details
            const formattedPosts = await Promise.all(posts.map(async (post) => {
                // First check users table (primary residents)
                const { data: primaryResident } = await supabase
                    .from('users')
                    .select('id, full_name, avatar_url, block_number, flat_number')
                    .eq('id', post.author_id)
                    .single();

                if (primaryResident) {
                    const blockNum = primaryResident.block_number.replace(/^Block\s*/i, '');
                    const flatNum = primaryResident.flat_number.replace(/^Flat\s*/i, '');
                    return {
                        ...post,
                        author: {
                            id: post.author_id,
                            name: primaryResident.full_name,
                            avatar_url: primaryResident.avatar_url || '',
                            unit: `B${blockNum} F${flatNum}`
                        },
                        category: post.category,
                        subCategory: post.sub_category,
                        isPinned: post.is_pinned,
                        views: post.views,
                        reactions: {
                            likes: 0,
                            replies: 0
                        },
                        tags: [],
                        created_at: post.created_at,
                        updated_at: post.updated_at
                    };
                }

                // If not found in users, check household_members
                const { data: householdMember, error: householdError } = await supabase
                    .from('household_members')
                    .select('*')
                    .eq('id', post.author_id)
                    .single();

                console.log('Raw Household Member Data:', householdMember);
                console.log('Household Member Error:', householdError);

                if (householdMember) {
                    // Get the primary resident data in a separate query
                    const { data: primaryResident } = await supabase
                        .from('users')
                        .select('block_number, flat_number')
                        .eq('id', householdMember.primary_resident_id)
                        .single();

                    console.log('Primary Resident Data:', primaryResident);

                    const blockNum = primaryResident?.block_number?.replace(/^Block\s*/i, '') || '';
                    const flatNum = primaryResident?.flat_number?.replace(/^Flat\s*/i, '') || '';

                    return {
                        ...post,
                        author: {
                            id: post.author_id,
                            name: `${householdMember.first_name} ${householdMember.last_name}`,
                            avatar_url: householdMember.avatar_url || '',
                            unit: primaryResident ? `B${blockNum} F${flatNum}` : ''
                        },
                        category: post.category,
                        subCategory: post.sub_category,
                        isPinned: post.is_pinned,
                        views: post.views,
                        reactions: {
                            likes: 0,
                            replies: 0
                        },
                        tags: [],
                        created_at: post.created_at,
                        updated_at: post.updated_at
                    };
                }

                return {
                    ...post,
                    author: {
                        id: post.author_id,
                        name: 'Unknown User',
                        avatar_url: '',
                        unit: ''
                    },
                    category: post.category,
                    subCategory: post.sub_category,
                    isPinned: post.is_pinned,
                    views: post.views,
                    reactions: {
                        likes: 0,
                        replies: 0
                    },
                    tags: [],
                    created_at: post.created_at,
                    updated_at: post.updated_at
                };
            }));

            setPosts(formattedPosts);
        } catch (error) {
            console.error('Error fetching posts:', error);
            toast.error('Failed to load forum posts');
        } finally {
            setLoading(false);
        }
    };

    const handleReaction = async (postId: string, type: 'like' | 'reply') => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Please login to react to posts')
                return
            }

            const { data, error } = await supabase
                .from('forum_reactions')
                .upsert({
                    post_id: postId,
                    user_id: user.id,
                    type
                })

            if (error) throw error

            fetchPosts() // Refresh posts to update reaction counts
        } catch (error) {
            console.error('Error adding reaction:', error)
            toast.error('Failed to add reaction')
        }
    }

    const getCategoryColor = (category: string) => {
        switch (category.toLowerCase()) {
            case "education":
                return "bg-blue-500"
            case "technology":
                return "bg-purple-500"
            case "business":
                return "bg-green-500"
            case "announcement":
                return "bg-red-500"
            default:
                return "bg-gray-500"
        }
    }

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case "education":
                return BookOpen
            case "technology":
                return Laptop
            case "business":
                return Briefcase
            case "announcement":
                return Megaphone
            default:
                return MessageSquare
        }
    }

    return (
        <div className="min-h-screen bg-white p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Community Forum
                </h1>
                <p className="text-gray-600">
                    Discuss and stay updated with your community
                </p>
            </motion.div>

            {/* Updated Category Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {["All", "Education", "Technology", "Business"].map((category) => (
                    <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        onClick={() => setSelectedCategory(category === "All" ? null : category)}
                        className="whitespace-nowrap"
                    >
                        {getCategoryIcon(category) && (
                            <div className="mr-2">
                                {React.createElement(getCategoryIcon(category), { className: "h-4 w-4" })}
                            </div>
                        )}
                        {category}
                    </Button>
                ))}
            </div>

            {/* Forum Posts */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No posts found in this category
                    </div>
                ) : (
                    posts.map((post, index) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="hover:shadow-md transition-shadow duration-300 cursor-pointer"
                                onClick={() => router.push(`/resident/forum/post/${post.id}`)}>
                                <CardContent className="p-4 md:p-6">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {post.isPinned && (
                                                <Pin className="h-4 w-4 text-[#8B0000]" />
                                            )}
                                            <Badge className={`${getCategoryColor(post.category)} text-white`}>
                                                {post.category}
                                            </Badge>
                                            <div className="flex flex-wrap gap-1">
                                                {post.tags.map(tag => (
                                                    <Badge key={tag} variant="outline" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-base md:text-lg font-semibold mb-1">{post.title}</h3>
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                {post.content}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    {post.author.avatar_url ? (
                                                        <AvatarImage src={post.author.avatar_url} />
                                                    ) : (
                                                        <AvatarFallback>
                                                            {post.author?.name?.[0] || 'U'}
                                                        </AvatarFallback>
                                                    )}
                                                </Avatar>
                                                <div className="text-sm">
                                                    <div className="font-medium">
                                                        {post.author?.name || 'Unknown User'}
                                                    </div>
                                                    <div className="text-gray-500 text-xs">
                                                        {post.author?.unit || 'No Unit'}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="hidden md:flex">
                                                View Discussion
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </div>

                                        <div className="flex items-center justify-between text-xs md:text-sm text-gray-500 pt-2 border-t border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1">
                                                    <Eye className="h-3 w-3 md:h-4 md:w-4" />
                                                    {post.views}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <MessageSquare className="h-3 w-3 md:h-4 md:w-4" />
                                                    {post.reactions.replies}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <ThumbsUp className="h-3 w-3 md:h-4 md:w-4" />
                                                    {post.reactions.likes}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3 md:h-4 md:w-4" />
                                                {new Date(post.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Updated Create New Post Button */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="fixed bottom-4 right-4 md:bottom-8 md:right-8"
            >
                <Button
                    className="bg-[#8B0000] hover:bg-[#8B0000]/90 shadow-lg"
                    onClick={() => router.push('/resident/forum/create')}
                >
                    <PenSquare className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Start Discussion</span>
                </Button>
            </motion.div>
        </div>
    )
}

export default ForumPage 