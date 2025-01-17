"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
    Heart,
    MessageCircle,
    Share2,
    Users,
    Calendar,
    MapPin,
    ThumbsUp,
    Image as ImageIcon,
    Send
} from "lucide-react"
import { Input } from "@/components/ui/input"

interface Post {
    id: string
    author: {
        name: string
        avatar: string
        unit: string
    }
    content: string
    image?: string
    likes: number
    comments: number
    shares: number
    timestamp: string
    category: string
}

const socialPosts: Post[] = [
    {
        id: "1",
        author: {
            name: "Sarah Johnson",
            avatar: "/avatars/sarah.jpg",
            unit: "Block A-12"
        },
        content: "Just finished setting up our community garden! Everyone's welcome to join the gardening club. We meet every Saturday morning. 🌱",
        image: "/images/garden.jpg",
        likes: 24,
        comments: 8,
        shares: 3,
        timestamp: "2 hours ago",
        category: "Community"
    },
    {
        id: "2",
        author: {
            name: "Mike Chen",
            avatar: "/avatars/mike.jpg",
            unit: "Block C-05"
        },
        content: "Lost cat found near the playground! Please contact me if it's yours. Orange tabby with white paws.",
        likes: 15,
        comments: 12,
        shares: 6,
        timestamp: "5 hours ago",
        category: "Lost & Found"
    }
]

const SocialPage: React.FC = () => {
    const [newPost, setNewPost] = useState("")

    const getCategoryColor = (category: string) => {
        switch (category.toLowerCase()) {
            case "community":
                return "bg-green-500"
            case "lost & found":
                return "bg-yellow-500"
            default:
                return "bg-gray-500"
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
                    Community Social
                </h1>
                <p className="text-gray-600">
                    Connect with your neighbors and stay updated
                </p>
            </motion.div>

            {/* Create Post Card */}
            <Card className="mb-8">
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <Avatar>
                            <AvatarFallback>ME</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-4">
                            <Input
                                placeholder="Share something with your community..."
                                value={newPost}
                                onChange={(e) => setNewPost(e.target.value)}
                                className="w-full"
                            />
                            <div className="flex justify-between items-center">
                                <Button variant="outline" size="sm">
                                    <ImageIcon className="h-4 w-4 mr-2" />
                                    Add Image
                                </Button>
                                <Button className="bg-[#8B0000] hover:bg-[#8B0000]/90">
                                    <Send className="h-4 w-4 mr-2" />
                                    Post
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Posts Feed */}
            <div className="space-y-6">
                {socialPosts.map((post, index) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-3">
                                        <Avatar>
                                            <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold">{post.author.name}</h3>
                                            <p className="text-sm text-gray-500">{post.author.unit}</p>
                                        </div>
                                    </div>
                                    <Badge className={`${getCategoryColor(post.category)} text-white`}>
                                        {post.category}
                                    </Badge>
                                </div>
                                <p className="text-gray-700 mb-4">{post.content}</p>
                                {post.image && (
                                    <div className="mb-4 rounded-lg overflow-hidden">
                                        <img src={post.image} alt="" className="w-full h-auto" />
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-gray-500 text-sm">
                                    <Button variant="ghost" size="sm">
                                        <ThumbsUp className="h-4 w-4 mr-1" />
                                        {post.likes}
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        <MessageCircle className="h-4 w-4 mr-1" />
                                        {post.comments}
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        <Share2 className="h-4 w-4 mr-1" />
                                        {post.shares}
                                    </Button>
                                    <span>{post.timestamp}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

export default SocialPage 