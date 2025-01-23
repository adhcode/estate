"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
import { Search, Plus, Loader2, MessageSquare, Send, User, Reply, Inbox, ChevronDown } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader } from "@/app/components/Loader"

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
    sender: {
        full_name: string
        block_number: string
        flat_number: string
    }
    recipient: {
        full_name: string
        block_number: string
        flat_number: string
    }
}

export default function ResidentMessagesPage() {
    const router = useRouter()
    const supabase = createClientComponentClient()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("inbox")
    const [messages, setMessages] = useState<Message[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [showNewMessageDialog, setShowNewMessageDialog] = useState(false)
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
    const [showReplyDialog, setShowReplyDialog] = useState(false)

    useEffect(() => {
        const checkAuthorization = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/auth/login')
                    return
                }

                // Check if user is a primary resident
                const { data: userData, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (error || !userData) {
                    toast.error("Access denied. Only primary residents can access messages.")
                    router.push('/resident/dashboard')
                    return
                }

                setIsAuthorized(true)
            } catch (error) {
                console.error('Error checking authorization:', error)
                toast.error("Something went wrong")
                router.push('/resident/dashboard')
            } finally {
                setIsLoading(false)
            }
        }

        checkAuthorization()
    }, [router, supabase])

    useEffect(() => {
        fetchMessages()
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

    const sendMessage = async () => {
        if (!title || !content) {
            toast.error('Please fill in all fields')
            return
        }

        setIsSubmitting(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData?.user) throw new Error('Not authenticated')

            // Get facility admin user ID
            const { data: adminData, error: adminError } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'superadmin')
                .single()

            if (adminError || !adminData) throw new Error('Failed to find facility admin')

            const { error } = await supabase
                .from('messages')
                .insert({
                    title,
                    content,
                    sender_id: userData.user.id,
                    sender_type: 'resident',
                    recipient_id: adminData.id,
                    recipient_type: 'superadmin',
                    is_read: false
                })

            if (error) throw error

            toast.success('Message sent successfully')
            setShowNewMessageDialog(false)
            setTitle("")
            setContent("")
            fetchMessages()
        } catch (error: any) {
            console.error('Error sending message:', error)
            toast.error(error.message || 'Failed to send message')
        } finally {
            setIsSubmitting(false)
        }
    }

    const markAsRead = async (messageId: string) => {
        try {
            const { error } = await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', messageId)

            if (error) throw error
        } catch (error) {
            console.error('Error marking message as read:', error)
        }
    }

    const filteredMessages = messages.filter(msg =>
        msg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (isLoading) {
        return <Loader />
    }

    if (!isAuthorized) {
        return null // This prevents the page content from flashing before redirect
    }

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#8B0000] to-[#6B0000] bg-clip-text text-transparent">
                    Facility Messages
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
                        messages={filteredMessages}
                        isLoading={isLoading}
                        onReply={(message) => {
                            setSelectedMessage(message)
                            setShowReplyDialog(true)
                        }}
                        activeTab={activeTab}
                        onMarkAsRead={markAsRead}
                    />
                </TabsContent>

                <TabsContent value="sent" className="mt-4">
                    <MessagesTable
                        messages={filteredMessages}
                        isLoading={isLoading}
                        showReplyButton={false}
                        activeTab={activeTab}
                        onMarkAsRead={markAsRead}
                    />
                </TabsContent>
            </Tabs>

            {/* New Message Dialog */}
            <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>New Message to Facility Management</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
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
                            onClick={sendMessage}
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
                                placeholder={`Re: ${selectedMessage?.title}`}
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
                                    sendMessage()
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
        </div>
    )
}

function MessagesTable({
    messages,
    isLoading,
    onReply,
    showReplyButton = true,
    activeTab,
    onMarkAsRead
}: {
    messages: Message[]
    isLoading: boolean
    onReply?: (message: Message) => void
    showReplyButton?: boolean
    activeTab: string
    onMarkAsRead: (messageId: string) => void
}) {
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)

    return (
        <div className="space-y-4">
            {isLoading ? (
                <div className="h-32 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-[#8B0000]" />
                        <span className="text-sm text-gray-500">Loading messages...</span>
                    </div>
                </div>
            ) : messages.length === 0 ? (
                <div className="h-32 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <MessageSquare className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-500">No messages found</span>
                    </div>
                </div>
            ) : (
                <div className="grid gap-3">
                    {messages.map((msg) => (
                        <Card
                            key={msg.id}
                            className={`overflow-hidden transition-all duration-200 ${selectedMessageId === msg.id ? 'ring-2 ring-[#8B0000]/20' : ''
                                }`}
                        >
                            <div
                                className="p-4 cursor-pointer hover:bg-gray-50"
                                onClick={() => {
                                    setSelectedMessageId(selectedMessageId === msg.id ? null : msg.id)
                                    if (!msg.is_read) {
                                        onMarkAsRead(msg.id)
                                    }
                                }}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="bg-[#8B0000]/10 p-2 rounded-full shrink-0">
                                            <User className="h-4 w-4 text-[#8B0000]" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900 truncate">
                                                    {activeTab === 'sent' ? 'Facility Management' : 'Facility Management'}
                                                </span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${msg.is_read
                                                    ? 'bg-green-50 text-green-700'
                                                    : 'bg-blue-50 text-blue-700'
                                                    }`}>
                                                    {msg.is_read ? 'Read' : 'New'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <span>{activeTab === 'sent' ? 'To' : 'From'}</span>
                                                <span>•</span>
                                                <span>{format(new Date(msg.created_at), 'MMM d, yyyy')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="shrink-0"
                                    >
                                        <ChevronDown className={`h-4 w-4 transition-transform ${selectedMessageId === msg.id ? 'rotate-180' : ''
                                            }`} />
                                    </Button>
                                </div>
                                <div className="mt-2">
                                    <h3 className="font-medium text-gray-900">{msg.title}</h3>
                                </div>
                            </div>

                            {selectedMessageId === msg.id && (
                                <div className="px-4 pb-4">
                                    <div className="pt-4 border-t">
                                        <p className="text-gray-600 whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                    {showReplyButton && (
                                        <div className="mt-4 flex justify-end">
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => onReply?.(msg)}
                                                className="bg-[#8B0000] hover:bg-[#6B0000]"
                                            >
                                                <Reply className="h-4 w-4 mr-2" />
                                                Reply
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
