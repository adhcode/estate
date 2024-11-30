'use client'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCE8EB]">
            <h2 className="text-xl font-bold mb-4">Something went wrong!</h2>
            <button
                className="bg-[#832131] text-white px-4 py-2 rounded"
                onClick={() => reset()}
            >
                Try again
            </button>
        </div>
    )
} 