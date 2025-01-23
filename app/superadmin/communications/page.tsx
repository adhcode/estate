"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Search, Plus, Loader2, Mail, MessageSquare, Send, User, Reply, Inbox } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Message {
    id: string
    title: string
    content: string
    sender_id: string
    sender_type: 'resident' | 'superadmin'
    recipient_id: string
    recipient_type: 'resident' | 'superadmin'
    is_read: boolean
    created_at: string
    sender_resident?: {
        full_name: string
        block_number: string
        flat_number: string
    }
    sender_admin?: {
        name: string
    }
    recipient_resident?: {
        full_name: string
        block_number: string
        flat_number: string
    }
    recipient_admin?: {
        name: string
    }
}

interface Resident {
    id: string
    full_name: string
    block_number: string
    flat_number: string
}

export default function CommunicationsPage() {
    const [activeTab, setActiveTab] = useState("inbox")
    const [messages, setMessages] = useState<Message[]>([])
    const [residents, setResidents] = useState<Resident[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [showNewMessageDialog, setShowNewMessageDialog] = useState(false)
    const [selectedResident, setSelectedResident] = useState<string>("")
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
    const [showReplyDialog, setShowReplyDialog] = useState(false)
    const supabase = createClientComponentClient()

    useEffect(() => {
        fetchMessages()
        fetchResidents()
    }, [activeTab])

    const fetchMessages = async () => {
        setIsLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData?.user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    sender:users(
                        full_name,
                        block_number,
                        flat_number
                    ),
                    recipient:users(
                        full_name,
                        block_number,
                        flat_number
                    )
                `)
                .match(
                    activeTab === 'inbox'
                        ? { recipient_id: userData.user.id }
                        : { sender_id: userData.user.id }
                )
                .order('created_at', { ascending: false })

            if (error) throw error

            // Transform the data to match our expected structure
            const transformedData = data?.map(msg => ({
                ...msg,
                sender_resident: msg.sender,
                recipient_resident: msg.recipient
            })) || []

            setMessages(transformedData)
        } catch (error) {
            console.error('Error fetching messages:', error)
            toast.error('Failed to load messages')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchResidents = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, full_name, block_number, flat_number')
                .order('block_number')
                .order('flat_number')

            if (error) throw error
            setResidents(data || [])
        } catch (error) {
            console.error('Error fetching residents:', error)
            toast.error('Failed to load residents')
        }
    }

    const sendMessage = async (recipient_id: string) => {
        if (!title || !content || !selectedResident) {
            toast.error('Please fill in all fields')
            return
        }

        setIsSubmitting(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData?.user) throw new Error('Not authenticated')

            const { error } = await supabase
                .from('messages')
                .insert({
                    title,
                    content,
                    sender_id: userData.user.id,
                    sender_type: 'superadmin',
                    recipient_id: selectedResident,
                    is_read: false
                })

            if (error) throw error

            toast.success('Message sent successfully')
            setShowNewMessageDialog(false)
            setTitle("")
            setContent("")
            setSelectedResident("")
            fetchMessages()
        } catch (error: any) {
            console.error('Error sending message:', error)
            toast.error(error.message || 'Failed to send message')
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredMessages = messages.filter(msg =>
        msg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.sender_resident?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.recipient_resident?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#8B0000] to-[#6B0000] bg-clip-text text-transparent">
                    Messages
                </h1>
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                    <div className="relative flex-grow md:flex-grow-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                        <Input
                            placeholder="Search messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full md:w-[300px]"
                        />
                    </div>
                    <Button
                        onClick={() => setShowNewMessageDialog(true)}
                        className="bg-[#8B0000] text-white hover:bg-[#6B0000]"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Message
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="inbox" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="inbox" className="flex items-center gap-2">
                        <Inbox className="h-4 w-4" />
                        Inbox
                    </TabsTrigger>
                    <TabsTrigger value="sent" className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Sent
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="inbox" className="mt-4">
                    <MessagesTable
                        messages={messages}
                        isLoading={isLoading}
                        onReply={(message) => {
                            setSelectedMessage(message)
                            setShowReplyDialog(true)
                        }}
                        activeTab={activeTab}
                    />
                </TabsContent>

                <TabsContent value="sent" className="mt-4">
                    <MessagesTable
                        messages={messages}
                        isLoading={isLoading}
                        showReplyButton={false}
                        activeTab={activeTab}
                    />
                </TabsContent>
            </Tabs>

            {/* Reply Dialog */}
            <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Reply to Message</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium">Original Message</h4>
                            <p className="text-sm text-gray-600 mt-1">{selectedMessage?.content}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Re: ${selectedMessage?.title}"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="content">Reply</Label>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Type your reply here..."
                                className="min-h-[200px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            className="bg-[#8B0000] hover:bg-[#6B0000]"
                            onClick={() => {
                                if (selectedMessage) {
                                    sendMessage(selectedMessage.sender_id)
                                    setShowReplyDialog(false)
                                }
                            }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Reply className="h-4 w-4 mr-2" />
                                    Send Reply
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Message Dialog */}
            <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>New Message</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="resident">To</Label>
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                                    <Input
                                        placeholder="Search by name, block, or flat..."
                                        className="pl-10"
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Select value={selectedResident} onValueChange={setSelectedResident}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select resident" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {residents
                                            .filter(resident =>
                                                searchQuery === "" ? true :
                                                    resident.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    resident.block_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    resident.flat_number.toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                            .map((resident) => (
                                                <SelectItem
                                                    key={resident.id}
                                                    value={resident.id}
                                                    className="flex items-center justify-between"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{resident.full_name}</span>
                                                        <span className="text-sm text-gray-500">
                                                            {resident.block_number} • {resident.flat_number}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter message title"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="content">Message</Label>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Type your message here..."
                                className="min-h-[200px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            className="bg-[#8B0000] hover:bg-[#6B0000] w-full sm:w-auto"
                            onClick={() => {
                                if (selectedResident) {
                                    sendMessage(selectedResident)
                                    setShowNewMessageDialog(false)
                                }
                            }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Message
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Separate component for the messages table
function MessagesTable({
    messages,
    isLoading,
    onReply,
    showReplyButton = true,
    activeTab
}: {
    messages: Message[]
    isLoading: boolean
    onReply?: (message: Message) => void
    showReplyButton?: boolean
    activeTab: string
}) {
    return (
        <Card className="overflow-hidden border border-gray-100 shadow-lg rounded-xl">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gradient-to-r from-[#8B0000]/10 to-[#6B0000]/10">
                        <TableHead className="font-semibold text-[#8B0000]">From/To</TableHead>
                        <TableHead className="font-semibold text-[#8B0000]">Title</TableHead>
                        <TableHead className="font-semibold text-[#8B0000] hidden md:table-cell">Message</TableHead>
                        <TableHead className="font-semibold text-[#8B0000]">Status</TableHead>
                        <TableHead className="font-semibold text-[#8B0000]">Date</TableHead>
                        {showReplyButton && <TableHead className="font-semibold text-[#8B0000]">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-[#8B0000]" />
                                    <span className="text-sm text-gray-500">Loading messages...</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : messages.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <MessageSquare className="h-8 w-8 text-gray-400" />
                                    <span className="text-sm text-gray-500">No messages found</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : messages.map((msg) => (
                        <TableRow key={msg.id} className="group hover:bg-[#8B0000]/5 transition-colors duration-200">
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#8B0000]/10 p-2 rounded-full">
                                        <User className="h-4 w-4 text-[#8B0000]" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">
                                            {activeTab === 'sent'
                                                ? msg.recipient_resident?.full_name
                                                : msg.sender_resident?.full_name}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {activeTab === 'sent' ? 'To' : 'From'} •{' '}
                                            <span className="inline-flex items-center gap-1">
                                                <span className="text-[#8B0000]">
                                                    {activeTab === 'sent'
                                                        ? msg.recipient_resident?.block_number
                                                        : msg.sender_resident?.block_number}
                                                </span>
                                                •
                                                <span className="text-[#8B0000]">
                                                    {activeTab === 'sent'
                                                        ? msg.recipient_resident?.flat_number
                                                        : msg.sender_resident?.flat_number}
                                                </span>
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="font-medium">{msg.title}</TableCell>
                            <TableCell className="hidden md:table-cell">
                                <p className="truncate max-w-[300px] text-gray-600">{msg.content}</p>
                            </TableCell>
                            <TableCell>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${msg.is_read
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-blue-50 text-blue-700'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${msg.is_read ? 'bg-green-600' : 'bg-blue-600'
                                        }`}></span>
                                    {msg.is_read ? 'Read' : 'Unread'}
                                </span>
                            </TableCell>
                            <TableCell className="text-gray-600">
                                {format(new Date(msg.created_at), 'MMM d, yyyy')}
                            </TableCell>
                            {showReplyButton && (
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onReply?.(msg)}
                                        className="hover:bg-[#8B0000]/10 text-[#8B0000]"
                                    >
                                        <Reply className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    )
} 