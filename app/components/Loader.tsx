import React from "react"

export function Loader() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#8B0000]"></div>
            <p className="mt-4 text-lg font-semibold text-gray-700">Loading...</p>
            <p className="mt-2 text-sm text-gray-500">
                Powered by <span className="font-semibold">UVISE</span>
            </p>
        </div>
    )
} 