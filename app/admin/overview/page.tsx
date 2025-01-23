"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserRound, UsersRound, UserRoundCheck, UserRoundX, ChevronRight, Bell, ChevronDown, Calendar, ListTodo, PanelsTopLeft, ChartLine, Check, X, User, Clock, Building2 } from "lucide-react"
import Footer from "../components/footer"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { useInView } from "react-intersection-observer"
import { toast } from "react-hot-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Toaster } from "react-hot-toast"
import { ArrowUpRight } from "lucide-react"

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
    block_number: string;
    flat_number: string;
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
    created_at: string;
    description: string;
    guest_id: string;
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

interface IssueGuest {
    id: string;
    guest_id: string;
    full_name: string;
    visit_time: string;
    status: string;
}

interface GuestNotification {
    id: string;
    type: 'issue' | 'new_guest';
    created_at: string;
    guest_id: string;
    description: string | null;
    guest: {
        full_name: string;
        visit_time: string;
        status: string;
    } | null;
}

interface GuestIssueDetails {
    id: string;
    guest_id: string;
    description: string;
    created_at: string;
    guest: {
        full_name: string;
        block_number: string;
        flat_number: string;
        visit_history: Array<{
            visit_date: string;
            visit_time: string;
            status: string;
        }>;
    };
    reported_by: {
        full_name: string;
    };
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

const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
};

// Skeleton components for better loading states
function VisitationHistorySkeleton() {
    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

function RecentVisitationSkeleton() {
    return (
        <Card className="lg:h-[228px]">
            <CardHeader className="pb-4">
                <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-center space-x-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-16 rounded-full" />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

function NotificationsSkeleton() {
    return (
        <Card className="lg:h-[228px]">
            <CardHeader className="pb-2">
                <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-4 w-4" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

// Update the AdminHeaderSkeleton component
function AdminHeaderSkeleton() {
    return (
        <div className="flex justify-end items-center">
            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <Skeleton className="h-6 w-32 mb-1" /> {/* Admin name */}
                    <Skeleton className="h-4 w-24" /> {/* Staff account text */}
                </div>
                <Skeleton className="h-10 w-10 rounded-full" /> {/* Profile picture */}
            </div>
        </div>
    )
}

// Update the fetchNotifications function with explicit typing
const fetchNotifications = async (supabase: any): Promise<GuestNotification[]> => {
    const today = new Date().toISOString().split('T')[0];

    // Only fetch guests with issues
    const { data: issueGuests, error } = await supabase
        .from('guests')
        .select(`
            id,
            guest_id,
            full_name,
            visit_time,
            status
        `)
        .eq('status', 'issue')
        .eq('visit_date', today)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching guests:', error);
        return [];
    }

    // Format as notifications
    return issueGuests.map((guest: IssueGuest) => ({
        id: guest.id,
        type: 'issue' as const,
        created_at: new Date().toISOString(),
        guest_id: guest.guest_id,
        description: 'Guest reported with issue',
        guest: {
            full_name: guest.full_name,
            visit_time: guest.visit_time,
            status: guest.status
        }
    }));
};

// Add this helper function for status badges
const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        case 'checked_in':
            return 'bg-green-100 text-green-800 border border-green-200';
        case 'checked_out':
            return 'bg-gray-100 text-gray-800 border border-gray-200';
        case 'cancelled':
            return 'bg-red-100 text-red-800 border border-red-200';
        default:
            return 'bg-gray-100 text-gray-500 border border-gray-200';
    }
};

function AdminOverviewContent({ user }: AdminOverviewProps) {
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
    const [recentVisitors, setRecentVisitors] = useState<{ full_name: string }[]>([])
    const [guestIssues, setGuestIssues] = useState<GuestIssue[]>([])
    const [notifications, setNotifications] = useState<GuestNotification[]>([])
    const [showIssueDialog, setShowIssueDialog] = useState(false)
    const [selectedIssue, setSelectedIssue] = useState<GuestIssueDetails | null>(null)
    const supabase = createClientComponentClient()
    const router = useRouter()
    const { ref: statsRef, inView: statsInView } = useInView()

    // Memoize stats config to prevent unnecessary re-renders
    const statsConfig = useMemo(() => [
        {
            title: "Expected Guests",
            value: stats.expectedGuests.toString(),
            period: "Today",
            icon: UserRound,
            periodIcon: Calendar,
            color: "text-blue-600",
            description: "Pending visits"
        },
        {
            title: "Active Guests",
            value: stats.pendingVisits.toString(),
            period: "Today",
            icon: UsersRound,
            periodIcon: Calendar,
            description: "Active Guests"
        },
        {
            title: "Completed Visits",
            value: stats.completedVisits.toString(),
            period: "Today",
            icon: UserRoundCheck,
            periodIcon: Calendar,
            description: "Completed Visits"
        },
        {
            title: "Defaulted Visitors",
            value: stats.defaultedVisits.toString(),
            period: "Today",
            icon: UserRoundX,
            periodIcon: Calendar,
            description: "Defaulted Visitors"
        },
    ], [stats])

    // Optimized data fetching
    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/auth/login');
                return;
            }

            // Get URL parameters to check for highlighted guest
            const searchParams = new URLSearchParams(window.location.search);
            const highlightedGuestId = searchParams.get('highlight');

            // Fetch all data in parallel
            const [historyData, statsData, notificationsData] = await Promise.all([
                fetchVisitationHistory(),
                fetchStats(),
                fetchNotifications(supabase)
            ]);

            // Update states with proper error handling
            if (historyData) {
                setVisitationHistory(historyData);
                // If there's a highlighted guest, scroll to their entry
                if (highlightedGuestId) {
                    const element = document.getElementById(`guest-${highlightedGuestId}`);
                    element?.scrollIntoView({ behavior: 'smooth' });
                }
            }

            if (statsData) setStats(statsData);
            if (notificationsData) setNotifications(notificationsData);

        } catch (error) {
            console.error('Error in fetchData:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setIsLoading(false);
        }
    }, [supabase, router]);

    useEffect(() => {
        fetchData();

        // Real-time updates for notifications
        const channel = supabase
            .channel('admin-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications'
            }, (payload) => {
                setNotifications(prev => [payload.new as GuestNotification, ...prev].slice(0, 5));
            })
            .subscribe();

        // Real-time updates for guest status changes
        const guestChannel = supabase
            .channel('guest-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'guests'
            }, () => {
                // Refetch stats when guest status changes
                fetchStats().then(newStats => {
                    if (newStats) setStats(newStats);
                });
            })
            .subscribe();

        // Add real-time subscription for data sync
        const overviewChannel = supabase
            .channel('overview-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'guests'
            }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(guestChannel);
            supabase.removeChannel(overviewChannel);
        };
    }, [fetchData]);

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
            .select('id, full_name, status')
            .eq('visit_date', today)
            .eq('status', 'completed')  // Use 'completed' status
            .order('created_at', { ascending: false })  // Order by created_at instead
            .limit(6);

        if (error) {
            console.error('Error fetching recent visitors:', error);
            return [];
        }

        console.log('Fetched completed visitors:', guests);
        setRecentVisitors(guests || []);
    };

    // Call immediately and when stats change
    useEffect(() => {
        fetchRecentVisitors();
    }, []);

    const fetchStats = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data: guests, error } = await supabase
                .from('guests')
                .select('status')
                .eq('visit_date', today);

            if (error) throw error;

            // Count guests by status
            const stats = {
                expectedGuests: guests?.filter(guest => guest.status === 'pending').length || 0,
                completedVisits: guests?.filter(guest => guest.status === 'completed').length || 0,
                pendingVisits: guests?.filter(guest => guest.status === 'active').length || 0,
                defaultedVisits: guests?.filter(guest => guest.status === 'defaulted').length || 0
            };

            return stats;
        } catch (error) {
            console.error('Error fetching stats:', error);
            toast.error('Failed to load statistics');
            return {
                expectedGuests: 0,
                completedVisits: 0,
                pendingVisits: 0,
                defaultedVisits: 0
            };
        }
    };

    const fetchVisitationHistory = async () => {
        try {
            console.log('Fetching visitation history...');
            const { data, error } = await supabase
                .from('guests')
                .select('*')  // Simplified select
                .order('created_at', { ascending: false })
                .limit(7);

            if (error) {
                console.error('Error fetching history:', error);
                return null;
            }

            console.log('Fetched history data:', data);
            return data;
        } catch (error) {
            console.error('Unexpected error:', error);
            return null;
        }
    };

    const fetchIssueDetails = async (guestId: string) => {
        // First fetch guest and issue details
        const { data: guest, error: guestError } = await supabase
            .from('guests')
            .select(`
                full_name,
                block_number,
                flat_number,
                user_id,
                guest_issues (
                    id,
                    description,
                    created_at
                )
            `)
            .eq('guest_id', guestId)
            .single();

        if (guestError) {
            console.error('Error fetching guest:', guestError);
            return null;
        }

        // Try to find resident in users table first
        let { data: resident } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', guest.user_id)
            .single();

        // If not found in users, check household_members
        if (!resident) {
            const { data: householdMember } = await supabase
                .from('household_members')
                .select('full_name')
                .eq('id', guest.user_id)
                .single();
            resident = householdMember;
        }

        return {
            id: guest.guest_issues[0].id,
            guest_id: guestId,
            description: guest.guest_issues[0].description,
            created_at: guest.guest_issues[0].created_at,
            guest: {
                full_name: guest.full_name,
                block_number: guest.block_number,
                flat_number: guest.flat_number,
                visit_history: []
            },
            reported_by: resident || { full_name: 'Unknown' }
        };
    };

    const handleIssueClick = async (notification: GuestNotification) => {
        console.log('Notification clicked:', notification);

        if (notification.type === 'issue') {
            console.log('Fetching issue details for guest:', notification.guest_id);
            const data = await fetchIssueDetails(notification.guest_id);
            console.log('Fetched issue data:', data);

            if (data) {
                setSelectedIssue(data);
                setShowIssueDialog(true);
            } else {
                toast.error('Failed to load issue details');
            }
        }
    };

    // Visitation History Component
    const VisitationHistory = ({ visits }: { visits: Visit[] }) => (
        <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                <div className="flex items-center gap-2">
                    <ChartLine className="h-5 w-5 text-[#832131]" />
                    <CardTitle className="text-lg font-semibold">Visitation History</CardTitle>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/admin/logbook')}
                    className="hidden sm:flex items-center gap-1 text-[#832131] border-[#832131] hover:bg-[#832131]/5"
                >
                    View All
                    <ArrowUpRight className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                {/* Desktop View */}
                <div className="hidden sm:block">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="text-sm font-medium text-gray-500">Guest</TableHead>
                                <TableHead className="text-sm font-medium text-gray-500">Time</TableHead>
                                <TableHead className="text-sm font-medium text-gray-500">Location</TableHead>
                                <TableHead className="text-sm font-medium text-gray-500">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visits.map((visit, index) => (
                                <motion.tr
                                    key={visit.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group cursor-pointer hover:bg-gray-50"
                                    onClick={() => router.push(`/admin/logbook?highlight=${visit.guest_id}`)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-[#832131]/10 flex items-center justify-center">
                                                <span className="text-sm font-semibold text-[#832131]">
                                                    {visit.full_name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{visit.full_name}</p>
                                                <p className="text-sm text-gray-500">{visit.guest_id}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600">{visit.visit_time}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            <Building2 className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600"> {visit.block_number}, {visit.flat_number}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(visit.status)}`}>
                                            {visit.status === 'completed' ? <Check className="h-3 w-3" /> : null}
                                            {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                                        </span>
                                    </TableCell>
                                </motion.tr>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile View */}
                <div className="sm:hidden">
                    {visits.map((visit, index) => (
                        <motion.div
                            key={visit.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 border-b last:border-b-0"
                            onClick={() => router.push(`/admin/logbook?highlight=${visit.guest_id}`)}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-[#832131]/10 flex items-center justify-center">
                                        <span className="text-sm font-semibold text-[#832131]">
                                            {visit.full_name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{visit.full_name}</p>
                                        <p className="text-sm text-gray-500">{visit.guest_id}</p>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(visit.status)}`}>
                                    {visit.status === 'completed' ? <Check className="h-3 w-3" /> : null}
                                    {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                                </span>
                            </div>
                            <div className="flex flex-col gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">{visit.visit_time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">Block {visit.block_number}, {visit.flat_number}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    <div className="p-4 border-t">
                        <Button
                            variant="outline"
                            className="w-full text-[#832131] border-[#832131] hover:bg-[#832131]/5"
                            onClick={() => router.push('/admin/logbook')}
                        >
                            View All Visits
                            <ArrowUpRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    if (isLoading) {
        return (
            <div className="space-y-6">
                <AdminHeaderSkeleton />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <VisitationHistorySkeleton />
                    </div>
                    <div className="space-y-6">
                        <RecentVisitationSkeleton />
                        <NotificationsSkeleton />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 sm:p-6 max-w-[1600px] mx-auto animate-fadeIn">
            {/* Modern Admin Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-center bg-white rounded-xl p-4 shadow-sm"
            >
                <h1 className="text-2xl font-semibold text-[#832131]">Dashboard Overview</h1>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <div className="text-base sm:text-lg font-medium">
                            {adminData?.email?.split('@')[0] || 'Admin'}
                        </div>
                        <div className="text-sm text-muted-foreground">Staff Account</div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-[#FFC145] overflow-hidden shadow-md">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">
                                    {(adminData?.email?.[0] || 'A').toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid with Glass Morphism */}
            <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statsInView && statsConfig.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="backdrop-blur-sm bg-white/90 border-none shadow-lg hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 rounded-lg bg-[#832131]/10">
                                        <stat.icon className="h-6 w-6 text-[#832131]" />
                                    </div>
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        <stat.periodIcon className="h-4 w-4" />
                                        {stat.period}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-bold text-[#832131]">{stat.value}</h2>
                                    <p className="text-sm text-muted-foreground">{stat.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid with Modern Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visitation History Card */}
                <div className="lg:col-span-2">
                    <VisitationHistory visits={visitationHistory} />
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Recent Completed Visits */}
                    <Card className="shadow-lg">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <Check className="h-5 w-5 text-[#832131]" />
                                    Recent Completed
                                </CardTitle>
                                <span className="text-sm text-muted-foreground">Today</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {recentVisitors.map((visitor, index) => (
                                    <motion.div
                                        key={index}
                                        className="relative group"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-[#832131]/10 flex items-center justify-center
                                                    text-[#832131] font-semibold text-lg group-hover:bg-[#832131] 
                                                    group-hover:text-white transition-all duration-300">
                                            {visitor.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notifications Card */}
                    <Card className="shadow-lg">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-[#832131]" />
                                    Notifications
                                </CardTitle>
                                <span className="text-sm text-muted-foreground">Today</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                                {notifications.length > 0 ? (
                                    notifications.map((notification: GuestNotification) => (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 
                                                     cursor-pointer transition-all duration-300"
                                            onClick={() => handleIssueClick(notification)}
                                        >
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium flex items-center gap-2">
                                                    {notification.type === 'issue' ? (
                                                        <span className="text-red-600 flex items-center gap-1">
                                                            <X className="h-4 w-4" />
                                                            Issue Reported
                                                        </span>
                                                    ) : (
                                                        <span className="text-blue-600 flex items-center gap-1">
                                                            <User className="h-4 w-4" />
                                                            New Guest
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {notification.guest?.full_name} • {notification.guest?.visit_time}
                                                </p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                        <Bell className="h-8 w-8 mb-2 text-gray-300" />
                                        <p className="text-sm">No notifications today</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Footer />

            <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-red-600">
                            Guest Information
                        </DialogTitle>
                        <div className="space-y-1">
                            <p className="text-sm text-gray-500">
                                Guest ID: {selectedIssue?.guest_id}
                            </p>
                            <p className="text-sm font-medium">
                                Name: {selectedIssue?.guest.full_name}
                            </p>
                        </div>
                    </DialogHeader>
                    {selectedIssue && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-medium mb-2">Location</h3>
                                <div className="space-y-1 text-sm">
                                    <p className="text-base"> {selectedIssue.guest.block_number},  {selectedIssue.guest.flat_number}</p>
                                    <p><span className="font-medium">Resident:</span> {selectedIssue.reported_by.full_name}</p>
                                    <p><span className="font-medium">Time:</span> {formatTime(selectedIssue.created_at)}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-medium mb-2">Issue Description</h3>
                                <div className="bg-red-50 p-3 rounded-md text-sm">
                                    {selectedIssue.description}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <Toaster />
        </div>
    )
}

export default function AdminOverviewPage() {
    return <AdminOverviewContent />
}