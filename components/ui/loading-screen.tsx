"use client"

import { motion } from "framer-motion"

export function LoadingScreen() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center gap-6"
            >
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#832131]"></div>
                <div className="flex flex-col items-center gap-1">
                    <p className="text-sm text-muted-foreground">Loading...</p>
                    <p className="text-xs text-muted-foreground">Powered by UVISE</p>
                </div>
            </motion.div>
        </div>
    )
} 