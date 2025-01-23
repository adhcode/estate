"use client"


import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import {
  Users,
  Building2,
  AlertTriangle,
  ClipboardList,
  Wallet,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Calendar,
  Droplet,
  Gauge
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DashboardStats {
  totalResidents: number
  totalProperties: number
  facilityMaintenance: {
    completed: number
    pending: number
  }
  pendingDues: number
}

interface Activity {
  id: string
  type: 'maintenance' | 'message' | 'payment'
  title: string
  description: string
  timestamp: string
  status: 'pending' | 'completed' | 'in_progress'
}

interface UpcomingEvent {
  id: string
  title: string
  date: string
  type: 'meeting' | 'maintenance'
  description: string
  location: string
}

// Add sample occupancy data
const sampleOccupancyData = [
  { month: 'Jan', rate: 85 },
  { month: 'Feb', rate: 88 },
  { month: 'Mar', rate: 87 },
  { month: 'Apr', rate: 89 },
  { month: 'May', rate: 92 },
  { month: 'Jun', rate: 90 },
  { month: 'Jul', rate: 91 },
  { month: 'Aug', rate: 93 },
  { month: 'Sep', rate: 94 },
  { month: 'Oct', rate: 95 },
  { month: 'Nov', rate: 94 },
  { month: 'Dec', rate: 96 },
]

// Update sample maintenance data to reflect facility maintenance
const sampleMaintenanceData = [
  { month: 'Jan', water_station: 1, injection_station: 1 },
  { month: 'Feb', water_station: 1, injection_station: 0 },
  { month: 'Mar', water_station: 1, injection_station: 1 },
  { month: 'Apr', water_station: 1, injection_station: 0 },
  { month: 'May', water_station: 1, injection_station: 1 },
  { month: 'Jun', water_station: 1, injection_station: 0 },
  { month: 'Jul', water_station: 1, injection_station: 1 },
  { month: 'Aug', water_station: 1, injection_station: 0 },
  { month: 'Sep', water_station: 1, injection_station: 1 },
  { month: 'Oct', water_station: 1, injection_station: 0 },
  { month: 'Nov', water_station: 1, injection_station: 1 },
  { month: 'Dec', water_station: 1, injection_station: 0 },
]

// Add sample activities data
const sampleActivities: Activity[] = [
  {
    id: '1',
    type: 'maintenance',
    title: 'New Maintenance Request',
    description: 'Block 4, Apartment 302 reported AC malfunction',
    timestamp: '2 hours ago',
    status: 'pending'
  },

  {
    id: '3',
    type: 'payment',
    title: 'Service Charge Payment',
    description: 'Block 2, Apartment 105 completed quarterly payment',
    timestamp: '5 hours ago',
    status: 'completed'
  },

  {
    id: '5',
    type: 'maintenance',
    title: 'Maintenance Completed',
    description: 'Plumbing issue resolved in Block 3, Apartment 204',
    timestamp: '1 day ago',
    status: 'completed'
  }
]

// Add sample upcoming events
const sampleUpcomingEvents: UpcomingEvent[] = [
  {
    id: '1',
    title: 'Estate General Meeting',
    date: 'March 15, 2024',
    type: 'meeting',
    description: 'Annual general meeting for all residents',
    location: 'Estate Premises'
  },
  {
    id: '2',
    title: 'Facility Maintenance',
    date: 'March 18, 2024',
    type: 'maintenance',
    description: 'Scheduled maintenance of injection station',
    location: 'Estate Premises'
  },

]

const TOTAL_ESTATE_FLATS = 492; // Total number of flats in LKJ Estate

// Add the maintenance data interface
interface MaintenanceData {
  month: string
  water_station: number
  injection_station: number
}

interface OccupancyData {
  month: string
  rate: number
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalResidents: 0,
    totalProperties: 0,
    facilityMaintenance: {
      completed: 0,
      pending: 0
    },
    pendingDues: 0
  })

  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceData[]>([])
  const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([])

  useEffect(() => {
    fetchDashboardData()
    fetchMaintenanceData()
    fetchOccupancyData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([
        fetchStats(),
        fetchRecentActivities(),
        fetchUpcomingEvents()
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Fetch total residents (including household members)
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact' })

      const { count: householdCount } = await supabase
        .from('household_members')
        .select('*', { count: 'exact' })

      // Fetch maintenance stats
      const { data: maintenanceData } = await supabase
        .from('maintenance_requests')
        .select('status')

      const completed = maintenanceData?.filter(m => m.status === 'completed').length || 0
      const total = maintenanceData?.length || 0

      // Fetch pending dues
      const { data: serviceCharges } = await supabase
        .from('service_charges')
        .select('balance')
        .eq('year', new Date().getFullYear())

      const totalPendingDues = serviceCharges?.reduce((sum, charge) =>
        sum + (charge.balance || 0), 0) || 0

      setStats({
        totalResidents: (usersCount || 0) + (householdCount || 0),
        totalProperties: 492, // Your total properties constant
        facilityMaintenance: {
          completed,
          pending: total - completed
        },
        pendingDues: totalPendingDues
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchRecentActivities = async () => {
    try {
      const activities: Activity[] = []

      // Fetch maintenance requests
      const { data: maintenanceData } = await supabase
        .from('maintenance_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (maintenanceData) {
        maintenanceData.forEach(item => {
          activities.push({
            id: item.id,
            type: 'maintenance',
            title: 'Maintenance Request',
            description: item.description,
            timestamp: item.created_at,
            status: item.status
          })
        })
      }

      // Fetch messages (issues)
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (messagesData) {
        messagesData.forEach(item => {
          activities.push({
            id: item.id,
            type: 'message',
            title: 'New Message',
            description: item.content,
            timestamp: item.created_at,
            status: item.is_read ? 'completed' : 'pending'
          })
        })
      }

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (paymentsData) {
        paymentsData.forEach(item => {
          activities.push({
            id: item.id,
            type: 'payment',
            title: 'New Payment',
            description: `₦${item.amount} - ${item.payment_type}`,
            timestamp: item.created_at,
            status: item.status
          })
        })
      }

      // Sort by timestamp and update state
      activities.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      setRecentActivities(activities.slice(0, 10))
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const fetchUpcomingEvents = async () => {
    try {
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(5)

      if (eventsData) {
        const formattedEvents: UpcomingEvent[] = eventsData.map(event => ({
          id: event.id,
          title: event.title,
          date: event.date,
          type: event.type,
          description: event.description,
          location: event.location || 'Estate Premises'
        }))
        setUpcomingEvents(formattedEvents)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const fetchMaintenanceData = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_schedule')
        .select('*')
        .order('month')

      if (error) throw error

      if (data) {
        setMaintenanceData(data)
      }
    } catch (error) {
      console.error('Error fetching maintenance data:', error)
    }
  }

  const fetchOccupancyData = async () => {
    try {
      const { data, error } = await supabase
        .from('occupancy_rates')
        .select('*')
        .order('month')

      if (error) throw error

      if (data) {
        setOccupancyData(data)
      }
    } catch (error) {
      console.error('Error fetching occupancy data:', error)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color }: {
    title: string
    value: number | string
    icon: any
    color: string
  }) => (
    <Card className={`p-6 ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Card>
  )

  const ActivityItem = ({ activity }: { activity: Activity }) => (
    <div className="flex items-start space-x-4 p-4 border-b last:border-0">
      <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1">
        <p className="font-medium">{activity.title}</p>
        <p className="text-sm text-gray-500">{activity.description}</p>
        <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(activity.status)}`}>
        {activity.status}
      </span>
    </div>
  )

  const EventItem = ({ event }: { event: UpcomingEvent }) => (
    <div className="flex items-start space-x-4 p-4 border-b last:border-0">
      <div className={`p-2 rounded-full ${getEventColor(event.type)}`}>
        {getEventIcon(event.type)}
      </div>
      <div className="flex-1">
        <p className="font-medium">{event.title}</p>
        <p className="text-sm text-gray-500">{event.description}</p>
        <p className="text-xs text-gray-400 mt-1">{event.date}</p>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="h-20 bg-gray-100 rounded animate-pulse" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Residents"
          value={stats.totalResidents}
          icon={Users}
          color="bg-blue-100"
        />
        <StatCard
          title="Total Flats"
          value={stats.totalProperties}
          icon={Building2}
          color="bg-green-100"
        />
        <StatCard
          title="Pending Maintenance"
          value={stats.facilityMaintenance.pending}
          icon={ClipboardList}
          color="bg-yellow-100"
        />
        <StatCard
          title="Pending Dues"
          value={`₦${stats.pendingDues.toLocaleString()}`}
          icon={Wallet}
          color="bg-purple-100"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Facility Maintenance History</CardTitle>
            <CardDescription>Monthly maintenance records for water and injection stations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maintenanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="water_station" fill="#2563eb" name="Water Station" />
                  <Bar dataKey="injection_station" fill="#7c3aed" name="Injection Station" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Occupancy Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Estate Occupancy Rate</CardTitle>
            <CardDescription>Monthly occupancy percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={occupancyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#832131"
                    name="Occupancy Rate"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest updates from maintenance, issues, and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Scheduled meetings and maintenance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <EventItem key={event.id} event={event} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function getActivityColor(type: Activity['type']) {
  const colors = {
    maintenance: 'bg-yellow-100 text-yellow-600',
    message: 'bg-blue-100 text-blue-600',
    payment: 'bg-green-100 text-green-600'
  }
  return colors[type]
}

function getActivityIcon(type: Activity['type']) {
  const icons = {
    maintenance: <ClipboardList className="h-4 w-4" />,
    message: <AlertTriangle className="h-4 w-4" />,
    payment: <Wallet className="h-4 w-4" />
  }
  return icons[type]
}

function getStatusColor(status: Activity['status']) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-600',
    completed: 'bg-green-100 text-green-600',
    in_progress: 'bg-blue-100 text-blue-600'
  }
  return colors[status]
}

function getEventColor(type: UpcomingEvent['type']) {
  const colors = {
    meeting: 'bg-blue-100 text-blue-600',
    maintenance: 'bg-green-100 text-green-600'
  }
  return colors[type]
}

function getEventIcon(type: UpcomingEvent['type']) {
  const icons = {
    meeting: <Calendar className="h-4 w-4" />,
    maintenance: <Droplet className="h-4 w-4" />
  }
  return icons[type]
}