"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Droplet, Gauge, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Calendar as ReCalendar } from "@/components/ui/calendar"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { format } from "date-fns"
import { addMonths } from "date-fns"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

interface MaintenanceRecord {
    id: string
    type: 'water_station' | 'injection_station'
    last_maintenance_date: string | null
    next_maintenance_date: string
    status: 'completed' | 'pending' | 'overdue'
    notes: string | null
    completed_by: string | null
}

interface MaintenanceHistory {
    id: string
    type: 'water_station' | 'injection_station'
    maintenance_date: string
    completed_by: string
    notes: string | null
}

interface MaintenanceSchedule {
    id?: string
    facility: string
    frequency: string
    startDate: Date | undefined
    nextDates: Date[]
}

export default function MaintenancePage() {
    const [isLoading, setIsLoading] = useState(true)
    const [waterStation, setWaterStation] = useState<MaintenanceRecord | null>(null)
    const [injectionStation, setInjectionStation] = useState<MaintenanceRecord | null>(null)
    const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceHistory[]>([])
    const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null)
    const [notes, setNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date>()
    const [selectedFacility, setSelectedFacility] = useState<string>("")
    const [maintenancePeriod, setMaintenancePeriod] = useState<string>("")
    const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([])
    const [newSchedule, setNewSchedule] = useState<MaintenanceSchedule>({
        facility: "",
        frequency: "",
        startDate: undefined,
        nextDates: []
    })
    const supabase = createClientComponentClient()

    useEffect(() => {
        fetchMaintenanceData()
        fetchSchedules()
    }, [])

    async function fetchMaintenanceData() {
        try {
            // Fetch current maintenance records
            const { data: maintenanceData, error } = await supabase
                .from('facility_maintenance')
                .select('*')
                .order('next_maintenance_date', { ascending: true })

            if (error) throw error

            setWaterStation(maintenanceData.find(m => m.type === 'water_station') || null)
            setInjectionStation(maintenanceData.find(m => m.type === 'injection_station') || null)

            // Fetch maintenance history
            const { data: history, error: historyError } = await supabase
                .from('maintenance_history')
                .select(`
          id,
          type,
          maintenance_date,
          completed_by,
          notes
        `)
                .order('maintenance_date', { ascending: false })
                .limit(10)

            if (historyError) throw historyError
            setMaintenanceHistory(history)

        } catch (error) {
            console.error('Error fetching maintenance data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchSchedules = async () => {
        const { data, error } = await supabase
            .from('maintenance_schedule')
            .select('*')
            .order('scheduled_date', { ascending: true })

        if (error) {
            toast.error("Failed to fetch schedules")
            return
        }

        if (data) {
            setSchedules(data.map(schedule => ({
                id: schedule.id,
                facility: schedule.facility,
                frequency: schedule.frequency,
                startDate: new Date(schedule.scheduled_date),
                nextDates: calculateNextDates(new Date(schedule.scheduled_date), schedule.frequency)
            })))
        }
    }

    const calculateNextDates = (startDate: Date, frequency: string): Date[] => {
        const dates: Date[] = []
        let months = 0

        switch (frequency) {
            case 'monthly':
                months = 1
                break
            case 'quarterly':
                months = 3
                break
            case 'biannual':
                months = 6
                break
            case 'annual':
                months = 12
                break
        }

        // Calculate next 4 maintenance dates
        for (let i = 1; i <= 4; i++) {
            dates.push(addMonths(startDate, months * i))
        }

        return dates
    }

    // Add helper function to check if maintenance is due
    function isMaintenanceDue(nextMaintenanceDate: string | null): boolean {
        if (!nextMaintenanceDate) return false
        const today = new Date()
        const nextDate = new Date(nextMaintenanceDate)
        return today >= nextDate
    }

    async function handleMaintenanceCompletion() {
        if (!selectedRecord) return
        setIsSubmitting(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No authenticated user')

            const now = new Date().toISOString()
            const nextDate = new Date()
            nextDate.setDate(nextDate.getDate() + 1) // Set next maintenance to tomorrow
            const nextMaintenanceDate = nextDate.toISOString()

            // Update facility maintenance record
            const { error: updateError } = await supabase
                .from('facility_maintenance')
                .update({
                    last_maintenance_date: now,
                    next_maintenance_date: nextMaintenanceDate,
                    status: 'completed',
                    notes,
                    completed_by: user.id,
                    updated_at: now
                })
                .eq('id', selectedRecord.id)

            if (updateError) throw updateError

            // Add to maintenance history
            const { error: historyError } = await supabase
                .from('maintenance_history')
                .insert({
                    facility_maintenance_id: selectedRecord.id,
                    type: selectedRecord.type,
                    maintenance_date: now,
                    completed_by: user.id,
                    notes
                })

            if (historyError) throw historyError

            // Refresh data
            await fetchMaintenanceData()
            setSelectedRecord(null)
            setNotes('')
        } catch (error) {
            console.error('Error completing maintenance:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const MaintenanceCard = ({ title, record, icon: Icon, onAction }: {
        title: string
        record: MaintenanceRecord | null
        icon: any
        onAction: () => void
    }) => {
        const isDue = isMaintenanceDue(record?.next_maintenance_date || null)

        return (
            <Card className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">{title}</h3>
                            <p className="text-sm text-gray-500">
                                Next maintenance: {formatDate(record?.next_maintenance_date || null)}
                            </p>
                            {record?.last_maintenance_date && (
                                <p className="text-xs text-gray-400 mt-1">
                                    Last maintained: {formatDate(record.last_maintenance_date)}
                                </p>
                            )}
                        </div>
                    </div>
                    <MaintenanceStatus status={record?.status || 'pending'} />
                </div>
                <div className="mt-6">
                    {isDue ? (
                        <Button
                            className="w-full"
                            onClick={onAction}
                        >
                            Mark as Completed
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            className="w-full"
                            disabled
                        >
                            Scheduled for {formatDate(record?.next_maintenance_date || null)}
                        </Button>
                    )}
                </div>
            </Card>
        )
    }

    const MaintenanceStatus = ({ status }: { status: MaintenanceRecord['status'] }) => {
        const statusStyles = {
            pending: 'bg-yellow-100 text-yellow-600',
            completed: 'bg-green-100 text-green-600',
            overdue: 'bg-red-100 text-red-600'
        }

        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        )
    }

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setNewSchedule(prev => ({
                ...prev,
                startDate: date,
                nextDates: prev.frequency ? calculateNextDates(date, prev.frequency) : []
            }))
        }
    }

    const handleFrequencyChange = (value: string) => {
        setNewSchedule(prev => ({
            ...prev,
            frequency: value,
            nextDates: prev.startDate ? calculateNextDates(prev.startDate, value) : []
        }))
    }

    const handleScheduleMaintenance = async () => {
        if (!newSchedule.startDate || !newSchedule.facility || !newSchedule.frequency) {
            toast.error("Please fill in all fields")
            return
        }

        try {
            const { error } = await supabase
                .from('maintenance_schedule')
                .insert({
                    facility: newSchedule.facility,
                    scheduled_date: newSchedule.startDate.toISOString(),
                    frequency: newSchedule.frequency,
                    next_dates: newSchedule.nextDates.map(date => date.toISOString())
                })

            if (error) throw error

            toast.success("Maintenance schedule created successfully")
            fetchSchedules()
            setNewSchedule({
                facility: "",
                frequency: "",
                startDate: undefined,
                nextDates: []
            })
        } catch (error) {
            console.error('Error scheduling maintenance:', error)
            toast.error("Failed to schedule maintenance")
        }
    }

    if (isLoading) {
        return <div>Loading...</div>
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Facility Maintenance Schedule</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Create Maintenance Schedule</CardTitle>
                        <CardDescription>Set up periodic maintenance for facilities</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Facility</label>
                            <Select
                                value={newSchedule.facility}
                                onValueChange={(value) => setNewSchedule(prev => ({ ...prev, facility: value }))}
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
                                value={newSchedule.frequency}
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
                                    selected={newSchedule.startDate}
                                    onSelect={handleDateSelect}
                                    disabled={(date) => date < new Date()}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {newSchedule.nextDates.length > 0 && (
                            <div className="p-4 bg-gray-50 rounded-md space-y-3">
                                <p className="text-sm font-medium text-gray-600">Next Maintenance Dates:</p>
                                <div className="space-y-2">
                                    {newSchedule.nextDates.map((date, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                            <p className="text-sm text-gray-900">
                                                {format(date, 'PPP')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
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

                <Card>
                    <CardHeader>
                        <CardTitle>Current Schedules</CardTitle>
                        <CardDescription>Active maintenance schedules</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {schedules.map((schedule) => (
                            <div key={schedule.id} className="p-4 border rounded-lg space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-medium">
                                            {schedule.facility === 'water_station' ? 'Water Station' : 'Injection Station'}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)} maintenance
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-600">Next maintenance dates:</p>
                                    {schedule.nextDates.map((date, index) => (
                                        <p key={index} className="text-sm text-gray-900">
                                            {format(date, 'PPP')}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {schedules.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">
                                No maintenance schedules set
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Maintenance History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {maintenanceHistory.map(record => (
                            <div key={record.id} className="flex items-start space-x-4 border-b last:border-0 pb-4">
                                <div className="p-2 rounded-full bg-green-100">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">
                                        {record.type === 'water_station' ? 'Water Station' : 'Injection Station'} Maintenance
                                    </p>
                                    <p className="text-sm text-gray-500">{formatDate(record.maintenance_date)}</p>
                                    {record.notes && (
                                        <p className="text-sm text-gray-600 mt-1">{record.notes}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function formatDate(date: string | null) {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
} 