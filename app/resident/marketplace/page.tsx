"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Home, ShoppingBag, Star, Clock, DollarSign, Search, ChevronLeft, Filter } from "lucide-react"
import { useRouter } from "next/navigation"

type MarketplaceItem = {
    id: string
    name: string
    description: string
    price: number
    rating: number
    category: string
    image: string
    provider: {
        name: string
        avatar: string
    }
}

const marketplaceItems: MarketplaceItem[] = [
    {
        id: "1",
        name: "Professional Home Cleaning",
        description: "Thorough cleaning service for your entire home",
        price: 80,
        rating: 4.8,
        category: "Home Services",
        image: "/placeholder.svg?height=200&width=200",
        provider: {
            name: "Clean Co.",
            avatar: "/placeholder.svg?height=40&width=40"
        }
    },
    {
        id: "2",
        name: "Handyman Services",
        description: "Quick fixes and repairs for your home",
        price: 60,
        rating: 4.6,
        category: "Home Services",
        image: "/placeholder.svg?height=200&width=200",
        provider: {
            name: "Fix It Fast",
            avatar: "/placeholder.svg?height=40&width=40"
        }
    },
    {
        id: "3",
        name: "Gourmet Meal Delivery",
        description: "Delicious, chef-prepared meals delivered to your door",
        price: 25,
        rating: 4.9,
        category: "Food & Dining",
        image: "/placeholder.svg?height=200&width=200",
        provider: {
            name: "Tasty Bites",
            avatar: "/placeholder.svg?height=40&width=40"
        }
    },
    {
        id: "4",
        name: "Personal Fitness Training",
        description: "Customized workout sessions with a certified trainer",
        price: 70,
        rating: 4.7,
        category: "Health & Wellness",
        image: "/placeholder.svg?height=200&width=200",
        provider: {
            name: "FitLife",
            avatar: "/placeholder.svg?height=40&width=40"
        }
    },

    {
        id: "5",
        name: "Car Wash",
        description: "Mobile car washing at your doorstep",
        price: 30,
        rating: 4.5,
        category: "Home Services",
        image: "/placeholder.svg?height=200&width=200",
        provider: {
            name: "SparkleWash",
            avatar: "/placeholder.svg?height=40&width=40"
        }
    },

    {
        id: "6",
        name: "Lawn Care and Landscaping",
        description: "Complete lawn maintenance and landscaping services",
        price: 100,
        rating: 4.8,
        category: "Home Services",
        image: "/placeholder.svg?height=200&width=200",
        provider: {
            name: "Green Thumb",
            avatar: "/placeholder.svg?height=40&width=40"
        }
    },
    {
        id: "7",
        name: "Tech Support",
        description: "In-home tech support and setup",
        price: 45,
        rating: 4.5,
        category: "Tech Services",
        image: "/placeholder.svg?height=200&width=200",
        provider: {
            name: "Tech Wizards",
            avatar: "/placeholder.svg?height=40&width=40"
        }
    },
]

export default function MarketplacePage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [sortBy, setSortBy] = useState("rating")
    const [bookingItem, setBookingItem] = useState<MarketplaceItem | null>(null)
    const router = useRouter()

    const filteredItems = marketplaceItems.filter(item =>
        (selectedCategory === "All" || item.category === selectedCategory) &&
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        if (sortBy === "rating") return b.rating - a.rating
        if (sortBy === "price_low") return a.price - b.price
        if (sortBy === "price_high") return b.price - a.price
        return 0
    })

    const categories = ["All", ...new Set(marketplaceItems.map(item => item.category))]

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto px-4 py-12">
                <Button
                    variant="ghost"
                    className="mb-6 -ml-4 text-gray-600 hover:text-gray-900 hover:bg-transparent"
                    onClick={() => router.push('/resident/dashboard')}
                >
                    <ChevronLeft className="h-5 w-5 mr-1" />
                    Back to Dashboard
                </Button>

                <div className="mb-8">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-grow">
                            <Label htmlFor="search" className="sr-only">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <Input
                                    id="search"
                                    placeholder="Search services..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-white"
                                />
                            </div>
                        </div>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-full md:w-[180px] bg-white">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(category => (
                                    <SelectItem key={category} value={category}>{category}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full md:w-[180px] bg-white">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="rating">Top Rated</SelectItem>
                                <SelectItem value="price_low">Price: Low to High</SelectItem>
                                <SelectItem value="price_high">Price: High to Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white">
                                <CardHeader className="p-0">
                                    <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                                </CardHeader>
                                <CardContent className="p-4">
                                    <CardTitle className="text-lg font-semibold mb-2">{item.name}</CardTitle>
                                    <CardDescription className="text-sm mb-2">{item.description}</CardDescription>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center">
                                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                            <span className="text-sm font-medium">{item.rating.toFixed(1)}</span>
                                        </div>
                                        <div className="flex items-center text-[#832131]">
                                            <DollarSign className="h-4 w-4 mr-1" />
                                            <span className="text-lg font-bold">{item.price}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center mt-2">
                                        <Avatar className="h-6 w-6 mr-2">
                                            <AvatarImage src={item.provider.avatar} alt={item.provider.name} />
                                            <AvatarFallback>{item.provider.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm text-gray-600">{item.provider.name}</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-gray-50 p-4">
                                    <Button
                                        className="w-full bg-[#832131] hover:bg-[#6a1a28] text-white"
                                        onClick={() => setBookingItem(item)}
                                    >
                                        Book Now
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </main>

            <Dialog open={!!bookingItem} onOpenChange={() => setBookingItem(null)}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>Book {bookingItem?.name}</DialogTitle>
                        <DialogDescription>Enter your details to book this service.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="booking-date">Preferred Date</Label>
                            <Input id="booking-date" type="date" />
                        </div>
                        <div>
                            <Label htmlFor="booking-time">Preferred Time</Label>
                            <Input id="booking-time" type="time" />
                        </div>
                        <div>
                            <Label htmlFor="booking-notes">Special Instructions</Label>
                            <Input id="booking-notes" placeholder="Any special requests or notes" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button className="bg-[#832131] text-white hover:bg-[#6a1a28]">Confirm Booking</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


        </div>
    )
}