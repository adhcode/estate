import { cva } from "class-variance-authority"

export const toastVariants = cva(
    "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
    {
        variants: {
            variant: {
                default: "bg-background border",
                destructive:
                    "destructive group border-destructive bg-destructive text-destructive-foreground",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

// Add this type export
export type ToastVariant = "default" | "destructive" 