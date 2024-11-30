import { ToastVariant } from "./toast"

type ToastProps = {
  variant?: ToastVariant
  title?: string
  description?: string
}

export function useToast() {
  const toast = (props: ToastProps) => {
    // Implementation
  }

  return {
    toast,
  }
} 