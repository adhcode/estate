import * as React from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"

interface VisitorDetailsSheetProps {
    isOpen: boolean
    onClose: () => void
    visitor: any
    onCheckIn: () => void
    onCheckOut: () => void
}

export default function VisitorDetailsSheet({ isOpen, onClose, visitor, onCheckIn, onCheckOut }: VisitorDetailsSheetProps) {
    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent>
                {visitor && (
                    <div>
                        <h2>Visitor Details</h2>
                        <p>Name: {visitor.name}</p>
                        <p>ID: {visitor.id}</p>
                        {/* Add more visitor details as needed */}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
} 