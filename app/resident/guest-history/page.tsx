"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerDescription } from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader } from "@/app/components/Loader"

import {
  ChevronLeft,
  ArrowUpRight,
  UserCircle,
  CreditCard,
  Clock,
  Calendar,
  Mail,
  Phone,
  Search,
  Copy,
  Check,
  Eye,
  X,
  AlertTriangle,
} from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface Guest {
  id: string
  guest_id: string
  full_name: string
  email: string
  phone_number: string
  visit_date: string
  visit_time: string
  purpose_of_visit: string
  check_in_time?: string
  check_out_time?: string
  duration?: string
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'issue'
  registered_by: string
  created_at: string
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    const listener = () => setMatches(media.matches)
    window.addEventListener("resize", listener)
    return () => window.removeEventListener("resize", listener)
  }, [matches, query])

  return matches
}

const formatTime = (timeString: string | undefined) => {
  if (!timeString) return '—';
  return new Date(timeString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const ReportIssueDialog = ({ guest, isOpen, onOpenChange, onStatusUpdate }: {
  guest: Guest;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: (guestId: string, newStatus: Guest['status']) => void;
}) => {
  const [issueDescription, setIssueDescription] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)
  const supabase = createClientComponentClient()

  const handleReportSubmit = async () => {
    if (!issueDescription.trim()) return;

    try {
      const { error: issueError } = await supabase
        .from('guest_issues')
        .insert([{
          guest_id: guest.guest_id,
          description: issueDescription,
          created_at: new Date().toISOString()
        }]);

      if (issueError) {
        console.error('Error reporting issue:', issueError);
        return;
      }

      const { error: updateError } = await supabase
        .from('guests')
        .update({
          status: 'issue',
          updated_at: new Date().toISOString()
        })
        .eq('guest_id', guest.guest_id);

      if (updateError) {
        console.error('Error updating guest status:', updateError);
        return;
      }

      onStatusUpdate(guest.guest_id, 'issue');
      setShowConfirmation(true);
      setTimeout(() => {
        setShowConfirmation(false);
        setIssueDescription("");
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Report Issue</DialogTitle>
          <DialogDescription>
            Describe your issue with {guest.full_name}
          </DialogDescription>
        </DialogHeader>
        {!showConfirmation ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="issue-description">Issue Description</Label>
              <textarea
                id="issue-description"
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Type your issue here..."
                className="w-full min-h-[100px] p-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleReportSubmit}
                disabled={!issueDescription.trim()}
              >
                Submit Report
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4">
            <Check className="h-6 w-6 text-green-500 mb-2" />
            <p className="text-center">Report submitted successfully!</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface DesktopGuestDetailsDialogProps {
  guest: Guest | null;
  isOpen: boolean;
  onClose: () => void;
  onCopyId: (id: string) => void;
  copiedId: string | null;
  handleOpenCancelDialog: (guest: Guest) => void;
  onReport: (guest: Guest) => void;
  getStatusColor: (status: string) => string;
  setEditingGuest: (guest: Guest | null) => void;
  setIsEditDialogOpen: (open: boolean) => void;
}

const DesktopGuestDetailsDialog = ({
  guest,
  isOpen,
  onClose,
  onCopyId,
  copiedId,
  handleOpenCancelDialog,
  onReport,
  getStatusColor,
  setEditingGuest,
  setIsEditDialogOpen
}: DesktopGuestDetailsDialogProps) => {
  if (!guest) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Guest Details</DialogTitle>
          <DialogDescription>
            View detailed information about your guest.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-500">Guest ID</Label>
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
              <span className="font-medium">{guest.guest_id}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopyId(guest.guest_id)}
                className="h-8 px-2 hover:bg-gray-100"
              >
                {copiedId === guest.guest_id ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="text-xs">Copied</span>
                  </div>
                ) : (
                  <Copy className="h-4 w-4 text-gray-600" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-500">Full Name</Label>
            <p className="text-gray-900">{guest.full_name}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-500">Visit Date</Label>
            <p className="text-gray-900">
              {new Date(guest.visit_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-500">Visit Time</Label>
            <p className="text-gray-900">{guest.visit_time}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-500">Purpose of Visit</Label>
            <p className="text-gray-900">{guest.purpose_of_visit}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-500">Status</Label>
            <Badge variant="outline" className={`${getStatusColor(guest.status)} text-white`}>
              {guest.status}
            </Badge>
          </div>

          {guest.status === 'pending' && (
            <div className="space-y-2">
              <Button
                variant="default"
                onClick={() => {
                  setEditingGuest(guest)
                  setIsEditDialogOpen(true)
                }}
                className="w-full bg-blue-500 text-white hover:bg-blue-600"
              >
                Edit Guest
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleOpenCancelDialog(guest)}
                className="w-full bg-red-500 text-white hover:bg-red-600"
              >
                Cancel Guest
              </Button>
            </div>
          )}

          {guest.status === 'active' && (
            <Button
              variant="outline"
              onClick={() => onReport(guest)}
              className="w-full bg-yellow-500 text-white hover:bg-yellow-600"
            >
              Report Issue with Guest
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function GuestHistory() {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const supabase = createClientComponentClient()
  const [guests, setGuests] = useState<Guest[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [guestToCancel, setGuestToCancel] = useState<Guest | null>(null)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [issueDescription, setIssueDescription] = useState("")
  const [selectedGuestForReport, setSelectedGuestForReport] = useState<Guest | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const itemsPerPage = 10
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Filter guests based on search term
  const filteredGuests = guests.filter(guest =>
    guest.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.guest_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate current guests for the page from filtered guests
  const indexOfLastGuest = currentPage * itemsPerPage
  const indexOfFirstGuest = indexOfLastGuest - itemsPerPage
  const currentGuests = filteredGuests.slice(indexOfFirstGuest, indexOfLastGuest)
  const totalPages = Math.ceil(filteredGuests.length / itemsPerPage)

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const openGuestDetails = (guest: Guest) => {
    setSelectedGuest(guest)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500"
      case "active":
        return "bg-blue-500"
      case "pending":
        return "bg-yellow-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleCopyGuestId = async (guestId: string) => {
    try {
      await navigator.clipboard.writeText(guestId)
      setCopiedId(guestId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCancelGuest = async (guestId: string) => {
    try {
      console.log('Attempting to cancel guest:', guestId)

      const { data: existingGuest, error: fetchError } = await supabase
        .from('guests')
        .select('*')
        .eq('guest_id', guestId)
        .single()

      if (fetchError) {
        console.error('Error fetching guest:', fetchError)
        return
      }

      if (!existingGuest) {
        console.error('Guest not found:', guestId)
        return
      }

      const { data, error: updateError } = await supabase
        .from('guests')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('guest_id', guestId)
        .select()

      if (updateError) {
        console.error('Error updating guest status:', updateError.message || updateError)
        return
      }

      if (data) {
        console.log('Update successful:', data)
      }

      setGuests(prevGuests =>
        prevGuests.map(guest =>
          guest.guest_id === guestId ? { ...guest, status: 'cancelled' } : guest
        )
      )

      console.log('Successfully cancelled guest:', guestId)
    } catch (error) {
      console.error('Unexpected error in handleCancelGuest:', error)
    }
  }

  const handleOpenCancelDialog = (guest: Guest) => {
    setGuestToCancel(guest)
    setIsCancelDialogOpen(true)
    setSelectedGuest(null)
  }

  const handleConfirmCancel = async () => {
    if (guestToCancel) {
      await handleCancelGuest(guestToCancel.guest_id)
      setIsCancelDialogOpen(false)
      setGuestToCancel(null)
      fetchGuestHistory()
    }
  }

  const handleStatusUpdate = (guestId: string, newStatus: Guest['status']) => {
    setGuests(prevGuests =>
      prevGuests.map(g =>
        g.guest_id === guestId ? { ...g, status: newStatus } : g
      )
    );
  };

  const handleEditGuest = async (guestId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('guests')
        .update({ full_name: newName.trim() })
        .eq('guest_id', guestId)

      if (error) throw error

      toast.success("Guest details updated successfully")
      fetchGuestHistory()
      setIsEditDialogOpen(false)
      setEditingGuest(null)
    } catch (error) {
      console.error('Error updating guest:', error)
      toast.error("Failed to update guest details")
    }
  }

  const GuestDetailsContent = ({ guest }: { guest: Guest }) => {
    const [registeredBy, setRegisteredBy] = useState<string>("");
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const supabase = createClientComponentClient();

    useEffect(() => {
      const fetchRegisteredBy = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();

          if (guest.registered_by === user?.id) {
            setRegisteredBy("You");
            return;
          }

          // If not registered by current user, fetch the name
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', guest.registered_by)
            .single();

          if (userError) {
            console.error("Error fetching user:", userError);
          }

          if (userData) {
            setRegisteredBy(userData.full_name);
          } else {
            // If not found in users, try household_members table
            const { data: householdData, error: householdError } = await supabase
              .from('household_members')
              .select('first_name, last_name')
              .eq('id', guest.registered_by)
              .single();

            if (householdError) {
              console.error("Error fetching household member:", householdError);
            }

            if (householdData) {
              const fullName = `${householdData.first_name} ${householdData.last_name}`;
              setRegisteredBy(fullName);
            }
          }
        } catch (error) {
          console.error("Error in fetchRegisteredBy:", error);
        }
      };

      if (guest.registered_by) {
        fetchRegisteredBy();
      }
    }, [guest.registered_by, supabase]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-4 font-quicksand px-6 py-8"
      >
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-500">Guest ID</Label>
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
            <span className="font-medium">{guest.guest_id}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyGuestId(guest.guest_id)}
              className="h-8 px-2 hover:bg-gray-100"
            >
              {copiedId === guest.guest_id ? (
                <div className="flex items-center space-x-1 text-green-600">
                  <Check className="h-4 w-4" />
                  <span className="text-xs">Copied</span>
                </div>
              ) : (
                <Copy className="h-4 w-4 text-gray-600" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-500">Registered By</Label>
          <p className="text-gray-900">
            {registeredBy || "Loading..."}
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-500">Full Name</Label>
          <p className="text-gray-900">{guest.full_name}</p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-500">Visit Date</Label>
          <p className="text-gray-900">
            {new Date(guest.visit_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-500">Visit Time</Label>
          <p className="text-gray-900">{guest.visit_time}</p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-500">Purpose of Visit</Label>
          <p className="text-gray-900">{guest.purpose_of_visit}</p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-500">Status</Label>
          <Badge variant="outline" className={`${getStatusColor(guest.status)} text-white`}>
            {guest.status}
          </Badge>
        </div>

        {guest.status === 'pending' && (
          <div className="space-y-2">
            <Button
              variant="default"
              onClick={() => {
                setEditingGuest(guest)
                setIsEditDialogOpen(true)
              }}
              className="w-full bg-blue-500 text-white hover:bg-blue-600"
            >
              Edit Guest
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleOpenCancelDialog(guest)}
              className="w-full bg-red-500 text-white hover:bg-red-600"
            >
              Cancel Guest
            </Button>
          </div>
        )}

        {guest.status === 'active' && (
          <Button
            variant="outline"
            onClick={() => setIsReportDialogOpen(true)}
            className="w-full bg-yellow-500 text-white hover:bg-yellow-600"
          >
            Report Issue with Guest
          </Button>
        )}
      </motion.div>
    );
  };

  const fetchGuestHistory = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // First try to get user from users table (for primary residents)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      // If not found in users table, check household_members table
      if (!userData) {
        const { data: householdData, error: householdError } = await supabase
          .from('household_members')
          .select('*')
          .eq('id', user.id)
          .single();

        if (householdError) {
          console.error('Error fetching household member:', householdError);
          toast.error('Failed to load user data');
          return;
        }

        if (householdData) {
          // For household members, only show their own registered guests
          const { data: guestsData, error: guestsError } = await supabase
            .from('guests')
            .select('*')
            .eq('registered_by', householdData.id)
            .order('created_at', { ascending: false });

          if (guestsError) {
            console.error('Error fetching guests:', guestsError);
          }

          setGuests(guestsData || []);
        }
      } else {
        // For primary residents
        const { data: householdMembers, error: householdError } = await supabase
          .from('household_members')
          .select('id')
          .eq('primary_resident_id', userData.id);

        if (householdError) {
          console.error('Error fetching household members:', householdError);
        }

        const registeredByIds = [userData.id, ...(householdMembers?.map(member => member.id) || [])];

        const { data: guestsData, error: guestsError } = await supabase
          .from('guests')
          .select('*')
          .in('registered_by', registeredByIds)
          .order('created_at', { ascending: false });

        if (guestsError) {
          console.error('Error fetching guests:', guestsError);
        }

        setGuests(guestsData || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load guest history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuestHistory();
  }, [supabase]);

  // Mobile view component
  const MobileView = () => (
    <div className="space-y-2">
      {currentGuests.map((guest, index) => (
        <div key={index} className="flex justify-between items-center py-2 border-b">
          <div>
            <p className="font-medium font-quicksand">{guest.full_name}</p>
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 font-quicksand">{guest.guest_id}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyGuestId(guest.guest_id)}
                  className="h-8 px-2 hover:bg-gray-100 ml-2"
                >
                  {copiedId === guest.guest_id ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <Check className="h-4 w-4" />
                      <span className="text-xs font-quicksand">Copied</span>
                    </div>
                  ) : (
                    <Copy className="h-4 w-4 text-gray-600" />
                  )}
                </Button>
              </div>
              <Badge variant="outline" className={`${getStatusColor(guest.status)} text-white font-quicksand`}>
                {guest.status}
              </Badge>
            </div>
          </div>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="ghost" onClick={() => openGuestDetails(guest)}>
                <ArrowUpRight className="text-gray-400" size={20} />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="px-0 pt-4 pb-8">
              <GuestDetailsContent guest={guest} />
            </DrawerContent>
          </Drawer>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return <Loader />
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12">
        <Button
          variant="ghost"
          className="mb-6 -ml-4 text-gray-600 hover:text-gray-900 hover:bg-transparent"
          onClick={() => router.push('/resident/dashboard')}
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Dashboard
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className={`${isMobile ? 'shadow-sm' : 'shadow-lg'} border-0 overflow-hidden ${isMobile ? '' : 'bg-white/50 backdrop-blur-sm'}`}>
            <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap');
                
                * {
                  font-family: 'Quicksand', sans-serif !important;
                }

                .drawer-content * {
                  font-family: 'Quicksand', sans-serif !important;
                }

                .dialog-content * {
                  font-family: 'Quicksand', sans-serif !important;
                }
              `}</style>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  type="text"
                  placeholder="Search guests..."
                  className="pl-10 pr-4 py-2 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {isMobile ? (
                <MobileView />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Guest ID</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead className="hidden md:table-cell">Visit Date</TableHead>
                        <TableHead className="hidden md:table-cell">Visit Time</TableHead>
                        <TableHead className="hidden md:table-cell">Purpose</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentGuests.map((guest) => (
                        <TableRow key={guest.guest_id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {guest.guest_id}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopyGuestId(guest.guest_id)}
                                className="h-8 w-8"
                              >
                                {copiedId === guest.guest_id ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{guest.full_name}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {new Date(guest.visit_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{guest.visit_time}</TableCell>
                          <TableCell className="hidden md:table-cell">{guest.purpose_of_visit}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${getStatusColor(guest.status)} text-white`}>
                              {guest.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="hidden md:flex justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openGuestDetails(guest)}
                              >
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {filteredGuests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No guests found matching your search.
                </div>
              )}
              {filteredGuests.length > 0 && (
                <CardFooter className="flex justify-between items-center mt-4 px-6 py-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </CardFooter>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Desktop Guest Details Dialog - Only show on desktop */}
      {!isMobile && (
        <DesktopGuestDetailsDialog
          guest={selectedGuest}
          isOpen={!!selectedGuest}
          onClose={() => setSelectedGuest(null)}
          onCopyId={handleCopyGuestId}
          copiedId={copiedId}
          handleOpenCancelDialog={handleOpenCancelDialog}
          onReport={(guest) => {
            setSelectedGuestForReport(guest);
            setIsReportDialogOpen(true);
          }}
          getStatusColor={getStatusColor}
          setEditingGuest={setEditingGuest}
          setIsEditDialogOpen={setIsEditDialogOpen}
        />
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Edit Guest Details</DialogTitle>
            <DialogDescription>
              Update guest information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={editingGuest?.full_name || ''}
                onChange={(e) => setEditingGuest(prev =>
                  prev ? { ...prev, full_name: e.target.value } : null
                )}
                placeholder="Enter guest's full name"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingGuest(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  if (editingGuest) {
                    handleEditGuest(editingGuest.guest_id, editingGuest.full_name)
                  }
                }}
                disabled={!editingGuest || !editingGuest.full_name.trim()}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel {guestToCancel?.full_name}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={() => setIsCancelDialogOpen(false)}>
              No
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel}>
              Yes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
