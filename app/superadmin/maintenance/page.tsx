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
    facility: string
    frequency: string
    startDate: Date | undefined
    nextDate: Date | undefined
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
    const [schedule, setSchedule] = useState<MaintenanceSchedule>({
        facility: "",
        frequency: "",
        startDate: undefined,
        nextDate: undefined
    })
    const supabase = createClientComponentClient()

    useEffect(() => {
        fetchMaintenanceData()
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

    // Calculate next maintenance date based on frequency
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

    if (isLoading) {
        return <div>Loading...</div>
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Maintenance Schedule</h1>

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
                                    <SelectItem value="quarterly">Quarterly (Every 3 months)</SelectItem>
                                    <SelectItem value="biannual">Bi-annual (Every 6 months)</SelectItem>
                                    <SelectItem value="annual">Annual</SelectItem>
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
                                    classNames={{
                                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                        month: "space-y-4",
                                        caption: "flex justify-center pt-1 relative items-center",
                                        caption_label: "text-sm font-medium",
                                        nav: "space-x-1 flex items-center",
                                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                                        nav_button_previous: "absolute left-1",
                                        nav_button_next: "absolute right-1",
                                        table: "w-full border-collapse space-y-1",
                                        head_row: "flex",
                                        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                                        row: "flex w-full mt-2",
                                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                        day_today: "bg-accent text-accent-foreground",
                                        day_outside: "text-muted-foreground opacity-50",
                                        day_disabled: "text-muted-foreground opacity-50",
                                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                        day_hidden: "invisible",
                                    }}
                                />
                            </div>
                        </div>

                        {schedule.nextDate && (
                            <div className="p-4 bg-gray-50 rounded-md">
                                <p className="text-sm font-medium text-gray-600">Next Maintenance Date:</p>
                                <p className="text-lg font-semibold text-gray-900">
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

                <Card>
                    <CardHeader>
                        <CardTitle>Facility Maintenance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Water Station</h2>
                            <Button variant="outline" onClick={() => setSelectedRecord(waterStation)}>
                                View Details
                            </Button>
                        </div>
                        <p>Next maintenance: {formatDate(waterStation?.next_maintenance_date || null)}</p>
                        {waterStation?.last_maintenance_date && (
                            <p>Last maintained: {formatDate(waterStation.last_maintenance_date)}</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Facility Maintenance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Injection Station</h2>
                            <Button variant="outline" onClick={() => setSelectedRecord(injectionStation)}>
                                View Details
                            </Button>
                        </div>
                        <p>Next maintenance: {formatDate(injectionStation?.next_maintenance_date || null)}</p>
                        {injectionStation?.last_maintenance_date && (
                            <p>Last maintained: {formatDate(injectionStation.last_maintenance_date)}</p>
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