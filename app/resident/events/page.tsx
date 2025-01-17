"use client"

import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    CalendarCheck,
    ChevronRight
} from "lucide-react"

interface Event {
    id: string
    title: string
    date: string
    time: string
    location: string
    category: string
    description: string
    attendees: number
    maxCapacity: number
}

const upcomingEvents: Event[] = [

    {
        id: "1",
        title: "Monthly Town Hall Meeting",
        date: "2025-01-25",
        time: "10:00 AM",
        location: "Community Hall",
        category: "Meeting",
        description: "Monthly resident meeting to discuss community updates and concerns.",
        attendees: 30,
        maxCapacity: 150
    }

]

const EventsPage: React.FC = () => {
    const getCategoryColor = (category: string) => {
        switch (category.toLowerCase()) {
            case "social":
                return "bg-blue-500"
            case "meeting":
                return "bg-yellow-500"
            case "sports":
                return "bg-green-500"
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
                    Community Events
                </h1>
                <p className="text-gray-600">
                    Stay connected with upcoming events and activities
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event, index) => (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="h-full hover:shadow-lg transition-all duration-300">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge className={`${getCategoryColor(event.category)} text-white`}>
                                        {event.category}
                                    </Badge>
                                    <Badge variant="outline" className="bg-gray-100">
                                        <Users className="h-3 w-3 mr-1" />
                                        {event.attendees}/{event.maxCapacity}
                                    </Badge>
                                </div>
                                <CardTitle className="text-xl mb-1">{event.title}</CardTitle>
                                <CardDescription>{event.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center text-gray-600">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        <span>{new Date(event.date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <Clock className="h-4 w-4 mr-2" />
                                        <span>{event.time}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <MapPin className="h-4 w-4 mr-2" />
                                        <span>{event.location}</span>
                                    </div>
                                    <Button className="w-full mt-4 bg-[#8B0000] hover:bg-[#8B0000]/90">
                                        <span>Register Interest</span>
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

export default EventsPage 