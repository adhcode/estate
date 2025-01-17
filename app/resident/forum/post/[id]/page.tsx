"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
    ArrowLeft,
    ThumbsUp,
    MessageSquare,
    Share2,
    Flag,
    Clock,
    Eye,
    BookOpen,
    Laptop,
    Briefcase,
    AlertCircle
} from "lucide-react"
import { Loader } from "@/app/components/Loader"

interface ForumPost {
    id: string
    title: string
    content: string
    author: {
        id: string
        name: string
        unit: string
        avatar_url?: string
    }
    category: string
    created_at: string
    updated_at: string
    views: number
    tags: string[]
    reactions: {
        likes: number
        replies: number
    }
}

interface Comment {
    id: string
    content: string
    author: {
        name: string
        unit: string
        avatar_url?: string
    }
    created_at: string
}

interface ForumTag {
    tag: {
        name: string;
    };
}

interface ForumComment {
    id: string;
    content: string;
    author_id: string;
    created_at: string;
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

const forumRules = [
    {
        title: "Be Respectful",
        description: "Treat all members with respect. No harassment, hate speech, or personal attacks."
    },
    {
        title: "Stay On Topic",
        description: "Keep discussions relevant to the post category and community matters."
    },
    {
        title: "No Spam",
        description: "Avoid duplicate posts and commercial promotions without approval."
    },
    {
        title: "Privacy",
        description: "Do not share personal information of others without consent."
    }
];

export default function PostPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const supabase = createClientComponentClient()
    const [post, setPost] = useState<ForumPost | null>(null)
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [newComment, setNewComment] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [hasLiked, setHasLiked] = useState(false)

    useEffect(() => {
        fetchPost()
        incrementViews()
    }, [params.id])

    const fetchAuthorDetails = async (authorId: string) => {
        console.log('Fetching author details for ID:', authorId);

        // First check users table (primary residents)
        const { data: primaryResident, error: primaryError } = await supabase
            .from('users')
            .select(`
                id,
                full_name,
                avatar_url,
                block_number,
                flat_number
            `)
            .eq('id', authorId)
            .single();

        if (primaryResident) {
            const blockNum = primaryResident.block_number.replace(/^Block\s*/i, '');
            const flatNum = primaryResident.flat_number.replace(/^Flat\s*/i, '');
            const authorDetails = {
                id: authorId,
                name: primaryResident.full_name,
                avatar_url: primaryResident.avatar_url || '',
                unit: `B${blockNum} F${flatNum}`
            };
            return authorDetails;
        }

        // If not found in users, check household_members
        const { data: householdMember, error: householdError } = await supabase
            .from('household_members')
            .select('*')
            .eq('id', authorId)
            .single();

        console.log('Household member data:', householdMember);

        if (householdMember) {
            // Get the primary resident data in a separate query
            const { data: primaryResident } = await supabase
                .from('users')
                .select('block_number, flat_number')
                .eq('id', householdMember.primary_resident_id)
                .single();

            console.log('Primary resident data:', primaryResident);

            const blockNum = primaryResident?.block_number?.replace(/^Block\s*/i, '') || '';
            const flatNum = primaryResident?.flat_number?.replace(/^Flat\s*/i, '') || '';

            const authorDetails = {
                id: authorId,
                name: `${householdMember.first_name} ${householdMember.last_name}`,
                avatar_url: householdMember.avatar_url || '',
                unit: primaryResident ? `B${blockNum} F${flatNum}` : ''
            };
            return authorDetails;
        }

        return {
            id: authorId,
            name: 'Unknown User',
            avatar_url: '',
            unit: ''
        };
    };

    const fetchPost = async () => {
        try {
            const { data: post, error: postError } = await supabase
                .from('forum_posts')
                .select(`
                    *,
                    forum_reactions (
                        type,
                        user_id
                    ),
                    forum_comments (
                        id,
                        content,
                        author_id,
                        created_at
                    )
                `)
                .eq('id', params.id)
                .single();

            if (postError) throw postError;

            // Get author details for the post
            const authorDetails = await fetchAuthorDetails(post.author_id);

            // Format comments with their own author info
            const formattedComments = await Promise.all((post.forum_comments || []).map(async (comment: any) => {
                const commentAuthorDetails = await fetchAuthorDetails(comment.author_id);
                return {
                    id: comment.id,
                    content: comment.content,
                    created_at: comment.created_at,
                    author: commentAuthorDetails
                };
            }));

            // Get reactions and tags
            const { data: reactions } = await supabase
                .from('forum_reactions')
                .select('type')
                .eq('post_id', post.id);

            const { data: postTags } = await supabase
                .from('forum_post_tags')
                .select<string, ForumTag>('tag:forum_tags(name)')
                .eq('post_id', post.id);

            // Set post and comments state
            setPost({
                ...post,
                author: authorDetails,
                reactions: {
                    likes: (post.forum_reactions || []).filter((r: any) => r.type === 'like').length,
                    replies: (post.forum_comments || []).length
                },
                tags: postTags?.map(t => t.tag?.name) || []
            });

            setComments(formattedComments);

        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to load post');
        } finally {
            setLoading(false);
        }
    };

    const incrementViews = async () => {
        try {
            const { error } = await supabase
                .from('forum_posts')
                .update({ views: post ? post.views + 1 : 1 })
                .eq('id', params.id)

            if (error) throw error
        } catch (error) {
            console.error('Error incrementing views:', error)
        }
    }

    const handleLike = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error('Please login to like posts')
                return
            }

            if (hasLiked) {
                // Remove like
                const { error } = await supabase
                    .from('forum_reactions')
                    .delete()
                    .eq('post_id', params.id)
                    .eq('user_id', user.id)
                    .eq('type', 'like')

                if (error) throw error
                setHasLiked(false)
                setPost(prev => prev ? {
                    ...prev,
                    reactions: {
                        ...prev.reactions,
                        likes: prev.reactions.likes - 1
                    }
                } : null)
            } else {
                // Add like
                const { error } = await supabase
                    .from('forum_reactions')
                    .insert({
                        post_id: params.id,
                        user_id: user.id,
                        type: 'like'
                    })

                if (error) throw error
                setHasLiked(true)
                setPost(prev => prev ? {
                    ...prev,
                    reactions: {
                        ...prev.reactions,
                        likes: prev.reactions.likes + 1
                    }
                } : null)
            }
        } catch (error) {
            console.error('Error toggling like:', error)
            toast.error('Failed to update like')
        }
    }

    const handleComment = async () => {
        if (!newComment.trim()) return

        setSubmitting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error('Please login to comment')
                return
            }

            const { error } = await supabase
                .from('forum_comments')
                .insert({
                    content: newComment,
                    post_id: params.id,
                    author_id: user.id
                })

            if (error) throw error

            setNewComment("")
            fetchPost() // Refresh comments
            toast.success('Comment added successfully')
        } catch (error) {
            console.error('Error adding comment:', error)
            toast.error('Failed to add comment')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">
            <Loader />
        </div>
    }

    if (!post) {
        return <div className="text-center py-8">Post not found</div>
    }

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case "education": return BookOpen
            case "technology": return Laptop
            case "business": return Briefcase
            default: return MessageSquare
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
                    <CardContent className="p-6">
                        {/* Post Header */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-[#8B0000]">
                                        {post.category}
                                    </Badge>
                                    {post.tags.map(tag => (
                                        <Badge key={tag} variant="outline">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Eye className="h-4 w-4" />
                                    {post.views}
                                    <Clock className="h-4 w-4 ml-2" />
                                    {new Date(post.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            <h1 className="text-2xl font-bold">{post.title}</h1>

                            {/* Author Info */}
                            <div className="flex items-center gap-3 pb-4 border-b">
                                <Avatar>
                                    {post.author.avatar_url ? (
                                        <AvatarImage src={post.author.avatar_url} />
                                    ) : (
                                        <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                                    )}
                                </Avatar>
                                <div>
                                    <div className="font-medium">{post.author.name}</div>
                                    <div className="text-sm text-gray-500">{post.author.unit}</div>
                                </div>
                            </div>

                            {/* Post Content */}
                            <div className="py-4 whitespace-pre-wrap">
                                {post.content}
                            </div>

                            <div className="mb-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5 text-[#8B0000]" />
                                            Forum Rules
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {forumRules.map((rule, index) => (
                                                <div key={index} className="flex gap-3">
                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#8B0000]/10 flex items-center justify-center">
                                                        <span className="text-sm text-[#8B0000] font-medium">{index + 1}</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-sm">{rule.title}</h4>
                                                        <p className="text-sm text-gray-600">{rule.description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-4 pt-4 border-t">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleLike}
                                    className={hasLiked ? "text-[#8B0000]" : ""}
                                >
                                    <ThumbsUp className="h-4 w-4 mr-1" />
                                    {post.reactions.likes}
                                </Button>
                                <Button variant="ghost" size="sm">
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    {post.reactions.replies}
                                </Button>
                                <Button variant="ghost" size="sm">
                                    <Share2 className="h-4 w-4 mr-1" />
                                    Share
                                </Button>
                                <Button variant="ghost" size="sm" className="ml-auto">
                                    <Flag className="h-4 w-4 mr-1" />
                                    Report
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Comments Section */}
                <div className="space-y-4 mt-6">
                    <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>
                    {comments.map((comment) => (
                        <Card key={comment.id} className="bg-gray-50">
                            <CardContent className="pt-4">
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8">
                                        {comment.author.avatar_url ? (
                                            <AvatarImage src={comment.author.avatar_url} />
                                        ) : (
                                            <AvatarFallback>
                                                {comment.author.name[0]}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {comment.author.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {comment.author.unit} • {new Date(comment.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-sm text-gray-700">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* New Comment Form */}
                <div className="space-y-4">
                    <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[100px]"
                    />
                    <Button
                        onClick={handleComment}
                        disabled={submitting || !newComment.trim()}
                        className="bg-[#8B0000] hover:bg-[#8B0000]/90"
                    >
                        {submitting ? "Posting..." : "Post Comment"}
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}