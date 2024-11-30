"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserRound, UsersRound, UserRoundCheck, UserRoundX, ChevronRight, Bell, ChevronDown, Calendar, ListTodo, PanelsTopLeft } from "lucide-react"
import Footer from "../components/footer"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"



interface AdminOverviewProps {
    user?: {
        name: string;
        avatar?: string;
    }
}

interface Visit {
    id: string;
    guest_id: string;
    full_name: string;
    visit_date: string;
    visit_time: string;
    purpose_of_visit: string;
    status: string;
    created_at: string;
}

interface ExpectedGuest {
    id: string;
    full_name: string;
    check_in_time: string;
    duration: string;
    check_out?: string;
    status: 'pending' | 'active' | 'completed' | 'scheduled' | 'defaulted';
}

interface Guest {
    id: string
    guest_id: string
    full_name: string
    email: string
    phone_number: string
    visit_date: string
    visit_time: string
    purpose_of_visit: string
    check_in?: string
    check_out?: string
    duration?: string
    status: 'pending' | 'active' | 'completed' | 'scheduled' | 'defaulted'
}

interface GuestIssue {
    id: string;
    guest_id: string;
    description: string;
    created_at: string;
    guest: {
        full_name: string;
        visit_time: string;
    };
}

interface Notification {
    id: string;
    type: 'issue' | 'new_guest';
    created_at: string;
    guest_id: string;
    guest: {
        full_name: string;
        visit_time: string;
    };
    description?: string;
}

interface GuestIssueWithGuest {
    id: string;
    created_at: string;
    description: string;
    guest_id: string;
    guests: {
        full_name: string;
        visit_time: string;
    }[];
}

const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString.startsWith(today);
};

const convertTo24Hour = (time12h: string) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');

    if (hours === '12') {
        hours = '00';
    }

    if (modifier === 'PM') {
        hours = String(parseInt(hours, 10) + 12);
    }

    return `${hours}:${minutes}`;
};

export function AdminOverviewContent({ user }: AdminOverviewProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [adminData, setAdminData] = useState<any>(null)
    const [stats, setStats] = useState({
        expectedGuests: 0,
        completedVisits: 0,
        pendingVisits: 0,
        defaultedVisits: 0
    })
    const [visitationHistory, setVisitationHistory] = useState<Visit[]>([])
    const [expectedGuests, setExpectedGuests] = useState<ExpectedGuest[]>([])
    const [recentVisitors, setRecentVisitors] = useState<{ full_name: string }[]>([]);
    const [guestIssues, setGuestIssues] = useState<GuestIssue[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const supabase = createClientComponentClient()
    const router = useRouter()

    const fetchCompletedGuests = async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data: guests, error } = await supabase
            .from('guests')
            .select(`
                id,
                full_name,
                visit_time,
                duration
            `)
            .eq('visit_date', today)
            .eq('status', 'checked_out')
            .order('visit_time', { ascending: false })
            .limit(3);

        if (error) throw error;

        console.log('Fetched guests:', guests);

        const transformedGuests = guests?.map(guest => ({
            id: guest.id,
            full_name: guest.full_name,
            check_in_time: guest.visit_time,
            duration: guest.duration,
            status: 'completed' as const
        })) || [];

        console.log('Transformed guests:', transformedGuests);

        setExpectedGuests(transformedGuests);
    };

    const fetchRecentVisitors = async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data: guests, error } = await supabase
            .from('guests')
            .select('full_name')
            .eq('visit_date', today)
            .eq('status', 'checked_out')
            .order('visit_time', { ascending: false })
            .limit(6);

        if (error) throw error;
        setRecentVisitors(guests || []);
    };

    const fetchStats = async () => {
        const today = new Date().toISOString().split('T')[0];

        const { data: defaultedVisits, error: defaultedError } = await supabase
            .from('guests')
            .select('id')
            .eq('visit_date', today)
            .eq('status', 'cancelled');

        const { data: expectedGuests, error: expectedError } = await supabase
            .from('guests')
            .select('id')
            .eq('visit_date', today)
            .eq('status', 'pending');

        const { data: activeGuests, error: activeError } = await supabase
            .from('guests')
            .select('id')
            .eq('visit_date', today)
            .eq('status', 'checked_in');

        const { data: completedVisits, error: completedError } = await supabase
            .from('guests')
            .select('id')
            .eq('visit_date', today)
            .eq('status', 'checked_out');

        if (expectedError || activeError || completedError || defaultedError) {
            console.error('Error fetching stats:', expectedError || activeError || completedError || defaultedError);
            return;
        }

        setStats({
            expectedGuests: expectedGuests?.length || 0,
            pendingVisits: activeGuests?.length || 0,
            completedVisits: completedVisits?.length || 0,
            defaultedVisits: defaultedVisits?.length || 0
        });
    };

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) return

                // Fetch admin details
                const { data: adminData, error: adminError } = await supabase
                    .from('staff')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()

                if (adminError) throw adminError
                setAdminData(adminData)

                // Fetch today's stats
                const today = new Date().toISOString().split('T')[0]

                const { data: todayVisits, error: visitsError } = await supabase
                    .from('visits')
                    .select('status')
                    .gte('visit_date', today)
                    .lte('visit_date', today + 'T23:59:59')

                if (visitsError) throw visitsError

                // Calculate stats
                const stats = {
                    expectedGuests: todayVisits?.length || 0,
                    completedVisits: todayVisits?.filter(v => v.status === 'completed').length || 0,
                    pendingVisits: todayVisits?.filter(v => v.status === 'pending').length || 0,
                    defaultedVisits: todayVisits?.filter(v => v.status === 'defaulted').length || 0
                }
                setStats(stats)

                // Fetch recent visitation history
                const { data: history, error: historyError } = await supabase
                    .from('guests')
                    .select()
                    .order('created_at', { ascending: false })
                    .limit(7)

                console.log('Raw query result:', { data: history, error: historyError })

                if (historyError) throw historyError
                console.log('Fetched guest data:', history)

                setVisitationHistory(history as Visit[])

                // Fetch today's expected guests
                await fetchCompletedGuests();

                fetchRecentVisitors();

            } catch (error: any) {
                console.error('Error fetching admin data:', error?.message || error);
            } finally {
                setIsLoading(false)
            }
        }

        fetchAdminData()

        // Set up real-time subscription
        const channel = supabase
            .channel('visits-changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'visits',
                    filter: `visit_date=eq.${new Date().toISOString().split('T')[0]}`
                },
                (payload) => {
                    // Refetch all expected guests to ensure accurate data
                    fetchCompletedGuests();
                }
            )
            .subscribe();

        // Set up daily refresh at midnight
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const timeUntilMidnight = tomorrow.getTime() - now.getTime();

        const midnightTimeout = setTimeout(() => {
            fetchCompletedGuests();
            // Reload the page at midnight to reset all daily stats
            window.location.reload();
        }, timeUntilMidnight);

        return () => {
            supabase.removeChannel(channel);
            clearTimeout(midnightTimeout);
        };
    }, [supabase])

    useEffect(() => {
        fetchStats();

        // Set up a timer to refresh stats every 24 hours
        const interval = setInterval(() => {
            fetchStats();
        }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds

        // Clean up the interval on component unmount
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchNotifications = async () => {
            const { data, error: issuesError } = await supabase
                .from('guest_issues')
                .select('*, guests(*)')
                .order('created_at', { ascending: false });

            if (issuesError) {
                console.error('Error fetching issues:', issuesError);
                return;
            }

            console.log('Raw issues data:', data);

            const issueNotifications = (data || []).map(issue => ({
                id: issue.id,
                type: 'issue' as const,
                created_at: issue.created_at,
                guest_id: issue.guest_id,
                guest: {
                    full_name: issue.guests?.full_name || 'Unknown',
                    visit_time: issue.guests?.visit_time || 'N/A'
                },
                description: issue.description
            }));

            // Fetch today's new guests
            const today = new Date().toISOString().split('T')[0];
            const { data: newGuests, error: guestsError } = await supabase
                .from('guests')
                .select(`
                    id,
                    created_at,
                    full_name,
                    visit_time
                `)
                .eq('visit_date', today)
                .order('created_at', { ascending: false });

            if (issuesError) {
                console.error('Error fetching issues:', issuesError);
            }
            if (guestsError) {
                console.error('Error fetching new guests:', guestsError);
            }

            // Transform and combine notifications
            const guestNotifications: Notification[] = (newGuests || []).map(guest => ({
                id: guest.id,
                type: 'new_guest',
                created_at: guest.created_at,
                guest_id: guest.id,
                guest: {
                    full_name: guest.full_name,
                    visit_time: guest.visit_time
                }
            }));

            // Combine and sort notifications by created_at
            const allNotifications = [...issueNotifications, ...guestNotifications]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setNotifications(allNotifications);
        };

        fetchNotifications();

        // Set up real-time subscriptions for both issues and new guests
        const issueSubscription = supabase
            .channel('guest-issues-channel')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'guest_issues' },
                fetchNotifications
            )
            .subscribe();

        const guestSubscription = supabase
            .channel('new-guests-channel')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'guests' },
                fetchNotifications
            )
            .subscribe();

        return () => {
            supabase.removeChannel(issueSubscription);
            supabase.removeChannel(guestSubscription);
        };
    }, [supabase]);

    const statsConfig = [
        {
            title: "Expected Guest",
            value: stats.expectedGuests.toString(),
            period: "Today",
            icon: UserRound,
            periodIcon: Calendar
        },
        {
            title: "Active Guests",
            value: stats.pendingVisits.toString(),
            period: "Today",
            icon: UsersRound,
            periodIcon: Calendar
        },
        {
            title: "Completed Visitation",
            value: stats.completedVisits.toString(),
            period: "Today",
            icon: UserRoundCheck,
            periodIcon: Calendar
        },
        {
            title: "Defaulted Visitors",
            value: stats.defaultedVisits.toString(),
            period: "Today",
            icon: UserRoundX,
            periodIcon: Calendar
        },
    ]

    // Add a function to cancel a guest



    // Update the getStatusColor function to include "defaulted"
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "completed":
                return "bg-green-500";
            case "active":
                return "bg-blue-500";
            case "scheduled":
                return "bg-yellow-500";
            case "defaulted":
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    // Update the status display logic
    const formatStatus = (status: string) => {
        switch (status.toLowerCase()) {
            case "completed":
                return "Checked Out";
            case "active":
                return "Checked In";
            case "scheduled":
                return "Scheduled";
            case "defaulted":
                return "Defaulted";
            default:
                return "Pending";
        }
    };

    // Add this function at the top level of your component
    const handleCancelGuest = async (guestId: string) => {
        try {
            const { error } = await supabase
                .from('guests')
                .update({
                    status: 'defaulted',
                    check_out: new Date().toISOString()
                })
                .eq('id', guestId);

            if (error) throw error;

            // Update local state
            setExpectedGuests(prevGuests =>
                prevGuests.map(guest =>
                    guest.id === guestId
                        ? { ...guest, status: 'defaulted', check_out: new Date().toISOString() }
                        : guest
                )
            );
        } catch (error) {
            console.error('Error cancelling guest:', error);
        }
    };

    // Update the GuestDetailsContent component
    const GuestDetailsContent = ({ guest }: { guest: ExpectedGuest }) => (
        <div className="space-y-4 font-quicksand">
            <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500">Guest Name</Label>
                <p className="text-gray-900">{guest.full_name}</p>
            </div>

            <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500">Check-in Time</Label>
                <p className="text-gray-900">{guest.check_in_time}</p>
            </div>

            <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500">Duration</Label>
                <p className="text-gray-900">{guest.duration}</p>
            </div>

            <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <p className="text-gray-900">{guest.status}</p>
            </div>


        </div>
    );

    if (isLoading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#832131] border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="text-[#832131] font-medium text-xl">Powered by UVISE</p>
            </div>
        )
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header with Profile */}
            <div className="flex justify-end items-center space-x-4">
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <div className="text-right hidden sm:block">
                        <div className="text-base sm:text-lg font-medium">
                            {adminData?.email?.split('@')[0] || 'Admin'}
                        </div>
                        <div className="text-sm sm:text-base text-muted-foreground">Staff account</div>
                    </div>
                    <div className="hidden sm:flex h-10 w-10 rounded-full bg-[#FFC145] overflow-hidden items-center justify-center cursor-pointer">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="relative w-full h-full">
                                <div className="absolute bottom-0 left-1/2 h-2 w-4 -translate-x-1/2 bg-[#4F4F4F] rounded-t-full"></div>
                                <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-0 lg:grid-cols-4">
                {statsConfig.map((stat, index) => (
                    <Card key={index} className="border border-[#E0E0E0] shadow-none stat-box">
                        <CardContent className="p-3 sm:p-4 h-full flex flex-col items-center justify-center">
                            <div className="text-2xl sm:text-3xl lg:text-[4rem] font-bold text-[#832131]">{stat.value}</div>
                            <div className="flex items-center space-x-2 text-[#BDBDBD] text-xs sm:text-sm text-muted-foreground mt-2">
                                <stat.periodIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>{stat.period}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm sm:text-base mt-8">
                                <stat.icon className="h-4 w-4 hidden sm:inline" />
                                <span>{stat.title}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:flex lg:gap-8">
                {/* Visitation History */}
                <Card className="lg:w-[660px]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base sm:text-lg font-medium">
                            Visitation history
                        </CardTitle>
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs sm:text-sm whitespace-nowrap">Guest Name</TableHead>
                                        <TableHead className="text-xs sm:text-sm whitespace-nowrap">Guest ID</TableHead>
                                        <TableHead className="text-xs sm:text-sm whitespace-nowrap">Time</TableHead>
                                        <TableHead className="text-xs sm:text-sm whitespace-nowrap">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visitationHistory.map((visit: Visit) => (
                                        <TableRow key={visit.id}>
                                            <TableCell className="text-xs sm:text-sm font-medium whitespace-nowrap">
                                                {visit.full_name || 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                                                {visit.guest_id || 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                                {visit.visit_time || 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                                {visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="mt-4 flex justify-center">
                            <Button
                                variant="outline"
                                className="bg-[#832131] text-white hover:bg-[#932131] text-sm sm:text-base h-9 sm:h-10"
                                onClick={() => router.push('/admin/logbook')}
                            >
                                Show History
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column */}
                <div className="space-y-4 lg:w-[390px]">
                    {/* Recent Visitation */}
                    <Card className="lg:h-[228px] flex flex-col justify-center">
                        <CardHeader className="flex flex-row items-center space-x-2 align-middle space-y-0 pb-4">
                            <CardTitle className="text-base sm:text-lg font-medium">
                                Recent Visitation
                            </CardTitle>
                            <PanelsTopLeft className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center -space-x-6 justify-center">
                                {recentVisitors.slice(0, 6).map((visitor, index) => (
                                    <motion.div
                                        key={index}
                                        className="flex border-[8px] border-[#FFFFFF] h-[64px] w-[64px] items-center justify-center rounded-full bg-[#EEEEEE] font-[700] text-[32px] text-[#000000]"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        {visitor.full_name.charAt(0).toUpperCase()}
                                    </motion.div>
                                ))}
                                {recentVisitors.length > 6 && (
                                    <motion.div
                                        className="text-sm sm:text-base font-medium text-muted-foreground"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        <span className="ml-6 text-[24px] text-[#000000]">
                                            +{recentVisitors.length - 6}
                                        </span>
                                    </motion.div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notifications */}
                    <Card className="lg:h-[228px]">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg font-medium">
                                <span>Notifications</span>
                                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                            </CardTitle>
                            <div className="text-xs sm:text-sm text-muted-foreground">Today</div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 sm:space-y-3 h-[140px] overflow-y-auto">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => router.push(`/admin/logbook?highlight=${notification.guest_id}`)}
                                        className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                                    >
                                        <div className="flex flex-col items-start">
                                            <p className={`text-sm sm:text-base font-medium text-left truncate max-w-[200px] ${notification.type === 'issue' ? 'text-red-600' : 'text-green-600'
                                                }`}>
                                                {notification.type === 'issue'
                                                    ? `Issue: ${notification.guest.full_name}`
                                                    : `New Guest: ${notification.guest.full_name}`
                                                }
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(notification.created_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Footer />
        </div>
    )
}

export default function Page({
    params,
    searchParams,
}: {
    params: { slug: string }
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const user = {
        name: typeof searchParams.name === 'string' ? searchParams.name : '',
        avatar: typeof searchParams.avatar === 'string' ? searchParams.avatar : undefined
    };

    return <AdminOverviewContent user={user} />;
}