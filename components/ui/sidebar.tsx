import * as React from "react"
import { type ReactNode } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("w-64 bg-white border-r", className)} {...props} />
))
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("border-b", className)} {...props} />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("py-4", className)} {...props} />
))
SidebarContent.displayName = "SidebarContent"

const SidebarMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-1", className)} {...props} />
))
SidebarMenu.displayName = "SidebarMenu"

interface SidebarMenuItemProps {
  children: ReactNode;
  href: string;
  icon: ReactNode;
}

const SidebarMenuItem = ({ children, href, icon }: SidebarMenuItemProps) => (
  <Link href={href}>
    <div className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100">
      {icon}
      {children}
    </div>
  </Link>
);

const SidebarMenuButton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? React.Fragment : "div"
  return (
    <Comp
      ref={ref}
      className={cn(
        "flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-gray-100",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} 