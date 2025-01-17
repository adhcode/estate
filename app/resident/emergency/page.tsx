"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Phone,
    Shield,
    Siren,
    Stethoscope,
    FlameKindling,
    AlertTriangle,
    Building2,
    ArrowUpRightFromCircle
} from "lucide-react"
import Link from "next/link"

const emergencyContacts = [
    {
        title: "Police Emergency",
        number: "999",
        description: "For immediate police assistance",
        icon: Shield,
        bgColor: "bg-blue-500/10",
        iconColor: "text-blue-500"
    },
    {
        title: "Ambulance",
        number: "999",
        description: "Medical emergencies",
        icon: Stethoscope,
        bgColor: "bg-red-500/10",
        iconColor: "text-red-500"
    },
    {
        title: "Fire Department",
        number: "999",
        description: "Fire emergencies",
        icon: FlameKindling,
        bgColor: "bg-orange-500/10",
        iconColor: "text-orange-500"
    },
    {
        title: "Estate Security",
        number: "012-345-6789",
        description: "24/7 estate security patrol",
        icon: Siren,
        bgColor: "bg-purple-500/10",
        iconColor: "text-purple-500"
    },
    {
        title: "Estate Management",
        number: "012-345-6790",
        description: "Estate office (9AM-5PM)",
        icon: Building2,
        bgColor: "bg-green-500/10",
        iconColor: "text-green-500"
    },
    {
        title: "Non-Emergency Helpline",
        number: "012-345-6791",
        description: "For non-urgent assistance",
        icon: Phone,
        bgColor: "bg-gray-500/10",
        iconColor: "text-gray-500"
    }
]

export default function EmergencyPage() {
    const handleCall = (number: string) => {
        window.location.href = `tel:${number}`
    }

    return (
        <div className="min-h-screen bg-white p-4 md:p-8">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Emergency Contacts
                </h1>
                <p className="text-gray-600">
                    Quick access to important emergency numbers and services
                </p>
            </motion.div>

            {/* Emergency Alert Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-8"
            >
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-red-900 mb-1">
                                    In case of emergency
                                </h2>
                                <p className="text-red-700">
                                    Stay calm and dial the appropriate emergency number. Be ready to provide your exact location within the estate.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Emergency Contacts Grid */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
                {emergencyContacts.map((contact, index) => (
                    <motion.div
                        key={contact.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                    >
                        <Card className="h-full hover:shadow-md transition-shadow duration-300">
                            <CardHeader className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`p-2 rounded-lg ${contact.bgColor}`}>
                                        <contact.icon className={`h-5 w-5 ${contact.iconColor}`} />
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="hover:bg-gray-100"
                                        onClick={() => handleCall(contact.number)}
                                    >
                                        <Phone className="h-4 w-4 mr-2" />
                                        Call
                                    </Button>
                                </div>
                                <CardTitle className="text-lg font-semibold">
                                    {contact.title}
                                </CardTitle>
                                <div className="mt-1 space-y-1">
                                    <p className="text-lg font-medium text-gray-900">
                                        {contact.number}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {contact.description}
                                    </p>
                                </div>
                            </CardHeader>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    )
}