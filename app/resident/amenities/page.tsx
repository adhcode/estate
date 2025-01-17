"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Calendar,
    Clock,
    Users,
    DollarSign,
    Info,
    ChevronRight,
    Dumbbell,
    Waves,
    CircleDot,
    UtensilsCrossed,
    Gamepad2,
    Coffee,
    Car,
    Building2,
    CircleDot as CircleDot2
} from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface Amenity {
    id: string
    name: string
    description: string
    icon: React.ElementType
    capacity: number

    availability: 'available' | 'busy' | 'maintenance'
    nextAvailable?: string
    operatingHours: string
    rules: string[]
}

const amenities: Amenity[] = [

    {
        id: "2",
        name: "Community Hall",
        description: "Multi-purpose hall for events and gatherings",
        icon: Building2,
        capacity: 200,
        availability: 'available',
        operatingHours: "9:00 AM - 10:00 PM",
        rules: [
            "Clean up after use",
            "No loud music after 9 PM",
            "Advance booking required"
        ]
    },
    {
        id: "3",
        name: "Tennis Court",
        description: "Professional-grade tennis court with lighting",
        icon: CircleDot,
        capacity: 4,

        availability: 'busy',
        nextAvailable: "2:00 PM",
        operatingHours: "7:00 AM - 9:00 PM",
        rules: [
            "Proper tennis shoes required",
            "Maximum 2 hours booking",
            "Cancel at least 4 hours in advance"
        ]
    },
    {
        id: "4",
        name: "Basketball Court",
        description: "Full-size basketball court with night lighting",
        icon: CircleDot2,
        capacity: 10,

        availability: 'available',
        operatingHours: "7:00 AM - 9:00 PM",
        rules: [
            "No food or drinks on court",
            "Maximum 2 hours during peak times",
            "Proper sports shoes required"
        ]
    }
]

const AmenitiesPage: React.FC = () => {
    const getAvailabilityColor = (status: string) => {
        switch (status) {
            case 'available':
                return 'bg-green-500'
            case 'busy':
                return 'bg-yellow-500'
            case 'maintenance':
                return 'bg-red-500'
            default:
                return 'bg-gray-500'
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
                    Amenities
                </h1>
                <p className="text-gray-600">
                    Book and manage facility reservations
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {amenities.map((amenity, index) => (
                    <motion.div
                        key={amenity.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="h-full hover:shadow-lg transition-all duration-300">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 rounded-lg bg-gray-100">
                                        <amenity.icon className="h-5 w-5 text-[#8B0000]" />
                                    </div>
                                    <Badge className={`${getAvailabilityColor(amenity.availability)} text-white`}>
                                        {amenity.availability.charAt(0).toUpperCase() + amenity.availability.slice(1)}
                                    </Badge>
                                </div>
                                <CardTitle className="text-xl">{amenity.name}</CardTitle>
                                <CardDescription>{amenity.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center text-gray-600">
                                            <Users className="h-4 w-4 mr-2" />
                                            <span>Capacity: {amenity.capacity}</span>
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            <Clock className="h-4 w-4 mr-2" />
                                            <span>{amenity.operatingHours}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center text-gray-600 text-sm">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
                                                    <Info className="h-4 w-4 mr-2" />
                                                    <span>Rules & Guidelines</span>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80">
                                                <div className="space-y-2">
                                                    <h4 className="font-medium">Facility Rules</h4>
                                                    <ul className="list-disc pl-4 space-y-1 text-sm text-gray-600">
                                                        {amenity.rules.map((rule, index) => (
                                                            <li key={index}>{rule}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    {amenity.nextAvailable && (
                                        <div className="text-sm text-gray-600">
                                            Next available: {amenity.nextAvailable}
                                        </div>
                                    )}
                                    <Button
                                        className="w-full bg-[#8B0000] hover:bg-[#8B0000]/90"
                                        disabled={amenity.availability === 'maintenance'}
                                    >
                                        {amenity.availability === 'maintenance' ? 'Under Maintenance' : 'Book Now'}
                                        <ChevronRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

export default AmenitiesPage 