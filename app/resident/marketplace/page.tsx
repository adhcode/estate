"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    ShoppingBag,
    Search,
    Plus,
    Clock,
    MessageSquare,
    ChevronRight,
    Filter
} from "lucide-react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface DatabaseListing {
    id: string
    title: string
    description: string
    price: number
    category: string
    subcategory: string
    availability: string
    delivery: string
    images?: string[]
    status: 'active' | 'sold' | 'pending'
    created_at: string
    users: {
        full_name: string
        block_number: string
        flat_number: string
    }
}

interface ListingItem {
    id: string
    title: string
    description: string
    price: number
    category: string
    subcategory: string
    availability: string
    delivery: string
    seller: {
        name: string
        unit: string
    }
    posted: string
    images?: string[]
    status: 'active' | 'sold' | 'pending'
}

const categories = [
    { id: "all", name: "All" },
    { id: "food", name: "Food & Beverages" },
    { id: "furniture", name: "Furniture" },
    { id: "electronics", name: "Electronics" },
    { id: "daily", name: "Daily Essentials" },
    { id: "services", name: "Services" }
]

const MarketplacePage = () => {
    const router = useRouter()
    const supabase = createClientComponentClient()
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [listings, setListings] = useState<ListingItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchListings()
    }, [selectedCategory])

    const fetchListings = async () => {
        try {
            setLoading(true)
            let query = supabase
                .from('marketplace_listings')
                .select(`
                    *,
                    users (
                        id,
                        full_name,
                        block_number,
                        flat_number
                    )
                `)
                .eq('status', 'active')
                .order('created_at', { ascending: false })

            if (selectedCategory !== "all") {
                query = query.eq('category', selectedCategory)
            }

            const { data, error } = await query

            if (error) throw error

            const formattedListings = data?.map(item => ({
                id: item.id,
                title: item.title,
                description: item.description,
                price: item.price,
                category: item.category,
                subcategory: item.subcategory,
                availability: item.availability,
                delivery: item.delivery,
                seller: {
                    name: item.users?.full_name || '',
                    unit: `${item.users?.block_number || ''}-${item.users?.flat_number || ''}`,
                },
                posted: new Date(item.created_at).toLocaleDateString(),
                images: item.images,
                status: item.status
            })) || []

            setListings(formattedListings)
        } catch (error) {
            console.error('Error fetching listings:', error)
            toast.error('Failed to load listings')
        } finally {
            setLoading(false)
        }
    }

    const handleContactSeller = async (listingId: string) => {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                toast.error('Please login to contact sellers')
                return
            }

            // Add your contact logic here
            toast.success('Contact request sent to seller')
        } catch (error) {
            console.error('Error contacting seller:', error)
            toast.error('Failed to contact seller')
        }
    }

    return (
        <div className="min-h-screen bg-white p-4 md:p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Marketplace
                </h1>
                <p className="text-gray-600">
                    Buy and sell items within the community
                </p>
            </motion.div>

            {/* Search and Filter */}
            <div className="mb-8 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search listings..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {categories.map((category) => (
                        <Button
                            key={category.id}
                            variant={selectedCategory === category.id ? "default" : "outline"}
                            className={`whitespace-nowrap ${selectedCategory === category.id ? "bg-[#8B0000] hover:bg-[#8B0000]/90" : ""
                                }`}
                            onClick={() => setSelectedCategory(category.id)}
                        >
                            {category.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Create Listing Button */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-10"
            >
                <Button
                    className="bg-[#8B0000] hover:bg-[#8B0000]/90 shadow-lg"
                    onClick={() => router.push('/resident/marketplace/create')}
                >
                    <Plus className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Create Listing</span>
                </Button>
            </motion.div>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing, index) => (
                    <motion.div
                        key={listing.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="h-full hover:shadow-lg transition-all duration-300">
                            {listing.images && listing.images.length > 0 && (
                                <div className="relative h-48 w-full">
                                    <Image
                                        src={listing.images[0]}
                                        alt={listing.title}
                                        fill
                                        className="object-cover rounded-t-lg"
                                    />
                                </div>
                            )}
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge>{listing.subcategory || listing.category}</Badge>
                                    <Badge variant="outline">{listing.availability}</Badge>
                                </div>
                                <CardTitle className="text-xl">{listing.title}</CardTitle>
                                <CardDescription>{listing.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="font-semibold text-lg">
                                            ₦{listing.price.toLocaleString()}
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            <Clock className="h-4 w-4 mr-1" />
                                            {listing.posted}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-gray-600">
                                        <div>{listing.seller.name}</div>
                                        <div>{listing.seller.unit}</div>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Delivery: {listing.delivery}
                                    </div>
                                    <Button
                                        className="w-full bg-[#8B0000] hover:bg-[#8B0000]/90"
                                        onClick={() => handleContactSeller(listing.id)}
                                    >
                                        Contact Seller
                                        <MessageSquare className="h-4 w-4 ml-2" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Empty State */}
            {listings.length === 0 && !loading && (
                <div className="text-center py-12">
                    <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
                    <p className="text-gray-600">
                        {searchTerm
                            ? "Try adjusting your search terms"
                            : "Be the first to create a listing in this category"}
                    </p>
                </div>
            )}
        </div>
    )
}

export default MarketplacePage