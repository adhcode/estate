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
    Search,
    LogOut,
    ArrowDownRight,
    AlertTriangle,
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
import { motion } from "framer-motion"



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
    notes?: string;
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

const truncateName = (name: string, length: number = 4) => {
    if (!name) return 'N/A';
    return name.length > length ? `${name.slice(0, length)}...` : name;
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
        expected: visits.filter(v => v.status === 'pending').length,
        "Checked In": visits.filter(v => v.status === 'active').length,
        "Checked Out": visits.filter(v => v.status === 'completed').length,
        issue: visits.filter(v => v.status === 'issue').length
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

interface UserMap {
    [key: string]: string;
}

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
                                disabled={
                                    !visitor.check_in_time ||
                                    loadingCheckOut === visitor.guest_id ||
                                    visitor.status === 'cancelled' ||
                                    visitor.status === 'issue'
                                }
                                className={`border-none ${(!visitor.check_in_time || visitor.status === 'cancelled' || visitor.status === 'issue')
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100'
                                    : 'bg-[#832131] text-white hover:bg-[#932131]'
                                    }`}
                            >
                                {loadingCheckOut === visitor.guest_id ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Checking Out...
                                    </>
                                ) : visitor.status === 'issue' ? (
                                    'Issue Pending'
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
                            <p className="font-medium">{visitor.host_name ?? 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    const fetchVisits = async () => {
        setIsLoading(true);
        try {
            // Fetch guests
            const { data: guestsData, error: guestsError } = await supabase
                .from('guests')
                .select('*')
                .order('created_at', { ascending: false });

            if (guestsError) throw guestsError;

            // Fetch household members
            const { data: householdData, error: householdError } = await supabase
                .from('household_members')
                .select('id, first_name, last_name');

            if (householdError) throw householdError;

            // Fetch users
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('id, full_name');

            if (usersError) throw usersError;

            console.log('Guests Data:', guestsData);
            console.log('Household Data:', householdData);
            console.log('Users Data:', usersData);

            const transformedVisits = guestsData.map(guest => {
                const householdMember = householdData.find(h => h.id === guest.registered_by);
                const user = usersData.find(u => u.id === guest.registered_by);

                const hostFullName = householdMember
                    ? `${householdMember.first_name} ${householdMember.last_name}`
                    : user
                        ? user.full_name
                        : 'No Host';

                return {
                    id: guest.id,
                    guest_id: guest.guest_id,
                    primary_resident_id: guest.registered_by || '',
                    host_name: hostFullName,
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
                };
            });

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

            const { error } = await supabase
                .from('guests')
                .update({
                    status: 'active',
                    check_in_time: now.toISOString()
                })
                .eq('guest_id', guestId);

            if (error) throw error;

            // Update local state
            setVisits(prev => prev.map(visit =>
                visit.guest_id === guestId
                    ? { ...visit, status: 'active', check_in_time: now.toISOString() }
                    : visit
            ));

            toast.success(
                <div className="flex flex-col gap-1">
                    <div className="font-medium">✅ Check-In Successful</div>
                    <div className="text-sm">
                        {guest?.full_name} has been checked in
                    </div>
                </div>
            );

        } catch (error: any) {
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
                        Location:  {guest.block_number}, Flat {guest.flat_number}
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
            <div className="flex gap-2 text-sm">
                <span className="px-2 py-1 rounded-lg bg-yellow-100 text-yellow-700">
                    Expected: {counts.expected}
                </span>
                <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700">
                    Checked In: {counts["Checked In"]}
                </span>
                <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700">
                    Checked Out: {counts["Checked Out"]}
                </span>
                <span className="px-2 py-1 rounded-lg bg-red-100 text-red-700">
                    Issue: {counts.issue}
                </span>
            </div>
        )
    }

    const handleResolveIssue = async (guestId: string) => {
        try {
            const { error } = await supabase
                .from('guests')
                .update({
                    status: 'completed'
                })
                .eq('guest_id', guestId);

            if (error) throw error;

            // Update local state
            setVisits(prev => prev.map(visit =>
                visit.guest_id === guestId
                    ? { ...visit, status: 'completed' }
                    : visit
            ));

            toast.success(
                <div className="flex flex-col gap-1">
                    <div className="font-medium">✅ Issue Resolved</div>
                    <div className="text-sm">The issue has been marked as resolved</div>
                </div>
            );

            // Close the modal
            setShowDetailsModal(false);
            setSelectedVisitor(null);

        } catch (error: any) {
            toast.error(
                <div className="flex flex-col gap-1">
                    <div className="font-medium">❌ Failed to resolve issue</div>
                    <div className="text-sm">{error.message}</div>
                </div>
            );
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

    // Mobile card component with check-in/out functionality
    const VisitorCard = ({ visit }: { visit: Visit }) => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg p-4 mb-3 border border-gray-200
                ${visit.guest_id === highlightedId ? 'bg-yellow-50/50' : 'bg-transparent'}`}
        >
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-medium text-gray-900">{visit.full_name}</h3>
                    <p className="text-sm text-gray-500">{visit.guest_id}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyles(visit.status)}`}>
                    {visit.status === 'completed' ? 'Completed' :
                        visit.status === 'active' ? 'Checked In' :
                            visit.status === 'pending' ? 'Expected' : visit.status}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                    <p className="text-gray-500">Host</p>
                    <p className="font-medium">{truncateName(visit.host_name ?? 'N/A', 4)}</p>
                </div>
                <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-medium"> {visit.block_number}, {visit.flat_number}</p>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {visit.check_in_time ? (
                            <div className="flex items-center space-x-2">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatDisplayTime(visit.check_in_time)}
                                    </span>
                                    <span className="text-xs text-gray-500">Checked In</span>
                                </div>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCheckIn(visit.guest_id)}
                                disabled={loadingCheckIn === visit.guest_id || visit.status === 'cancelled'}
                                className={`flex items-center space-x-2 h-9 px-4 rounded-md transition-colors
                                    ${visit.status === 'cancelled'
                                        ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                        : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                                    }`}
                            >
                                {loadingCheckIn === visit.guest_id ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Checking In...</span>
                                    </>
                                ) : (
                                    <>
                                        <ArrowDownRight className="h-4 w-4" />
                                        <span>Check In</span>
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                    {visit.check_out_time && (
                        <div className="flex items-center gap-2">
                            <LogOut className="h-4 w-4 text-gray-400" />
                            <span className="text-red-600">{formatDisplayTime(visit.check_out_time)}</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mt-2">
                    {!visit.check_in_time && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCheckIn(visit.guest_id)}
                            disabled={loadingCheckIn === visit.guest_id || visit.status === 'cancelled'}
                            className="flex-1 border-green-200 text-green-600 hover:bg-green-50"
                        >
                            {loadingCheckIn === visit.guest_id ? (
                                <>
                                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                    Checking In...
                                </>
                            ) : (
                                'Check In'
                            )}
                        </Button>
                    )}

                    {visit.check_in_time && !visit.check_out_time && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCheckOut(visit.guest_id)}
                            disabled={
                                !visit.check_in_time ||
                                loadingCheckOut === visit.guest_id ||
                                visit.status === 'cancelled' ||
                                visit.status === 'issue'
                            }
                            className={`flex-1 border-red-200 text-red-600 hover:bg-red-50 
                                ${(!visit.check_in_time || visit.status === 'cancelled' || visit.status === 'issue')
                                    ? 'opacity-50 cursor-not-allowed'
                                    : ''
                                }`}
                        >
                            {loadingCheckOut === visit.guest_id ? (
                                <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Out...
                                </>
                            ) : visit.status === 'issue' ? (
                                'Issue Pending'
                            ) : (
                                'Check Out'
                            )}
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSelectedVisitor(visit);
                            setShowDetailsModal(true);
                        }}
                        className="text-gray-500 hover:text-[#832131]"
                    >
                        Details
                        <ArrowUpRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );

    // Details Modal Component
    const VisitorDetailsModal = ({ visitor, isOpen, onClose }: {
        visitor: Visit | null;
        isOpen: boolean;
        onClose: () => void;
    }) => {
        if (!visitor) return null;

        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Visitor Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-lg font-semibold text-gray-900">{visitor.full_name}</h3>
                            <p className="text-sm text-gray-500">{visitor.guest_id}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Host</p>
                                <p className="font-medium">{truncateName(visitor.host_name ?? 'N/A', 4)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Location</p>
                                <p className="font-medium"> {visitor.block_number}, {visitor.flat_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Check In</p>
                                <p className="font-medium text-green-600">
                                    {visitor.check_in_time ? formatDisplayTime(visitor.check_in_time) : 'Not checked in'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Check Out</p>
                                <p className="font-medium text-red-600">
                                    {visitor.check_out_time ? formatDisplayTime(visitor.check_out_time) : 'Not checked out'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${getStatusBadgeStyles(visitor.status)}`}>
                                    {visitor.status.charAt(0).toUpperCase() + visitor.status.slice(1)}
                                </span>
                            </div>
                            {visitor.duration && (
                                <div>
                                    <p className="text-sm text-gray-500">Duration</p>
                                    <p className="font-medium">{visitor.duration}</p>
                                </div>
                            )}
                        </div>

                        {visitor.notes && (
                            <div>
                                <p className="text-sm text-gray-500">Notes</p>
                                <p className="mt-1">{visitor.notes}</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="flex gap-2">
                        {visitor.status === 'issue' && (
                            <Button
                                onClick={() => handleResolveIssue(visitor.guest_id)}
                                className="bg-green-600 text-white hover:bg-green-700"
                            >
                                Resolve Issue
                            </Button>
                        )}
                        <Button variant="outline" onClick={onClose}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-semibold text-gray-900">Visitor Logbook</h1>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFilterOpen(true)}
                        className="text-gray-600 border-gray-300"
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                    </Button>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[140px] text-sm">
                            <SelectValue>
                                {filterOptions.find(option => option.id === filterType)?.label}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {filterOptions.map(option => (
                                <SelectItem key={option.id} value={option.id}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Input
                        type="text"
                        placeholder="Search by name, ID, block..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white border-gray-300"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                <div className="flex gap-3">
                    <Select value={selectedBlock} onValueChange={setSelectedBlock}>
                        <SelectTrigger className="w-[140px] bg-white border-gray-300">
                            <SelectValue>
                                {blockOptions.find(option => option.value === selectedBlock)?.label}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {blockOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="hidden sm:block">
                        <DatePickerComponent
                            date={date}
                            setDate={setDate}
                            isDatePickerOpen={isDatePickerOpen}
                            setIsDatePickerOpen={setIsDatePickerOpen}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsDatePickerOpen(true)}
                        className="sm:hidden bg-white border-gray-300"
                    >
                        <CalendarIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Active Filters */}
            <FilterIndicator
                selectedBlock={selectedBlock}
                date={date}
                filterType={filterType}
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(getStatusCounts(filteredVisitors)).map(([key, count]) => (
                    <div
                        key={key}
                        className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
                    >
                        <div className="text-sm text-gray-500 mb-1">
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                        </div>
                        <div className="text-2xl font-semibold">{count}</div>
                    </div>
                ))}
            </div>

            {/* Visitor Table/Cards */}
            {isLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-[#832131]" />
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <table className="w-full border-separate border-spacing-0">
                            <thead className="bg-transparent">
                                <tr className="bg-transparent">
                                    <th className="text-left text-sm font-medium text-gray-600 pb-4 w-[18%] bg-transparent">
                                        Guest
                                    </th>
                                    <th className="text-left text-sm font-medium text-gray-600 pb-4 w-[12%] bg-transparent">
                                        Host
                                    </th>
                                    <th className="text-left text-sm font-medium text-gray-600 pb-4 w-[15%] bg-transparent">
                                        Location
                                    </th>
                                    <th className="text-left text-sm font-medium text-gray-600 pb-4 w-[15%] bg-transparent">
                                        Check In
                                    </th>
                                    <th className="text-left text-sm font-medium text-gray-600 pb-4 w-[15%] bg-transparent">
                                        Check Out
                                    </th>
                                    <th className="text-left text-sm font-medium text-gray-600 pb-4 w-[12%] bg-transparent">
                                        Status
                                    </th>
                                    <th className="text-right text-sm font-medium text-gray-600 pb-4 w-[13%] bg-transparent">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-transparent">
                                {filteredVisitors.map((visitor) => (
                                    <tr
                                        key={visitor.id}
                                        className={`group bg-transparent
                                            ${visitor.guest_id === highlightedId ? 'bg-yellow-50/50' : 'hover:bg-gray-50/50'}`}
                                    >
                                        <td className="py-4 bg-transparent">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">
                                                    {truncateName(visitor.full_name, 4)}
                                                </span>
                                                <span className="text-xs text-gray-500">{visitor.guest_id}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 bg-transparent">
                                            <span className="text-gray-600">
                                                {truncateName(visitor.host_name ?? 'N/A', 4)}
                                            </span>
                                        </td>
                                        <td className="py-4 bg-transparent">
                                            <span className="text-gray-600">
                                                {visitor.block_number}, {visitor.flat_number}
                                            </span>
                                        </td>
                                        <td className="py-4 bg-transparent">
                                            {visitor.check_in_time ? (
                                                <div className="flex items-center space-x-2">
                                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {formatDisplayTime(visitor.check_in_time)}
                                                        </span>
                                                        <span className="text-xs text-gray-500">Checked In</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleCheckIn(visitor.guest_id)}
                                                    disabled={loadingCheckIn === visitor.guest_id || visitor.status === 'cancelled'}
                                                    className={`flex items-center space-x-2 h-9 px-4 rounded-md transition-colors
                                                        ${visitor.status === 'cancelled'
                                                            ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                                            : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                                                        }`}
                                                >
                                                    {loadingCheckIn === visitor.guest_id ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            <span>Checking In...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ArrowDownRight className="h-4 w-4" />
                                                            <span>Check In</span>
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </td>
                                        <td className="py-4 bg-transparent">
                                            {visitor.check_out_time ? (
                                                <div className="flex items-center space-x-2">
                                                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {formatDisplayTime(visitor.check_out_time)}
                                                        </span>
                                                        <span className="text-xs text-gray-500">Checked Out</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleCheckOut(visitor.guest_id)}
                                                    disabled={
                                                        !visitor.check_in_time ||
                                                        loadingCheckOut === visitor.guest_id ||
                                                        visitor.status === 'cancelled' ||
                                                        visitor.status === 'issue'
                                                    }
                                                    className={`flex items-center space-x-2 h-9 px-4 rounded-md transition-colors
                                                        ${(!visitor.check_in_time || visitor.status === 'cancelled' || visitor.status === 'issue')
                                                            ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                                            : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                                        }`}
                                                >
                                                    {loadingCheckOut === visitor.guest_id ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            <span>Checking Out...</span>
                                                        </>
                                                    ) : visitor.status === 'issue' ? (
                                                        <>
                                                            <AlertTriangle className="h-4 w-4" />
                                                            <span>Issue Pending</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ArrowUpRight className="h-4 w-4" />
                                                            <span>Check Out</span>
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </td>
                                        <td className="py-4 bg-transparent">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyles(visitor.status)}`}>
                                                {visitor.status.charAt(0).toUpperCase() + visitor.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right bg-transparent">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedVisitor(visitor);
                                                    setShowDetailsModal(true);
                                                }}
                                                className="text-gray-500 hover:text-[#832131] opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                View
                                                <ArrowUpRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                        {filteredVisitors.map((visitor) => (
                            <VisitorCard key={visitor.id} visit={visitor} />
                        ))}
                    </div>
                </>
            )}

            {/* Details Modal */}
            <VisitorDetailsModal
                visitor={selectedVisitor}
                isOpen={showDetailsModal}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedVisitor(null);
                }}
            />

            {/* Add Toaster component */}
            <Toaster position="top-right" />
        </div>
    )
}

