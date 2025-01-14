import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    MoreVertical,
    Mail,
    Phone,
    Trash2,
    UserRound,
    CheckCircle2,
    Clock,
    Send
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MemberCardProps {
    member: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        phone_number: string | null;
        relationship: string;
        invitation_status: 'pending' | 'sent' | 'accepted';
        avatar_url?: string | null;
    };
    onDelete: (id: string) => void;
}

export function MemberCard({ member, onDelete }: MemberCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(member.id);
        } finally {
            setIsDeleting(false);
        }
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    };

    const getStatusColor = (status: 'pending' | 'sent' | 'accepted') => {
        switch (status) {
            case 'accepted':
                return 'text-green-600';
            case 'sent':
                return 'text-blue-600';
            case 'pending':
                return 'text-amber-600';
            default:
                return 'text-gray-600';
        }
    };

    const getStatusIcon = (status: 'pending' | 'sent' | 'accepted') => {
        switch (status) {
            case 'accepted':
                return <CheckCircle2 className="w-4 h-4 text-green-600" />;
            case 'sent':
                return <Send className="w-4 h-4 text-blue-600" />;
            case 'pending':
                return <Clock className="w-4 h-4 text-amber-600" />;
            default:
                return null;
        }
    };

    const getStatusText = (status: 'pending' | 'sent' | 'accepted') => {
        switch (status) {
            case 'accepted':
                return 'Active Member';
            case 'sent':
                return 'Invitation Sent';
            case 'pending':
                return 'Invitation Pending';
            default:
                return 'Unknown Status';
        }
    };

    const capitalizeFirstLetter = (string: string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    return (
        <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar_url || ''} />
                        <AvatarFallback className="bg-[#832131]/10 text-[#832131]">
                            {getInitials(member.first_name, member.last_name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-lg">
                                {member.first_name} {member.last_name}
                            </h3>
                            <span className="text-sm text-gray-500">
                                • {capitalizeFirstLetter(member.relationship)}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                            {getStatusIcon(member.invitation_status)}
                            <span className={getStatusColor(member.invitation_status)}>
                                {getStatusText(member.invitation_status)}
                            </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1 text-gray-600">
                                <Mail className="w-4 h-4" />
                                <span className="text-sm">{member.email}</span>
                            </div>
                            {member.phone_number && (
                                <div className="flex items-center space-x-1 text-gray-600">
                                    <Phone className="w-4 h-4" />
                                    <span className="text-sm">{member.phone_number}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {isDeleting ? 'Removing...' : 'Remove Member'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </Card>
    );
} 