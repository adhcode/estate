import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Copy,
    Check,
    UserCircle,
    Mail,
    Phone,
    Calendar,
    Clock,
    ArrowUpRight,
    Pencil,
    X
} from "lucide-react"

interface GuestDetailsContentProps {
    guest: {
        guest_id: string
        full_name: string
        email: string
        phone_number: string
        visit_date: string
        visit_time: string
        purpose_of_visit: string
        check_in_time?: string
        check_out_time?: string
        status: string
    }
    onCopyId: (id: string) => void
    onEdit?: (guest: GuestDetailsContentProps['guest']) => void
    onCancel?: (guestId: string) => void
    copiedId?: string | null
}

export function GuestDetailsContent({
    guest,
    onCopyId,
    onEdit,
    onCancel,
    copiedId
}: GuestDetailsContentProps) {
    const formatTime = (timeString: string | undefined) => {
        if (!timeString) return '—'
        return new Date(timeString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Guest ID:</span>
                        <span className="text-sm text-gray-500">{guest.guest_id}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        {guest.status === 'pending' && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit?.(guest)}
                                    className="h-8 w-8 p-0"
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onCancel?.(guest.guest_id)}
                                    className="h-8 w-8 p-0 hover:text-red-500"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCopyId(guest.guest_id)}
                            className="h-8 w-8 p-0"
                        >
                            {copiedId === guest.guest_id ? (
                                <Check className="h-4 w-4 text-green-500" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                        >
                            <ArrowUpRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <Badge
                    variant="outline"
                    className={`
                        ${guest.status === 'completed' ? 'bg-green-500' :
                            guest.status === 'active' ? 'bg-blue-500' :
                                guest.status === 'pending' ? 'bg-yellow-500' :
                                    guest.status === 'cancelled' ? 'bg-red-500' :
                                        'bg-gray-500'} text-white
                    `}
                >
                    {guest.status.charAt(0).toUpperCase() + guest.status.slice(1)}
                </Badge>
            </div>

            <div className="space-y-4">
                <div className="flex items-center space-x-3">
                    <UserCircle className="h-5 w-5 text-gray-500" />
                    <div>
                        <p className="text-sm font-medium">Full Name</p>
                        <p className="text-sm text-gray-500">{guest.full_name}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-gray-500">{guest.email}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <div>
                        <p className="text-sm font-medium">Phone Number</p>
                        <p className="text-sm text-gray-500">{guest.phone_number}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                        <p className="text-sm font-medium">Visit Date</p>
                        <p className="text-sm text-gray-500">
                            {new Date(guest.visit_date).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <div>
                        <p className="text-sm font-medium">Visit Time</p>
                        <p className="text-sm text-gray-500">{guest.visit_time}</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium">Purpose of Visit</p>
                    <p className="text-sm text-gray-500">{guest.purpose_of_visit}</p>
                </div>

                {(guest.check_in_time || guest.check_out_time) && (
                    <div className="space-y-3 pt-2 border-t">
                        {guest.check_in_time && (
                            <div className="flex items-center space-x-3">
                                <Clock className="h-5 w-5 text-gray-500" />
                                <div>
                                    <p className="text-sm font-medium">Check-in Time</p>
                                    <p className="text-sm text-gray-500">
                                        {formatTime(guest.check_in_time)}
                                    </p>
                                </div>
                            </div>
                        )}
                        {guest.check_out_time && (
                            <div className="flex items-center space-x-3">
                                <Clock className="h-5 w-5 text-gray-500" />
                                <div>
                                    <p className="text-sm font-medium">Check-out Time</p>
                                    <p className="text-sm text-gray-500">
                                        {formatTime(guest.check_out_time)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
} 