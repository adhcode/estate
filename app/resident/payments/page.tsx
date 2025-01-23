"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { CreditCard, Search, Plus, Loader2, Receipt, History, Clock } from "lucide-react"
import { usePaystackPayment } from "react-paystack"
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface Payment {
    id: string
    amount: number
    description: string
    status: 'pending' | 'completed' | 'failed'
    payment_date: string
    due_date: string
    payment_type: string
    resident_id: string
}

interface PaymentMethod {
    id: 'paystack' | 'flutterwave'
    name: string
    icon: any // Replace with proper icon type
}

export default function PaymentsPage() {
    const [activeTab, setActiveTab] = useState("pending")
    const [payments, setPayments] = useState<Payment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const supabase = createClientComponentClient()
    const [showPaymentDialog, setShowPaymentDialog] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod['id']>('paystack')

    const paymentMethods: PaymentMethod[] = [
        { id: 'paystack', name: 'Paystack', icon: CreditCard },
        { id: 'flutterwave', name: 'Flutterwave', icon: CreditCard },
    ]

    const paystackConfig = {
        reference: new Date().getTime().toString(),
        email: "user@example.com", // Get from user profile
        amount: selectedPayment?.amount ? selectedPayment.amount * 100 : 0, // Convert to kobo
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    }
    const initializePaystack = usePaystackPayment(paystackConfig)

    const flutterwaveConfig = {
        public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY!,
        tx_ref: new Date().getTime().toString(),
        amount: selectedPayment?.amount || 0,
        currency: "NGN",
        payment_options: "card,ussd,bank_transfer",
        customer: {
            email: "user@example.com",
            phone_number: "1234567890", // Get from user profile
            name: "John Doe" // Get from user profile
        },
        customizations: {
            title: "Estate Payment",
            description: selectedPayment?.description || "",
            logo: "https://your-logo-url.com",
        },
    }
    const handleFlutterPayment = useFlutterwave(flutterwaveConfig)

    const fetchPayments = async () => {
        setIsLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData?.user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .eq('resident_id', userData.user.id)
                .eq('status', activeTab)
                .order('due_date', { ascending: false })

            if (error) throw error
            setPayments(data || [])
        } catch (error) {
            console.error('Error fetching payments:', error)
            toast.error('Failed to load payments')
            setPayments([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchPayments()
    }, [activeTab])

    const filteredPayments = payments.filter(payment =>
        payment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.payment_type.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handlePayment = async () => {
        if (!selectedPayment) return

        if (selectedMethod === 'paystack') {
            initializePaystack({
                onSuccess: async (reference) => {
                    await updatePaymentStatus(selectedPayment.id, 'completed', reference)
                    setShowPaymentDialog(false)
                    toast.success('Payment successful')
                    fetchPayments()
                },
                onClose: () => {
                    toast.error('Payment cancelled')
                },
            })
        } else {
            handleFlutterPayment({
                callback: async (response) => {
                    closePaymentModal()
                    if (response.status === 'successful') {
                        await updatePaymentStatus(selectedPayment.id, 'completed', response)
                        setShowPaymentDialog(false)
                        toast.success('Payment successful')
                        fetchPayments()
                    } else {
                        toast.error('Payment failed')
                    }
                },
                onClose: () => {
                    toast.error('Payment cancelled')
                },
            })
        }
    }

    const updatePaymentStatus = async (
        paymentId: string,
        status: Payment['status'],
        reference: any
    ) => {
        try {
            const { error } = await supabase
                .from('payments')
                .update({
                    status,
                    payment_date: new Date().toISOString(),
                    payment_reference: reference
                })
                .eq('id', paymentId)

            if (error) throw error
        } catch (error) {
            console.error('Error updating payment:', error)
            toast.error('Failed to update payment status')
        }
    }

    const getPendingPayments = async () => {
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData?.user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .eq('resident_id', userData.user.id)
                .eq('status', 'pending')
                .order('due_date', { ascending: false })

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error fetching pending payments:', error)
            return []
        }
    }

    return (
        <div className="container mx-auto p-4 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#8B0000] to-[#6B0000] bg-clip-text text-transparent">
                    Payments
                </h1>

                {/* Search and Action Buttons */}
                <div className="flex flex-col w-full gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                        <Input
                            placeholder="Search payments..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full"
                        />
                    </div>
                    <Button
                        onClick={async () => {
                            const pendingPayments = await getPendingPayments()
                            if (pendingPayments.length > 0) {
                                setSelectedPayment(pendingPayments[0])
                                setShowPaymentDialog(true)
                            } else {
                                toast.error('No pending payments found')
                            }
                        }}
                        className="w-full md:w-auto bg-[#8B0000] text-white hover:bg-[#6B0000]"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Make Payment
                    </Button>
                </div>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="hidden sm:inline">Pending</span>
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="flex items-center gap-2">
                        <Receipt className="h-4 w-4" />
                        <span className="hidden sm:inline">Completed</span>
                    </TabsTrigger>
                    <TabsTrigger value="failed" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        <span className="hidden sm:inline">Failed</span>
                    </TabsTrigger>
                </TabsList>

                {/* Mobile Cards View */}
                <div className="md:hidden mt-4">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-[#8B0000]" />
                        </div>
                    ) : filteredPayments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No payments found
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredPayments.map((payment) => (
                                <Card key={payment.id} className="overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">{payment.description}</CardTitle>
                                        <CardDescription>
                                            Due: {new Date(payment.due_date).toLocaleDateString()}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-2xl font-bold">
                                                ₦{payment.amount.toLocaleString()}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs ${payment.status === 'completed'
                                                ? 'bg-green-100 text-green-800'
                                                : payment.status === 'failed'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">
                                                {payment.payment_type}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedPayment(payment)
                                                    setShowPaymentDialog(true)
                                                }}
                                                className="hover:bg-[#8B0000]/10"
                                            >
                                                Pay Now
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                    <TabsContent value="pending" className="mt-4">
                        <PaymentsTable
                            payments={filteredPayments}
                            isLoading={isLoading}
                            onPayment={(payment) => {
                                setSelectedPayment(payment)
                                setShowPaymentDialog(true)
                            }}
                        />
                    </TabsContent>
                    <TabsContent value="completed" className="mt-4">
                        <PaymentsTable
                            payments={filteredPayments}
                            isLoading={isLoading}
                            onPayment={(payment) => {
                                setSelectedPayment(payment)
                                setShowPaymentDialog(true)
                            }}
                        />
                    </TabsContent>
                    <TabsContent value="failed" className="mt-4">
                        <PaymentsTable
                            payments={filteredPayments}
                            isLoading={isLoading}
                            onPayment={(payment) => {
                                setSelectedPayment(payment)
                                setShowPaymentDialog(true)
                            }}
                        />
                    </TabsContent>
                </div>
            </Tabs>

            {/* Payment Dialog */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Make Payment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <h3 className="font-medium">Description</h3>
                            <p className="text-gray-600">{selectedPayment?.description}</p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-medium">Amount</h3>
                            <p className="text-3xl font-bold">₦{selectedPayment?.amount.toLocaleString()}</p>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-medium">Payment Method</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {paymentMethods.map((method) => (
                                    <Button
                                        key={method.id}
                                        variant={selectedMethod === method.id ? "default" : "outline"}
                                        className={`flex items-center gap-2 ${selectedMethod === method.id
                                            ? "bg-[#8B0000] text-white"
                                            : ""
                                            }`}
                                        onClick={() => setSelectedMethod(method.id)}
                                    >
                                        <method.icon className="h-4 w-4" />
                                        {method.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button
                            className="w-full sm:w-auto bg-[#8B0000] text-white hover:bg-[#6B0000]"
                            onClick={handlePayment}
                        >
                            Proceed to Payment
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function PaymentsTable({
    payments,
    isLoading,
    onPayment
}: {
    payments: Payment[]
    isLoading: boolean
    onPayment: (payment: Payment) => void
}) {
    return (
        <Card className="overflow-hidden border-none shadow-xl">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gradient-to-r from-[#8B0000]/5 to-[#6B0000]/5">
                        <TableHead className="font-semibold">Description</TableHead>
                        <TableHead className="font-semibold">Amount</TableHead>
                        <TableHead className="font-semibold">Due Date</TableHead>
                        <TableHead className="font-semibold">Payment Type</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                                <div className="flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-[#8B0000]" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : payments.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                No payments found
                            </TableCell>
                        </TableRow>
                    ) : (
                        payments.map((payment) => (
                            <TableRow key={payment.id} className="group hover:bg-[#8B0000]/5">
                                <TableCell>{payment.description}</TableCell>
                                <TableCell>₦{payment.amount.toLocaleString()}</TableCell>
                                <TableCell>{new Date(payment.due_date).toLocaleDateString()}</TableCell>
                                <TableCell>{payment.payment_type}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs ${payment.status === 'completed'
                                        ? 'bg-green-100 text-green-800'
                                        : payment.status === 'failed'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="hover:bg-[#8B0000]/10"
                                        onClick={() => onPayment(payment)}
                                    >
                                        <CreditCard className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </Card>
    )
} 