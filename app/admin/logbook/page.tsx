"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
    Filter,
    User,
    FileText,
    ArrowUpRight,
    ChevronLeft,
    Home,
    Building2,
    Clock,
    X,
    Mail,
    Phone,
    Calendar as CalendarIcon,
    Eye,
    Loader2,
    ChevronRight,
    ChartLine,
    Check,

} from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label"
import { Toaster } from "sonner"



type Visit = {
    id: string;
    guest_id: string;
    primary_resident_id: string;
    host_name: string | null;
    full_name: string;
    email: string | null;
    phone_number: string | null;
    check_in_time: string | null;
    check_out_time: string | null;
    duration: string | null;
    status: 'pending' | 'active' | 'completed' | 'cancelled' | 'issue';
    created_at: string;
    visit_date: string;
    visit_time: string;
    purpose_of_visit: string | null;
    block_number: string;
    flat_number: string;
    alternatePhone?: string | null;
    resolution_report: string | null;
    resolved_at: string | null;
}

type Resident = {
    id: string;
    full_name: string;
}

type VisitResponse = {
    id: string;
    guest_id: string;
    primary_resident_id: string;
    full_name: string;
    check_in_time: string | null;
    check_out_time: string | null;
    duration: string | null;
    status: 'pending' | 'active' | 'checked_in' | 'checked_out' | 'cancelled' | 'issue' | 'completed';
    created_at: string;
    resident: {
        full_name: string;
    } | null;
}

// Define the type for searchable fields
type SearchableField = keyof Pick<Visit, 'full_name' | 'guest_id' | 'host_name' | 'block_number' | 'flat_number'>;

// Define the searchable fields constant with proper typing
const searchableFields: SearchableField[] = [
    'full_name',
    'guest_id',
    'host_name',
    'block_number',
    'flat_number'
];

const filterVisits = (visits: Visit[], filters: {
    block: string;
    date?: Date;
    search: string;
    status: string;
}) => {
    return visits.filter(visitor => {
        const matchesBlock = filters.block === "all" || visitor.block_number === filters.block;
        const matchesDate = !filters.date ||
            format(new Date(visitor.created_at), "yyyy-MM-dd") === format(filters.date, "yyyy-MM-dd");
        const matchesSearch = !filters.search.trim() ||
            searchableFields.some((field: SearchableField) =>
                visitor[field]?.toLowerCase().includes(filters.search.toLowerCase())
            );
        const matchesStatus = filters.status === "all" || getStatusMatch(visitor.status, filters.status);

        return matchesBlock && matchesDate && matchesSearch && matchesStatus;
    });
};

const getStatusMatch = (visitorStatus: Visit['status'], filterStatus: string) => {
    switch (filterStatus) {
        case 'pending': return visitorStatus === 'pending';
        case 'active': return visitorStatus === 'active';
        case 'completed': return visitorStatus === 'completed';
        default: return true;
    }
};

const getStatusBadgeStyles = (status: string) => {
    switch (status) {
        case 'completed':
            return 'bg-gray-100 text-gray-700 border border-gray-200'
        case 'active':
            return 'bg-green-100 text-green-700 border border-green-200'
        case 'issue':
            return 'bg-red-100 text-red-700 border border-red-200'
        case 'cancelled':
            return 'bg-gray-100 text-gray-500 border border-gray-200'
        default:
            return 'bg-yellow-100 text-yellow-700 border border-yellow-200'
    }
}

const highlightText = (text: string, search: string) => {
    if (!search) return text;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return parts.map((part, i) =>
        part.toLowerCase() === search.toLowerCase() ?
            <span key={i} className="bg-yellow-200">{part}</span> : part
    );
};

type FilterIndicatorProps = {
    selectedBlock: string;
    date: Date | undefined;
    filterType: string;
}

const FilterIndicator = ({ selectedBlock, date, filterType }: FilterIndicatorProps) => {
    const activeFilters = [
        selectedBlock !== 'all' && `Block: ${selectedBlock}`,
        date && `Date: ${format(date, 'PP')}`,
        filterType !== 'all' && `Status: ${filterType}`,
    ].filter(Boolean);

    if (!activeFilters.length) return null;

    return (
        <div className="flex gap-2 mb-4">
            {activeFilters.map((filter, index) => (
                <span key={index} className="px-2 py-1 text-sm bg-gray-100 rounded-full">
                    {filter}
                </span>
            ))}
        </div>
    );
};

const truncateName = (name: string) => {
    if (!name) return '';
    const firstName = name.split(' ')[0];
    if (firstName.length <= 4) {
        return `${firstName}...`;
    }
    return `${firstName.slice(0, 4)}...`;
};

const formatDisplayTime = (timestamp: string | null) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

const getStatusCounts = (visits: Visit[]) => {
    return {
        all: visits.length,
        expected: visits.filter(v => v.status === 'pending').length,
        checked_in: visits.filter(v => v.status === 'active').length,
        checked_out: visits.filter(v => v.status === 'completed').length
    }
}

const MobileVisitorInfo = ({ visitor }: { visitor: Visit }) => (
    <div className="space-y-4">
        <div className="flex gap-3">
            <User className="h-5 w-5 text-gray-500" />
            <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium">{visitor.full_name}</p>
            </div>
        </div>
        <div className="flex gap-3">
            <Building2 className="h-5 w-5 text-gray-500" />
            <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{visitor.block_number}, {visitor.flat_number}</p>
            </div>
        </div>
        <div className="flex gap-3">
            <FileText className="h-5 w-5 text-gray-500" />
            <div>
                <p className="text-sm text-gray-500">Guest ID</p>
                <p className="font-medium">{visitor.guest_id}</p>
            </div>
        </div>
    </div>
);

const MobileDatePicker = ({ date, setDate, isOpen, setIsOpen }: {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}) => (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[500px] bg-white p-0">
            <div className="p-6 pb-0">
                <SheetHeader className="mb-4">
                    <SheetTitle>Select Date</SheetTitle>
                </SheetHeader>
            </div>
            <div className="px-6 flex flex-col items-center">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                        setDate(newDate);
                        setIsOpen(false);
                    }}
                    disabled={{ after: new Date() }}
                    className="rounded-md border-0"
                    classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        head_row: "flex",
                        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                        day_selected: "bg-[#832131] text-white hover:bg-[#932131] hover:text-white focus:bg-[#832131] focus:text-white",
                        day_today: "bg-accent text-accent-foreground",
                        day_outside: "text-muted-foreground opacity-50",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        day_hidden: "invisible",
                    }}
                />
                {date && (
                    <Button
                        variant="outline"
                        onClick={() => {
                            setDate(undefined);
                            setIsOpen(false);
                        }}
                        className="mt-4 w-full"
                    >
                        Clear Date
                    </Button>
                )}
            </div>
        </SheetContent>
    </Sheet>
);

// Desktop Date Picker Component
const DesktopDatePicker = ({ date, setDate }: {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
}) => (
    <Popover>
        <PopoverTrigger asChild>
            <Button
                variant="outline"
                className={`w-[240px] justify-start text-left font-normal ${!date && "text-muted-foreground"}`}
            >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={{ after: new Date() }}
                initialFocus
                className="rounded-md border-0"
                classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    head_row: "flex",
                    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
                    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                    day_range_end: "day-range-end",
                    day_selected: "bg-[#832131] text-white hover:bg-[#932131] hover:text-white focus:bg-[#832131] focus:text-white",
                    day_today: "bg-accent text-accent-foreground",
                    day_outside: "text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    caption: "relative h-10 flex items-center justify-center text-sm font-medium",
                }}
            />
            {date && (
                <div className="p-3 border-t border-border">
                    <Button
                        variant="ghost"
                        className="w-full justify-center text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => setDate(undefined)}
                    >
                        <X className="mr-2 h-4 w-4" />
                        Clear date
                    </Button>
                </div>
            )}
        </PopoverContent>
    </Popover>
);

// Use this component conditionally based on screen size
const DatePickerComponent = ({ date, setDate, isDatePickerOpen, setIsDatePickerOpen }: {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    isDatePickerOpen: boolean;
    setIsDatePickerOpen: (open: boolean) => void;
}) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768); // 768px is typical tablet/mobile breakpoint
        };

        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);

        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    if (isMobile) {
        return (
            <MobileDatePicker
                date={date}
                setDate={setDate}
                isOpen={isDatePickerOpen}
                setIsOpen={setIsDatePickerOpen}
            />
        );
    }

    return <DesktopDatePicker date={date} setDate={setDate} />;
};

export default function VisitorLogbook() {
    const supabase = createClientComponentClient()
    const [isFilterOpen, setIsFilterOpen] = React.useState(false)
    const [filterType, setFilterType] = React.useState("all")
    const [selectedVisitor, setSelectedVisitor] = React.useState<Visit | null>(null)
    const [selectedBlock, setSelectedBlock] = React.useState("all")
    const [showMobileSheet, setShowMobileSheet] = React.useState(false)
    const [showDetailsModal, setShowDetailsModal] = React.useState(false)
    const [date, setDate] = React.useState<Date>()
    const [visits, setVisits] = React.useState<Visit[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [loadingCheckIn, setLoadingCheckIn] = React.useState<string | null>(null)
    const [loadingCheckOut, setLoadingCheckOut] = React.useState<string | null>(null)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false)
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const [showResolveDialog, setShowResolveDialog] = useState(false);
    const [resolutionReport, setResolutionReport] = useState('');
    const [resolvingGuestId, setResolvingGuestId] = useState<string | null>(null);

    useEffect(() => {
        const highlight = searchParams.get('highlight');
        if (highlight) {
            setHighlightedId(highlight);
            // Remove highlight after 2 seconds
            setTimeout(() => {
                setHighlightedId(null);
            }, 2000);
        }
    }, [searchParams]);

    const filterOptions = [
        { id: "all", label: "All Guests" },
        { id: "pending", label: "Expected" },
        { id: "active", label: "Checked In" },
        { id: "completed", label: "Checked Out" },
    ]

    const blockOptions = [
        { value: "all", label: "Blocks" },
        ...Array.from({ length: 41 }, (_, i) => ({
            value: `Block ${i + 1}`,
            label: `Block ${i + 1}`
        }))
    ]

    const filteredVisitors = React.useMemo(() => {
        return visits.filter(visitor => {
            // Block filter
            const matchesBlock = selectedBlock === "all" || visitor.block_number === selectedBlock;

            // Date filter
            const matchesDate = !date ||
                format(new Date(visitor.created_at), "yyyy-MM-dd") === format(date, "yyyy-MM-dd");

            // Status filter
            const matchesStatus = filterType === "all" ||
                (filterType === "pending" && visitor.status === "pending") ||
                (filterType === "active" && visitor.status === "active") ||
                (filterType === "completed" && visitor.status === "completed");

            // Search filter
            const matchesSearch = searchQuery.trim() === "" ||
                visitor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                visitor.guest_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                visitor.host_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                visitor.block_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                visitor.flat_number.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesBlock && matchesDate && matchesStatus && matchesSearch;
        });
    }, [visits, selectedBlock, date, filterType, searchQuery]);

    const MobileVisitorCard = ({ visitor }: { visitor: Visit }) => {
        return (
            <div className={`border-b py-4 ${visitor.guest_id === highlightedId ? 'bg-yellow-100 animate-pulse' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-sm font-medium">
                            <span className="md:hidden">{truncateName(visitor.full_name)}</span>
                            <span className="hidden md:inline">{visitor.full_name}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[#828282] w-20">{visitor.guest_id}</span>
                        <ArrowUpRight
                            className="h-4 w-4 text-[#828282] cursor-pointer hover:text-[#832131] transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVisitor(visitor);
                                setShowDetailsModal(true);
                            }}
                        />
                    </div>
                </div>

                {/* Add check-in/out buttons and status */}
                <div className="flex flex-col gap-3 mt-4">
                    {/* Check-in section */}
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Check In:</span>
                        {visitor.check_in_time ? (
                            <div className="flex flex-col items-end">
                                <span className="text-green-600 font-medium text-[14px]">
                                    {formatDisplayTime(visitor.check_in_time)}
                                </span>
                                <span className="text-[#828282] text-[12px]">Checked In</span>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCheckIn(visitor.guest_id)}
                                disabled={loadingCheckIn === visitor.guest_id || visitor.status === 'cancelled'}
                                className={`border-none ${visitor.status === 'cancelled'
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100'
                                    : 'bg-[#832131] text-white hover:bg-[#932131]'
                                    }`}
                            >
                                {loadingCheckIn === visitor.guest_id ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Checking In...
                                    </>
                                ) : (
                                    'Check In'
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Check-out section */}
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Check Out:</span>
                        {visitor.check_out_time ? (
                            <div className="flex flex-col items-end">
                                <span className="text-red-600 font-medium text-[14px]">
                                    {formatDisplayTime(visitor.check_out_time)}
                                </span>
                                <span className="text-[#828282] text-[12px]">Checked Out</span>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCheckOut(visitor.guest_id)}
                                disabled={!visitor.check_in_time || loadingCheckOut === visitor.guest_id || visitor.status === 'cancelled'}
                                className={`border-none ${!visitor.check_in_time || visitor.status === 'cancelled'
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100'
                                    : 'bg-[#832131] text-white hover:bg-[#932131]'
                                    }`}
                            >
                                {loadingCheckOut === visitor.guest_id ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Checking Out...
                                    </>
                                ) : (
                                    'Check Out'
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Duration and Status */}
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Duration:</span>
                        <span className="text-[14px] text-[#828282]">
                            {visitor.check_out_time ? (
                                visitor.duration
                            ) : visitor.check_in_time ? (
                                'Ongoing'
                            ) : (
                                'Not started'
                            )}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Status:</span>
                        <span className={`
                            px-2.5 py-1 rounded-full text-xs font-medium
                            ${getStatusBadgeStyles(visitor.status)}
                        `}>
                            {visitor.status === 'completed' ? 'Checked Out' :
                                visitor.status === 'active' ? 'Checked In' :
                                    visitor.status === 'pending' ? 'Expected' :
                                        visitor.status}
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    const VisitorDetails = ({ visitor }: { visitor: Visit }) => (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#832131]">Visitor's Profile: {visitor.guest_id}</h3>
                <div className="grid gap-4">
                    <div className="flex gap-3">
                        <User className="h-5 w-5 text-gray-500" />
                        <div>
                            <p className="text-sm text-gray-500">Full Name</p>
                            <p className="font-medium">{visitor.full_name}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <CalendarIcon className="h-5 w-5 text-gray-500" />
                        <div>
                            <p className="text-sm text-gray-500">Date of Visit</p>
                            <p className="font-medium">
                                {format(new Date(visitor.created_at), 'MMMM d, yyyy')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                            <p className="text-sm text-gray-500">Reason for Visit</p>
                            <p className="font-medium">{visitor.purpose_of_visit}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Home className="h-5 w-5 text-gray-500" />
                        <div>
                            <p className="text-sm text-gray-500">Host</p>
                            <p className="font-medium">{visitor.host_name}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    const fetchVisits = async () => {
        try {
            setIsLoading(true);
            console.log('Fetching visits...'); // Debug log

            // First get the guests data
            const { data: guestsData, error: guestsError } = await supabase
                .from('guests')
                .select('*')
                .order('created_at', { ascending: false });

            if (guestsError) throw guestsError;

            if (!guestsData?.length) {
                setVisits([]);
                return;
            }

            // Then get the users data for the host names
            const userIds = guestsData
                .map(guest => guest.user_id)
                .filter(id => id) // Remove null/undefined values
                .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates

            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('id, full_name')
                .in('id', userIds);

            if (usersError) throw usersError;

            // Create a map of user IDs to names for quick lookup
            const userMap = (usersData || []).reduce((acc, user) => {
                acc[user.id] = user.full_name;
                return acc;
            }, {} as Record<string, string>);

            // Transform the data
            const transformedVisits = guestsData.map(guest => ({
                id: guest.id,
                guest_id: guest.guest_id,
                primary_resident_id: guest.user_id || '',
                host_name: userMap[guest.user_id] || 'No Host',
                full_name: guest.full_name || '',
                email: guest.email || null,
                phone_number: guest.phone_number || null,
                check_in_time: guest.check_in_time || null,
                check_out_time: guest.check_out_time || null,
                duration: guest.duration || null,
                status: guest.status || 'pending',
                created_at: guest.created_at || new Date().toISOString(),
                visit_date: guest.visit_date || guest.created_at || new Date().toISOString(),
                visit_time: guest.visit_time || '',
                purpose_of_visit: guest.purpose_of_visit || null,
                block_number: guest.block_number || '',
                flat_number: guest.flat_number || '',
                resolution_report: guest.resolution_report || null,
                resolved_at: guest.resolved_at || null
            }));

            console.log('Transformed visits:', transformedVisits);
            setVisits(transformedVisits);

        } catch (error) {
            console.error('Failed to fetch visits:', error);
            toast.error('Failed to load visits');
            setVisits([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckIn = async (guestId: string) => {
        setLoadingCheckIn(guestId);
        try {
            const now = new Date();
            const guest = visits.find(v => v.guest_id === guestId);

            if (!guest) {
                throw new Error('Guest not found');
            }

            // Update the guest record
            const { data, error } = await supabase
                .from('guests')
                .update({
                    status: 'active',
                    check_in_time: now.toISOString()
                })
                .eq('guest_id', guestId)
                .select()
                .single();

            if (error) {
                console.error('Check-in error:', error);
                throw error;
            }

            // Update local state
            setVisits(prev => prev.map(visit =>
                visit.guest_id === guestId
                    ? {
                        ...visit,
                        status: 'active',
                        check_in_time: now.toISOString()
                    }
                    : visit
            ));

            // Format time for toast message
            const formattedTime = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            toast.success(
                <div className="flex flex-col gap-1">
                    <div className="font-medium">✅ Check-In Successful</div>
                    <div className="text-sm">
                        You have checked in <span className="font-semibold">{guest.full_name}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                        Location: Block {guest.block_number}, Flat {guest.flat_number}
                    </div>
                    <div className="text-sm text-gray-500">
                        Time: {formattedTime}
                    </div>
                </div>
            );

        } catch (error: any) {
            console.error('Check-in failed:', error);
            toast.error(
                <div className="flex flex-col gap-1">
                    <div className="font-medium">❌ Check-In Failed</div>
                    <div className="text-sm">{error.message}</div>
                </div>
            );
        } finally {
            setLoadingCheckIn(null);
        }
    };

    const handleCheckOut = async (guestId: string) => {
        setLoadingCheckOut(guestId);
        try {
            const now = new Date();
            const guest = visits.find(v => v.guest_id === guestId);

            if (!guest?.check_in_time) {
                throw new Error('No check-in time found');
            }

            // Calculate duration
            const checkInTime = new Date(guest.check_in_time);
            const durationMs = now.getTime() - checkInTime.getTime();
            const hours = Math.floor(durationMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            const duration = `${hours}h ${minutes}m`;

            // Update database
            const { error } = await supabase
                .from('guests')
                .update({
                    status: 'completed',
                    check_out_time: now.toISOString(),
                    duration: duration
                })
                .eq('guest_id', guestId);

            if (error) throw error;

            // Update local state
            setVisits(prev => prev.map(visit =>
                visit.guest_id === guestId
                    ? {
                        ...visit,
                        status: 'completed',
                        check_out_time: now.toISOString(),
                        duration: duration
                    }
                    : visit
            ));

            // Format time for toast message
            const formattedTime = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            toast.success(
                <div className="flex flex-col gap-1">
                    <div className="font-medium">✅ Check-Out Successful</div>
                    <div className="text-sm">
                        You have checked out <span className="font-semibold">{guest.full_name}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                        Location: Block {guest.block_number}, Flat {guest.flat_number}
                    </div>
                    <div className="text-sm text-gray-500">
                        Time: {formattedTime}
                    </div>
                    <div className="text-sm text-gray-500">
                        Visit Duration: {duration}
                    </div>
                </div>
            );

        } catch (error: any) {
            console.error('Check-out failed:', error);
            toast.error(
                <div className="flex flex-col gap-1">
                    <div className="font-medium">❌ Check-Out Failed</div>
                    <div className="text-sm">{error.message}</div>
                </div>
            );
        } finally {
            setLoadingCheckOut(null);
        }
    };

    React.useEffect(() => {
        fetchVisits()
    }, [])

    React.useEffect(() => {
        // Log the initial state
        console.log('Initial visits:', visits)
        console.log('Supabase client initialized:', !!supabase)
    }, [])

    console.log('Current search query:', searchQuery);
    console.log('Total visits:', visits.length);
    console.log('Filtered visits:', filteredVisitors.length);

    const StatusSummary = () => {
        const counts = getStatusCounts(visits)

        return (
            <div className="flex gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span>Expected: {counts.expected}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Checked In: {counts.checked_in}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    <span>Checked Out: {counts.checked_out}</span>
                </div>
            </div>
        )
    }

    const handleResolveIssue = async (guestId: string) => {
        setResolvingGuestId(guestId);
        setShowResolveDialog(true);
    };

    const handleResolutionSubmit = async () => {
        try {
            if (!resolvingGuestId || !resolutionReport.trim()) {
                toast.error('Please write a report before resolving');
                return;
            }

            // First update the guest status to 'active'
            const { error: guestError } = await supabase
                .from('guests')
                .update({
                    status: 'active'  // Changed from 'completed' to 'active'
                })
                .eq('guest_id', resolvingGuestId);

            if (guestError) throw guestError;

            // Then update the guest_issues table
            const { error: issueError } = await supabase
                .from('guest_issues')
                .update({
                    status: 'resolved',
                    resolution_report: resolutionReport,
                    resolved_at: new Date().toISOString()
                })
                .eq('guest_id', resolvingGuestId);

            if (issueError) throw issueError;

            // Update local state to 'active'
            setVisits(prevVisits => prevVisits.map(visit =>
                visit.guest_id === resolvingGuestId
                    ? { ...visit, status: 'active' }  // Changed from 'completed' to 'active'
                    : visit
            ));

            toast.success('Issue resolved successfully');
            setShowResolveDialog(false);
            setResolutionReport('');
            setResolvingGuestId(null);

        } catch (error: any) {
            toast.error(`Failed to resolve issue: ${error.message}`);
        }
    };

    const renderResolveButton = (visit: Visit) => {
        if (visit.status === 'completed' || visit.resolved_at) {
            return (
                <span className="text-green-600 text-sm flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    Resolved
                </span>
            );
        }

        return (
            <Button
                variant="outline"
                size="sm"
                onClick={() => handleResolveIssue(visit.guest_id)}
                className="bg-yellow-500 text-white hover:bg-yellow-600 border-none w-[114px]"
            >
                Resolve Issue
            </Button>
        );
    };

    return (
        <div className="min-h-screen bg-[#FBFBFB]">
            {isLoading ? (
                <div className="flex items-center justify-center h-screen bg-[#FBFBFB]">
                    <p>Loading...</p>
                </div>
            ) : visits.length === 0 ? (
                <div className="flex items-center justify-center h-screen bg-[#FBFBFB]">
                    <p>No visits found</p>
                </div>
            ) : (
                <>
                    {/* Mobile View */}
                    <div className="block md:hidden">
                        {/* Search */}
                        <div className="p-4 bg-white sticky top-0 z-10 border-b">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search..."
                                    className="rounded-r-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Button className="rounded-l-none bg-[#832131] hover:bg-[#932131] text-white">
                                    Search
                                </Button>
                            </div>
                        </div>

                        {/* Filter Options */}
                        <div className="px-4 pb-2">
                            <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-hide">
                                <Select value={selectedBlock} onValueChange={setSelectedBlock}>
                                    <SelectTrigger className="min-w-[120px] text-sm bg-white border-input hover:bg-gray-50 transition-colors">
                                        <SelectValue placeholder="Block" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px] bg-white">
                                        {blockOptions.map(option => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                                className="cursor-pointer hover:bg-gray-50 transition-colors"
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="min-w-[120px] h-[40px] justify-start text-left font-normal bg-white hover:bg-gray-50 transition-colors flex items-center px-3"
                                    onClick={() => setIsDatePickerOpen(true)}
                                >
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    <span className="text-[14px] truncate">
                                        {date ? format(date, "MMM dd, yyyy") : "Select Date"}
                                    </span>
                                </Button>

                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="min-w-[120px] h-[40px] justify-start text-left font-normal bg-white hover:bg-gray-50 transition-colors flex items-center px-3"
                                        >
                                            <Filter className="h-4 w-4 mr-2" />
                                            <span className="text-[14px]">
                                                {filterOptions.find(opt => opt.id === filterType)?.label || "Filter"}
                                            </span>
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent
                                        side="bottom"
                                        className="h-[40vh] bg-white border-t-2 motion-safe:animate-slide-up"
                                    >
                                        <SheetHeader className="mb-4">
                                            <SheetTitle>Filter Visitors</SheetTitle>
                                        </SheetHeader>
                                        <div className="space-y-4 bg-white">
                                            {filterOptions.map((option) => (
                                                <div
                                                    key={option.id}
                                                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${filterType === option.id
                                                        ? 'bg-[#832131] text-white border-[#832131]'
                                                        : 'bg-white hover:bg-gray-50'
                                                        }`}
                                                    onClick={() => {
                                                        setFilterType(option.id)
                                                    }}
                                                >
                                                    <div className="font-medium">{option.label}</div>
                                                    <div className="text-sm opacity-80">
                                                        {option.id === 'all' && 'View all visitors'}
                                                        {option.id === 'pending' && 'Visitors not checked in'}
                                                        {option.id === 'active' && 'Currently checked in visitors'}
                                                        {option.id === 'completed' && 'Completed visits'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>

                            {/* Active Filters Display */}
                            {(filterType !== 'all' || selectedBlock !== 'all' || date) && (
                                <div className="flex flex-wrap gap-2 mt-3 pb-2">
                                    {filterType !== 'all' && (
                                        <div className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                            <span>{filterOptions.find(opt => opt.id === filterType)?.label}</span>
                                            <X
                                                className="h-3 w-3 cursor-pointer"
                                                onClick={() => setFilterType('all')}
                                            />
                                        </div>
                                    )}
                                    {selectedBlock !== 'all' && (
                                        <div className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                            <span>{selectedBlock}</span>
                                            <X
                                                className="h-3 w-3 cursor-pointer"
                                                onClick={() => setSelectedBlock('all')}
                                            />
                                        </div>
                                    )}
                                    {date && (
                                        <div className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                            <span>{format(date, "MMM dd, yyyy")}</span>
                                            <X
                                                className="h-3 w-3 cursor-pointer"
                                                onClick={() => setDate(undefined)}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Visitation History */}
                        <div className="px-4 pb-20">
                            <div className="py-10">
                                <div className="flex items-center gap-2">
                                    <ChartLine className="h-5 w-5 text-[#404040]" />
                                    <h2 className="text-[20px] font-medium text-[#404040]">
                                        Visitation History
                                    </h2>
                                </div>
                            </div>
                            <div className="flex border-b pb-2">
                                <div className="flex items-center gap-2 flex-1">
                                    <User className="h-4 w-4 text-[#404040]" />
                                    <span className="text-sm text-[#404040]">Guest Name</span>
                                </div>
                                <div className="flex items-center gap-2 w-24">
                                    <FileText className="h-4 w-4 text-[#404040]" />
                                    <span className="text-sm text-[#404040]">ID</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {filteredVisitors.map((visitor, index) => (
                                    <MobileVisitorCard
                                        key={index}
                                        visitor={visitor}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Fixed Bottom Navigation */}
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">1/22</span>
                            <Button className="bg-[#832131] hover:bg-[#932131] text-white">
                                Next
                            </Button>
                        </div>

                        {/* Mobile Sheet */}
                        <Sheet open={showMobileSheet} onOpenChange={setShowMobileSheet}>
                            <SheetContent className="w-full sm:max-w-md">
                                <SheetHeader>
                                    <SheetTitle>Visitor Information</SheetTitle>
                                </SheetHeader>
                                {selectedVisitor && (
                                    <>
                                        <div className="py-6">
                                            <MobileVisitorInfo visitor={selectedVisitor} />
                                        </div>
                                        <SheetFooter>
                                            <Button
                                                className="w-full bg-[#832131] hover:bg-[#932131]"
                                                onClick={() => {
                                                    setShowDetailsModal(true)
                                                    setShowMobileSheet(false)
                                                }}
                                            >
                                                View Details
                                            </Button>
                                        </SheetFooter>
                                    </>
                                )}
                            </SheetContent>
                        </Sheet>

                        {/* Mobile Details Modal */}
                        <Sheet open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                            <SheetContent
                                side="bottom"
                                className="h-[80vh] bg-white border-t-2 motion-safe:animate-slide-up"
                            >
                                <SheetHeader className="mb-4">
                                    <SheetTitle className="text-[#404040]">Visitor Details</SheetTitle>
                                </SheetHeader>
                                {selectedVisitor && (
                                    <div className="space-y-6 bg-white overflow-y-auto">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-[#832131]">
                                                Visitor's Profile: {selectedVisitor.guest_id}
                                            </h3>
                                            <div className="grid gap-4">
                                                <div className="flex gap-3">
                                                    <User className="h-5 w-5 text-gray-500" />
                                                    <div>
                                                        <p className="text-sm text-gray-500">Full Name</p>
                                                        <p className="font-medium">{selectedVisitor.full_name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <CalendarIcon className="h-5 w-5 text-gray-500" />
                                                    <div>
                                                        <p className="text-sm text-gray-500">Date of Visit</p>
                                                        <p className="font-medium">
                                                            {format(new Date(selectedVisitor.created_at), 'MMMM d, yyyy')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <FileText className="h-5 w-5 text-gray-500" />
                                                    <div>
                                                        <p className="text-sm text-gray-500">Reason for Visit</p>
                                                        <p className="font-medium">{selectedVisitor.purpose_of_visit}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <Home className="h-5 w-5 text-gray-500" />
                                                    <div>
                                                        <p className="text-sm text-gray-500">Host</p>
                                                        <p className="font-medium">{selectedVisitor.host_name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <Building2 className="h-5 w-5 text-gray-500" />
                                                    <div>
                                                        <p className="text-sm text-gray-500">Block & Flat</p>
                                                        <p className="font-medium">
                                                            {selectedVisitor.block_number}, {selectedVisitor.flat_number}
                                                        </p>
                                                    </div>
                                                </div>
                                                {selectedVisitor.check_in_time && (
                                                    <div className="flex gap-3">
                                                        <Clock className="h-5 w-5 text-gray-500" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Check In Time</p>
                                                            <p className="font-medium">
                                                                {formatDisplayTime(selectedVisitor.check_in_time)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedVisitor.check_out_time && (
                                                    <div className="flex gap-3">
                                                        <Clock className="h-5 w-5 text-gray-500" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Check Out Time</p>
                                                            <p className="font-medium">
                                                                {formatDisplayTime(selectedVisitor.check_out_time)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedVisitor.duration && (
                                                    <div className="flex gap-3">
                                                        <Clock className="h-5 w-5 text-gray-500" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Duration</p>
                                                            <p className="font-medium">{selectedVisitor.duration}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </SheetContent>
                        </Sheet>

                        {/* Mobile Date Picker */}
                        <MobileDatePicker
                            date={date}
                            setDate={setDate}
                            isOpen={isDatePickerOpen}
                            setIsOpen={setIsDatePickerOpen}
                        />
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <div className="px-6">
                            <div className="py-10">
                                <div className="flex items-center gap-2">
                                    <ChartLine className="h-5 w-5 text-[#404040]" />
                                    <h2 className="text-[20px] font-medium text-[#404040]">
                                        Visitation History
                                    </h2>
                                </div>
                            </div>
                            {/* Search and Filters */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex-1 max-w-md">
                                    <div className="flex">
                                        <Input
                                            placeholder="Search..."
                                            className="rounded-r-none"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <Button className="rounded-l-none bg-[#832131] hover:bg-[#932131] text-white">
                                            Search
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Select value={selectedBlock} onValueChange={setSelectedBlock}>
                                        <SelectTrigger className="w-[120px] bg-white border-input hover:bg-gray-50 transition-colors">
                                            <SelectValue placeholder="Select Block" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px] bg-white">
                                            {blockOptions.map(option => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-[120px] h-[40px] justify-start text-left font-normal bg-white hover:bg-gray-50 transition-colors flex items-center px-3"
                                        onClick={() => setIsDatePickerOpen(true)}
                                    >
                                        <CalendarIcon className="h-4 w-4 mr-2" />
                                        <span className="text-[14px]">
                                            {date ? format(date, "MMM dd, yyyy") : "Today"}
                                        </span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                        className="w-[120px] h-[40px] justify-start text-left font-normal bg-white hover:bg-gray-50 transition-colors flex items-center px-3"
                                    >
                                        <Filter className="h-4 w-4 mr-2" />
                                        <span className="text-[14px]">Filter</span>
                                    </Button>
                                </div>
                            </div>

                            {/* Filter Options */}
                            {isFilterOpen && (
                                <div className="bg-[#FBFBFB] p-4 rounded-md shadow-md mb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Filter className="h-4 w-4" />
                                        <span className="text-base font-medium">FILTER</span>
                                    </div>
                                    <div className="flex gap-4">
                                        {filterOptions.map((option) => (
                                            <label
                                                key={option.id}
                                                className="flex items-center space-x-2 cursor-pointer"
                                            >
                                                <Checkbox
                                                    id={option.id}
                                                    checked={filterType === option.id}
                                                    onCheckedChange={() => setFilterType(option.id)}
                                                />
                                                <span className="text-sm font-medium">
                                                    {option.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Visitation History Table */}
                            <Table className="bg-transparent [&_tr]:border-0">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-[14px] text-[#404040] whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-[#404040]" />
                                                Guest Name
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-[14px] text-[#404040] whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-[#404040]" />
                                                Host
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-[14px] text-[#404040] whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-[#404040]" />
                                                ID
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-[14px] text-[#404040] whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-[#404040]" />
                                                Block
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-[14px] text-[#404040] whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Home className="h-4 w-4 text-[#404040]" />
                                                Flat
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-[14px] text-[#404040] whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-[#404040]" />
                                                Check In
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-[14px] text-[#404040] whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-[#404040]" />
                                                Check Out
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-[14px] text-[#404040] whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-[#404040]" />
                                                Duration
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-[14px] text-[#404040] whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-[#404040]" />
                                                Status
                                            </div>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="bg-transparent">
                                    {filteredVisitors.map((visit) => (
                                        <TableRow
                                            key={visit.id}
                                            className={`
                                                transition-all duration-200 hover:bg-gray-50
                                                ${visit.status === 'completed' ? 'bg-gray-50/50' :  // Changed from 'checked_out'
                                                    visit.status === 'active' ? 'bg-green-50/50' : ''  // Changed from 'checked_in'
                                                }
                                                ${visit.guest_id === highlightedId ? 'bg-yellow-100 animate-pulse' : ''}
                                                h-20 border-0
                                            `}
                                        >
                                            <TableCell
                                                onClick={() => {
                                                    setSelectedVisitor(visit);
                                                    setShowMobileSheet(true);
                                                }}
                                                className="cursor-pointer hover:text-[#832131] transition-colors"
                                            >
                                                <span className="font-medium text-[#333333] text-[14px]">
                                                    {truncateName(visit.full_name)}
                                                </span>
                                            </TableCell>
                                            <TableCell
                                                onClick={() => {
                                                    setSelectedVisitor(visit);
                                                    setShowDetailsModal(true);
                                                }}
                                                className="cursor-pointer hover:text-[#832131] transition-colors"
                                            >
                                                <span className="text-[#828282] text-[14px]">
                                                    {truncateName(visit.host_name || '')}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-[#828282] text-[14px]">
                                                {visit.guest_id}
                                            </TableCell>
                                            <TableCell className="text-[#828282] text-[14px]">
                                                {visit.block_number}
                                            </TableCell>
                                            <TableCell className="text-[#828282] text-[14px]">
                                                {visit.flat_number}
                                            </TableCell>
                                            <TableCell>
                                                {visit.check_in_time ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-green-600 font-medium text-[14px]">
                                                            {formatDisplayTime(visit.check_in_time)}
                                                        </span>
                                                        <span className="text-[#828282] text-[14px]">Checked In</span>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            console.log('Check-in button clicked for:', visit.guest_id)
                                                            handleCheckIn(visit.guest_id)
                                                        }}
                                                        disabled={loadingCheckIn === visit.guest_id || visit.status === 'cancelled'}
                                                        className={`border-none ${visit.status === 'cancelled'
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100'
                                                            : 'bg-[#832131] text-white hover:bg-[#932131]'
                                                            }`}
                                                    >
                                                        {loadingCheckIn === visit.guest_id ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                Checking In...
                                                            </>
                                                        ) : (
                                                            'Check In'
                                                        )}
                                                    </Button>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {visit.status === 'issue' ? (
                                                    <div className="flex flex-col gap-2">
                                                        {renderResolveButton(visit)}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={true}
                                                            className="bg-gray-200 text-gray-400 cursor-not-allowed hover:bg-gray-200 border-none"
                                                        >
                                                            Check Out
                                                        </Button>
                                                    </div>
                                                ) : visit.check_out_time ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-red-600 font-medium text-[14px]">
                                                            {formatDisplayTime(visit.check_out_time)}
                                                        </span>
                                                        <span className="text-[#828282] text-[14px]">Checked Out</span>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCheckOut(visit.guest_id)}
                                                        disabled={
                                                            !visit.check_in_time ||
                                                            loadingCheckOut === visit.guest_id ||
                                                            visit.status === 'issue' as Visit['status'] ||
                                                            visit.status === 'cancelled'
                                                        }
                                                        className={`border-none ${!visit.check_in_time || visit.status === 'issue' as Visit['status'] || visit.status === 'cancelled'
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100'
                                                            : 'bg-[#832131] text-white hover:bg-[#932131]'
                                                            }`}
                                                    >
                                                        {loadingCheckOut === visit.guest_id ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                Checking Out...
                                                            </>
                                                        ) : (
                                                            'Check Out'
                                                        )}
                                                    </Button>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-[#828282] text-[14px]">
                                                {visit.check_out_time ? (
                                                    <span className="font-medium text-[14px]">{visit.duration}</span>
                                                ) : visit.check_in_time ? (
                                                    <span className="font-medium text-[14px]">Ongoing</span>
                                                ) : (
                                                    <span className="font-medium text-[14px]">Not started</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`
                                                    px-2.5 py-1 rounded-full text-xs font-medium
                                                    ${getStatusBadgeStyles(visit.status)}
                                                `}>
                                                    {visit.status === 'completed' ? 'Completed' :
                                                        visit.status === 'active' ? 'Checked In' :
                                                            visit.status === 'pending' ? 'Expected' :
                                                                visit.status === 'cancelled' ? 'Cancelled' :
                                                                    visit.status === 'issue' ? 'Issue' : 'Pending'}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Desktop Details Modal */}
                            <Sheet open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                                <SheetContent
                                    side="bottom"
                                    className="h-[80vh] bg-white border-t-2 motion-safe:animate-slide-up"
                                >
                                    <SheetHeader className="mb-4">
                                        <SheetTitle className="text-[#404040]">Visitor Details</SheetTitle>
                                    </SheetHeader>
                                    {selectedVisitor && (
                                        <div className="space-y-6 bg-white overflow-y-auto">
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-semibold text-[#832131]">
                                                    Visitor's Profile: {selectedVisitor.guest_id}
                                                </h3>
                                                <div className="grid gap-4">
                                                    <div className="flex gap-3">
                                                        <User className="h-5 w-5 text-gray-500" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Full Name</p>
                                                            <p className="font-medium">{selectedVisitor.full_name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <CalendarIcon className="h-5 w-5 text-gray-500" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Date of Visit</p>
                                                            <p className="font-medium">
                                                                {format(new Date(selectedVisitor.created_at), 'MMMM d, yyyy')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <FileText className="h-5 w-5 text-gray-500" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Reason for Visit</p>
                                                            <p className="font-medium">{selectedVisitor.purpose_of_visit}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <Home className="h-5 w-5 text-gray-500" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Host</p>
                                                            <p className="font-medium">{selectedVisitor.host_name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <Building2 className="h-5 w-5 text-gray-500" />
                                                        <div>
                                                            <p className="text-sm text-gray-500">Block & Flat</p>
                                                            <p className="font-medium">
                                                                {selectedVisitor.block_number}, {selectedVisitor.flat_number}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {selectedVisitor.check_in_time && (
                                                        <div className="flex gap-3">
                                                            <Clock className="h-5 w-5 text-gray-500" />
                                                            <div>
                                                                <p className="text-sm text-gray-500">Check In Time</p>
                                                                <p className="font-medium">
                                                                    {formatDisplayTime(selectedVisitor.check_in_time)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {selectedVisitor.check_out_time && (
                                                        <div className="flex gap-3">
                                                            <Clock className="h-5 w-5 text-gray-500" />
                                                            <div>
                                                                <p className="text-sm text-gray-500">Check Out Time</p>
                                                                <p className="font-medium">
                                                                    {formatDisplayTime(selectedVisitor.check_out_time)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {selectedVisitor.duration && (
                                                        <div className="flex gap-3">
                                                            <Clock className="h-5 w-5 text-gray-500" />
                                                            <div>
                                                                <p className="text-sm text-gray-500">Duration</p>
                                                                <p className="font-medium">{selectedVisitor.duration}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </SheetContent>
                            </Sheet>

                            {/* Pagination */}
                            <div className="flex justify-between items-center mt-6">
                                <span className="text-sm text-muted-foreground">1/23</span>
                                <Button className="bg-[#832131] hover:bg-[#932131] text-white">
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}
            <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
                <DialogContent className="sm:max-w-[600px] bg-white p-0 gap-0">
                    {/* Header Section */}
                    <div className="px-8 py-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-semibold text-[#832131]">
                                Issue Resolution Report
                            </DialogTitle>
                            <p className="text-gray-500 mt-2">
                                Document the steps taken to resolve this guest issue
                            </p>
                        </DialogHeader>
                    </div>

                    {/* Content Section */}
                    <div className="px-8 py-6">
                        {/* Guest Info Card */}
                        <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-100">
                            <h3 className="text-sm font-medium text-gray-500 mb-3">ISSUE DETAILS</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-500">Guest Name</p>
                                    <p className="font-medium">
                                        {visits.find(v => v.guest_id === resolvingGuestId)?.full_name}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-500">Guest ID</p>
                                    <p className="font-medium">{resolvingGuestId}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-500">Report Date</p>
                                    <p className="font-medium">
                                        {new Date().toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-500">Report Time</p>
                                    <p className="font-medium">
                                        {new Date().toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Report Input Section */}
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-500">
                                    RESOLUTION REPORT
                                </Label>
                                <p className="text-sm text-gray-500 mt-1">
                                    Please provide a detailed description of how the issue was resolved
                                </p>
                            </div>
                            <Textarea
                                placeholder="Enter your report here..."
                                value={resolutionReport}
                                onChange={(e) => setResolutionReport(e.target.value)}
                                className="min-h-[180px] resize-none border border-gray-200 rounded-xl
                                         focus:ring-0 focus:border-[#832131] text-base outline-none
                                         focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                        </div>
                    </div>

                    {/* Footer Section */}
                    <div className="bg-gray-50 px-8 py-5 border-t border-gray-100">
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowResolveDialog(false);
                                    setResolutionReport('');
                                    setResolvingGuestId(null);
                                }}
                                className="border-gray-300 hover:bg-white/50 text-gray-600 font-medium"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleResolutionSubmit}
                                disabled={!resolutionReport.trim()}
                                className="bg-[#832131] hover:bg-[#932131] text-white px-8 py-2 h-10
                                         font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                {resolutionReport.trim() ? (
                                    <>
                                        <FileText className="h-4 w-4" />
                                        Submit Report
                                    </>
                                ) : (
                                    'Write Report to Submit'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <Toaster />
        </div>
    )
}

