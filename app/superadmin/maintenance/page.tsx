"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { format, addMonths } from "date-fns"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { toast } from "sonner"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface MaintenanceSchedule {
    facility: string
    frequency: string
    startDate: Date | undefined
    nextDate: Date | undefined
}

export default function MaintenancePage() {
    const [schedule, setSchedule] = useState<MaintenanceSchedule>({
        facility: "",
        frequency: "",
        startDate: undefined,
        nextDate: undefined
    })
    const supabase = createClientComponentClient()

    const calculateNextDate = (startDate: Date, frequency: string): Date => {
        switch (frequency) {
            case 'monthly':
                return addMonths(startDate, 1)
            case 'quarterly':
                return addMonths(startDate, 3)
            case 'biannual':
                return addMonths(startDate, 6)
            case 'annual':
                return addMonths(startDate, 12)
            default:
                return startDate
        }
    }

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setSchedule(prev => ({
                ...prev,
                startDate: date,
                nextDate: prev.frequency ? calculateNextDate(date, prev.frequency) : undefined
            }))
        }
    }

    const handleFrequencyChange = (value: string) => {
        setSchedule(prev => ({
            ...prev,
            frequency: value,
            nextDate: prev.startDate ? calculateNextDate(prev.startDate, value) : undefined
        }))
    }

    const handleScheduleMaintenance = async () => {
        if (!schedule.startDate || !schedule.facility || !schedule.frequency) {
            toast.error("Please fill in all fields")
            return
        }

        try {
            const { error } = await supabase
                .from('maintenance_schedule')
                .insert({
                    facility: schedule.facility,
                    scheduled_date: schedule.startDate.toISOString(),
                    frequency: schedule.frequency,
                    next_date: schedule.nextDate?.toISOString(),
                    status: 'scheduled'
                })

            if (error) throw error

            toast.success("Maintenance schedule created successfully")
            setSchedule({
                facility: "",
                frequency: "",
                startDate: undefined,
                nextDate: undefined
            })
        } catch (error) {
            console.error('Error scheduling maintenance:', error)
            toast.error("Failed to schedule maintenance")
        }
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Schedule Facility Maintenance</h1>

            <Card className="max-w-xl mx-auto">
                <CardHeader>
                    <CardTitle>Create Maintenance Schedule</CardTitle>
                    <CardDescription>Set up periodic maintenance for facilities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Facility</label>
                        <Select
                            value={schedule.facility}
                            onValueChange={(value) => setSchedule(prev => ({ ...prev, facility: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select facility" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="water_station">Water Station</SelectItem>
                                <SelectItem value="injection_station">Injection Station</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Maintenance Frequency</label>
                        <Select
                            value={schedule.frequency}
                            onValueChange={handleFrequencyChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Every 3 Months</SelectItem>
                                <SelectItem value="biannual">Every 6 Months</SelectItem>
                                <SelectItem value="annual">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Start Date</label>
                        <div className="border rounded-md p-4">
                            <DayPicker
                                mode="single"
                                selected={schedule.startDate}
                                onSelect={handleDateSelect}
                                disabled={(date) => date < new Date()}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {schedule.nextDate && (
                        <div className="p-4 bg-gray-50 rounded-md">
                            <p className="text-sm font-medium text-gray-600">Next Maintenance Date:</p>
                            <p className="text-lg font-semibold text-gray-900 mt-1">
                                {format(schedule.nextDate, 'PPP')}
                            </p>
                        </div>
                    )}

                    <Button
                        className="w-full"
                        onClick={handleScheduleMaintenance}
                    >
                        Create Schedule
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
} 