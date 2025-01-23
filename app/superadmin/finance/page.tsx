"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Download, Search, Plus, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Resident {
    id: string
    full_name: string
    block_number: string
    flat_number: string
    service_charge: {
        id: string
        total_amount: number
        amount_paid: number
        balance: number
        last_payment_date: string | null
    }
}

interface PaymentHistory {
    id: string
    amount: number
    payment_date: string
    payment_method: string
    reference_number: string | null
    notes: string | null
}

export default function FinancePage() {
    const [residents, setResidents] = useState<Resident[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const supabase = createClientComponentClient()
    const currentYear = new Date().getFullYear()
    const [selectedResident, setSelectedResident] = useState<Resident | null>(null)
    const [showPaymentDialog, setShowPaymentDialog] = useState(false)
    const [paymentAmount, setPaymentAmount] = useState("")
    const [paymentReference, setPaymentReference] = useState("")
    const [paymentNotes, setPaymentNotes] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
    const [showHistory, setShowHistory] = useState(false)

    useEffect(() => {
        fetchResidents()
    }, [])

    const fetchResidents = async () => {
        setIsLoading(true)
        try {
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select(`
                    id,
                    full_name,
                    block_number,
                    flat_number,
                    service_charges!service_charges_user_id_fkey (
                        id,
                        total_amount,
                        amount_paid,
                        balance,
                        last_payment_date
                    )
                `)
                .eq('service_charges.year', currentYear)

            if (usersError) throw usersError

            // Create service charge records for users who don't have one
            const formattedResidents = await Promise.all((users || []).map(async user => {
                if (!user.service_charges?.[0]) {
                    // Create new service charge record
                    const { data: newCharge, error: createError } = await supabase
                        .from('service_charges')
                        .insert({
                            user_id: user.id,
                            year: currentYear,
                            total_amount: 131000,
                            amount_paid: 0,
                            balance: 131000
                        })
                        .select()
                        .single()

                    if (createError) throw createError

                    return {
                        id: user.id,
                        full_name: user.full_name,
                        block_number: user.block_number || '',
                        flat_number: user.flat_number || '',
                        service_charge: newCharge
                    }
                }

                return {
                    id: user.id,
                    full_name: user.full_name,
                    block_number: user.block_number || '',
                    flat_number: user.flat_number || '',
                    service_charge: user.service_charges[0]
                }
            }))

            setResidents(formattedResidents)
        } catch (error) {
            console.error('Error fetching residents:', error)
            toast.error('Failed to load residents')
        } finally {
            setIsLoading(false)
        }
    }

    const filteredResidents = residents.filter(resident =>
        resident.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resident.block_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resident.flat_number.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const generatePDF = async (resident: Resident) => {
        const doc = new jsPDF()

        // Add logo and styling
        doc.setFillColor(139, 0, 0)
        doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F')

        // Header
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(22)
        doc.text('Payment Statement', 20, 25)

        // Resident Details
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(12)
        doc.text('Resident Details', 20, 50)
        doc.setFontSize(10)
        doc.text([
            `Name: ${resident.full_name}`,
            `Block: ${resident.block_number}`,
            `Flat: ${resident.flat_number}`,
        ], 20, 60)

        // Payment Summary
        doc.setFontSize(12)
        doc.text('Payment Summary', 20, 90)
        doc.setFontSize(10)
        doc.text([
            `Total Amount: # ${resident.service_charge.total_amount.toLocaleString()}`,
            `Amount Paid: # ${resident.service_charge.amount_paid.toLocaleString()}`,
            `Balance: # ${resident.service_charge.balance.toLocaleString()}`
        ], 20, 100)

        // Fetch payment history
        const { data: payments } = await supabase
            .from('payment_history')
            .select('*')
            .eq('service_charge_id', resident.service_charge.id)
            .order('payment_date', { ascending: false })

        // Payment History Table
        if (payments && payments.length > 0) {
            doc.setFontSize(12)
            doc.text('Payment History', 20, 130)

            autoTable(doc, {
                startY: 140,
                head: [['Date', 'Amount', 'Reference', 'Notes']],
                body: payments.map(payment => [
                    format(new Date(payment.payment_date), 'MMM d, yyyy'),
                    `# ${payment.amount.toLocaleString()}`,
                    payment.reference_number || '-',
                    payment.notes || '-'
                ]),
                styles: {
                    fontSize: 9,
                    cellPadding: 5,
                },
                headStyles: {
                    fillColor: [139, 0, 0],
                    textColor: 255,
                    fontSize: 10,
                    fontStyle: 'bold',
                },
                columnStyles: {
                    0: { cellWidth: 40 },
                    1: { cellWidth: 40, halign: 'left' },
                    2: { cellWidth: 50 },
                    3: { cellWidth: 'auto' }
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                margin: { left: 20, right: 20 }
            })
        }

        // Footer
        const pageCount = doc.internal.pages.length - 1
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(
            `Generated on ${format(new Date(), 'MMMM d, yyyy')}`,
            20,
            doc.internal.pageSize.height - 10
        )
        doc.text(
            `Page ${pageCount}`,
            doc.internal.pageSize.width - 20,
            doc.internal.pageSize.height - 10,
            { align: 'right' }
        )

        doc.save(`${resident.full_name}_payment_statement.pdf`)
    }

    const recordPayment = async (resident: Resident) => {
        console.log('Recording payment for resident:', resident)

        // Validate inputs
        if (!paymentAmount || isNaN(parseFloat(paymentAmount))) {
            toast.error('Please enter a valid payment amount')
            return
        }

        if (!resident.service_charge?.id) {
            toast.error('No service charge record found')
            return
        }

        setIsSubmitting(true)

        try {
            const amount = parseFloat(paymentAmount)
            const now = new Date().toISOString()
            const newBalance = Math.max(0, resident.service_charge.balance - amount)
            const newAmountPaid = resident.service_charge.amount_paid + amount

            // Log the data being sent
            console.log('Updating service charge with:', {
                id: resident.service_charge.id,
                amount_paid: newAmountPaid,
                balance: newBalance,
                last_payment_date: now
            })

            // Update service charges
            const { data: updateData, error: updateError } = await supabase
                .from('service_charges')
                .update({
                    amount_paid: newAmountPaid,
                    balance: newBalance,
                    last_payment_date: now,
                    updated_at: now
                })
                .eq('id', resident.service_charge.id)
                .select()
                .single()

            if (updateError) {
                console.error('Error updating service charge:', updateError)
                throw updateError
            }

            console.log('Service charge updated successfully:', updateData)

            // Log payment history data
            console.log('Creating payment history with:', {
                service_charge_id: resident.service_charge.id,
                amount,
                payment_date: now,
                reference_number: paymentReference,
                notes: paymentNotes
            })

            // Record payment history
            const { data: historyData, error: historyError } = await supabase
                .from('payment_history')
                .insert({
                    service_charge_id: resident.service_charge.id,
                    amount,
                    payment_date: now,
                    payment_method: 'cash', // Add default payment method
                    reference_number: paymentReference || null,
                    notes: paymentNotes || null
                })
                .select()
                .single()

            if (historyError) {
                console.error('Error recording payment history:', historyError)
                throw historyError
            }

            console.log('Payment history recorded successfully:', historyData)

            toast.success('Payment recorded successfully')
            setShowPaymentDialog(false)
            setPaymentAmount("")
            setPaymentReference("")
            setPaymentNotes("")
            fetchResidents() // Refresh the list
        } catch (error: any) {
            console.error('Error recording payment:', error)
            toast.error(error.message || 'Failed to record payment')
        } finally {
            setIsSubmitting(false)
        }
    }

    async function fetchPaymentHistory(serviceChargeId: string) {
        try {
            const { data, error } = await supabase
                .from('payment_history')
                .select('*')
                .eq('service_charge_id', serviceChargeId)
                .order('payment_date', { ascending: false })

            if (error) throw error
            setPaymentHistory(data || [])
        } catch (error) {
            console.error('Error fetching payment history:', error)
            toast.error("Failed to load payment history")
        }
    }

    // Add new function for generating combined PDF
    const generateAllPDF = async () => {
        try {
            const doc = new jsPDF() as jsPDF & { lastAutoTable: { finalY: number } }
            const pageWidth = doc.internal.pageSize.getWidth()
            const primaryColor = [139, 0, 0]

            // Add header with gradient-like effect
            doc.setFillColor(139, 0, 0)
            doc.rect(0, 0, pageWidth, 45, 'F')
            doc.setFillColor(107, 0, 0) // Darker shade for depth
            doc.rect(0, 42, pageWidth, 3, 'F')

            doc.setTextColor(255, 255, 255)
            doc.setFontSize(28)
            doc.text('LKJ GARDENS IGANDO', pageWidth / 2, 25, { align: 'center' })
            doc.setFontSize(16)
            doc.text('Service Charges Summary Report', pageWidth / 2, 37, { align: 'center' })

            // Reset text color for body
            doc.setTextColor(0, 0, 0)
            doc.setFontSize(11)
            doc.text(`Generated on: ${format(new Date(), 'MMMM d, yyyy')}`, 20, 55)
            doc.text(`Year: ${currentYear}`, 20, 65)

            // Add summary table with styling
            autoTable(doc, {
                startY: 80,
                head: [['Name', 'Block', 'Flat', 'Amount Paid', 'Balance', 'Last Payment']],
                body: filteredResidents.map(resident => [
                    resident.full_name,
                    resident.block_number,
                    resident.flat_number,
                    `# ${resident.service_charge.amount_paid.toLocaleString()}`,
                    `# ${resident.service_charge.balance.toLocaleString()}`,
                    resident.service_charge.last_payment_date
                        ? format(new Date(resident.service_charge.last_payment_date), 'MMM d, yyyy')
                        : 'No payment'
                ]),
                headStyles: {
                    fillColor: [139, 0, 0] as [number, number, number],
                    fontSize: 12,
                    halign: 'center',
                    textColor: 255
                },
                styles: {
                    fontSize: 10,
                    cellPadding: 8,
                    lineColor: [200, 200, 200]
                },
                alternateRowStyles: {
                    fillColor: [252, 252, 252]
                },
                columnStyles: {
                    0: { cellWidth: 40 },        // Name
                    1: { cellWidth: 30 },        // Block
                    2: { cellWidth: 30 },        // Flat
                    3: { cellWidth: 35, halign: 'left' },  // Amount Paid
                    4: { cellWidth: 35, halign: 'left' },  // Balance
                    5: { cellWidth: 40 }         // Last Payment
                },
                margin: { left: 0, right: 10 }
            })

            // Add totals with styled box
            const totals = filteredResidents.reduce((acc, resident) => ({
                totalAmount: acc.totalAmount + resident.service_charge.total_amount,
                amountPaid: acc.amountPaid + resident.service_charge.amount_paid,
                balance: acc.balance + resident.service_charge.balance
            }), { totalAmount: 0, amountPaid: 0, balance: 0 })

            const finalY = doc.lastAutoTable?.finalY || 120
            doc.setFillColor(245, 245, 245)
            doc.rect(15, finalY + 15, pageWidth - 30, 50, 'F')

            doc.setFontSize(14)
            doc.text('Summary', 20, finalY + 30)
            doc.setFontSize(11)
            doc.text(`Total Expected: #${totals.totalAmount.toLocaleString()}`, 25, finalY + 40)
            doc.text(`Total Received: #${totals.amountPaid.toLocaleString()}`, 25, finalY + 50)
            doc.text(`Total Outstanding: #${totals.balance.toLocaleString()}`, 25, finalY + 60)

            // Add footer with line and powered by text
            doc.setDrawColor(139, 0, 0)
            doc.setLineWidth(0.5)
            doc.line(20, finalY + 75, pageWidth - 20, finalY + 75)

            doc.setTextColor(80, 80, 80)
            doc.setFontSize(9)
            doc.text('This is a computer-generated document. No signature required.', pageWidth / 2, finalY + 85, { align: 'center' })

            doc.setTextColor(139, 0, 0)
            doc.setFontSize(11)
            doc.setFont('', 'bold')
            doc.text('Powered by Uvise', pageWidth / 2, finalY + 95, { align: 'center' })

            // Save the PDF
            const fileName = `LKJ_Gardens_Service_Charges_Summary_${currentYear}.pdf`
            doc.save(fileName)

            toast.success('Summary PDF generated successfully')
        } catch (error) {
            console.error('Error generating summary PDF:', error)
            toast.error('Failed to generate summary PDF')
        }
    }

    return (
        <div className="container mx-auto p-4 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#8B0000] to-[#6B0000] bg-clip-text text-transparent">
                    Service Charges {currentYear}
                </h1>
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                    <div className="relative flex-grow md:flex-grow-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                        <Input
                            placeholder="Search residents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full md:w-[300px] border-gray-200 focus:border-[#8B0000] focus:ring-[#8B0000]/20"
                        />
                    </div>
                    <Button
                        onClick={generateAllPDF}
                        className="bg-[#8B0000] text-white hover:bg-[#6B0000] transition-colors flex items-center justify-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Download Summary</span>
                        <span className="sm:hidden">Download</span>
                    </Button>
                </div>
            </div>

            {/* Table Section */}
            <Card className="overflow-hidden border-none shadow-xl bg-white rounded-xl">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gradient-to-r from-[#8B0000]/5 to-[#6B0000]/5">
                                <TableHead className="font-semibold">
                                    <span className="flex items-center gap-2">Resident</span>
                                </TableHead>
                                <TableHead className="font-semibold hidden md:table-cell">Block/Flat</TableHead>
                                <TableHead className="font-semibold text-right">Amount</TableHead>
                                <TableHead className="font-semibold text-right">Balance</TableHead>
                                <TableHead className="font-semibold hidden lg:table-cell">Last Payment</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-[#8B0000]" />
                                            <span className="text-sm text-gray-500">Loading residents...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredResidents.map((resident) => (
                                <TableRow
                                    key={resident.id}
                                    className="group hover:bg-[#8B0000]/5 transition-colors cursor-pointer"
                                >
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900">{resident.full_name}</span>
                                            <span className="text-sm text-gray-500 md:hidden">
                                                {resident.block_number} • {resident.flat_number}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <span className="inline-flex gap-1">
                                            <span className="font-medium">{resident.block_number}</span>
                                            <span className="text-gray-500">•</span>
                                            <span>{resident.flat_number}</span>
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                # {resident.service_charge.amount_paid.toLocaleString()}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                of # {resident.service_charge.total_amount.toLocaleString()}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-sm ${resident.service_charge.balance > 0
                                            ? 'bg-red-50 text-red-700'
                                            : 'bg-green-50 text-green-700'
                                            }`}>
                                            # {resident.service_charge.balance.toLocaleString()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-gray-500">
                                        {resident.service_charge.last_payment_date
                                            ? format(new Date(resident.service_charge.last_payment_date), 'MMM d, yyyy')
                                            : 'No payment yet'
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="hover:bg-[#8B0000]/10 hover:text-[#8B0000] hover:border-[#8B0000]"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelectedResident(resident)
                                                    setShowPaymentDialog(true)
                                                }}
                                            >
                                                <Plus className="h-4 w-4 sm:mr-1" />
                                                <span className="hidden sm:inline">Payment</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="hover:bg-[#8B0000]/10 hover:text-[#8B0000] hover:border-[#8B0000]"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    generatePDF(resident)
                                                }}
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Payment History</DialogTitle>
                        <DialogDescription>
                            {selectedResident?.full_name} - Block {selectedResident?.block_number}, Flat {selectedResident?.flat_number}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paymentHistory.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell>
                                                {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                                            </TableCell>
                                            <TableCell>#${payment.amount.toLocaleString()}</TableCell>
                                            <TableCell>{payment.reference_number || '-'}</TableCell>
                                            <TableCell>{payment.notes || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                    {paymentHistory.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                No payment history found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
} 