"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface LoadingContextType {
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

function LoadingSpinner() {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center space-y-2">
                <div className="w-12 h-12 border-4 border-[#832131] border-t-transparent rounded-full animate-spin" />
                <p className="text-[#832131] font-medium">Loading...</p>
            </div>
        </div>
    )
}

export default function LoadingProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(false)

    return (
        <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
            {isLoading && <LoadingSpinner />}
            {children}
        </LoadingContext.Provider>
    )
}

export function useLoading() {
    const context = useContext(LoadingContext)
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider')
    }
    return context
} 