"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useClerk } from "@clerk/nextjs"

export function LogoutButton() {
    const [showConfirmation, setShowConfirmation] = useState(false)
    const { signOut } = useClerk()
    const router = useRouter()

    const handleLogout = async () => {
        await signOut()
        router.push("/sign-in")
        setShowConfirmation(false)
    }

    return (
        <>
            <Button
                variant="ghost"
                className="flex items-center gap-2 text-[#832131] hover:bg-[#832131]/10 w-full justify-start"
                onClick={() => setShowConfirmation(true)}
            >
                <LogOut size={20} />
                <span>Logout</span>
            </Button>

            <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <DialogContent className="w-[90%] max-w-[320px] rounded-lg bg-white">
                    <DialogHeader className="space-y-2">
                        <DialogTitle className="text-xl text-center font-semibold">
                            Confirm Logout
                        </DialogTitle>
                        <DialogDescription className="text-center text-gray-600">
                            Are you sure you want to logout?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowConfirmation(false)}
                            className="w-full sm:w-auto border-2"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="w-full sm:w-auto bg-[#832131] text-white hover:bg-[#832131]/90"
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
} 